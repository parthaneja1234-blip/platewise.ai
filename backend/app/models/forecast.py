from sqlalchemy import Column, String, Float, Integer, Date, Boolean, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin
from app.models.meal import MealType


class ForecastRecord(Base, BaseModelMixin):
    """
    Predictions generated for future meals with baseline/ML model versioning,
    cold-start flagging, and subsequent actual error evaluations.
    """
    __tablename__ = "forecast_records"

    cafeteria_id = Column(String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), nullable=False, index=True)
    dish_id = Column(String(36), ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False, index=True)

    forecast_date = Column(Date, nullable=False, index=True)
    meal_type = Column(Enum(MealType), nullable=False, index=True)

    # Forecast Outputs
    predicted_turnout = Column(Integer, nullable=False)
    recommended_kg = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False, default="BASELINE_MA")
    is_cold_start = Column(Boolean, default=False, nullable=False)

    # Actual Evaluation (populated after meal occurs)
    actual_kg_consumed = Column(Float, nullable=True)
    absolute_error_kg = Column(Float, nullable=True)
    percentage_error = Column(Float, nullable=True)

    # Relationships
    cafeteria = relationship("Cafeteria", back_populates="forecast_records")
    dish = relationship("Dish", back_populates="forecast_records")

    __table_args__ = (
        Index("idx_forecast_lookup", "cafeteria_id", "forecast_date", "meal_type"),
    )
