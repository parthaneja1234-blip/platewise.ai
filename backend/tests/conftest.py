import os

# Ensure required settings are configured for test runs in isolated environments
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("POSTGRES_PASSWORD", "test_secure_postgres_pass_16_chars")
os.environ.setdefault("SECRET_KEY", "test_secure_access_secret_key_32_chars_long")
os.environ.setdefault("REFRESH_SECRET_KEY", "test_secure_refresh_secret_key_32_chars_long")
os.environ.setdefault("CSRF_SECRET", "test_secure_csrf_secret_token_32_chars_long")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.config import settings

# Use an in-memory SQLite database for test execution
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
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

