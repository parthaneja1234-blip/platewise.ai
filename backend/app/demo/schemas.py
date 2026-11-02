"""
Pydantic Schemas for PlateWise AI Demo Endpoints.
Enforces strict input bounds and type contracts.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PlateItemInput(BaseModel):
    food_id: str = Field(..., min_length=1, max_length=50, description="Food item identifier")
    count: int = Field(1, ge=1, le=10, description="Quantity of units (1 to 10)")


class EvaluatePlateRequest(BaseModel):
    items: List[PlateItemInput] = Field(
        ...,
        min_length=1,
        max_length=12,
        description="List of food items and quantities on the plate (max 12 distinct items)",
    )


class SavePlateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Plate display name")
    mess_id: Optional[str] = Field("mess-boys-a", max_length=50)
    meal: Optional[str] = Field("Lunch", pattern="^(Breakfast|Lunch|Dinner)$")
    items: List[PlateItemInput] = Field(
        ...,
        min_length=1,
        max_length=12,
        description="List of food items and quantities on the plate",
    )


class ForecastRequest(BaseModel):
    mess_id: str = Field("mess-boys-a", min_length=1, max_length=50)
    day_of_week: int = Field(0, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")
    meal: str = Field("Lunch", pattern="^(Breakfast|Lunch|Dinner)$")
    expected_turnout: Optional[int] = Field(None, ge=50, le=5000, description="Optional manual headcount override")
    is_exam: bool = Field(False, description="Exam session ongoing")
    is_holiday: bool = Field(False, description="Campus or statutory holiday")
    has_event: bool = Field(False, description="Campus fest or sports event")
    rain_mm: float = Field(0.0, ge=0.0, le=300.0, description="Precipitation in mm (0 to 300)")
    temperature_c: float = Field(30.0, ge=-10.0, le=55.0, description="Ambient temperature in °C (-10 to 55)")
    menu: Optional[List[str]] = Field(None, max_length=12, description="List of dish IDs")


class LogMealRequest(BaseModel):
    mess_id: str = Field(..., min_length=1, max_length=50)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    meal: str = Field(..., pattern="^(Breakfast|Lunch|Dinner)$")
    dish_id: str = Field(..., min_length=1, max_length=50)
    prepared_kg: float = Field(..., ge=0.0, le=2000.0)
    consumed_kg: float = Field(..., ge=0.0, le=2000.0)
    leftover_kg: float = Field(..., ge=0.0, le=2000.0)
    turnout: int = Field(..., ge=0, le=5000)


class RsvpRequest(BaseModel):
    student_id: str = Field("student-anon", min_length=1, max_length=50)
    mess_id: str = Field("mess-boys-a", min_length=1, max_length=50)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    meal: str = Field(..., pattern="^(Breakfast|Lunch|Dinner)$")
    status: str = Field(..., pattern="^(eating|skipping)$")


class ApprovePlanRequest(BaseModel):
    mess_id: str = Field("mess-boys-a", min_length=1, max_length=50)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    meal: str = Field("Lunch", pattern="^(Breakfast|Lunch|Dinner)$")

