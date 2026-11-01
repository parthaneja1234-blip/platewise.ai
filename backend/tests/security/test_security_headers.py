"""
Tests for Requirement 10 & Amendment 10:
Security Headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) and Strict CORS Allow-List.
"""
import pytest
from app.config import settings


def test_content_security_policy_header_present(client):
    """Verify Content-Security-Policy (CSP) is set on all responses."""
    resp = client.get("/health")
    assert resp.status_code == 200
    csp = resp.headers.get("Content-Security-Policy")
    assert csp is not None
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp


def test_strict_transport_security_header_when_cookie_secure(client, monkeypatch):
    """Verify HSTS header is present when COOKIE_SECURE is True, and omitted when False."""
    # When COOKIE_SECURE=False (development default)
    monkeypatch.setattr(settings, "COOKIE_SECURE", False)
    resp = client.get("/health")
    assert "Strict-Transport-Security" not in resp.headers

    # When COOKIE_SECURE=True
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)
    resp = client.get("/health")
    hsts = resp.headers.get("Strict-Transport-Security")
    assert hsts is not None
    assert "max-age=31536000" in hsts
    assert "includeSubDomains" in hsts


def test_x_content_type_options_nosniff(client):
    """Verify X-Content-Type-Options is nosniff."""
    resp = client.get("/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"


def test_x_frame_options_deny(client):
    """Verify X-Frame-Options is DENY to prevent clickjacking."""
    resp = client.get("/health")
    assert resp.headers.get("X-Frame-Options") == "DENY"


def test_referrer_policy_strict_origin(client):
    """Verify Referrer-Policy is strict-origin-when-cross-origin."""
    resp = client.get("/health")
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_strict_cors_allowed_origin_receives_headers(client):
    """Origins in CORS_ORIGINS allow-list receive Access-Control-Allow-Origin."""
    resp = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"
    assert resp.headers.get("Access-Control-Allow-Credentials") == "true"


def test_strict_cors_unauthorized_origin_rejected(client):
    """Origins NOT in the CORS allow-list do NOT receive Access-Control-Allow-Origin."""
    resp = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://malicious-website.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    # The header should NOT match the unauthorized origin
    assert resp.headers.get("Access-Control-Allow-Origin") != "http://malicious-website.com"
