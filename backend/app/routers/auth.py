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
from app.models.cafeteria import Cafeteria
from app.models.join_code import MessJoinCode
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
from app.security import verify_password, hash_password, DUMMY_HASH
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


class StudentRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    join_code: str


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


# ----- Rate Limiting & Lockout State -----
MAX_CACHE_ENTRIES = 10000

# _ip_failed_attempts: IP -> list of failed attempt datetimes
_ip_failed_attempts: dict[str, list[datetime]] = {}
_ip_login_attempts = _ip_failed_attempts  # Backward compatibility alias for tests

# _lockout_attempts: (email, ip) -> {"failed_attempts": int, "locked_until": Optional[datetime]}
_lockout_attempts: dict[tuple[str, str], dict] = {}


def reset_rate_limits() -> None:
    """Clear in-memory IP and lockout counters (for testing and maintenance)."""
    _ip_failed_attempts.clear()
    _lockout_attempts.clear()


def parse_rate_limit(rate_str: str) -> tuple[int, timedelta]:
    """Parse rate limit string like '5/15minutes' or '100/minute' into (limit, timedelta)."""
    parts = rate_str.strip().split("/")
    limit = int(parts[0])
    window_str = parts[1].lower() if len(parts) > 1 else "15minutes"
    if "minute" in window_str:
        num = "".join(c for c in window_str if c.isdigit())
        minutes = int(num) if num else 1
        window = timedelta(minutes=minutes)
    elif "hour" in window_str:
        num = "".join(c for c in window_str if c.isdigit())
        hours = int(num) if num else 1
        window = timedelta(hours=hours)
    elif "second" in window_str:
        num = "".join(c for c in window_str if c.isdigit())
        secs = int(num) if num else 1
        window = timedelta(seconds=secs)
    else:
        window = timedelta(minutes=15)
    return limit, window


def _prune_caches() -> None:
    """Cap cache sizes and prune expired entries to prevent memory exhaustion."""
    now = datetime.now(timezone.utc)
    _, window = parse_rate_limit(settings.RATE_LIMIT_LOGIN)
    cutoff = now - window

    # Prune expired IP attempts
    expired_ips = []
    for ip, timestamps in _ip_failed_attempts.items():
        valid = [t for t in timestamps if (t.replace(tzinfo=timezone.utc) if t.tzinfo is None else t) > cutoff]
        if valid:
            _ip_failed_attempts[ip] = valid
        else:
            expired_ips.append(ip)
    for ip in expired_ips:
        _ip_failed_attempts.pop(ip, None)

    # Prune expired lockout attempts
    expired_keys = []
    for key, record in _lockout_attempts.items():
        locked_until = record.get("locked_until")
        if locked_until and _is_past(locked_until):
            expired_keys.append(key)
    for key in expired_keys:
        _lockout_attempts.pop(key, None)

    # Enforce capacity cap
    if len(_ip_failed_attempts) > MAX_CACHE_ENTRIES:
        excess = len(_ip_failed_attempts) - MAX_CACHE_ENTRIES
        for k in list(_ip_failed_attempts.keys())[:excess]:
            _ip_failed_attempts.pop(k, None)

    if len(_lockout_attempts) > MAX_CACHE_ENTRIES:
        excess = len(_lockout_attempts) - MAX_CACHE_ENTRIES
        for k in list(_lockout_attempts.keys())[:excess]:
            _lockout_attempts.pop(k, None)


def _check_ip_rate_limit(ip: str) -> None:
    """
    Check if client IP has exceeded the allowed failed login attempts.
    Only failed attempts are counted (Item 2). Does NOT record an attempt here.
    """
    now = datetime.now(timezone.utc)
    _, window = parse_rate_limit(settings.RATE_LIMIT_LOGIN)
    cutoff = now - window

    timestamps = _ip_failed_attempts.get(ip, [])
    valid_timestamps = [t for t in timestamps if (t.replace(tzinfo=timezone.utc) if t.tzinfo is None else t) > cutoff]
    _ip_failed_attempts[ip] = valid_timestamps

    per_ip_limit = settings.RATE_LIMIT_LOGIN_PER_IP
    if len(valid_timestamps) >= per_ip_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )


def _record_ip_failure(ip: str) -> None:
    """Record a failed login attempt for the client IP."""
    now = datetime.now(timezone.utc)
    if ip not in _ip_failed_attempts:
        _ip_failed_attempts[ip] = []
    _ip_failed_attempts[ip].append(now)
    _prune_caches()


def _get_lockout(email: str, ip: str) -> tuple[int, Optional[datetime]]:
    """Return (failed_attempts, locked_until) for an (email, ip) pair.
    Resets failed counters when a lock has expired (Item 3)."""
    key = (email, ip)
    record = _lockout_attempts.get(key)
    if not record:
        return 0, None

    locked_until = record.get("locked_until")
    if locked_until:
        if _is_past(locked_until):
            # Lock has expired: reset failed counter
            record["failed_attempts"] = 0
            record["locked_until"] = None
            return 0, None
        return record.get("failed_attempts", 0), locked_until

    return record.get("failed_attempts", 0), None


