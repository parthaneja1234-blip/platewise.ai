from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class Dish(Base, BaseModelMixin):
    """
    Food items prepared in cafeterias, categorized with standard portion sizes.
    """
    __tablename__ = "dishes"

    cafeteria_id = Column(String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="main_course")  # rice, dal, curry, bread, dessert
    standard_serving_g = Column(Float, nullable=False, default=150.0)  # grams per student

    # Relationships
    cafeteria = relationship("Cafeteria", back_populates="dishes")
    meal_records = relationship("MealRecord", back_populates="dish", cascade="all, delete-orphan")
    forecast_records = relationship("ForecastRecord", back_populates="dish", cascade="all, delete-orphan")
