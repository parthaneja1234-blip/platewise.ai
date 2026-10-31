from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings loaded from environment variables and .env file.
    Follows 12-Factor App methodology and OWASP ASVS guidelines.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Core Application Settings
    PROJECT_NAME: str = "PlateWise AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database Settings
    POSTGRES_USER: str = "platewise"
    POSTGRES_PASSWORD: str = "change_me_in_env"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "platewise_db"
    DATABASE_URL: str = "sqlite:///./platewise_dev.db"

    # Cryptographic & Authentication Secrets
    SECRET_KEY: str = "default_dev_secret_key_replace_immediately_32_chars_min"
    REFRESH_SECRET_KEY: str = "default_dev_refresh_secret_key_replace_immediately"
    CSRF_SECRET: str = "default_dev_csrf_secret_token_replace_immediately"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie Security Settings
    COOKIE_SECURE: bool = False  # Set to True in production (enforces HTTPS)
    COOKIE_SAMESITE: str = "lax"  # "lax", "strict", or "none"
    COOKIE_DOMAIN: Union[str, None] = None

    # CORS Settings
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Rate Limiting & Account Lockout
    RATE_LIMIT_LOGIN: str = "5/15minutes"
    RATE_LIMIT_GLOBAL: str = "100/minute"
    ACCOUNT_LOCKOUT_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # University Mess / Cafeteria Impact Defaults
    DEFAULT_COST_PER_KG_INR: float = 45.0  # ₹45 per kg average institutional food prep cost
    DEFAULT_EMISSION_FACTOR_CO2E: float = 2.5  # 2.5 kg CO2e per kg food waste (IPCC/FAO standard)

    # Weather Cache Settings
    OPENWEATHER_API_KEY: Union[str, None] = None
    WEATHER_CACHE_TTL_HOURS: int = 6


settings = Settings()
