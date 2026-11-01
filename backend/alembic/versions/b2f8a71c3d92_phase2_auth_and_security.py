"""Phase 2: auth security - refresh_tokens table, user indexes, audit_log immutability trigger

Revision ID: b2f8a71c3d92
Revises: c85385045a59
Create Date: 2026-11-01 17:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2f8a71c3d92'
down_revision: Union[str, Sequence[str], None] = 'c85385045a59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Phase 2 schema: refresh_tokens table, security indexes, audit_log immutability."""

    # 1. Create refresh_tokens table for family-based token rotation (ASVS V3.4)
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('family_id', sa.String(length=36), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('replaced_by', sa.String(length=36), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['replaced_by'], ['refresh_tokens.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('token_hash', name='uq_refresh_tokens_token_hash'),
    )
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_family_id', 'refresh_tokens', ['family_id'])
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'])

    # 2. Drop the old single-token column from users (migrated to refresh_tokens table)
    op.drop_column('users', 'refresh_token_hash')

    # 3. Performance & security indexes on users
    op.create_index('ix_users_email_active', 'users', ['email', 'is_active'])
    op.create_index('ix_users_locked_until', 'users', ['locked_until'])

    # 4. Audit log indexes for security review and SIEM export
    op.create_index('ix_audit_logs_user_action', 'audit_logs', ['user_id', 'action'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])

    # 5. Database-level append-only enforcement for audit_logs
    # Prevent UPDATE and DELETE at the database level via triggers (SQLite + PostgreSQL)
    conn = op.get_bind()
    dialect = conn.dialect.name

    if dialect == 'sqlite':
        # SQLite triggers
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
    elif dialect == 'postgresql':
        # PostgreSQL trigger function + triggers
        conn.execute(sa.text("""
            CREATE OR REPLACE FUNCTION audit_logs_immutable_trigger()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'audit_logs is append-only: % operations are prohibited', TG_OP;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql
        """))
        conn.execute(sa.text("""
            DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
            CREATE TRIGGER audit_logs_no_update
            BEFORE UPDATE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable_trigger()
        """))
        conn.execute(sa.text("""
            DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs;
            CREATE TRIGGER audit_logs_no_delete
            BEFORE DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable_trigger()
        """))


def downgrade() -> None:
    """Reverse Phase 2 schema changes."""
    conn = op.get_bind()
    dialect = conn.dialect.name

    # Remove audit_log immutability triggers
    if dialect == 'sqlite':
        conn.execute(sa.text("DROP TRIGGER IF EXISTS audit_logs_no_update"))
        conn.execute(sa.text("DROP TRIGGER IF EXISTS audit_logs_no_delete"))
    elif dialect == 'postgresql':
        conn.execute(sa.text("DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs"))
        conn.execute(sa.text("DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs"))
        conn.execute(sa.text("DROP FUNCTION IF EXISTS audit_logs_immutable_trigger()"))

    # Remove audit log indexes
    op.drop_index('ix_audit_logs_created_at', table_name='audit_logs')
    op.drop_index('ix_audit_logs_user_action', table_name='audit_logs')

    # Remove user security indexes
    op.drop_index('ix_users_locked_until', table_name='users')
    op.drop_index('ix_users_email_active', table_name='users')

    # Re-add the old refresh_token_hash column on users
    op.add_column('users', sa.Column('refresh_token_hash', sa.String(length=255), nullable=True))

    # Drop refresh_tokens table
    op.drop_index('ix_refresh_tokens_expires_at', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_family_id', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_token_hash', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
