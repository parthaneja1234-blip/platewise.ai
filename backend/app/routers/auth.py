"""
Authentication endpoints: login, refresh, logout, me, csrf.

Design decisions:
- Login uses timing-safe comparison even for non-existent users to prevent enumeration.
- Locked accounts return the SAME generic message as wrong password (amendment #4).
- Rate limiting uses in-memory counters keyed by client IP (amendment #5).
- Refresh rotation is atomic using SELECT ... FOR UPDATE (amendment #6).
- Logout works from refresh cookie alone; expired access token does not block it (amendment #3).
"""
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Header, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.deps import get_client_ip, get_current_user, verify_csrf
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.security import verify_password, DUMMY_HASH
from app.security.cookies import set_auth_cookies, clear_auth_cookies
from app.security.csrf import generate_csrf_token
from app.security.jwt import (
    create_access_token,
    create_refresh_token_jwt,
    decode_refresh_token,
)
from app.services.audit import write_audit_log

import jwt as pyjwt

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ----- Request / Response Schemas -----

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    message: str
    csrf_token: str


class MeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    cafeteria_ids: list[str]


class RefreshResponse(BaseModel):
    message: str
    csrf_token: str


# ----- Rate Limiting State -----
# In-memory counters for per-IP and per-email rate limiting and lockout.
# Counters stored in-process memory (dictionary).
# In production multi-worker deployments, this should be backed by Redis or a shared store.
_ip_login_attempts: dict[str, list[datetime]] = {}
_email_login_attempts: dict[str, dict] = {}


def reset_rate_limits() -> None:
    """Clear in-memory IP and email rate limit counters (for testing and maintenance)."""
    _ip_login_attempts.clear()
    _email_login_attempts.clear()


def _check_ip_rate_limit(ip: str) -> None:
    """
    Per-IP rate limiting for login endpoint.
    Counters stored in-process memory.
    """
    now = datetime.now(timezone.utc)
    window = timedelta(minutes=15)
    cutoff = now - window

    if ip not in _ip_login_attempts:
        _ip_login_attempts[ip] = []

    # Prune old attempts outside the window
    _ip_login_attempts[ip] = [t for t in _ip_login_attempts[ip] if t > cutoff]

    max_attempts = settings.ACCOUNT_LOCKOUT_ATTEMPTS
    if len(_ip_login_attempts[ip]) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )

    _ip_login_attempts[ip].append(now)


def _get_email_lockout(email: str) -> tuple[int, Optional[datetime]]:
    """Return (failed_attempts, locked_until) for an email."""
    record = _email_login_attempts.get(email)
    if not record:
        return 0, None
    return record.get("failed_attempts", 0), record.get("locked_until")


def _record_email_failure(email: str) -> tuple[int, Optional[datetime]]:
    """Increment failed attempts for an email and calculate lockout window if threshold met."""
    now = datetime.now(timezone.utc)
    if email not in _email_login_attempts:
        _email_login_attempts[email] = {
            "failed_attempts": 0,
            "locked_until": None,
        }
    record = _email_login_attempts[email]
    record["failed_attempts"] += 1
    if record["failed_attempts"] >= settings.ACCOUNT_LOCKOUT_ATTEMPTS:
        record["locked_until"] = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
    return record["failed_attempts"], record["locked_until"]


def _reset_email_lockout(email: str) -> None:
    _email_login_attempts.pop(email, None)


def _apply_progressive_delay(attempts: int) -> None:
    """Apply progressive delay proportional to attempts to deter brute-force attacks."""
    delay = min(0.02 * attempts, 0.3)
    if delay > 0:
        import time
        time.sleep(delay)


def _is_future(dt: Optional[datetime]) -> bool:
    """Timezone-safe check if datetime is in the future (works with naive and aware datetimes)."""
    if not dt:
        return False
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt > datetime.now(timezone.utc)


def _is_past(dt: Optional[datetime]) -> bool:
    """Timezone-safe check if datetime is in the past (works with naive and aware datetimes)."""
    if not dt:
        return False
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt < datetime.now(timezone.utc)


