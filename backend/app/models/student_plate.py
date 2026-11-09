import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class StudentPlate(Base, BaseModelMixin):
    """
    Student custom created plate from Plate Studio.
    """
    __tablename__ = "student_plates"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mess_id = Column(String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    meal = Column(String(20), default="Lunch")
    total_kcal = Column(Integer, default=0)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    cost_inr = Column(Float, default=0.0)
    co2e_g = Column(Float, default=0.0)
    descriptor = Column(String(50), default="Moderate")
    hint = Column(Text, default="Balanced meal selection")
    is_veg = Column(Boolean, default=True)
    items = Column(JSON, nullable=False)

    # Relationships
    user = relationship("User", backref="plates")
    mess = relationship("Cafeteria", backref="student_plates")

    __table_args__ = (
        Index("ix_student_plates_user", "user_id", "created_at"),
    )
