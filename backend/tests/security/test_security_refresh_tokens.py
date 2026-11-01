"""
Tests for Requirement 2 & Amendment 6:
Refresh Token Hashing, ASVS V3.4 Rotation, Theft/Reuse Detection & Atomic Concurrency.
"""
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
import pytest

from app.models.audit_log import AuditLog
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
from app.security import hash_password
from app.security.jwt import create_refresh_token_jwt


@pytest.fixture
def test_user(db_session):
    user = User(
        email="refreshuser@university.edu",
        full_name="Refresh User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _login_and_get_cookies(client, email="refreshuser@university.edu", password="ValidPassword123!"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    cookies = client.cookies
    return resp, cookies


def test_refresh_token_stored_only_as_sha256_hash(client, db_session, test_user):
    """Verify database contains only the 64-char hex SHA-256 hash of refresh token."""
    _login_and_get_cookies(client)
    refresh_cookie = client.cookies.get("refresh_token")
    assert refresh_cookie is not None

    expected_hash = hashlib.sha256(refresh_cookie.encode("utf-8")).hexdigest()
    assert len(expected_hash) == 64

    record = db_session.query(RefreshToken).filter(RefreshToken.user_id == test_user.id).first()
    assert record is not None
    assert record.token_hash == expected_hash
    assert record.is_revoked is False
    assert record.replaced_by is None


def test_raw_refresh_token_never_saved_in_database(client, db_session, test_user):
    """Assert raw refresh token string cannot be found anywhere in database tables."""
    _login_and_get_cookies(client)
    refresh_cookie = client.cookies.get("refresh_token")

    # Query all refresh token records
    records = db_session.query(RefreshToken).all()
    for rec in records:
        assert rec.token_hash != refresh_cookie
        assert refresh_cookie not in str(rec.__dict__)


def test_refresh_token_rotates_on_every_use(client, db_session, test_user):
    """Calling /api/v1/auth/refresh rotates the token and sets replaced_by on old record."""
    _login_and_get_cookies(client)
    old_cookie = client.cookies.get("refresh_token")
    old_hash = hashlib.sha256(old_cookie.encode("utf-8")).hexdigest()

    # Call refresh
    refresh_resp = client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200

    new_cookie = client.cookies.get("refresh_token")
    assert new_cookie != old_cookie
    new_hash = hashlib.sha256(new_cookie.encode("utf-8")).hexdigest()

    # Verify old record points to new record in DB
    old_rec = db_session.query(RefreshToken).filter(RefreshToken.token_hash == old_hash).first()
    new_rec = db_session.query(RefreshToken).filter(RefreshToken.token_hash == new_hash).first()

    assert old_rec is not None
    assert new_rec is not None
    assert old_rec.replaced_by == new_rec.id
    assert old_rec.family_id == new_rec.family_id


def test_refresh_token_reuse_revokes_entire_family(client, db_session, test_user):
    """Submitting an already-used refresh token triggers theft detection and revokes the family."""
    _login_and_get_cookies(client)
    token_1 = client.cookies.get("refresh_token")

    # Legitimate rotation 1 -> 2
    resp1 = client.post("/api/v1/auth/refresh")
    assert resp1.status_code == 200
    token_2 = client.cookies.get("refresh_token")
    assert token_2 != token_1

    # Attacker reuses token_1
    client.cookies.set("refresh_token", token_1)
    reuse_resp = client.post("/api/v1/auth/refresh")
    assert reuse_resp.status_code == 401
    assert "Token reuse detected" in reuse_resp.json()["detail"]

    # Verify ALL tokens in the family are now revoked
    tokens_in_db = db_session.query(RefreshToken).filter(RefreshToken.user_id == test_user.id).all()
    assert len(tokens_in_db) >= 2
    for tok in tokens_in_db:
        assert tok.is_revoked is True


def test_refresh_token_reuse_logs_critical_security_alert(client, db_session, test_user):
    """Reuse attempt creates a SECURITY_ALERT_TOKEN_REUSE audit record."""
    _login_and_get_cookies(client)
    old_token = client.cookies.get("refresh_token")

    # Rotate
    client.post("/api/v1/auth/refresh")

    # Reuse old token
    client.cookies.set("refresh_token", old_token)
    client.post("/api/v1/auth/refresh")

    alert_log = db_session.query(AuditLog).filter(
        AuditLog.user_id == test_user.id,
        AuditLog.action == "SECURITY_ALERT_TOKEN_REUSE",
    ).first()
    assert alert_log is not None
    assert "family_id" in alert_log.details


def test_subsequent_token_in_revoked_family_fails(client, db_session, test_user):
    """Subsequent legitimate token in a compromised family also fails after theft detected."""
    _login_and_get_cookies(client)
    token_1 = client.cookies.get("refresh_token")

    # Rotate to token 2
    client.post("/api/v1/auth/refresh")
    token_2 = client.cookies.get("refresh_token")

    # Thief reuses token 1 -> revokes family
    client.cookies.set("refresh_token", token_1)
    client.post("/api/v1/auth/refresh")

    # Legitimate user now tries to use token 2
    client.cookies.set("refresh_token", token_2)
    resp = client.post("/api/v1/auth/refresh")
    assert resp.status_code == 401


def test_expired_refresh_token_rejected_401(client, db_session, test_user):
    """Expired refresh token returns 401 Unauthorized."""
    # Create expired refresh token in DB
    family_id = str(uuid.uuid4())
    expired_jwt = create_refresh_token_jwt(
        user_id=test_user.id,
        family_id=family_id,
        expires_delta=timedelta(seconds=-10),
    )
    rec = RefreshToken(
        user_id=test_user.id,
        token_hash=hashlib.sha256(expired_jwt.encode()).hexdigest(),
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db_session.add(rec)
    db_session.commit()

    client.cookies.set("refresh_token", expired_jwt)
    resp = client.post("/api/v1/auth/refresh")
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()


def test_logout_revokes_token_family_server_side(client, db_session, test_user):
    """Calling /api/v1/auth/logout revokes the active token family in database."""
    _login_and_get_cookies(client)
    refresh_token = client.cookies.get("refresh_token")

    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 200

    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    rec = db_session.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    assert rec.is_revoked is True


def test_logged_out_refresh_token_cannot_be_used(client, db_session, test_user):
    """Calling /api/v1/auth/refresh with a logged-out token returns 401."""
    _login_and_get_cookies(client)
    refresh_token = client.cookies.get("refresh_token")

    client.post("/api/v1/auth/logout")

    client.cookies.set("refresh_token", refresh_token)
    refresh_resp = client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 401


def test_atomic_concurrent_refresh_rotation_prevents_double_rotation(client, db_session, test_user):
    """
    Amendment 6: Refresh rotation must be atomic.
    Simulating two concurrent requests presenting the same token:
    The first rotates the token; the second MUST fail with token reuse detection.
    """
    _login_and_get_cookies(client)
    token = client.cookies.get("refresh_token")

    # Request 1 succeeds
    client.cookies.set("refresh_token", token)
    resp1 = client.post("/api/v1/auth/refresh")
    assert resp1.status_code == 200

    # Request 2 (simulated concurrent request with same original token)
    client.cookies.set("refresh_token", token)
    resp2 = client.post("/api/v1/auth/refresh")
    assert resp2.status_code == 401
    assert "Token reuse detected" in resp2.json()["detail"]
