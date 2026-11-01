import os

# Ensure required settings are configured for test runs in isolated environments
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("POSTGRES_PASSWORD", "test_secure_postgres_pass_16_chars")
os.environ.setdefault("SECRET_KEY", "test_secure_access_secret_key_32_chars_long")
os.environ.setdefault("REFRESH_SECRET_KEY", "test_secure_refresh_secret_key_32_chars_long")
os.environ.setdefault("CSRF_SECRET", "test_secure_csrf_secret_token_32_chars_long")

import pytest
import sqlalchemy as sa
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.config import settings
from app.main import app
from app.routers.auth import reset_rate_limits

# Use an in-memory SQLite database for test execution
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)

    # Install SQLite append-only triggers for audit_logs (as defined in Phase 2 migration)
    with engine.begin() as conn:
        conn.execute(sa.text("""
            CREATE TRIGGER IF NOT EXISTS audit_logs_no_update
            BEFORE UPDATE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'audit_logs is append-only: UPDATE operations are prohibited');
            END
        """))
        conn.execute(sa.text("""
            CREATE TRIGGER IF NOT EXISTS audit_logs_no_delete
            BEFORE DELETE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'audit_logs is append-only: DELETE operations are prohibited');
            END
        """))

    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    SessionTest = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = SessionTest()

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture(autouse=True)
def auto_reset_rate_limits():
    """Automatically reset in-memory IP and email rate limit counters between tests."""
    reset_rate_limits()
    yield
    reset_rate_limits()


@pytest.fixture
def client(db_session):
    """TestClient fixture with get_db overridden to use test session."""
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


