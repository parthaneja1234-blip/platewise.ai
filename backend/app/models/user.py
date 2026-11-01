import enum
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Table, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MESS_MANAGER = "mess_manager"
    VIEWER = "viewer"


user_cafeterias = Table(
    "user_cafeterias",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("cafeteria_id", String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base, BaseModelMixin):
    """
    User entity with RBAC, brute-force lockout tracking, and cafeteria tenant assignment.
    """
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Security: Brute-Force lockout tracking (OWASP ASVS)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    cafeterias = relationship("Cafeteria", secondary=user_cafeterias, back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
