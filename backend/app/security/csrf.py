"""
CSRF protection using a signed double-submit cookie pattern.
The CSRF token is an HMAC(CSRF_SECRET, session_id) so it is bound to the user's session.
Comparison uses hmac.compare_digest for constant-time verification.
"""
import hashlib
import hmac
import secrets

from app.config import settings


def generate_csrf_token(session_id: str) -> str:
    """
    Generate a CSRF token bound to the given session (user_id or family_id).
    Format: <random_nonce>.<hmac_signature>
    The nonce adds entropy; the signature binds the token to the session.
    """
    nonce = secrets.token_hex(16)
    message = f"{nonce}:{session_id}"
    signature = hmac.new(
        settings.CSRF_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{nonce}.{signature}"


def verify_csrf_token(token: str, session_id: str) -> bool:
    """
    Verify a CSRF token is valid and bound to the correct session.
    Uses hmac.compare_digest for constant-time comparison.
    """
    if not token or "." not in token:
        return False

    parts = token.split(".", 1)
    if len(parts) != 2:
        return False

    nonce, provided_signature = parts
    message = f"{nonce}:{session_id}"
    expected_signature = hmac.new(
        settings.CSRF_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(provided_signature, expected_signature)
