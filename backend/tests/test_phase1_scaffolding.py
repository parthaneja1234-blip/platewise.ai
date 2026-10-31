from datetime import date
import pytest
from sqlalchemy.exc import IntegrityError
from app.config import settings
from app.models import (
    Cafeteria,
    User,
    UserRole,
    Dish,
    MealRecord,
    MealType,
    CalendarEvent,
    EventType,
    ForecastRecord,
    AuditLog,
)


def test_configuration_loading():
    """Verify Pydantic v2 settings are correctly parsed and loaded."""
    assert settings.PROJECT_NAME == "PlateWise AI"
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
    assert settings.DEFAULT_COST_PER_KG_INR == 45.0
    assert settings.DEFAULT_EMISSION_FACTOR_CO2E == 2.5
    assert isinstance(settings.CORS_ORIGINS, list)
    assert len(settings.CORS_ORIGINS) >= 1


def test_cafeteria_and_dish_models(db_session):
    """Verify cafeteria creation, dish association, and default calculations."""
    cafeteria = Cafeteria(
        name="North Campus Mess",
        campus_location="Hostel Block A",
        cost_per_kg_inr=48.0,
        co2e_factor_kg_per_kg=2.5,
    )
    db_session.add(cafeteria)
    db_session.commit()
    db_session.refresh(cafeteria)

    assert cafeteria.id is not None
    assert len(cafeteria.id) == 36
    assert cafeteria.created_at is not None

    dish = Dish(
        cafeteria_id=cafeteria.id,
        name="Paneer Butter Masala",
        category="curry",
        standard_serving_g=180.0,
    )
    db_session.add(dish)
    db_session.commit()
    db_session.refresh(dish)

    assert dish.id is not None
    assert dish.cafeteria.name == "North Campus Mess"


def test_user_and_cafeteria_tenancy(db_session):
    """Verify User model, RBAC roles, and many-to-many cafeteria tenancy."""
    cafeteria = Cafeteria(
        name="South Dining Hall",
        campus_location="Hostel Block D",
    )
    user = User(
        email="manager@university.edu",
        full_name="Mess Manager Dave",
        hashed_password="argon2id$mockedhash",
        role=UserRole.MESS_MANAGER,
    )
    user.cafeterias.append(cafeteria)

    db_session.add_all([cafeteria, user])
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.role == UserRole.MESS_MANAGER
    assert len(user.cafeterias) == 1
    assert user.cafeterias[0].name == "South Dining Hall"


def test_user_email_uniqueness(db_session):
    """Verify unique constraint on user email."""
    user1 = User(
        email="unique@test.edu",
        full_name="User One",
        hashed_password="hash",
    )
    user2 = User(
        email="unique@test.edu",
        full_name="User Two",
        hashed_password="hash",
    )
    db_session.add(user1)
    db_session.commit()

    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_meal_record_and_synthetic_flag(db_session):
    """Verify meal logging with kg calculations and synthetic flag."""
    cafeteria = Cafeteria(name="East Mess", campus_location="Engineering Quad")
    dish = Dish(cafeteria=cafeteria, name="Dal Tadka", category="dal")
    db_session.add_all([cafeteria, dish])
    db_session.commit()

    meal = MealRecord(
        cafeteria_id=cafeteria.id,
        dish_id=dish.id,
        meal_date=date(2026, 10, 31),
        meal_type=MealType.LUNCH,
        kg_prepared=50.0,
        kg_consumed=42.5,
        kg_wasted=7.5,
        student_turnout=320,
        is_synthetic=True,
    )
    db_session.add(meal)
    db_session.commit()
    db_session.refresh(meal)

    assert meal.id is not None
    assert meal.kg_wasted == 7.5
    assert meal.is_synthetic is True


def test_forecast_record_model(db_session):
    """Verify forecast record model attributes and cold-start tracking."""
    cafeteria = Cafeteria(name="West Hall", campus_location="Management Quad")
    dish = Dish(cafeteria=cafeteria, name="Jeera Rice", category="rice")
    db_session.add_all([cafeteria, dish])
    db_session.commit()

    forecast = ForecastRecord(
        cafeteria_id=cafeteria.id,
        dish_id=dish.id,
        forecast_date=date(2026, 11, 1),
        meal_type=MealType.DINNER,
        predicted_turnout=280,
        recommended_kg=45.0,
        model_version="BASELINE_MA",
        is_cold_start=True,
    )
    db_session.add(forecast)
    db_session.commit()
    db_session.refresh(forecast)

    assert forecast.is_cold_start is True
    assert forecast.predicted_turnout == 280
    assert forecast.actual_kg_consumed is None


def test_audit_log_model(db_session):
    """Verify audit log immutability and metadata tracking."""
    log = AuditLog(
        action="LOGIN_FAILURE",
        ip_address="192.168.1.100",
        user_agent="Mozilla/5.0 TestBrowser",
        details={"reason": "bad_password", "attempt": 3},
    )
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)

    assert log.id is not None
    assert log.action == "LOGIN_FAILURE"
    assert log.details["attempt"] == 3
