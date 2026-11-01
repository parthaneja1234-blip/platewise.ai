from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, model_validator, ValidationInfo
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

    # Database Settings (Required; no defaults to prevent accidental fallback)
    POSTGRES_USER: str = "platewise"
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "platewise_db"
    DATABASE_URL: str

    # Cryptographic & Authentication Secrets (Required; no defaults to prevent insecure fallbacks)
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    CSRF_SECRET: str
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

    # Password Policy
    PASSWORD_MIN_LENGTH: int = 12

    # Trusted Proxies for X-Forwarded-For (empty = do not trust any proxy header)
    TRUSTED_PROXIES: Union[str, List[str]] = ""

    @field_validator("TRUSTED_PROXIES", mode="before")
    @classmethod
    def assemble_trusted_proxies(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [p.strip() for p in v.split(",") if p.strip()]
        return v

    # University Mess / Cafeteria Impact Defaults
    DEFAULT_COST_PER_KG_INR: float = 45.0  # ₹45 per kg average institutional food prep cost
    DEFAULT_EMISSION_FACTOR_CO2E: float = 2.5  # 2.5 kg CO2e per kg food waste (IPCC/FAO standard)

    # Weather Cache Settings
    OPENWEATHER_API_KEY: Union[str, None] = None
    WEATHER_CACHE_TTL_HOURS: int = 6

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("DATABASE_URL must be configured as a non-empty string.")
        v_stripped = v.strip()
        v_lower = v_stripped.lower()
        for placeholder in ("replace_with", "change_me", "default_"):
            if placeholder in v_lower:
                raise ValueError(
                    f"DATABASE_URL contains prohibited placeholder text ('{placeholder}'). "
                    "Configure a valid database connection string."
                )
        return v_stripped

    @field_validator("SECRET_KEY", "REFRESH_SECRET_KEY", "CSRF_SECRET", "POSTGRES_PASSWORD")
    @classmethod
    def validate_secrets_strength(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name or "Secret"
        if not v or not v.strip():
            raise ValueError(f"{field_name} must not be empty.")

        v_lower = v.lower()
        for placeholder in ("replace_with", "change_me", "default_"):
            if placeholder in v_lower:
                raise ValueError(
                    f"{field_name} contains prohibited placeholder or default text ('{placeholder}'). "
                    "A secure, unique secret must be configured."
                )

        min_len = 16 if field_name == "POSTGRES_PASSWORD" else 32
        if len(v) < min_len:
            raise ValueError(
                f"{field_name} must be at least {min_len} characters long."
            )
        return v

    @model_validator(mode="after")
    def validate_production_cookie_secure(self) -> "Settings":
        """Abort startup if COOKIE_SECURE=False in production to prevent cookie exposure over HTTP."""
        if self.ENVIRONMENT == "production" and not self.COOKIE_SECURE:
            raise ValueError(
                "COOKIE_SECURE must be True when ENVIRONMENT is 'production'. "
                "Running without Secure cookies in production exposes tokens to network interception."
            )
        return self


settings = Settings()


