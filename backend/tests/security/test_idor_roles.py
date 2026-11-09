"""
IDOR & Role-Based Access Control (RBAC) Test Suite.
Validates multi-role authorization isolation across Student, Mess Manager, and Platform Admin:
- Unauthenticated access returns 401.
- Role boundary violations return 403.
- Cross-tenant / Cross-mess IDOR violations return 403.
- Join-code registration securely binds students to their authorized mess hall.
"""
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
import pytest

from app.models.cafeteria import Cafeteria
from app.models.join_code import MessJoinCode
from app.models.user import User, UserRole
from app.security import hash_password
from app.security.csrf import generate_csrf_token
from app.security.jwt import create_access_token


def create_test_cafeteria(db, name: str) -> Cafeteria:
    caf = Cafeteria(
        id=str(uuid.uuid4()),
        name=name,
        campus_location=f"{name} Campus Location",
        is_demo=False,
        cost_per_kg_inr=45.0,
        co2e_factor_kg_per_kg=2.5,
    )
    db.add(caf)
    db.commit()
    db.refresh(caf)
    return caf


def create_test_user(db, email: str, role: UserRole, cafeterias=None) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=f"User {email}",
        hashed_password=hash_password("ValidPassword123!"),
        role=role,
        is_active=True,
    )
    if cafeterias:
        for c in cafeterias:
            user.cafeterias.append(c)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers_and_cookies(user: User):
    caf_ids = [c.id for c in user.cafeterias]
    token = create_access_token(user.id, user.email, user.role.value, caf_ids)
    csrf = generate_csrf_token(user.id)
    cookies = {
        "access_token": token,
        "csrf_token": csrf,
    }
    headers = {
        "X-CSRF-Token": csrf,
    }
    return cookies, headers


# ---------------------------------------------------------------------------
# 1. Unauthenticated Requests Return 401
# ---------------------------------------------------------------------------

def test_unauthenticated_requests_return_401(client):
    assert client.get("/api/v1/app/student/today").status_code == 401
    assert client.get("/api/v1/app/owner/messes").status_code == 401
    assert client.get("/api/v1/app/admin/users").status_code == 401


# ---------------------------------------------------------------------------
# 2. Student Role Boundaries (Student cannot access Owner or Admin endpoints)
# ---------------------------------------------------------------------------

def test_student_cannot_access_owner_or_admin_endpoints(client, db_session):
    caf = create_test_cafeteria(db_session, "Student Test Cafeteria")
    student = create_test_user(db_session, "student1@test.com", UserRole.STUDENT, [caf])
    cookies, headers = auth_headers_and_cookies(student)

    # Student CAN access student endpoints
    resp = client.get("/api/v1/app/student/today", cookies=cookies)
    assert resp.status_code == 200
    assert resp.json()["mess_id"] == caf.id

    # Student CANNOT access owner endpoints (403 Forbidden)
    assert client.get("/api/v1/app/owner/messes", cookies=cookies).status_code == 403
    assert client.get("/api/v1/app/owner/engagement", cookies=cookies).status_code == 403
    assert client.post("/api/v1/app/owner/join-codes", json={}, cookies=cookies, headers=headers).status_code == 403

    # Student CANNOT access admin endpoints (403 Forbidden)
    assert client.get("/api/v1/app/admin/users", cookies=cookies).status_code == 403
    assert client.get("/api/v1/app/admin/messes", cookies=cookies).status_code == 403
    assert client.get("/api/v1/app/admin/health", cookies=cookies).status_code == 403


# ---------------------------------------------------------------------------
# 3. Manager Role Boundaries (Manager cannot access Admin endpoints)
# ---------------------------------------------------------------------------

def test_manager_cannot_access_admin_endpoints(client, db_session):
    caf = create_test_cafeteria(db_session, "Manager Test Cafeteria")
    manager = create_test_user(db_session, "manager1@test.com", UserRole.MESS_MANAGER, [caf])
    cookies, headers = auth_headers_and_cookies(manager)

    # Manager CAN access owner endpoints
    resp = client.get("/api/v1/app/owner/messes", cookies=cookies)
    assert resp.status_code == 200

    # Manager CANNOT access admin endpoints (403 Forbidden)
    assert client.get("/api/v1/app/admin/users", cookies=cookies).status_code == 403
    assert client.get("/api/v1/app/admin/audit-logs", cookies=cookies).status_code == 403
    assert client.post("/api/v1/app/admin/messes", json={"name": "X", "campus_location": "Y"}, cookies=cookies, headers=headers).status_code == 403


# ---------------------------------------------------------------------------
# 4. Anti-IDOR: Manager A Cannot Access Manager B's Mess
# ---------------------------------------------------------------------------

