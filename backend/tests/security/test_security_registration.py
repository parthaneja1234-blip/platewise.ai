"""
Tests for Requirement 1: Seeding, Registration & Zero Self-Registration Policy.
"""
import pytest
from app.cli.seed_admin import seed_admin
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.security import verify_password


def test_cli_seed_initial_admin_success(db_session):
    """Verify CLI script creates Admin with Argon2id hash, active status, and audit log."""
    admin = seed_admin(
        email="superadmin@university.edu",
        full_name="Super Administrator",
        password="SuperSecurePassword123!",
        db=db_session,
    )
    assert admin.id is not None
    assert admin.email == "superadmin@university.edu"
    assert admin.full_name == "Super Administrator"
    assert admin.role == UserRole.ADMIN
    assert admin.is_active is True
    assert admin.failed_login_attempts == 0
    assert admin.locked_until is None

    # Verify password was hashed with Argon2id and can be verified
    assert verify_password("SuperSecurePassword123!", admin.hashed_password) is True
    assert admin.hashed_password.startswith("$argon2")

    # Verify audit log was recorded
    log = db_session.query(AuditLog).filter(
        AuditLog.user_id == admin.id,
        AuditLog.action == "INITIAL_ADMIN_SEEDED",
    ).first()
    assert log is not None
    assert log.details["email"] == "superadmin@university.edu"
    assert "password" not in log.details


def test_cli_seed_admin_rejects_duplicate_email(db_session):
    """Verify script aborts when email already exists."""
    seed_admin(
        email="admin.duplicate@university.edu",
        full_name="First Admin",
        password="ValidPassword123!",
        db=db_session,
    )

    with pytest.raises(ValueError, match="already exists"):
        seed_admin(
            email="admin.duplicate@university.edu",
            full_name="Second Admin",
            password="AnotherValidPassword123!",
            db=db_session,
        )


def test_cli_seed_admin_enforces_password_min_12_chars(db_session):
    """Verify passwords under 12 characters are rejected."""
    with pytest.raises(ValueError, match="minimum length requirement of 12 characters"):
        seed_admin(
            email="shortpass@university.edu",
            full_name="Short Pass Admin",
            password="Short123!",
            db=db_session,
        )


def test_cli_seed_admin_rejects_empty_email_or_name(db_session):
    """Verify empty email and empty name are rejected."""
    with pytest.raises(ValueError, match="email cannot be empty"):
        seed_admin(
            email="   ",
            full_name="Admin",
            password="ValidPassword123!",
            db=db_session,
        )

    with pytest.raises(ValueError, match="name cannot be empty"):
        seed_admin(
            email="valid@university.edu",
            full_name="   ",
            password="ValidPassword123!",
            db=db_session,
        )


def test_no_public_registration_endpoint_exists(client):
    """Assert POST /api/v1/auth/register returns 404 or 405 (zero open self-registration)."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "attacker@evil.com", "password": "Password12345!", "role": "admin"},
    )
    assert response.status_code in (404, 405)
