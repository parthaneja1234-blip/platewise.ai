"""
JWT token service with algorithm pinning (HS256), type isolation,
and mandatory claim enforcement (sub, exp, iat, jti, type).
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

from app.config import settings


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    cafeteria_ids: list[str],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a short-lived JWT access token.
    Claims: sub, email, role, cafeteria_ids, type, jti, iat, exp.
    """
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "cafeteria_ids": cafeteria_ids,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and verify an access token.
    - Algorithm pinned to HS256 (rejects 'none' and alg switching attacks).
    - Verifies exp and iat.
    - Enforces type == "access".
    Raises jwt.InvalidTokenError on any failure.
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat", "jti", "type"]},
    )

    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Token type is not 'access'")

    return payload


def create_refresh_token_jwt(
    user_id: str,
    family_id: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT refresh token.
    Contains minimal claims: sub, family_id, type, jti, iat, exp.
    The raw opaque secret is NOT used here; the JWT itself is the refresh token.
    """
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))

    payload = {
        "sub": user_id,
        "family_id": family_id,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    """
    Decode and verify a refresh token.
    - Algorithm pinned to HS256.
    - Enforces type == "refresh".
    Raises jwt.InvalidTokenError on any failure.
    """
    payload = jwt.decode(
        token,
        settings.REFRESH_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat", "jti", "type"]},
    )

    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Token type is not 'refresh'")

    return payload
