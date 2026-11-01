"""
Tests for Requirement 8 & Amendment 8:
Audit Logging Sanitization & Database-Level Append-Only Immutability Triggers.
"""
import pytest
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError, DBAPIError

from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.security import hash_password
from app.services.audit import write_audit_log


def test_audit_log_never_records_plain_or_hashed_passwords(db_session):
    """Confirm password strings and hashes are redacted from audit log details."""
    log = write_audit_log(
        db_session,
        action="TEST_SENSITIVE",
        details={
            "password": "SuperSecretPassword123!",
            "hashed_password": "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
            "plain_password": "PlainPassword123",
            "nested": {"new_password": "NewSecretPassword!"},
        },
    )
    db_session.commit()

    saved_log = db_session.query(AuditLog).filter(AuditLog.id == log.id).first()
    assert saved_log.details["password"] == "[REDACTED]"
    assert saved_log.details["hashed_password"] == "[REDACTED]"
    assert saved_log.details["plain_password"] == "[REDACTED]"
    assert saved_log.details["nested"]["new_password"] == "[REDACTED]"


def test_audit_log_never_records_raw_jwt_or_refresh_tokens(db_session):
    """Confirm raw JWT tokens and refresh token strings are redacted."""
    dummy_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_dummy_sig"
    log = write_audit_log(
        db_session,
        action="TEST_TOKEN_REDACTION",
        details={
            "token": dummy_jwt,
            "access_token": dummy_jwt,
            "refresh_token": "raw_opaque_refresh_token_string",
            "message": f"Authorization bearer {dummy_jwt} used",
        },
    )
    db_session.commit()

    saved_log = db_session.query(AuditLog).filter(AuditLog.id == log.id).first()
    assert saved_log.details["token"] == "[REDACTED]"
    assert saved_log.details["access_token"] == "[REDACTED]"
    assert saved_log.details["refresh_token"] == "[REDACTED]"
    assert dummy_jwt not in saved_log.details["message"]


def test_audit_log_never_records_csrf_tokens_or_secret_keys(db_session):
    """Confirm CSRF tokens and internal cryptographic secrets are redacted."""
    log = write_audit_log(
        db_session,
        action="TEST_SECRET_REDACTION",
        details={
            "csrf_token": "aabbccddeeff.0123456789abcdef",
            "secret_key": "some_super_secret_32_characters",
            "csrf_secret": "csrf_cryptographic_secret_key",
        },
    )
    db_session.commit()

    saved_log = db_session.query(AuditLog).filter(AuditLog.id == log.id).first()
    assert saved_log.details["csrf_token"] == "[REDACTED]"
    assert saved_log.details["secret_key"] == "[REDACTED]"
    assert saved_log.details["csrf_secret"] == "[REDACTED]"


def test_audit_log_records_login_success(client, db_session):
    """Successful login writes LOGIN_SUCCESS with client IP and user agent."""
    user = User(
        email="audit_login_user@university.edu",
        full_name="Audit User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "ValidPassword123!"},
        headers={"User-Agent": "TestBrowser/1.0"},
    )
    assert resp.status_code == 200

    log = db_session.query(AuditLog).filter(
        AuditLog.user_id == user.id,
        AuditLog.action == "LOGIN_SUCCESS",
    ).first()
    assert log is not None
    assert log.user_agent == "TestBrowser/1.0"


def test_audit_log_records_login_failure(client, db_session):
    """Failed login attempt writes LOGIN_FAILURE with masked/unknown details."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown_for_audit@test.com", "password": "WrongPassword123!"},
    )
    assert resp.status_code == 401

    log = db_session.query(AuditLog).filter(
        AuditLog.action == "LOGIN_FAILURE",
    ).order_by(AuditLog.created_at.desc()).first()
    assert log is not None
    assert log.details["reason"] == "unknown_email"


def test_audit_logs_database_triggers_prevent_update_and_delete(db_session):
    """
    Amendment 8: Audit logs must be append-only at the DATABASE level (triggers).
    Direct SQL UPDATE and DELETE statements must be rejected by the database.
    """
    # 1. Test UPDATE rejection
    log1 = write_audit_log(db_session, action="TEST_IMMUTABLE_UPDATE", details={"data": "original_1"})
    db_session.flush()
    log1_id = str(log1.id)

    with pytest.raises((OperationalError, DBAPIError), match="append-only"):
        with db_session.begin_nested():
            db_session.execute(
                sa.text(f"UPDATE audit_logs SET action = 'TAMPERED' WHERE id = '{log1_id}'")
            )

    # 2. Test DELETE rejection
    log2 = write_audit_log(db_session, action="TEST_IMMUTABLE_DELETE", details={"data": "original_2"})
    db_session.flush()
    log2_id = str(log2.id)

    with pytest.raises((OperationalError, DBAPIError), match="append-only"):
        with db_session.begin_nested():
            db_session.execute(
                sa.text(f"DELETE FROM audit_logs WHERE id = '{log2_id}'")
            )

    # Verify original records remain intact in database
    saved1 = db_session.query(AuditLog).filter(AuditLog.id == log1_id).first()
    saved2 = db_session.query(AuditLog).filter(AuditLog.id == log2_id).first()
    assert saved1 is not None and saved1.action == "TEST_IMMUTABLE_UPDATE"
    assert saved2 is not None and saved2.action == "TEST_IMMUTABLE_DELETE"