def _record_lockout_failure(email: str, ip: str) -> tuple[int, Optional[datetime]]:
    """Record a failed attempt for (email, ip). If threshold met, lock the pair."""
    now = datetime.now(timezone.utc)
    key = (email, ip)
    if key not in _lockout_attempts:
        _lockout_attempts[key] = {
            "failed_attempts": 0,
            "locked_until": None,
        }
    record = _lockout_attempts[key]

    # If previous lock expired, reset
    if record.get("locked_until") and _is_past(record["locked_until"]):
        record["failed_attempts"] = 0
        record["locked_until"] = None

    record["failed_attempts"] += 1
    per_email_limit, _ = parse_rate_limit(settings.RATE_LIMIT_LOGIN)
    lockout_threshold = min(settings.ACCOUNT_LOCKOUT_ATTEMPTS, per_email_limit)
    if record["failed_attempts"] >= lockout_threshold:
        record["locked_until"] = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)

    _prune_caches()
    return record["failed_attempts"], record["locked_until"]


def _reset_lockout(email: str, ip: str) -> None:
    _lockout_attempts.pop((email, ip), None)


def reset_lockout_for_email(email: str) -> None:
    """Clear all lockout entries for an email across all IPs (for unlock_user CLI)."""
    email_clean = email.strip().lower()
    keys_to_del = [k for k in _lockout_attempts.keys() if k[0] == email_clean]
    for k in keys_to_del:
        _lockout_attempts.pop(k, None)


def _apply_progressive_delay(attempts: int) -> None:
    """Apply progressive escalating delay proportional to failed attempts."""
    delay = min(0.01 * (attempts ** 1.3), 0.3)
    if delay > 0:
        import time
        time.sleep(delay)


