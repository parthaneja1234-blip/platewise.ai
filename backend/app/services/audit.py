"""
Audit logging service for security-critical events.
All sensitive data (passwords, tokens, secrets) is sanitized before persistence.
"""
import re
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


# Sensitive substrings to redact case-insensitively from audit log keys
_SENSITIVE_SUBSTRINGS = ("password", "token", "secret", "authorization", "cookie")

# Regex to detect JWT-like strings (xxx.yyy.zzz)
_JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")


def _is_sensitive_key(key: str) -> bool:
    """Return True if key contains any sensitive substring, case-insensitively."""
    key_lower = str(key).lower()
    return any(sub in key_lower for sub in _SENSITIVE_SUBSTRINGS)


def _sanitize_value(value: Any) -> Any:
    """Recursively sanitize sensitive values from audit log details."""
    if isinstance(value, dict):
        return {
            k: "[REDACTED]" if _is_sensitive_key(k) else _sanitize_value(v)
            for k, v in value.items()
        }
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
