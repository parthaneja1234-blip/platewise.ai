"""
CLI script to seed the initial system administrator.
Fulfills Phase 2 Zero Open Self-Registration Policy (OWASP ASVS).
Usage:
    python -m app.cli.seed_admin --email admin@university.edu --name "System Administrator" [--password "SecretPass123!"]
"""
import argparse
import getpass
import sys
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.security import hash_password
from app.services.audit import write_audit_log


def seed_admin(
    email: str,
    full_name: str,
    password: str,
    db: Optional[Session] = None,
) -> User:
    """
    Seed initial admin user into the database.
    - Validates minimum password length (>= 12 chars).
    - Checks email uniqueness.
    - Hashes password with Argon2id.
    - Creates user with role=UserRole.ADMIN, is_active=True.
    - Writes INITIAL_ADMIN_SEEDED audit log.
    """
    email_clean = email.strip().lower()
    name_clean = full_name.strip()

    if not email_clean:
        raise ValueError("Admin email cannot be empty.")

    if not name_clean:
        raise ValueError("Admin full name cannot be empty.")

    if len(password) < settings.PASSWORD_MIN_LENGTH:
        raise ValueError(
            f"Password does not meet minimum length requirement of {settings.PASSWORD_MIN_LENGTH} characters."
        )

    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email_clean).first()
        if existing_user is not None:
            raise ValueError(f"User with email '{email_clean}' already exists.")

        hashed = hash_password(password)
        admin_user = User(
            email=email_clean,
            full_name=name_clean,
            hashed_password=hashed,
            role=UserRole.ADMIN,
            is_active=True,
            failed_login_attempts=0,
            locked_until=None,
        )
        db.add(admin_user)
        db.flush()

        # Write audit log
        write_audit_log(
            db=db,
            action="INITIAL_ADMIN_SEEDED",
            user_id=admin_user.id,
            details={"email": admin_user.email, "role": admin_user.role.value},
        )
        db.commit()
        db.refresh(admin_user)
        return admin_user

    except Exception:
        db.rollback()
        raise
    finally:
        if owns_session:
            db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed initial PlateWise AI administrator account.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--name", required=True, help="Administrator full name")

    args = parser.parse_args()

    if sys.stdin.isatty():
        password = getpass.getpass("Enter admin password (min 12 characters): ")
        password_confirm = getpass.getpass("Confirm admin password: ")
        if password != password_confirm:
            print("Error: Passwords do not match.", file=sys.stderr)
            return 1
    else:
        # Piped/redirected stdin for automated environments
        password = sys.stdin.readline().strip()

    try:
        admin = seed_admin(email=args.email, full_name=args.name, password=password)
        print(f"Successfully seeded admin user '{admin.email}' (ID: {admin.id}).")
        return 0
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