def _hash_token(raw_token: str) -> str:
    """Compute SHA-256 hex digest of a raw token string."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _get_user_agent(request: Request) -> str:
    return request.headers.get("User-Agent", "")[:300]


# ----- Endpoints -----

@router.get("/csrf")
def get_csrf_token(request: Request, response: Response):
    """
    Issue a fresh CSRF token for SPA initialization.
    The token is not bound to a session yet (uses a temporary nonce).
    After login, a session-bound CSRF token replaces this one.
    """
    temp_session = str(uuid.uuid4())
    csrf_token = generate_csrf_token(temp_session)

    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

    return {"csrf_token": csrf_token}


@router.post("/login", response_model=LoginResponse)
def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with email + password.
    - Generic error message for all failure cases (unknown email, wrong password, locked account).
    - Timing-safe: runs Argon2id verification even when user doesn't exist.
    - Tracks lockout state per email regardless of whether the account exists (amendment #4).
    - Per-IP rate limiting and progressive delay.
    """
    client_ip = get_client_ip(request)
    user_agent = _get_user_agent(request)

    # Per-IP rate limit check
    _check_ip_rate_limit(client_ip)

    generic_error = "Invalid email or password"
    email_clean = body.email.strip().lower()

    # Check email lockout state (regardless of whether user exists)
    email_attempts, email_locked_until = _get_email_lockout(email_clean)
    now = datetime.now(timezone.utc)
    is_email_locked = _is_future(email_locked_until)

    # Look up user in DB with cafeterias preloaded
    user = db.query(User).options(joinedload(User.cafeterias)).filter(User.email == email_clean).first()
    is_db_locked = bool(user and _is_future(user.locked_until))

    if is_email_locked or is_db_locked:
        # Account is locked: apply progressive delay and run dummy hash for timing safety
        _apply_progressive_delay(max(email_attempts, getattr(user, "failed_login_attempts", 0)))
        verify_password("dummy_password_attempt", DUMMY_HASH)
        write_audit_log(
            db, "LOGIN_FAILURE",
            user_id=user.id if user else None,
            ip_address=client_ip,
            user_agent=user_agent,
            details={"reason": "account_locked"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=generic_error,
        )

    if user is None:
        # Non-existent user: track failure per email, apply progressive delay, run dummy hash
        new_attempts, _ = _record_email_failure(email_clean)
        _apply_progressive_delay(new_attempts)
        verify_password("dummy_password_attempt", DUMMY_HASH)
        write_audit_log(
            db, "LOGIN_FAILURE",
            ip_address=client_ip,
            user_agent=user_agent,
            details={"reason": "unknown_email"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=generic_error,
        )

    # User exists: verify password
    if not verify_password(body.password, user.hashed_password):
        user.failed_login_attempts += 1
        new_attempts, _ = _record_email_failure(email_clean)
        _apply_progressive_delay(user.failed_login_attempts)

        if user.failed_login_attempts >= settings.ACCOUNT_LOCKOUT_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
            write_audit_log(
                db, "ACCOUNT_LOCKED",
                user_id=user.id,
                ip_address=client_ip,
                user_agent=user_agent,
                details={"failed_attempts": user.failed_login_attempts},
            )
        else:
            write_audit_log(
                db, "LOGIN_FAILURE",
                user_id=user.id,
                ip_address=client_ip,
                user_agent=user_agent,
                details={"reason": "wrong_password", "failed_attempts": user.failed_login_attempts},
            )

        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=generic_error,
        )

    # Check account is active
    if not user.is_active:
        _apply_progressive_delay(1)
        verify_password("dummy_password_attempt", DUMMY_HASH)
        write_audit_log(
            db, "LOGIN_FAILURE",
            user_id=user.id,
            ip_address=client_ip,
            user_agent=user_agent,
            details={"reason": "account_inactive"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=generic_error,
        )

    # Success: reset lockout counters
    user.failed_login_attempts = 0
    user.locked_until = None
    _reset_email_lockout(email_clean)
    db.flush()

    # Load cafeteria assignments
    cafeteria_ids = [c.id for c in user.cafeterias]

    # Create tokens
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        cafeteria_ids=cafeteria_ids,
    )

    family_id = str(uuid.uuid4())
    refresh_jwt = create_refresh_token_jwt(
        user_id=user.id,
        family_id=family_id,
    )

    # Store refresh token hash in DB
    token_hash = _hash_token(refresh_jwt)
    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)

    # Generate session-bound CSRF token
    csrf_token = generate_csrf_token(user.id)

    write_audit_log(
        db, "LOGIN_SUCCESS",
        user_id=user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"cafeteria_ids": cafeteria_ids},
    )

    db.commit()

    # Set cookies
    set_auth_cookies(response, access_token, refresh_jwt, csrf_token)

    return LoginResponse(message="Login successful", csrf_token=csrf_token)


