"""
Pydantic Schemas for PlateWise AI Demo Endpoints.
Enforces strict input bounds and type contracts.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CreateMessRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Mess hall name")
    capacity: int = Field(..., ge=10, le=10000, description="Seating or serving capacity")
    type: Optional[str] = Field("hostel_mess", max_length=50, description="Facility type (e.g. hostel_mess, central_court)")
    location: Optional[str] = Field("Campus Main Zone", max_length=100, description="Campus location label")
    breakfast_time: Optional[str] = Field("07:30 - 09:30", max_length=50)
    lunch_time: Optional[str] = Field("12:00 - 14:30", max_length=50)
    dinner_time: Optional[str] = Field("19:30 - 21:30", max_length=50)


class UpdateMessRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    capacity: Optional[int] = Field(None, ge=10, le=10000)
    type: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    breakfast_time: Optional[str] = Field(None, max_length=50)
    lunch_time: Optional[str] = Field(None, max_length=50)
    dinner_time: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=20)


class CreateFoodRequest(BaseModel):
    id: Optional[str] = Field(None, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=50)
    veg: bool = Field(True)
    unit: Optional[str] = Field("1 serving (150g)", max_length=50)
    unit_label: Optional[str] = Field("1 serving", max_length=50)
    serving_weight_g: Optional[float] = Field(150.0, ge=1.0, le=3000.0)
    kcal_per_100g: Optional[float] = Field(None, ge=0.0, le=1000.0)
    kcal_per_serving: Optional[float] = Field(None, ge=0.0, le=3000.0)
    kcal_per_unit: Optional[float] = Field(150.0, ge=0.0, le=3000.0)
    protein_g: Optional[float] = Field(0.0, ge=0.0, le=500.0)
    carbs_g: Optional[float] = Field(0.0, ge=0.0, le=500.0)
    fat_g: Optional[float] = Field(0.0, ge=0.0, le=500.0)
    fiber_g: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    cost_inr_per_serving: Optional[float] = Field(10.0, ge=0.0, le=5000.0)
    cost_inr_per_unit: Optional[float] = Field(10.0, ge=0.0, le=5000.0)
    co2e_g_per_unit: Optional[float] = Field(100.0, ge=0.0, le=10000.0)
    serving_weight_kg: Optional[float] = Field(0.15, ge=0.001, le=5.0)
    popularity: Optional[float] = Field(0.85, ge=0.0, le=1.0)
    max_per_plate: int = Field(3, ge=1, le=10)
    model_id: Optional[str] = Field(None, max_length=100)
    icon_id: Optional[str] = Field(None, max_length=100)
    source_type: Optional[str] = Field("reference", pattern="^(label|recipe|measured|reference)$")
    source_note: Optional[str] = Field(None, max_length=255)
    measured_on: Optional[str] = Field(None, max_length=32)
    recipe_data: Optional[Dict[str, Any]] = None
    note: Optional[str] = Field("reference", max_length=250)
    verified: Optional[bool] = Field(False)


class UpdateFoodRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    veg: Optional[bool] = None
    unit: Optional[str] = Field(None, max_length=50)
    unit_label: Optional[str] = Field(None, max_length=50)
    serving_weight_g: Optional[float] = Field(None, ge=1.0, le=3000.0)
    kcal_per_100g: Optional[float] = Field(None, ge=0.0, le=1000.0)
    kcal_per_serving: Optional[float] = Field(None, ge=0.0, le=3000.0)
    kcal_per_unit: Optional[float] = Field(None, ge=0.0, le=3000.0)
    protein_g: Optional[float] = Field(None, ge=0.0, le=500.0)
    carbs_g: Optional[float] = Field(None, ge=0.0, le=500.0)
    fat_g: Optional[float] = Field(None, ge=0.0, le=500.0)
    fiber_g: Optional[float] = Field(None, ge=0.0, le=100.0)
    cost_inr_per_serving: Optional[float] = Field(None, ge=0.0, le=5000.0)
    cost_inr_per_unit: Optional[float] = Field(None, ge=0.0, le=5000.0)
    co2e_g_per_unit: Optional[float] = Field(None, ge=0.0, le=10000.0)
    serving_weight_kg: Optional[float] = Field(None, ge=0.001, le=5.0)
    popularity: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_per_plate: Optional[int] = Field(None, ge=1, le=10)
    model_id: Optional[str] = Field(None, max_length=100)
    icon_id: Optional[str] = Field(None, max_length=100)
    source_type: Optional[str] = Field(None, pattern="^(label|recipe|measured|reference)$")
    source_note: Optional[str] = Field(None, max_length=255)
    measured_on: Optional[str] = Field(None, max_length=32)
    recipe_data: Optional[Dict[str, Any]] = None
    note: Optional[str] = Field(None, max_length=250)
    verified: Optional[bool] = None


class FoodImportRow(BaseModel):
    id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    veg: bool = Field(True)
    unit_label: Optional[str] = Field("1 serving", max_length=50)
    serving_weight_g: float = Field(..., ge=1.0, le=3000.0)
    kcal_per_100g: Optional[float] = Field(None, ge=0.0, le=1000.0)
    kcal_per_serving: float = Field(..., ge=0.0, le=3000.0)
    protein_g: float = Field(0.0, ge=0.0, le=300.0)
    carbs_g: float = Field(0.0, ge=0.0, le=300.0)
    fat_g: float = Field(0.0, ge=0.0, le=300.0)
    fiber_g: float = Field(0.0, ge=0.0, le=100.0)
    cost_inr_per_serving: float = Field(10.0, ge=0.0, le=5000.0)
    source_type: str = Field("reference", pattern="^(label|recipe|measured|reference)$")
    source_note: Optional[str] = Field(None, max_length=255)
    measured_on: Optional[str] = Field(None, max_length=32)
    verified: bool = Field(False)
    model_id: Optional[str] = Field(None, max_length=100)
    icon_id: Optional[str] = Field(None, max_length=100)
    max_per_plate: int = Field(3, ge=1, le=10)


class FoodImportRequest(BaseModel):
    rows: List[Dict[str, Any]] = Field(..., max_length=500, description="List of CSV row dicts, max 500")
    dry_run: bool = Field(False, description="Preview creates/updates without committing")


class CreateIngredientRequest(BaseModel):
    id: Optional[str] = Field(None, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    kcal_per_100g: float = Field(..., ge=0.0, le=1000.0)
    protein: float = Field(0.0, ge=0.0, le=100.0)
    carbs: float = Field(0.0, ge=0.0, le=100.0)
    fat: float = Field(0.0, ge=0.0, le=100.0)
    source_note: Optional[str] = Field(None, max_length=255)


class UpdateIngredientRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    kcal_per_100g: Optional[float] = Field(None, ge=0.0, le=1000.0)
    protein: Optional[float] = Field(None, ge=0.0, le=100.0)
    carbs: Optional[float] = Field(None, ge=0.0, le=100.0)
    fat: Optional[float] = Field(None, ge=0.0, le=100.0)
    source_note: Optional[str] = Field(None, max_length=255)


class MealLogImportRow(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    meal: str = Field(..., pattern="^(Breakfast|Lunch|Dinner)$")
    food_id: str = Field(..., min_length=1, max_length=50)
    prepared_kg: float = Field(..., ge=0.0, le=2000.0)
    consumed_kg: float = Field(..., ge=0.0, le=2000.0)
    leftover_kg: float = Field(..., ge=0.0, le=2000.0)
    turnout: int = Field(..., ge=0, le=5000)


class MealLogImportRequest(BaseModel):
    mess_id: str = Field(..., min_length=1, max_length=50)
    rows: List[MealLogImportRow] = Field(..., max_length=1000)


class SetMenuCellRequest(BaseModel):
    mess_id: str = Field(..., min_length=1, max_length=50)
    day_of_week: int = Field(..., ge=0, le=6)
    meal: str = Field(..., pattern="^(Breakfast|Lunch|Dinner)$")
    dish_ids: List[str] = Field(..., min_length=1, max_length=12)


class UpdateMealLogRequest(BaseModel):
    dish_id: Optional[str] = Field(None, min_length=1, max_length=50)
    prepared_kg: Optional[float] = Field(None, ge=0.0, le=2000.0)
    consumed_kg: Optional[float] = Field(None, ge=0.0, le=2000.0)
    leftover_kg: Optional[float] = Field(None, ge=0.0, le=2000.0)
    turnout: Optional[int] = Field(None, ge=0, le=5000)




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

