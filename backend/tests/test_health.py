import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app, create_app
from app.config import Settings
from app.database import get_db

VALID_SETTINGS_BASE = {
    "DATABASE_URL": "sqlite:///:memory:",
    "SECRET_KEY": "a" * 32,
    "REFRESH_SECRET_KEY": "b" * 32,
    "CSRF_SECRET": "c" * 32,
    "POSTGRES_PASSWORD": "d" * 16,
    "COOKIE_SECURE": True,
}


@pytest.fixture
def client(db_session):
    """TestClient fixture with get_db overridden to use test session."""
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_health_check_development_details(client):
    """Verify /health returns extended diagnostic info in development."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["backend"] == "connected"
    assert data["database"] == "connected"
    assert "db_host" in data
    assert "db_driver" in data
    assert "latency_ms" in data
    assert data["environment"] == "development"
    assert "version" in data


def test_api_health_alias(client):
    """Verify /api/health alias also succeeds for container health checks."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_check_development_database_failure():
    """Verify /health returns 503 with error details in development when database execution fails."""
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("Database connection timeout")

    def _broken_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _broken_get_db
    try:
        with TestClient(app) as test_client:
            response = test_client.get("/health")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "error"
            assert data["backend"] == "connected"
            assert data["database"] == "disconnected"
            assert "Database connection timeout" in data["detail"]
    finally:
        app.dependency_overrides.clear()


def test_cors_headers_allowed_origin(client):
    """Verify CORS headers are returned for allowed origin http://localhost:3000."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_docs_enabled_in_development(client):
    """Verify /docs, /redoc, and /openapi.json are enabled in development."""
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200

    redoc_resp = client.get("/redoc")
    assert redoc_resp.status_code == 200

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200


def test_health_check_production_only_returns_status_ok(db_session):
    """Verify /health returns ONLY {'status': 'ok'} in production."""
    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        **VALID_SETTINGS_BASE,
    )
    prod_app = create_app(custom_settings=prod_settings)

    def _override_get_db():
        yield db_session

    prod_app.dependency_overrides[get_db] = _override_get_db
    try:
        with TestClient(prod_app) as prod_client:
            response = prod_client.get("/health")
            assert response.status_code == 200
            assert response.json() == {"status": "ok"}
    finally:
        prod_app.dependency_overrides.clear()


def test_health_check_production_database_failure():
    """Verify /health returns 503 with only {'status': 'error'} in production without leaking details."""
    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        **VALID_SETTINGS_BASE,
    )
    prod_app = create_app(custom_settings=prod_settings)

    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("Sensitive connection error to internal postgres host")

    def _broken_get_db():
        yield mock_db

    prod_app.dependency_overrides[get_db] = _broken_get_db
    try:
        with TestClient(prod_app) as prod_client:
            response = prod_client.get("/health")
            assert response.status_code == 503
            assert response.json() == {"status": "error"}
            # Ensure no internal error strings or host details are exposed
            assert "Sensitive" not in response.text
    finally:
        prod_app.dependency_overrides.clear()


def test_docs_disabled_in_production():
    """Verify /docs, /redoc, and /openapi.json are all disabled (404) in production."""
    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        **VALID_SETTINGS_BASE,
    )
    prod_app = create_app(custom_settings=prod_settings)

    with TestClient(prod_app) as prod_client:
        docs_resp = prod_client.get("/docs")
        assert docs_resp.status_code == 404

        redoc_resp = prod_client.get("/redoc")
        assert redoc_resp.status_code == 404

        openapi_resp = prod_client.get("/openapi.json")
        assert openapi_resp.status_code == 404
