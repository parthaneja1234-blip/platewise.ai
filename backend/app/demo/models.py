"""
SQLAlchemy models for demo tables (prefix demo_).
Enforces zero schema drift with auth/core tables and creates idempotently
at backend startup without touching Alembic migrations.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    JSON,
    ForeignKey,
)
try:
    from app.database import Base
except ImportError:
    from backend.app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DemoMess(Base):
    __tablename__ = "demo_messes"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    location = Column(String(100), default="Campus Main Zone")
    campus_location = Column(String(100), default="Campus Main Zone")
    type = Column(String(50), default="hostel_mess")
    avg_daily_diners = Column(Integer, default=700)
    current_turnout_pct = Column(Integer, default=80)
    status = Column(String(20), default="active")
    manager_name = Column(String(100), default="Duty Manager")
    meal_times = Column(
        JSON,
        default=lambda: {
            "breakfast": "07:30 - 09:30",
            "lunch": "12:00 - 14:30",
            "dinner": "19:30 - 21:30",
        },
    )
    has_imported_logs = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        is_imported = bool(self.has_imported_logs)
        return {
            "id": self.id,
            "name": self.name,
            "capacity": self.capacity,
            "location": self.location,
            "campus_location": self.campus_location,
            "type": self.type,
            "avg_daily_diners": self.avg_daily_diners,
            "current_turnout_pct": self.current_turnout_pct,
            "status": self.status,
            "manager_name": self.manager_name,
            "meal_times": self.meal_times,
            "has_imported_logs": is_imported,
            "data_source": "college_imported" if is_imported else "synthetic_demo",
            "data_label": "College data (imported)" if is_imported else "Demo data (synthetic)",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DemoFood(Base):
    __tablename__ = "demo_foods"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    veg = Column(Boolean, default=True, nullable=False)
    unit = Column(String(50), default="1 serving (150g)", nullable=False)
    unit_label = Column(String(50), default="1 serving", nullable=True)
    serving_weight_g = Column(Float, default=150.0)
    kcal_per_100g = Column(Float, nullable=True)
    kcal_per_serving = Column(Float, nullable=True)
    kcal_per_unit = Column(Float, nullable=False)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    fiber_g = Column(Float, default=0.0)
    cost_inr_per_serving = Column(Float, nullable=True)
    cost_inr_per_unit = Column(Float, default=10.0)
    co2e_g_per_unit = Column(Float, default=100.0)
    serving_weight_kg = Column(Float, default=0.15)
    popularity = Column(Float, default=0.85)
    max_per_plate = Column(Integer, default=3)
    model_id = Column(String(100), nullable=True)
    icon_id = Column(String(100), nullable=True)
    source_type = Column(String(32), default="reference")  # label | recipe | measured | reference
    source_note = Column(String(255), nullable=True)
    measured_on = Column(String(32), nullable=True)
    recipe_data = Column(JSON, nullable=True)
    note = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        kcal_srv = self.kcal_per_serving if self.kcal_per_serving is not None else self.kcal_per_unit
        cost_srv = self.cost_inr_per_serving if self.cost_inr_per_serving is not None else self.cost_inr_per_unit
        wt_g = self.serving_weight_g if self.serving_weight_g is not None else round((self.serving_weight_kg or 0.15) * 1000.0, 1)

        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "veg": self.veg,
            "unit": self.unit,
            "unit_label": self.unit_label or "1 serving",
            "serving_weight_g": round(wt_g, 1),
            "kcal_per_100g": round(self.kcal_per_100g, 1) if self.kcal_per_100g is not None else None,
            "kcal_per_serving": round(kcal_srv, 1),
            "kcal_per_unit": round(kcal_srv, 1),
            "protein_g": round(self.protein_g or 0.0, 1),
            "carbs_g": round(self.carbs_g or 0.0, 1),
            "fat_g": round(self.fat_g or 0.0, 1),
            "fiber_g": round(self.fiber_g or 0.0, 1),
            "cost_inr_per_serving": round(cost_srv or 0.0, 1),
            "cost_inr_per_unit": round(cost_srv or 0.0, 1),
            "co2e_g_per_unit": round(self.co2e_g_per_unit or 0.0, 1),
            "serving_weight_kg": round(wt_g / 1000.0, 3),
            "popularity": round(self.popularity or 0.85, 2),
            "max_per_plate": self.max_per_plate,
            "model_id": self.model_id,
            "icon_id": self.icon_id,
            "source_type": self.source_type or "reference",
            "source_note": self.source_note,
            "measured_on": self.measured_on,
            "recipe_data": self.recipe_data,
            "note": self.note,
            "verified": self.verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DemoIngredient(Base):
    __tablename__ = "demo_ingredients"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    kcal_per_100g = Column(Float, nullable=False)
    protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    source_note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "kcal_per_100g": round(self.kcal_per_100g or 0.0, 1),
            "protein": round(self.protein or 0.0, 1),
            "carbs": round(self.carbs or 0.0, 1),
            "fat": round(self.fat or 0.0, 1),
            "source_note": self.source_note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DemoWeeklyMenu(Base):
    __tablename__ = "demo_weekly_menus"

    id = Column(String(80), primary_key=True, index=True) # menu-{mess_id}-{dow}-{meal}
    mess_id = Column(String(50), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False) # 0=Mon .. 6=Sun
    meal = Column(String(20), nullable=False) # Breakfast, Lunch, Dinner
    dish_ids = Column(JSON, nullable=False) # List of food IDs
    predicted_waste_kg = Column(Float, default=0.0)
    predicted_cost_inr = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "mess_id": self.mess_id,
            "day_of_week": self.day_of_week,
            "meal": self.meal,
            "dish_ids": self.dish_ids or [],
            "predicted_waste_kg": round(self.predicted_waste_kg or 0.0, 1),
            "predicted_cost_inr": round(self.predicted_cost_inr or 0.0, 1),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DemoMealLog(Base):
    __tablename__ = "demo_meal_logs"

    id = Column(String(50), primary_key=True, index=True)
    mess_id = Column(String(50), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)
    meal = Column(String(20), nullable=False)
    dish_id = Column(String(50), nullable=False, index=True)
    prepared_kg = Column(Float, nullable=False)
    consumed_kg = Column(Float, nullable=False)
    leftover_kg = Column(Float, nullable=False)
    turnout = Column(Integer, nullable=False)
    is_synthetic_seed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "mess_id": self.mess_id,
            "date": self.date,
            "meal": self.meal,
            "dish_id": self.dish_id,
            "prepared_kg": self.prepared_kg,
            "consumed_kg": self.consumed_kg,
            "leftover_kg": self.leftover_kg,
            "turnout": self.turnout,
            "is_synthetic_seed": self.is_synthetic_seed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DemoPlate(Base):
    __tablename__ = "demo_plates"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    mess_id = Column(String(50), default="mess-boys-a", index=True)
    meal = Column(String(20), default="Lunch")
    is_popular_seed = Column(Boolean, default=False)
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
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "mess_id": self.mess_id,
            "meal": self.meal,
            "is_popular_seed": self.is_popular_seed,
            "total_kcal": self.total_kcal,
            "protein_g": round(self.protein_g or 0.0, 1),
            "carbs_g": round(self.carbs_g or 0.0, 1),
            "fat_g": round(self.fat_g or 0.0, 1),
            "cost_inr": round(self.cost_inr or 0.0, 1),
            "co2e_g": round(self.co2e_g or 0.0, 1),
            "descriptor": self.descriptor,
            "hint": self.hint,
            "is_veg": self.is_veg,
            "disclaimer": "General information, not medical or dietary advice.",
            "items": self.items or [],
            "item_count": len(self.items) if self.items else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DemoRsvp(Base):
    __tablename__ = "demo_student_rsvps"

    id = Column(String(100), primary_key=True, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    mess_id = Column(String(50), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)
    meal = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False) # eating | skipping
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "mess_id": self.mess_id,
            "date": self.date,
            "meal": self.meal,
            "status": self.status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
