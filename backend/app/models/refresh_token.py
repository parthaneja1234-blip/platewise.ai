import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RefreshToken(Base):
    """
    Dedicated refresh token store implementing OWASP ASVS V3.4:
    - Only SHA-256 hashes are persisted (never raw tokens).
    - Family-based lineage enables rotation tracking and theft/reuse detection.
    - Reuse of an already-rotated token triggers revocation of the entire family.
    """
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    family_id = Column(String(36), nullable=False, index=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    replaced_by = Column(
        String(36),
        ForeignKey("refresh_tokens.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    user = relationship("User", backref="refresh_tokens")

    __table_args__ = (
        Index("ix_refresh_tokens_expires_at", "expires_at"),
    )
