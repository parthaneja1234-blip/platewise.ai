"""
Argon2id password hashing following OWASP recommendations.
Parameters: memory_cost=65536 (64MB), time_cost=3, parallelism=4.
"""
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,
    argon2__time_cost=3,
    argon2__parallelism=4,
)


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with Argon2id."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    return pwd_context.verify(plain_password, hashed_password)


# Dummy hash for timing-safe comparison when user does not exist,
# preventing user enumeration via response latency differences.
DUMMY_HASH = pwd_context.hash("dummy_password_for_timing_safety")
