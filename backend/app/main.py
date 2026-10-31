import time
from typing import Optional
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import Settings, settings
from app.database import get_db


def create_app(custom_settings: Optional[Settings] = None) -> FastAPI:
    """
    Application factory for PlateWise AI FastAPI service.
    Enforces production security controls (OWASP ASVS):
    - Disables Swagger UI (/docs), ReDoc (/redoc), and OpenAPI specification (/openapi.json) in production.
    - Limits health check details in production to avoid exposing internal infrastructure metadata.
    """
    cfg = custom_settings or settings
    is_prod = cfg.ENVIRONMENT == "production"

    application = FastAPI(
        title=cfg.PROJECT_NAME,
        version=cfg.VERSION,
        docs_url=None if is_prod else "/docs",
        redoc_url=None if is_prod else "/redoc",
        openapi_url=None if is_prod else "/openapi.json",
    )

    origins = cfg.CORS_ORIGINS if isinstance(cfg.CORS_ORIGINS, list) else [cfg.CORS_ORIGINS]

    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    @application.get("/health", tags=["Health"])
    @application.get("/api/health", tags=["Health"], include_in_schema=False)
    def health_check(db: Session = Depends(get_db)):
        """
        Service health probe endpoint.
        - Production: returns minimal `{"status": "ok"}` or 503 without leaking infrastructure details.
        - Development: returns detailed diagnostic metrics (DB host, driver, latency, environment).
        """
        start_time = time.perf_counter()
        try:
            db.execute(text("SELECT 1"))
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if cfg.ENVIRONMENT == "production":
                return {"status": "ok"}

            bind = db.get_bind()
            engine_obj = getattr(bind, "engine", bind)
            db_url = getattr(engine_obj, "url", None)
            db_host = getattr(db_url, "host", None) or cfg.POSTGRES_SERVER or "localhost"
            db_driver = getattr(engine_obj, "driver", None) or getattr(getattr(engine_obj, "dialect", None), "name", "unknown")

            return {
                "status": "ok",
                "backend": "connected",
                "database": "connected",
                "db_host": db_host,
                "db_driver": db_driver,
                "latency_ms": latency_ms,
                "environment": cfg.ENVIRONMENT,
                "version": cfg.VERSION,
            }
        except Exception as exc:
            if cfg.ENVIRONMENT == "production":
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={"status": "error"},
                )

            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "error",
                    "backend": "connected",
                    "database": "disconnected",
                    "detail": str(exc),
                    "environment": cfg.ENVIRONMENT,
                },
            )

    return application


app = create_app()