def _verify_origin_allowed(request: Request) -> None:
    """Reject requests whose Origin header is present and not in the CORS allow-list (Item 5)."""
    origin = request.headers.get("origin")
    if origin:
        allowed = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
        if origin not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Origin not allowed",
            )


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
    - Lockout tracked per (email + IP) pair with escalating delay so third parties cannot lock users out (Items 2 & 3).
    - Only failed attempts count toward per-IP rate limit.
    - Atomically increments failed_login_attempts in SQL.
    """
    client_ip = get_client_ip(request)
    user_agent = _get_user_agent(request)

    # Check per-IP rate limit (only counts failed attempts)
    _check_ip_rate_limit(client_ip)

    generic_error = "Invalid email or password"
    email_clean = body.email.strip().lower()

    # Check (email + IP) lockout state
    pair_attempts, pair_locked_until = _get_lockout(email_clean, client_ip)
    is_pair_locked = _is_future(pair_locked_until)

    # Look up user in DB with cafeterias preloaded
    user = db.query(User).options(joinedload(User.cafeterias)).filter(User.email == email_clean).first()

    # Reset expired DB lock if applicable
    if user and user.locked_until and _is_past(user.locked_until):
        user.failed_login_attempts = 0
        user.locked_until = None
        db.flush()

    is_db_locked = bool(user and _is_future(user.locked_until))

    if is_pair_locked or is_db_locked:
        # Locked: record failure, apply progressive delay and run dummy hash for timing safety
        _record_ip_failure(client_ip)
        _record_lockout_failure(email_clean, client_ip)
        if user:
            db.execute(
                update(User)
                .where(User.id == user.id)
                .values(failed_login_attempts=User.failed_login_attempts + 1)
            )
        _apply_progressive_delay(max(pair_attempts + 1, getattr(user, "failed_login_attempts", 0)))
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
        # Non-existent user: track failure per (email, IP), apply progressive delay, run dummy hash
        _record_ip_failure(client_ip)
        new_attempts, _ = _record_lockout_failure(email_clean, client_ip)
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
        _record_ip_failure(client_ip)
        new_attempts, new_locked_until = _record_lockout_failure(email_clean, client_ip)

        # Atomically increment failed_login_attempts in SQL and set locked_until if locked (Item 3)
        update_vals = {"failed_login_attempts": User.failed_login_attempts + 1}
        if new_locked_until is not None:
            update_vals["locked_until"] = new_locked_until

        db.execute(
            update(User)
            .where(User.id == user.id)
            .values(**update_vals)
        )
        db.flush()
        db.refresh(user)
        _apply_progressive_delay(new_attempts)

        if new_locked_until is not None:
            write_audit_log(
                db, "ACCOUNT_LOCKED",
                user_id=user.id,
                ip_address=client_ip,
                user_agent=user_agent,
                details={"failed_attempts": user.failed_login_attempts, "locked_ip": client_ip},
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
        _record_ip_failure(client_ip)
        _record_lockout_failure(email_clean, client_ip)
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

    # Success: reset lockout counters (successful logins do NOT count against rate limits)
    user.failed_login_attempts = 0
    user.locked_until = None
    _reset_lockout(email_clean, client_ip)
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
    - Validates Origin header against CORS allow-list (Item 5).
    - Validates the refresh JWT signature and type.
    - Looks up the token hash in the database.
    - Performs atomic rotation with conditional UPDATE / row lock.
    - 10-second grace window: allows a recently replaced token to return 401 without revoking family (Item 6).
    - If reuse occurs after 10-second grace window, revokes the entire family and logs alert.
    - Issues a new access token + refresh token + CSRF token.
    """
    _verify_origin_allowed(request)

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

    # Check for reuse / revocation
    if token_record.is_revoked:
        # Token family already revoked: theft detection
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
            details={"family_id": family_id, "reused_token_id": token_record.id, "reason": "already_revoked"},
        )
        db.commit()
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected",
        )

    if token_record.replaced_by is not None:
        # Token has already been rotated. Check 10-second grace window (Item 6).
        replacement = db.query(RefreshToken).filter(RefreshToken.id == token_record.replaced_by).first()
        if replacement:
            rep_created = replacement.created_at
            if rep_created.tzinfo is None:
                rep_created = rep_created.replace(tzinfo=timezone.utc)
            age = (datetime.now(timezone.utc) - rep_created).total_seconds()
            if age <= 10.0:
                # Within 10-second grace period: return 401 WITHOUT revoking the family!
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token already rotated within grace period",
                )

        # After grace window has expired: theft detected, revoke entire family!
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
            details={"family_id": family_id, "reused_token_id": token_record.id, "reason": "grace_window_expired"},
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

    # Atomic conditional update to mark old token as replaced
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
        # Check if the token was rotated within 10-second grace window
        refreshed_rec = db.query(RefreshToken).filter(RefreshToken.id == token_record.id).first()
        if refreshed_rec and refreshed_rec.replaced_by and not refreshed_rec.is_revoked:
            replacement = db.query(RefreshToken).filter(RefreshToken.id == refreshed_rec.replaced_by).first()
            if replacement:
                rep_created = replacement.created_at
                if rep_created.tzinfo is None:
                    rep_created = rep_created.replace(tzinfo=timezone.utc)
                age = (datetime.now(timezone.utc) - rep_created).total_seconds()
                if age <= 10.0:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token already rotated within grace period",
                    )

        # Otherwise revoke entire token family
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
    - Validates Origin header against CORS allow-list (Item 5).
    - Works from the refresh cookie alone — an expired access token does not block logout.
    """
    _verify_origin_allowed(request)

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


@router.post("/register-student", response_model=LoginResponse)
def register_student(
    request: Request,
    response: Response,
    body: StudentRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Student registration via expiring, limited-use mess join code (Section 12).
    - Checks origin header.
    - Hashes join code and verifies validity, expiration, and usage limits.
    - Atomically increments join code usage counter.
    - Creates student user and links them to the mess hall.
    - Automatically issues tokens and sets auth cookies.
    """
    _verify_origin_allowed(request)

    client_ip = get_client_ip(request)
    user_agent = _get_user_agent(request)

    email_clean = body.email.strip().lower()
    name_clean = body.full_name.strip()
    code_clean = body.join_code.strip().upper()

    if len(body.password) < settings.PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long.",
        )

    # Check email uniqueness
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Validate join code
    code_hash = hashlib.sha256(code_clean.encode()).hexdigest()
    join_code = db.query(MessJoinCode).filter(
        MessJoinCode.code_hash == code_hash,
        MessJoinCode.is_active == True,
    ).first()

    if not join_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired mess join code.",
        )

    if _is_past(join_code.expires_at):
        join_code.is_active = False
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This join code has expired. Please request a new code from your mess manager.",
        )

    if join_code.used_count >= join_code.max_uses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This join code has reached its maximum usage limit.",
        )

    # Atomically increment used count
    join_code.used_count += 1

    # Load associated mess hall
    cafeteria = db.query(Cafeteria).filter(Cafeteria.id == join_code.mess_id).first()
    if not cafeteria:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The cafeteria linked to this join code no longer exists.",
        )

    # Create new student user
    new_user = User(
        email=email_clean,
        full_name=name_clean,
        hashed_password=hash_password(body.password),
        role=UserRole.STUDENT,
        is_active=True,
        failed_login_attempts=0,
        locked_until=None,
    )
    new_user.cafeterias.append(cafeteria)
    db.add(new_user)
    db.flush()

    write_audit_log(
        db,
        "STUDENT_REGISTERED",
        user_id=new_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={
            "email": new_user.email,
            "mess_id": cafeteria.id,
            "mess_name": cafeteria.name,
            "join_code_id": join_code.id,
        },
    )

    # Automatically log the student in
    access_token = create_access_token(
        user_id=new_user.id,
        email=new_user.email,
        role=new_user.role.value,
        cafeteria_ids=[cafeteria.id],
    )

    family_id = str(uuid.uuid4())
    refresh_jwt = create_refresh_token_jwt(
        user_id=new_user.id,
        family_id=family_id,
    )
    refresh_hash = _hash_token(refresh_jwt)
    refresh_record = RefreshToken(
        user_id=new_user.id,
        token_hash=refresh_hash,
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)

    csrf_token = generate_csrf_token(new_user.id)
    db.commit()

    set_auth_cookies(response, access_token, refresh_jwt, csrf_token)
    return LoginResponse(message="Student registered successfully", csrf_token=csrf_token)

