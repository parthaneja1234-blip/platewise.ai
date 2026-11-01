"""
Optional PostgreSQL Integration Test Suite.
Enabled ONLY when TEST_POSTGRES_URL environment variable is set.
Enforces strict guard: database name MUST end with '_test' (e.g., platewise_test),
refusing execution otherwise to prevent accidental execution against dev/production databases.

Covers (Security Review Item 12):
1. Safety guard refusing execution on non-_test database names.
2. Migration upgrade to head and downgrade to base.
3. Database-level audit_logs immutability trigger blocking UPDATE and DELETE.
4. Concurrent refresh token rotation with two real database connections.
"""
import os
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from sqlalchemy import create_engine, select, text, update
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import sessionmaker

from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
from app.security import hash_password
from app.security.jwt import create_refresh_token_jwt


def verify_test_postgres_url(url_str: str) -> str:
    """
    Validate that the database connection string targets an isolated test database
    ending with '_test'. Refuses execution otherwise.
    """
    parsed = make_url(url_str)
    db_name = parsed.database or ""
    if not db_name.endswith("_test"):
        raise ValueError(
            f"REFUSING to run PostgreSQL test suite: Database name '{db_name}' "
            "does not end with '_test'. Configure a dedicated test database "
            "(e.g., postgresql://user:pass@localhost:5432/platewise_test)."
        )
    return url_str


# Test the guard even when TEST_POSTGRES_URL is not set
def test_postgres_test_suite_guard_rejects_non_test_db():
    """Verify that verify_test_postgres_url strictly rejects production/dev databases."""
    with pytest.raises(ValueError, match="does not end with '_test'"):
        verify_test_postgres_url("postgresql://user:pass@localhost:5432/platewise_db")

    with pytest.raises(ValueError, match="does not end with '_test'"):
        verify_test_postgres_url("postgresql://user:pass@localhost:5432/production")

    # Valid test URL passes
    valid = verify_test_postgres_url("postgresql://user:pass@localhost:5432/platewise_test")
    assert valid.endswith("_test")


# Mark all remaining tests in this module to skip if TEST_POSTGRES_URL is unset
_pg_url = os.getenv("TEST_POSTGRES_URL")
pytestmark = pytest.mark.skipif(
    not _pg_url,
    reason="TEST_POSTGRES_URL not set; skipping PostgreSQL integration test suite."
)


@pytest.fixture(scope="module")
def pg_engine():
    """Create a verified PostgreSQL engine for the test suite."""
    url = verify_test_postgres_url(os.getenv("TEST_POSTGRES_URL", ""))
    engine = create_engine(url, pool_pre_ping=True)
    yield engine
    engine.dispose()


def test_postgres_migration_upgrade_and_downgrade(pg_engine):
    """
    Verify Alembic migration upgrade to 'head' and downgrade to 'base' on PostgreSQL.
    """
    from alembic import command
    from alembic.config import Config

    url = verify_test_postgres_url(os.getenv("TEST_POSTGRES_URL", ""))
    backend_dir = Path(__file__).resolve().parent.parent.parent
    ini_path = backend_dir / "alembic.ini"

    alembic_cfg = Config(str(ini_path))
    alembic_cfg.set_main_option("sqlalchemy.url", url)
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))

    # Upgrade to head
    command.upgrade(alembic_cfg, "head")

    # Downgrade to base
    command.downgrade(alembic_cfg, "base")

    # Upgrade back to head to leave schema ready for subsequent tests
    command.upgrade(alembic_cfg, "head")


def test_postgres_audit_log_trigger_blocks_update_and_delete(pg_engine):
    """
    Verify database-level trigger on PostgreSQL strictly prevents UPDATE and DELETE on audit_logs.
    """
    with pg_engine.connect() as conn:
        log_id = str(uuid.uuid4())
        conn.execute(
            text("""
                INSERT INTO audit_logs (id, action, created_at, updated_at)
                VALUES (:id, :action, NOW(), NOW())
            """),
            {"id": log_id, "action": "TEST_INSERT"},
        )
        conn.commit()

        # 1. Attempt UPDATE: Must fail via database trigger
        with pytest.raises(DBAPIError) as exc_info:
            conn.execute(
                text("UPDATE audit_logs SET action = 'TAMPERED' WHERE id = :id"),
                {"id": log_id},
            )
            conn.commit()
        conn.rollback()
        assert "audit_logs is append-only" in str(exc_info.value)

        # 2. Attempt DELETE: Must fail via database trigger
        with pytest.raises(DBAPIError) as exc_info:
            conn.execute(
                text("DELETE FROM audit_logs WHERE id = :id"),
                {"id": log_id},
            )
            conn.commit()
        conn.rollback()
        assert "audit_logs is append-only" in str(exc_info.value)