def test_anti_idor_manager_isolated_to_assigned_messes(client, db_session):
    caf_a = create_test_cafeteria(db_session, "Mess Alpha")
    caf_b = create_test_cafeteria(db_session, "Mess Beta")

    manager_a = create_test_user(db_session, "manager_a@test.com", UserRole.MESS_MANAGER, [caf_a])
    manager_b = create_test_user(db_session, "manager_b@test.com", UserRole.MESS_MANAGER, [caf_b])

    cookies_a, headers_a = auth_headers_and_cookies(manager_a)
    cookies_b, headers_b = auth_headers_and_cookies(manager_b)

    # Manager A querying their own mess (Mess Alpha) -> SUCCESS
    resp_a_own = client.get(f"/api/v1/app/owner/engagement?mess_id={caf_a.id}", cookies=cookies_a)
    assert resp_a_own.status_code == 200
    assert resp_a_own.json()["mess_id"] == caf_a.id

    # Manager A attempting to query Manager B's mess (Mess Beta) -> 403 FORBIDDEN
    resp_a_idor = client.get(f"/api/v1/app/owner/engagement?mess_id={caf_b.id}", cookies=cookies_a)
    assert resp_a_idor.status_code == 403
    assert "Access denied" in resp_a_idor.json()["detail"]

    # Manager B querying their own mess (Mess Beta) -> SUCCESS
    resp_b_own = client.get(f"/api/v1/app/owner/engagement?mess_id={caf_b.id}", cookies=cookies_b)
    assert resp_b_own.status_code == 200
    assert resp_b_own.json()["mess_id"] == caf_b.id


# ---------------------------------------------------------------------------
# 5. Admin Platform Operations
# ---------------------------------------------------------------------------

def test_admin_has_platform_wide_access(client, db_session):
    caf = create_test_cafeteria(db_session, "Admin Test Mess")
    admin = create_test_user(db_session, "admin@test.com", UserRole.ADMIN, [caf])
    target_user = create_test_user(db_session, "user_to_deactivate@test.com", UserRole.STUDENT, [caf])

    cookies, headers = auth_headers_and_cookies(admin)

    # Admin lists users
    resp_users = client.get("/api/v1/app/admin/users", cookies=cookies)
    assert resp_users.status_code == 200
    assert any(u["email"] == target_user.email for u in resp_users.json())

    # Admin deactivates user (NEVER deletes)
    resp_deact = client.patch(
        f"/api/v1/app/admin/users/{target_user.id}/deactivate",
        cookies=cookies,
        headers=headers,
    )
    assert resp_deact.status_code == 200
    assert resp_deact.json()["is_active"] is False

    # Deactivated user is rejected upon login
    resp_login = client.post(
        "/api/v1/auth/login",
        json={"email": target_user.email, "password": "ValidPassword123!"},
    )
    assert resp_login.status_code == 401


# ---------------------------------------------------------------------------
# 6. Join Code Lifecycle & Student Registration
# ---------------------------------------------------------------------------

def test_join_code_student_registration_lifecycle(client, db_session):
    caf = create_test_cafeteria(db_session, "Join Code Cafeteria")
    manager = create_test_user(db_session, "join_manager@test.com", UserRole.MESS_MANAGER, [caf])
    cookies_mgr, headers_mgr = auth_headers_and_cookies(manager)

    # Manager generates join code
    resp_code = client.post(
        "/api/v1/app/owner/join-codes",
        json={"mess_id": caf.id, "max_uses": 2, "valid_days": 3},
        cookies=cookies_mgr,
        headers=headers_mgr,
    )
    assert resp_code.status_code == 200
    plain_code = resp_code.json()["code"]
    code_id = resp_code.json()["id"]

    # Student registers with this join code
    student_email = "new_student_join@test.com"
    resp_reg = client.post(
        "/api/v1/auth/register-student",
        json={
            "email": student_email,
            "full_name": "New Student",
            "password": "SecureStudentPassword123!",
            "join_code": plain_code,
        },
    )
    assert resp_reg.status_code == 200
    assert "Student registered successfully" in resp_reg.json()["message"]

    # Verify student is assigned to that mess
    new_student = db_session.query(User).filter(User.email == student_email).first()
    assert new_student is not None
    assert new_student.role == UserRole.STUDENT
    assert len(new_student.cafeterias) == 1
    assert new_student.cafeterias[0].id == caf.id


def test_expired_or_invalid_join_code_rejected(client, db_session):
    caf = create_test_cafeteria(db_session, "Expired Code Mess")

    # Expired code in DB
    plain_code = "PW-EXPD-9999"
    code_hash = hashlib.sha256(plain_code.encode()).hexdigest()
    expired_code = MessJoinCode(
        id=str(uuid.uuid4()),
        mess_id=caf.id,
        code_hash=code_hash,
        max_uses=10,
        used_count=0,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
        is_active=True,
    )
    db_session.add(expired_code)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/register-student",
        json={
            "email": "fail_student@test.com",
            "full_name": "Fail Student",
            "password": "Password123456!",
            "join_code": plain_code,
        },
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()
