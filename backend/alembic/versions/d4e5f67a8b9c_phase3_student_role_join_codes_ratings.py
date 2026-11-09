"""Phase 3: student role, mess join codes, ratings, rsvps, plates, is_demo flag

Revision ID: d4e5f67a8b9c
Revises: b2f8a71c3d92
Create Date: 2026-11-05 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f67a8b9c'
down_revision: Union[str, Sequence[str], None] = 'b2f8a71c3d92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name

    # 1. Update userrole enum in PostgreSQL if necessary
    if dialect == 'postgresql':
        with op.get_context().autocommit_block():
            op.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'STUDENT';"))
            op.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'student';"))

    # 2. Add is_demo column to cafeterias
    op.add_column(
        'cafeterias',
        sa.Column('is_demo', sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    # 3. Create mess_join_codes table
    op.create_table(
        'mess_join_codes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('mess_id', sa.String(length=36), nullable=False),
        sa.Column('code_hash', sa.String(length=64), nullable=False),
        sa.Column('created_by', sa.String(length=36), nullable=True),
        sa.Column('max_uses', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('used_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['mess_id'], ['cafeterias.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('code_hash', name='uq_mess_join_codes_code_hash'),
    )
    op.create_index('ix_mess_join_codes_mess_id', 'mess_join_codes', ['mess_id'])
    op.create_index('ix_mess_join_codes_code_hash', 'mess_join_codes', ['code_hash'], unique=True)
    op.create_index('ix_mess_join_codes_expires_at', 'mess_join_codes', ['expires_at'])

    # 4. Create mess_ratings table
    op.create_table(
        'mess_ratings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('mess_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('meal', sa.String(length=20), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('feedback', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['mess_id'], ['cafeterias.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_mess_ratings_mess_id', 'mess_ratings', ['mess_id'])
    op.create_index('ix_mess_ratings_user_id', 'mess_ratings', ['user_id'])

    # 5. Create student_rsvps table
    op.create_table(
        'student_rsvps',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('mess_id', sa.String(length=36), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('meal', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['mess_id'], ['cafeterias.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_student_rsvps_lookup', 'student_rsvps', ['user_id', 'mess_id', 'date', 'meal'])

    # 6. Create student_plates table
    op.create_table(
        'student_plates',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('mess_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('meal', sa.String(length=20), nullable=False, server_default='Lunch'),
        sa.Column('total_kcal', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('protein_g', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('carbs_g', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('fat_g', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('cost_inr', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('co2e_g', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('descriptor', sa.String(length=50), nullable=False, server_default='Moderate'),
        sa.Column('hint', sa.Text(), nullable=True),
        sa.Column('is_veg', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('items', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['mess_id'], ['cafeterias.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_student_plates_user', 'student_plates', ['user_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('ix_student_plates_user', table_name='student_plates')
    op.drop_table('student_plates')

    op.drop_index('ix_student_rsvps_lookup', table_name='student_rsvps')
    op.drop_table('student_rsvps')

    op.drop_index('ix_mess_ratings_user_id', table_name='mess_ratings')
    op.drop_index('ix_mess_ratings_mess_id', table_name='mess_ratings')
    op.drop_table('mess_ratings')

    op.drop_index('ix_mess_join_codes_expires_at', table_name='mess_join_codes')
    op.drop_index('ix_mess_join_codes_code_hash', table_name='mess_join_codes')
    op.drop_index('ix_mess_join_codes_mess_id', table_name='mess_join_codes')
    op.drop_table('mess_join_codes')

    op.drop_column('cafeterias', 'is_demo')
