import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class StudentRsvp(Base, BaseModelMixin):
    """
    Student attendance RSVP for upcoming meals (eating / skipping before cutoff).
    """
    __tablename__ = "student_rsvps"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mess_id = Column(String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    meal = Column(String(20), nullable=False)              # Breakfast, Lunch, Dinner
    status = Column(String(20), nullable=False)            # eating | skipping

    # Relationships
    user = relationship("User", backref="rsvps")
    mess = relationship("Cafeteria", backref="student_rsvps")

    __table_args__ = (
        Index("ix_student_rsvps_lookup", "user_id", "mess_id", "date", "meal"),
    )
