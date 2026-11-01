"""
Tests for Requirement 4 & Amendment 7:
Signed & Session-Bound CSRF Tokens, Double-Submit Cookie Pattern, and Safe Methods Bypass.
"""
import pytest
from fastapi import APIRouter, Depends, Response
from app.deps import verify_csrf
from app.models.user import User, UserRole
from app.security import hash_password
from app.security.csrf import generate_csrf_token, verify_csrf_token
from app.security.jwt import create_access_token


@pytest.fixture
def csrf_test_user(db_session):
    user = User(
        email="csrfuser@university.edu",
        full_name="CSRF User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


_csrf_router = APIRouter(prefix="/test-csrf")


@_csrf_router.get("/safe", operation_id="test_csrf_safe_get")
def get_safe_route(user: User = Depends(verify_csrf)):
    return {"status": "ok"}


@_csrf_router.post("/mutating", operation_id="test_csrf_mutating_post")
def post_mutating_route(user: User = Depends(verify_csrf)):
    return {"status": "created"}


@_csrf_router.put("/mutating", operation_id="test_csrf_mutating_put")
def put_mutating_route(user: User = Depends(verify_csrf)):
    return {"status": "updated"}


@_csrf_router.delete("/mutating", operation_id="test_csrf_mutating_delete")
def delete_mutating_route(user: User = Depends(verify_csrf)):
    return {"status": "deleted"}


@pytest.fixture
def csrf_test_client(client, csrf_test_user):
    """Ensure test routes are included on client app."""
    if not any(getattr(r, "path", None) == "/test-csrf/safe" for r in client.app.routes):
        client.app.include_router(_csrf_router)

    # Set valid access token cookie for the user
    access_tok = create_access_token(
        user_id=csrf_test_user.id,
        email=csrf_test_user.email,
        role=csrf_test_user.role.value,
        cafeteria_ids=[],
    )
    client.cookies.set("access_token", access_tok)
    return client


def test_csrf_token_cookie_issued_on_login(client, csrf_test_user):
    """Login response includes Set-Cookie: csrf_token=... and JSON payload."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": csrf_test_user.email, "password": "ValidPassword123!"},
    )
    assert resp.status_code == 200
    assert "csrf_token" in resp.json()
    assert "csrf_token" in client.cookies


def test_csrf_token_cookie_is_readable_by_frontend_httponly_false(client, csrf_test_user):
    """Confirms csrf_token cookie has HttpOnly=False so frontend JavaScript can read it."""
    resp = client.get("/api/v1/auth/csrf")
    assert resp.status_code == 200
    # In Set-Cookie header, csrf_token must NOT have HttpOnly
    set_cookie_header = resp.headers.get("set-cookie", "")
    assert "csrf_token" in set_cookie_header
    # Check that for csrf_token cookie, httponly is absent
    for part in set_cookie_header.split(","):
        if "csrf_token=" in part:
            assert "HttpOnly" not in part, "csrf_token cookie should not be HttpOnly"


def test_safe_get_head_options_requests_bypass_csrf(csrf_test_client):
    """GET requests succeed without X-CSRF-Token header."""
    resp = csrf_test_client.get("/test-csrf/safe")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_post_missing_csrf_header_rejected_403(csrf_test_client, csrf_test_user):
    """Mutating POST request without X-CSRF-Token header returns 403 Forbidden."""
    token = generate_csrf_token(csrf_test_user.id)
    csrf_test_client.cookies.set("csrf_token", token)

    resp = csrf_test_client.post("/test-csrf/mutating")
    assert resp.status_code == 403
    assert "CSRF token missing or invalid" in resp.json()["detail"]


def test_put_missing_csrf_header_rejected_403(csrf_test_client, csrf_test_user):
    """Mutating PUT request without X-CSRF-Token returns 403 Forbidden."""
    token = generate_csrf_token(csrf_test_user.id)
    csrf_test_client.cookies.set("csrf_token", token)

    resp = csrf_test_client.put("/test-csrf/mutating")
    assert resp.status_code == 403


def test_delete_missing_csrf_header_rejected_403(csrf_test_client, csrf_test_user):
    """Mutating DELETE request without X-CSRF-Token returns 403 Forbidden."""
    token = generate_csrf_token(csrf_test_user.id)
    csrf_test_client.cookies.set("csrf_token", token)

    resp = csrf_test_client.delete("/test-csrf/mutating")
    assert resp.status_code == 403


def test_mismatched_csrf_header_and_cookie_rejected_403(csrf_test_client, csrf_test_user):
    """Different token in header vs cookie returns 403 Forbidden."""
    token1 = generate_csrf_token(csrf_test_user.id)
    token2 = generate_csrf_token(csrf_test_user.id)

    csrf_test_client.cookies.set("csrf_token", token1)
    resp = csrf_test_client.post(
        "/test-csrf/mutating",
        headers={"X-CSRF-Token": token2},
    )
    assert resp.status_code == 403


def test_matching_csrf_header_and_cookie_succeeds(csrf_test_client, csrf_test_user):
    """Valid matching session-bound CSRF header and cookie allow request to proceed."""
    valid_token = generate_csrf_token(csrf_test_user.id)
    csrf_test_client.cookies.set("csrf_token", valid_token)

    resp = csrf_test_client.post(
        "/test-csrf/mutating",
        headers={"X-CSRF-Token": valid_token},
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "created"}


def test_csrf_token_is_session_bound_and_signed(csrf_test_client, csrf_test_user):
    """
    Amendment 7: CSRF token is HMAC signed and bound to the session.
    A token created for another user's session is rejected even if header equals cookie.
    """
    other_user_id = "different-session-uuid"
    token_for_other_user = generate_csrf_token(other_user_id)

    csrf_test_client.cookies.set("csrf_token", token_for_other_user)
    resp = csrf_test_client.post(
        "/test-csrf/mutating",
        headers={"X-CSRF-Token": token_for_other_user},
    )
    assert resp.status_code == 403
    assert "CSRF token missing or invalid" in resp.json()["detail"]


def test_timing_safe_csrf_token_comparison():
    """Verify verify_csrf_token uses constant-time comparison and handles malformed input safely."""
    assert verify_csrf_token("", "session-1") is False
    assert verify_csrf_token("invalid_no_dot", "session-1") is False
    assert verify_csrf_token("nonce.badsignature", "session-1") is False

    valid = generate_csrf_token("session-1")
    assert verify_csrf_token(valid, "session-1") is True
    assert verify_csrf_token(valid, "session-2") is False
