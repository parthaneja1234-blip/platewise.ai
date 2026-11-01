"""
CLI script to unlock a locked user account and reset failed login counters.
Fulfills Phase 2 Security Review Item 3.

Usage:
    python -m app.cli.unlock_user --email admin@university.edu
"""
import argparse
import sys
from typing import Optional

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.routers.auth import reset_lockout_for_email
from app.services.audit import write_audit_log


def unlock_user(email: str, db: Optional[Session] = None) -> User:
    """
    Unlock a user account by email:
    - Resets failed_login_attempts to 0.
    - Clears locked_until timestamp.
    - Clears in-memory lockout cache for the email across all IPs.
    - Writes USER_UNLOCKED audit log.
    """
    email_clean = email.strip().lower()
    if not email_clean:
        raise ValueError("User email cannot be empty.")

    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        user = db.query(User).filter(User.email == email_clean).first()
        if user is None:
            raise ValueError(f"User with email '{email_clean}' not found.")

        user.failed_login_attempts = 0
        user.locked_until = None

        write_audit_log(
            db,
            "USER_UNLOCKED",
            user_id=user.id,
            details={"action": "cli_unlock", "target_email": email_clean},
        )
        db.commit()
        db.refresh(user)

        # Clear in-memory lockout counters for this email across all IPs
        reset_lockout_for_email(email_clean)

        return user
    except Exception:
        db.rollback()
        raise
    finally:
        if owns_session:
            db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Unlock a locked PlateWise user account.")
    parser.add_argument(
        "--email",
        required=True,
        help="Email address of the user to unlock.",
    )

    args = parser.parse_args()

    try:
        user = unlock_user(email=args.email)
        print(f"Successfully unlocked user '{user.email}' (ID: {user.id}).")
        sys.exit(0)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
