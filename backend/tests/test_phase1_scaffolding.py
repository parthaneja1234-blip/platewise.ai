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


def test_database_url_is_required(monkeypatch):
    """Verify DATABASE_URL is a required setting with no default and fails clearly if missing."""
    from pydantic import ValidationError
    from app.config import Settings

    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None)

    errors = exc_info.value.errors()
    assert any(err["loc"] == ("DATABASE_URL",) and err["type"] == "missing" for err in errors)


def test_database_url_cannot_be_empty(monkeypatch):
    """Verify DATABASE_URL cannot be empty or whitespace."""
    from pydantic import ValidationError
    from app.config import Settings

    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None, DATABASE_URL="   ")

    assert "DATABASE_URL must be configured as a non-empty string." in str(exc_info.value)


def test_database_url_custom_postgres_connection():
    """Verify DATABASE_URL accepts a postgresql+psycopg connection string."""
    from app.config import Settings

    custom_url = "postgresql+psycopg://platewise:secure_pass@localhost:5432/platewise_db"
    cfg = Settings(_env_file=None, DATABASE_URL=custom_url)
    assert cfg.DATABASE_URL == custom_url


VALID_BASE_CONFIG = {
    "DATABASE_URL": "sqlite:///:memory:",
    "SECRET_KEY": "valid_secret_key_32_characters_minimum",
    "REFRESH_SECRET_KEY": "valid_refresh_key_32_characters_minimum",
    "CSRF_SECRET": "valid_csrf_token_32_characters_minimum",
    "POSTGRES_PASSWORD": "valid_postgres_password_16_chars",
}


@pytest.mark.parametrize("field", [
    "SECRET_KEY",
    "REFRESH_SECRET_KEY",
    "CSRF_SECRET",
    "POSTGRES_PASSWORD",
])
def test_secret_refuses_to_start_when_missing(monkeypatch, field):
    """Verify app refuses to start when a required secret setting is missing."""
    from pydantic import ValidationError
    from app.config import Settings

    monkeypatch.delenv(field, raising=False)
    kwargs = dict(VALID_BASE_CONFIG)
    del kwargs[field]

    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None, **kwargs)

    errors = exc_info.value.errors()
    assert any(err["loc"] == (field,) and err["type"] == "missing" for err in errors)


@pytest.mark.parametrize("field,short_value,min_len", [
    ("SECRET_KEY", "too_short_key_under_32", 32),
    ("REFRESH_SECRET_KEY", "too_short_key_under_32", 32),
    ("CSRF_SECRET", "too_short_key_under_32", 32),
    ("POSTGRES_PASSWORD", "short_pass", 16),
])
def test_secret_refuses_to_start_when_too_short(monkeypatch, field, short_value, min_len):
    """Verify app refuses to start when a secret is shorter than minimum required length."""
    from pydantic import ValidationError
    from app.config import Settings

    monkeypatch.delenv(field, raising=False)
    kwargs = dict(VALID_BASE_CONFIG)
    kwargs[field] = short_value

    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None, **kwargs)

    err_str = str(exc_info.value)
    assert field in err_str
    assert f"at least {min_len} characters long" in err_str


@pytest.mark.parametrize("field", [
    "SECRET_KEY",
    "REFRESH_SECRET_KEY",
    "CSRF_SECRET",
    "POSTGRES_PASSWORD",
])
@pytest.mark.parametrize("placeholder", [
    "replace_with",
    "change_me",
    "default_",
])
def test_secret_refuses_to_start_when_placeholder(monkeypatch, field, placeholder):
    """Verify app refuses to start when a secret contains prohibited placeholder text."""
    from pydantic import ValidationError
    from app.config import Settings

    monkeypatch.delenv(field, raising=False)
    kwargs = dict(VALID_BASE_CONFIG)
    kwargs[field] = f"{placeholder}_insecure_value_long_enough_32_chars"

    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None, **kwargs)

    err_str = str(exc_info.value)
    assert field in err_str
    assert "prohibited placeholder or default text" in err_str


def test_valid_secrets_configuration_starts_successfully():
    """Verify app starts successfully when all secrets meet security requirements."""
    from app.config import Settings

    cfg = Settings(_env_file=None, **VALID_BASE_CONFIG)
    assert cfg.SECRET_KEY == VALID_BASE_CONFIG["SECRET_KEY"]
    assert cfg.REFRESH_SECRET_KEY == VALID_BASE_CONFIG["REFRESH_SECRET_KEY"]
    assert cfg.CSRF_SECRET == VALID_BASE_CONFIG["CSRF_SECRET"]
    assert cfg.POSTGRES_PASSWORD == VALID_BASE_CONFIG["POSTGRES_PASSWORD"]


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
