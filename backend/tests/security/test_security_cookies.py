"""
Tests for Requirement 7:
Cookie Security Architecture (HttpOnly, SameSite, Secure, Path Isolation) & Production Startup Validation.
"""
import pytest
from pydantic_core import ValidationError

from app.config import Settings
from app.models.user import User, UserRole
from app.security import hash_password


@pytest.fixture
def cookie_user(db_session):
    user = User(
        email="cookieuser@university.edu",
        full_name="Cookie User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_auth_cookies_have_httponly_and_samesite_lax(client, cookie_user):
    """Assert access_token and refresh_token specify HttpOnly=True and SameSite='lax'."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": cookie_user.email, "password": "ValidPassword123!"},
    )
    assert resp.status_code == 200

    set_cookie_headers = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else [resp.headers.get("set-cookie")]
    joined_headers = "; ".join(set_cookie_headers)

    # Check access_token has HttpOnly
    assert "access_token=" in joined_headers
    assert "refresh_token=" in joined_headers

    for header in set_cookie_headers:
        if "access_token=" in header:
            assert "httponly" in header.lower()
            assert "samesite=lax" in header.lower()
        if "refresh_token=" in header:
            assert "httponly" in header.lower()
            assert "samesite=lax" in header.lower()


def test_refresh_cookie_path_restricted_to_auth(client, cookie_user):
    """Assert refresh_token cookie path is restricted to /api/v1/auth."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": cookie_user.email, "password": "ValidPassword123!"},
    )
    assert resp.status_code == 200

    set_cookie_headers = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else [resp.headers.get("set-cookie")]
    for header in set_cookie_headers:
        if "refresh_token=" in header:
            assert "path=/api/v1/auth" in header.lower()


def test_cookies_have_secure_flag_when_cookie_secure_is_true(client, cookie_user, monkeypatch):
    """When COOKIE_SECURE=True, cookies include Secure flag."""
    from app.config import settings
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": cookie_user.email, "password": "ValidPassword123!"},
    )
    assert resp.status_code == 200

    set_cookie_headers = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else [resp.headers.get("set-cookie")]
    for header in set_cookie_headers:
        if any(tok in header for tok in ("access_token=", "refresh_token=", "csrf_token=")):
            assert "secure" in header.lower()


def test_startup_fails_in_production_if_cookie_secure_is_false():
    """Settings raises ValidationError if ENVIRONMENT='production' and COOKIE_SECURE=False."""
    with pytest.raises(ValidationError, match="COOKIE_SECURE must be True"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            COOKIE_SECURE=False,
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="x" * 32,
            REFRESH_SECRET_KEY="y" * 32,
            CSRF_SECRET="z" * 32,
            POSTGRES_PASSWORD="p" * 16,
        )


def test_startup_succeeds_in_production_when_cookie_secure_is_true():
    """Settings succeeds when ENVIRONMENT='production' and COOKIE_SECURE=True."""
    cfg = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        COOKIE_SECURE=True,
        DATABASE_URL="sqlite:///:memory:",
        SECRET_KEY="x" * 32,
        REFRESH_SECRET_KEY="y" * 32,
        CSRF_SECRET="z" * 32,
        POSTGRES_PASSWORD="p" * 16,
    )
    assert cfg.ENVIRONMENT == "production"
    assert cfg.COOKIE_SECURE is True
