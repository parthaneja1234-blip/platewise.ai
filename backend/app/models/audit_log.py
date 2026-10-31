from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class AuditLog(Base, BaseModelMixin):
    """
    Immutable audit log documenting critical security and operational events:
    logins, role elevations, data imports, and destructive operations.
    Follows ASVS Level 2 logging recommendations.
    """
    __tablename__ = "audit_logs"

    # User who triggered the event (nullable for unauthenticated failed attempts)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action = Column(String(100), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)  # Supports IPv4 and IPv6
    user_agent = Column(String(300), nullable=True)
    details = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