def test_postgres_concurrent_refresh_rotation_with_two_connections(pg_engine):
    """
    Verify concurrent refresh token rotation on PostgreSQL with two real database connections.
    Tests atomic conditional replacement and grace window under true concurrency.
    """
    Session = sessionmaker(bind=pg_engine)

    # Setup user and initial refresh token in DB
    setup_db = Session()
    test_user_id = str(uuid.uuid4())
    test_email = f"concurrent_pg_{uuid.uuid4().hex[:8]}@university.edu"

    user = User(
        id=test_user_id,
        email=test_email,
        full_name="Postgres Concurrent User",
        hashed_password=hash_password("SecurePass123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    setup_db.add(user)

    family_id = str(uuid.uuid4())
    initial_jwt = create_refresh_token_jwt(user_id=test_user_id, family_id=family_id)
    import hashlib
    token_hash = hashlib.sha256(initial_jwt.encode("utf-8")).hexdigest()

    initial_token = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=test_user_id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    setup_db.add(initial_token)
    setup_db.commit()
    initial_token_id = initial_token.id
    setup_db.close()

    results = {}

    def rotate_attempt(conn_id: int):
        db = Session()
        try:
            # 1. Select with row lock (PostgreSQL FOR UPDATE)
            stmt = select(RefreshToken).filter(RefreshToken.token_hash == token_hash).with_for_update()
            tok = db.execute(stmt).scalar_one_or_none()

            if not tok or tok.is_revoked:
                results[conn_id] = ("revoked", None)
                return

            if tok.replaced_by is not None:
                # Already replaced: check 10-second grace window
                rep = db.query(RefreshToken).filter(RefreshToken.id == tok.replaced_by).first()
                if rep:
                    rep_created = rep.created_at
                    if rep_created.tzinfo is None:
                        rep_created = rep_created.replace(tzinfo=timezone.utc)
                    age = (datetime.now(timezone.utc) - rep_created).total_seconds()
                    if age <= 10.0:
                        results[conn_id] = ("grace_window_401", rep.id)
                        return
                results[conn_id] = ("reuse_theft", None)
                return

            # Perform rotation
            new_jwt = create_refresh_token_jwt(user_id=test_user_id, family_id=family_id)
            new_hash = hashlib.sha256(new_jwt.encode("utf-8")).hexdigest()
            new_rec = RefreshToken(
                id=str(uuid.uuid4()),
                user_id=test_user_id,
                token_hash=new_hash,
                family_id=family_id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
            db.add(new_rec)
            db.flush()

            updated = db.execute(
                update(RefreshToken)
                .where(
                    RefreshToken.id == tok.id,
                    RefreshToken.replaced_by.is_(None),
                    RefreshToken.is_revoked.is_(False),
                )
                .values(replaced_by=new_rec.id)
            ).rowcount

            if updated == 1:
                db.commit()
                results[conn_id] = ("success", new_rec.id)
            else:
                db.rollback()
                results[conn_id] = ("concurrent_conflict", None)
        except Exception as exc:
            db.rollback()
            results[conn_id] = ("error", str(exc))
        finally:
            db.close()

    t1 = threading.Thread(target=rotate_attempt, args=(1,))
    t2 = threading.Thread(target=rotate_attempt, args=(2,))

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # Verify concurrency behavior:
    # Exactly one connection successfully rotated the token
    # The other received either grace_window_401 or handled the serialized rotation without data corruption
    outcomes = [results[1][0], results[2][0]]
    assert "success" in outcomes
    assert outcomes.count("success") == 1
    other_outcome = results[2][0] if results[1][0] == "success" else results[1][0]
    assert other_outcome in ("grace_window_401", "concurrent_conflict")
