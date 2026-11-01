"""
Audit logging service for security-critical events.
All sensitive data (passwords, tokens, secrets) is sanitized before persistence.
"""
import re
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


# Patterns and keys to redact from audit log details
_SENSITIVE_KEYS = {
    "password", "hashed_password", "plain_password", "new_password",
    "old_password", "token", "access_token", "refresh_token",
    "csrf_token", "secret_key", "csrf_secret", "refresh_secret_key",
    "token_hash", "secret",
}

# Regex to detect JWT-like strings (xxx.yyy.zzz)
_JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")


def _sanitize_value(value: Any) -> Any:
    """Recursively sanitize sensitive values from audit log details."""
    if isinstance(value, dict):
        return {k: _sanitize_value(v) if k.lower() not in _SENSITIVE_KEYS else "[REDACTED]"
                for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize_value(item) for item in value]
    if isinstance(value, str):
        # Redact any JWT-like tokens that might be embedded in strings
        sanitized = _JWT_PATTERN.sub("[REDACTED_TOKEN]", value)
        return sanitized
    return value


def write_audit_log(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[dict] = None,
) -> AuditLog:
    """
    Write an immutable audit log entry.
    All details are sanitized to ensure passwords, tokens, and secrets are never recorded.
    """
    sanitized_details = _sanitize_value(details) if details else None

    log_entry = AuditLog(
        action=action,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=sanitized_details,
    )
    db.add(log_entry)
    db.flush()
    return log_entry
