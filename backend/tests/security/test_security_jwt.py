"""
Tests for Requirement 3: JWT Algorithm Pinning, Type Isolation & Claim Enforcement.
"""
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import pytest

from app.config import settings
from app.models.user import User, UserRole
from app.security import hash_password
from app.security.jwt import (
    create_access_token,
    decode_access_token,
    create_refresh_token_jwt,
    decode_refresh_token,
)


@pytest.fixture
def test_user(db_session):
    user = User(
        email="jwtuser@university.edu",
        full_name="JWT User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.MESS_MANAGER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_jwt_signature_verified_with_hs256(test_user):
    """Verify standard HS256 signed access tokens authenticate successfully."""
    token = create_access_token(
        user_id=test_user.id,
        email=test_user.email,
        role=test_user.role.value,
        cafeteria_ids=["cafeteria-1"],
    )
    payload = decode_access_token(token)
    assert payload["sub"] == test_user.id
    assert payload["email"] == test_user.email
    assert payload["role"] == "mess_manager"
    assert payload["cafeteria_ids"] == ["cafeteria-1"]
    assert payload["type"] == "access"


def test_jwt_rejects_none_algorithm(test_user):
    """Verify tokens forged with alg='none' are rejected."""
    # Manually craft unsigned token with alg=none
    header = {"alg": "none", "typ": "JWT"}
    payload = {
        "sub": test_user.id,
        "email": test_user.email,
        "role": "admin",
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    unsecured_token = jwt.encode(payload, key="", algorithm="none")

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(unsecured_token)


def test_jwt_rejects_algorithm_switching_attack(test_user):
    """Verify token signed with an unauthorized algorithm or key is rejected."""
    # Attempting to sign with a different symmetric or asymmetric algorithm
    payload = {
        "sub": test_user.id,
        "email": test_user.email,
        "role": "admin",
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    # Sign with HS384 or wrong key
    wrong_alg_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS384")

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(wrong_alg_token)


def test_jwt_contains_required_claims_sub_exp_iat_jti_type(test_user):
    """Asserts decoded payload contains all required claims."""
    token = create_access_token(
        user_id=test_user.id,
        email=test_user.email,
        role=test_user.role.value,
        cafeteria_ids=[],
    )
    payload = decode_access_token(token)

    for claim in ("sub", "email", "role", "cafeteria_ids", "type", "jti", "iat", "exp"):
        assert claim in payload, f"Missing required claim: {claim}"
    assert payload["type"] == "access"


def test_access_token_cannot_be_used_at_refresh_endpoint(client, test_user):
    """Sending type: 'access' token to /api/v1/auth/refresh returns 401 Unauthorized."""
    access_tok = create_access_token(
        user_id=test_user.id,
        email=test_user.email,
        role=test_user.role.value,
        cafeteria_ids=[],
    )
    client.cookies.set("refresh_token", access_tok)
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 401
    assert "Invalid refresh token" in response.json()["detail"] or "expired" in response.json()["detail"]


def test_refresh_token_cannot_be_used_as_access_token(client, test_user):
    """Sending type: 'refresh' token to access-protected /api/v1/auth/me returns 401 Unauthorized."""
    refresh_tok = create_refresh_token_jwt(
        user_id=test_user.id,
        family_id=str(uuid.uuid4()),
    )
    client.cookies.set("access_token", refresh_tok)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Invalid access token" in response.json()["detail"]


def test_expired_access_token_rejected_401(client, test_user):
    """Tokens older than lifespan return 401 Unauthorized."""
    expired_token = create_access_token(
        user_id=test_user.id,
        email=test_user.email,
        role=test_user.role.value,
        cafeteria_ids=[],
        expires_delta=timedelta(seconds=-10),  # expired 10s ago
    )
    client.cookies.set("access_token", expired_token)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_tampered_jwt_payload_rejected_401(client, test_user):
    """Altering payload claims without signature update returns 401 Unauthorized."""
    valid_token = create_access_token(
        user_id=test_user.id,
        email=test_user.email,
        role="viewer",
        cafeteria_ids=[],
    )
    parts = valid_token.split(".")
    # Tamper with payload segment
    import base64
    import json
    header_b64, payload_b64, sig_b64 = parts
    # Add padding
    payload_json = json.loads(base64.urlsafe_b64decode(payload_b64 + "==").decode())
    payload_json["role"] = "admin"
    tampered_payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_json).encode()).decode().rstrip("=")
    tampered_token = f"{header_b64}.{tampered_payload_b64}.{sig_b64}"

    client.cookies.set("access_token", tampered_token)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
