from sqlalchemy import Column, String, Float
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class Cafeteria(Base, BaseModelMixin):
    """
    Represents a college mess or dining hall facility.
    Each cafeteria has isolated meal tracking, context, and impact parameters.
    """
    __tablename__ = "cafeterias"

    name = Column(String(120), nullable=False, unique=True, index=True)
    campus_location = Column(String(200), nullable=False)
    
    # Financial & Carbon parameters (configurable per cafeteria)
    cost_per_kg_inr = Column(Float, nullable=False, default=45.0)
    co2e_factor_kg_per_kg = Column(Float, nullable=False, default=2.5)

    # Relationships
    dishes = relationship("Dish", back_populates="cafeteria", cascade="all, delete-orphan")
    meal_records = relationship("MealRecord", back_populates="cafeteria", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="cafeteria", cascade="all, delete-orphan")
    forecast_records = relationship("ForecastRecord", back_populates="cafeteria", cascade="all, delete-orphan")
    users = relationship("User", secondary="user_cafeterias", back_populates="cafeterias")
