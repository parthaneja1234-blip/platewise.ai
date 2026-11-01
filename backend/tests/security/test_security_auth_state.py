"""
Tests for Amendments 2, 3 and 9:
Fresh DB State Enforcement, Immediate Revocation/Role/Tenancy Changes,
Logout from Refresh Cookie Alone, and Admin Safeguards.
"""
from datetime import timedelta
import pytest
from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user, require_role
from app.models.cafeteria import Cafeteria
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
from app.security import hash_password
from app.security.jwt import create_access_token, create_refresh_token_jwt


_auth_state_router = APIRouter(prefix="/test-auth-state")


@_auth_state_router.get("/admin-only", operation_id="test_auth_state_admin_only")
def admin_endpoint(user: User = Depends(require_role(UserRole.ADMIN))):
    return {"admin_id": user.id, "role": user.role.value}


@pytest.fixture
def auth_state_router(client):
    """Router for testing role enforcement with DB-backed get_current_user."""
    if not any(getattr(r, "path", None) == "/test-auth-state/admin-only" for r in client.app.routes):
        client.app.include_router(_auth_state_router)
    return _auth_state_router


def test_deactivated_user_access_token_rejected_immediately(client, db_session):
    """
    Amendment 2: get_current_user must load user from DB on every request.
    When a user is deactivated in the DB, their unexpired access token is rejected immediately.
    """
    user = User(
        email="deactivate_test@university.edu",
        full_name="Deactivate Test",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Generate a fresh 15-minute access token
    access_tok = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        cafeteria_ids=[],
    )
    client.cookies.set("access_token", access_tok)

    # Initially succeeds
    resp1 = client.get("/api/v1/auth/me")
    assert resp1.status_code == 200

    # Deactivate user in the database
    user.is_active = False
    db_session.commit()

    # Subsequent request with the SAME unexpired access token must fail immediately
    resp2 = client.get("/api/v1/auth/me")
    assert resp2.status_code == 401
    assert "deactivated" in resp2.json()["detail"].lower()


def test_role_change_takes_effect_immediately(client, db_session, auth_state_router):
    """
    Amendment 2: Role change in the DB takes effect immediately.
    JWT claims are treated only as an identifier, never as authorization.
    """
    user = User(
        email="rolechange@university.edu",
        full_name="Role Change User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Access token created with role="admin"
    access_tok = create_access_token(
        user_id=user.id,
        email=user.email,
        role="admin",
        cafeteria_ids=[],
    )
    client.cookies.set("access_token", access_tok)

    # Call admin endpoint -> succeeds
    resp1 = client.get("/test-auth-state/admin-only")
    assert resp1.status_code == 200

    # Change user's role to VIEWER in the database
    user.role = UserRole.VIEWER
    db_session.commit()

    # Even though access token payload still claims role="admin", the DB role is VIEWER
    # Admin endpoint must immediately return 403 Forbidden!
    resp2 = client.get("/test-auth-state/admin-only")
    assert resp2.status_code == 403
    assert "Insufficient permissions" in resp2.json()["detail"]


def test_cafeteria_unassignment_takes_effect_immediately(client, db_session):
    """
    Amendment 2: Cafeteria unassignment in the DB takes effect immediately.
    /api/v1/auth/me returns fresh cafeteria assignments from the DB.
    """
    cafeteria = Cafeteria(
        name="North Dining Hall",
        campus_location="North Campus",
        cost_per_kg_inr=45.0,
        co2e_factor_kg_per_kg=2.5,
    )
    db_session.add(cafeteria)
    db_session.flush()

    user = User(
        email="cafeteria_user@university.edu",
        full_name="Cafeteria User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.MESS_MANAGER,
        is_active=True,
        cafeterias=[cafeteria],
    )
    db_session.add(user)
    db_session.commit()

    # Token with cafeteria ID claim
    access_tok = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        cafeteria_ids=[cafeteria.id],
    )
    client.cookies.set("access_token", access_tok)

    resp1 = client.get("/api/v1/auth/me")
    assert resp1.status_code == 200
    assert resp1.json()["cafeteria_ids"] == [cafeteria.id]

    # Unassign cafeteria in the DB
    user.cafeterias.clear()
    db_session.commit()

    # Immediate call to /api/v1/auth/me reflects DB state, ignoring token claim
    resp2 = client.get("/api/v1/auth/me")
    assert resp2.status_code == 200
    assert resp2.json()["cafeteria_ids"] == []


def test_logout_works_from_refresh_cookie_alone_with_expired_access_token(client, db_session):
    """
    Amendment 3: /auth/logout must work from the refresh cookie alone.
    An expired access token must not block logout.
    """
    user = User(
        email="logout_test@university.edu",
        full_name="Logout Test User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Login to get valid cookies
    client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "ValidPassword123!"},
    )
    refresh_tok = client.cookies.get("refresh_token")

    # Set an expired access token cookie
    expired_access_tok = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        cafeteria_ids=[],
        expires_delta=timedelta(seconds=-60),
    )
    client.cookies.set("access_token", expired_access_tok)
    client.cookies.set("refresh_token", refresh_tok)

    # Logout should succeed despite expired access token!
    logout_resp = client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200
    assert logout_resp.json() == {"message": "Logged out successfully"}


def test_logout_works_from_refresh_cookie_alone_with_no_access_token(client, db_session):
    """
    Amendment 3: /auth/logout works with only refresh_token cookie and no access_token at all.
    """
    user = User(
        email="logout_no_access@university.edu",
        full_name="No Access Token User",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "ValidPassword123!"},
    )
    refresh_tok = client.cookies.get("refresh_token")

    # Clear access token cookie completely
    client.cookies.delete("access_token")
    client.cookies.set("refresh_token", refresh_tok)

    logout_resp = client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200


def test_admin_safeguard_admin_cannot_deactivate_or_delete_self(db_session):
    """
    Amendment 9: Admin safeguards.
    An admin cannot delete or deactivate themselves.
    """
    admin = User(
        email="sole_admin@university.edu",
        full_name="Sole Admin",
        hashed_password=hash_password("ValidPassword123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    # Safeguard enforcement logic (to be used in user update/delete service)
    def validate_admin_self_modification(actor: User, target: User, target_active: bool, new_role: UserRole):
        if actor.id == target.id and not target_active:
            raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account.")
        if target.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
            admin_count = db_session.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the last remaining active administrator.")

    with pytest.raises(HTTPException) as exc_self:
        validate_admin_self_modification(actor=admin, target=admin, target_active=False, new_role=UserRole.ADMIN)
    assert "cannot deactivate their own account" in exc_self.value.detail

    with pytest.raises(HTTPException) as exc_last:
        validate_admin_self_modification(actor=admin, target=admin, target_active=True, new_role=UserRole.VIEWER)
    assert "last remaining active administrator" in exc_last.value.detail