@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: Optional[str] = Cookie(None),
):
    """
    Rotate the refresh token.
    - Validates the refresh JWT signature and type.
    - Looks up the token hash in the database.
    - Performs atomic rotation with conditional UPDATE / row lock (amendment #6).
    - If the token has already been used or is revoked, revokes the entire family (theft detection).
    - Issues a new access token + refresh token + CSRF token.
    """
    client_ip = get_client_ip(request)
    user_agent = _get_user_agent(request)

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    try:
        payload = decode_refresh_token(refresh_token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    token_hash = _hash_token(refresh_token)
    user_id = payload.get("sub")
    family_id = payload.get("family_id")

    dialect = db.get_bind().dialect.name
    stmt = select(RefreshToken).filter(RefreshToken.token_hash == token_hash)
    if dialect == "postgresql":
        stmt = stmt.with_for_update()

    token_record = db.execute(stmt).scalar_one_or_none()

    if token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Check for reuse (already replaced or revoked)
    if token_record.is_revoked or token_record.replaced_by is not None:
        # THEFT DETECTED: revoke entire token family
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == token_record.family_id)
            .values(is_revoked=True)
        )
        write_audit_log(
            db, "SECURITY_ALERT_TOKEN_REUSE",
            user_id=user_id,
            ip_address=client_ip,
            user_agent=user_agent,
            details={"family_id": family_id, "reused_token_id": token_record.id},
        )
        db.commit()
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected",
        )

    # Check expiration
    if _is_past(token_record.expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    # Load user from DB (always fresh — amendment #2)
    user = db.query(User).options(joinedload(User.cafeterias)).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Issue new tokens
    cafeteria_ids = [c.id for c in user.cafeterias]

    new_access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        cafeteria_ids=cafeteria_ids,
    )

    new_refresh_jwt = create_refresh_token_jwt(
        user_id=user.id,
        family_id=family_id,
    )
    new_token_hash = _hash_token(new_refresh_jwt)

    # Create new refresh token record
    new_refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh_record)
    db.flush()

    # Atomic conditional update to mark old token as replaced (amendment #6)
    # If two concurrent requests reach this point, only one can succeed in setting replaced_by
    rows_updated = db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.id == token_record.id,
            RefreshToken.replaced_by.is_(None),
            RefreshToken.is_revoked.is_(False),
        )
        .values(replaced_by=new_refresh_record.id)
    ).rowcount

    if rows_updated == 0:
        # Race condition / concurrent use detected!
        db.rollback()
        # Revoke entire token family
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id)
            .values(is_revoked=True)
        )
        write_audit_log(
            db, "SECURITY_ALERT_TOKEN_REUSE",
            user_id=user_id,
            ip_address=client_ip,
            user_agent=user_agent,
            details={"family_id": family_id, "reused_token_id": token_record.id, "reason": "concurrent_race"},
        )
        db.commit()
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected",
        )

    # Generate session-bound CSRF token
    csrf_token = generate_csrf_token(user.id)

    write_audit_log(
        db, "TOKEN_ROTATED",
        user_id=user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"family_id": family_id},
    )

    db.commit()

    set_auth_cookies(response, new_access_token, new_refresh_jwt, csrf_token)

    return RefreshResponse(message="Token refreshed", csrf_token=csrf_token)


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: Optional[str] = Cookie(None),
):
    """
    Server-side logout: revokes the entire refresh token family.
    Works from the refresh cookie alone — an expired access token does not block logout (amendment #3).
    """
    client_ip = get_client_ip(request)
    user_agent = _get_user_agent(request)

    if refresh_token:
        family_id = None
        user_id = None
        try:
            payload = decode_refresh_token(refresh_token)
            user_id = payload.get("sub")
            family_id = payload.get("family_id")
        except pyjwt.InvalidTokenError:
            # If token expired or invalid, fall back to DB lookup by token_hash
            token_hash = _hash_token(refresh_token)
            token_rec = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
            if token_rec:
                family_id = token_rec.family_id
                user_id = token_rec.user_id

        if family_id:
            db.execute(
                update(RefreshToken)
                .where(RefreshToken.family_id == family_id)
                .values(is_revoked=True)
            )

            write_audit_log(
                db, "LOGOUT",
                user_id=user_id,
                ip_address=client_ip,
                user_agent=user_agent,
                details={"family_id": family_id},
            )
            db.commit()

    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the current authenticated user's profile.
    Data is always loaded fresh from the database.
    """
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        cafeteria_ids=[c.id for c in current_user.cafeterias],
    )
