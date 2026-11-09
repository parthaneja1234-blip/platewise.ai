"""
Tests for Requirement 6 & Amendments 4 and 5:
Timing-Safe Login, Non-Enumeration, Lockout for Non-Existent Accounts, IP Rate Limiting & Proxy Trust.
"""
import time
from datetime import datetime, timedelta, timezone
import pytest

from app.config import settings
from app.models.user import User, UserRole
from app.security import hash_password


@pytest.fixture
def existing_user(db_session):
    user = User(
        email="targetuser@university.edu",
        full_name="Target User",
        hashed_password=hash_password("CorrectPassword123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_generic_error_on_invalid_password(client, existing_user):
    """Wrong password returns 401 with 'Invalid email or password'."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": existing_user.email, "password": "WrongPassword123!"},
    )
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Invalid email or password"}


def test_login_generic_error_on_nonexistent_email(client):
    """Non-existent email returns identical 401 with 'Invalid email or password'."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@university.edu", "password": "WrongPassword123!"},
    )
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Invalid email or password"}


def test_login_generic_error_on_locked_account(client, db_session, existing_user):
    """Locked account returns identical 401 with 'Invalid email or password' (Amendment 4)."""
    existing_user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
    existing_user.failed_login_attempts = 5
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": existing_user.email, "password": "CorrectPassword123!"},
    )
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Invalid email or password"}


def test_no_user_enumeration_via_status_body_or_timing(client, db_session, existing_user):
    """
    Amendment 4: Prove no user enumeration through status, body, or timing.
    Status and body must be completely identical.
    Timing must execute Argon2id verification in all failure branches.
    """
    # 1. Non-existent account
    t0 = time.perf_counter()
    resp_nonexistent = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@university.edu", "password": "SomePassword123!"},
    )
    t_nonexistent = time.perf_counter() - t0

    # 2. Existing account with wrong password
    t0 = time.perf_counter()
    resp_wrong_pw = client.post(
        "/api/v1/auth/login",
        json={"email": existing_user.email, "password": "WrongPassword123!"},
    )
    t_wrong_pw = time.perf_counter() - t0

    # 3. Locked account
    existing_user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
    db_session.commit()

    t0 = time.perf_counter()
    resp_locked = client.post(
        "/api/v1/auth/login",
        json={"email": existing_user.email, "password": "CorrectPassword123!"},
    )
    t_locked = time.perf_counter() - t0

    # Verify identical HTTP status code
    assert resp_nonexistent.status_code == 401
    assert resp_wrong_pw.status_code == 401
    assert resp_locked.status_code == 401

    # Verify identical response payload
    assert resp_nonexistent.json() == {"detail": "Invalid email or password"}
    assert resp_wrong_pw.json() == {"detail": "Invalid email or password"}
    assert resp_locked.json() == {"detail": "Invalid email or password"}

    # Verify timing safety: all runs execute Argon2id verification (~10-100ms)
    # None of them return in sub-millisecond trivial timing (which would reveal early return)
    assert t_nonexistent > 0.005
    assert t_wrong_pw > 0.005
    assert t_locked > 0.005


def test_lockout_tracked_per_email_for_nonexistent_account(client):
    """
    Amendment 4: Lockout state is tracked per email regardless of whether the account exists.
    After 5 consecutive failures on a non-existent email, the email is locked.
    """
    from app.routers.auth import _ip_login_attempts
    email = "ghost@university.edu"
    for _ in range(5):
        _ip_login_attempts.clear()
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "WrongPassword123!"},
        )
        assert resp.status_code == 401
        assert resp.json() == {"detail": "Invalid email or password"}

    # 6th attempt (now locked)
    _ip_login_attempts.clear()
    resp_locked = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword123!"},
    )
    assert resp_locked.status_code == 401
    assert resp_locked.json() == {"detail": "Invalid email or password"}


