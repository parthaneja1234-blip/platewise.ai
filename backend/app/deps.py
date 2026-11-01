"""
Authentication and authorization dependencies for FastAPI.

Key design decisions (per amendments):
- get_current_user loads the user from DB on every request, using JWT only as an identifier.
  Role, is_active, and cafeteria assignments are always read from the database, never from JWT claims.
- require_role checks the DB-loaded role, not the JWT claim.
- verify_csrf enforces double-submit cookie validation on all mutating requests.
- get_client_ip does NOT trust X-Forwarded-For unless the direct peer is in TRUSTED_PROXIES.
"""
from typing import Optional

import jwt as pyjwt
from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.security.csrf import verify_csrf_token
from app.security.jwt import decode_access_token


def get_client_ip(request: Request) -> str:
    """
    Determine the client IP address.
    Only trusts X-Forwarded-For if the direct connecting peer is a configured trusted proxy.
    """
    peer_ip = request.client.host if request.client else "unknown"

    trusted_proxies = settings.TRUSTED_PROXIES
    if isinstance(trusted_proxies, str):
        trusted_proxies = [p.strip() for p in trusted_proxies.split(",") if p.strip()]

    if trusted_proxies and peer_ip in trusted_proxies:
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        if forwarded_for:
            # Take the first (client) IP from the chain
            return forwarded_for.split(",")[0].strip()

    return peer_ip


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    access_token: Optional[str] = Cookie(None),
) -> User:
    """
    Authenticate the current user from the access_token cookie.
    JWT is used ONLY as an identifier (sub claim) — authorization data (role, is_active,
    cafeteria assignments) is always loaded fresh from the database.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_access_token(access_token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token claims",
        )

    # Always load from DB: role changes, deactivation, and cafeteria unassignment
    # take effect immediately, not when the JWT expires.
    user = db.query(User).options(joinedload(User.cafeterias)).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account has been deactivated",
        )

    return user


def require_role(*allowed_roles: UserRole):
    """
    Dependency factory that checks the DB-loaded user's role.
    Usage: Depends(require_role(UserRole.ADMIN))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_checker


def verify_csrf(
    request: Request,
    current_user: User = Depends(get_current_user),
    x_csrf_token: Optional[str] = Header(None, alias="X-CSRF-Token"),
    csrf_token: Optional[str] = Cookie(None),
) -> User:
    """
    CSRF double-submit cookie verification for state-changing requests.
    Compares the X-CSRF-Token header against the csrf_token cookie value,
    verifying the HMAC signature is bound to the user's session.
    Safe methods (GET, HEAD, OPTIONS) bypass CSRF checks.
    """
    # Safe methods bypass CSRF
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return current_user

    if not x_csrf_token or not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing or invalid",
        )

    # Verify the header token matches the cookie AND is signed for this user's session
    if not verify_csrf_token(x_csrf_token, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing or invalid",
        )

    # Also verify the cookie matches the header (double-submit)
    if x_csrf_token != csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing or invalid",
        )

    return current_user
