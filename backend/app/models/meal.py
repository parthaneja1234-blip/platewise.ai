import enum
from sqlalchemy import Column, String, Float, Integer, Date, Boolean, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class MealType(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    SNACKS = "snacks"
    DINNER = "dinner"


class MealRecord(Base, BaseModelMixin):
    """
    Daily log of meals served, consumed, and wasted in a cafeteria.
    """
    __tablename__ = "meal_records"

    cafeteria_id = Column(String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), nullable=False, index=True)
    dish_id = Column(String(36), ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    meal_date = Column(Date, nullable=False, index=True)
    meal_type = Column(Enum(MealType), nullable=False, index=True)

    kg_prepared = Column(Float, nullable=False)
    kg_consumed = Column(Float, nullable=False)
    kg_wasted = Column(Float, nullable=False)
    student_turnout = Column(Integer, nullable=False)

    # Clearly flags synthetic seed data for transparency
    is_synthetic = Column(Boolean, default=False, nullable=False, index=True)

    # Relationships
    cafeteria = relationship("Cafeteria", back_populates="meal_records")
    dish = relationship("Dish", back_populates="meal_records")

    __table_args__ = (
        Index("idx_meal_lookup", "cafeteria_id", "meal_date", "meal_type"),
    )