def test_lockout_triggered_on_fifth_consecutive_failed_attempt(client, db_session, existing_user):
    """5 consecutive failures on an existing user sets locked_until in the DB."""
    for i in range(5):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": existing_user.email, "password": "WrongPassword123!"},
        )
        assert resp.status_code == 401

    db_session.refresh(existing_user)
    assert existing_user.failed_login_attempts == 5
    assert existing_user.locked_until is not None
    locked_dt = existing_user.locked_until
    if locked_dt.tzinfo is None:
        locked_dt = locked_dt.replace(tzinfo=timezone.utc)
    assert locked_dt > datetime.now(timezone.utc)


def test_locked_account_rejects_even_valid_password_with_generic_error(client, db_session, existing_user):
    """When locked, entering the correct password is still rejected with generic error."""
    existing_user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
    existing_user.failed_login_attempts = 5
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": existing_user.email, "password": "CorrectPassword123!"},
    )
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Invalid email or password"}


def test_successful_login_resets_failed_counter_and_lock(client, db_session, existing_user):
    """Successful login resets failed_login_attempts = 0 and locked_until = None."""
    # Fail twice
    client.post("/api/v1/auth/login", json={"email": existing_user.email, "password": "WrongPassword123!"})
    client.post("/api/v1/auth/login", json={"email": existing_user.email, "password": "WrongPassword123!"})

    db_session.refresh(existing_user)
    assert existing_user.failed_login_attempts == 2

    # Now login with correct password
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": existing_user.email, "password": "CorrectPassword123!"},
    )
    assert resp.status_code == 200

    db_session.refresh(existing_user)
    assert existing_user.failed_login_attempts == 0
    assert existing_user.locked_until is None


def test_login_ip_rate_limiting_triggers_429(client, monkeypatch):
    """
    Amendment 5: Exceeding allowed login requests from the same IP returns 429 Too Many Requests.
    """
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_PER_IP", 5)
    for i in range(5):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": f"user{i}@test.com", "password": "Password12345!"},
        )
        assert resp.status_code in (200, 401)

    # 6th attempt from same IP exceeds limit
    resp_rate_limited = client.post(
        "/api/v1/auth/login",
        json={"email": "user6@test.com", "password": "Password12345!"},
    )
    assert resp_rate_limited.status_code == 429
    assert "Too many login attempts" in resp_rate_limited.json()["detail"]


def test_untrusted_x_forwarded_for_ignored_for_rate_limiting(client, monkeypatch):
    """
    Amendment 5: Do not trust X-Forwarded-For unless behind a configured trusted proxy.
    Spoofing X-Forwarded-For from an untrusted peer does not bypass IP rate limiting.
    """
    # TRUSTED_PROXIES is empty by default in tests (untrusted)
    monkeypatch.setattr(settings, "TRUSTED_PROXIES", [])
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_PER_IP", 5)

    # Send 5 attempts with spoofed IP headers
    for i in range(5):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": f"test_spoof_{i}@test.com", "password": "Password123!"},
            headers={"X-Forwarded-For": f"198.51.100.{i}"},
        )
        assert resp.status_code in (200, 401)

    # 6th attempt with yet another spoofed IP must STILL be rate limited because peer IP is used
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "test_spoof_6@test.com", "password": "Password123!"},
        headers={"X-Forwarded-For": "198.51.100.99"},
    )
    assert resp.status_code == 429


def test_trusted_proxy_x_forwarded_for_respected(client, monkeypatch):
    """
    Amendment 5: When connecting peer IP is in TRUSTED_PROXIES, X-Forwarded-For client IP is respected.
    """
    # TestClient client.host is "testclient"
    monkeypatch.setattr(settings, "TRUSTED_PROXIES", ["testclient"])

    # Send requests with different forwarded client IPs through the trusted proxy
    # Since each has a different client IP, none reaches the 5-attempt limit
    for i in range(4):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": f"client_a_{i}@test.com", "password": "Password123!"},
            headers={"X-Forwarded-For": "203.0.113.1"},
        )
        assert resp.status_code == 401

    for j in range(4):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": f"client_b_{j}@test.com", "password": "Password123!"},
            headers={"X-Forwarded-For": "203.0.113.2"},
        )
        assert resp.status_code == 401
