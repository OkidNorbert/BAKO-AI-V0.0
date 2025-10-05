"""Add team management tables

Revision ID: 0004
Revises: 0003
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create training_plans table
    op.create_table('training_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('difficulty', sa.String(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('coach_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['coach_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_training_plans_id'), 'training_plans', ['id'], unique=False)

    # Create training_assignments table
    op.create_table('training_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('training_plan_id', sa.Integer(), nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('completion_rate', sa.Float(), nullable=False, default=0.0),
        sa.Column('status', sa.String(), nullable=False, default='assigned'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['training_plan_id'], ['training_plans.id'], ),
        sa.ForeignKeyConstraint(['player_id'], ['player_profiles.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('training_plan_id', 'player_id', name='unique_training_assignment')
    )
    op.create_index(op.f('ix_training_assignments_id'), 'training_assignments', ['id'], unique=False)

    # Add missing columns to events table
    op.add_column('events', sa.Column('performance_score', sa.Float(), nullable=True))
    op.add_column('events', sa.Column('duration', sa.Integer(), nullable=True))
    op.add_column('events', sa.Column('end_timestamp', sa.Float(), nullable=True))
    op.add_column('events', sa.Column('status', sa.String(), nullable=True))
    op.add_column('events', sa.Column('notes', sa.Text(), nullable=True))

    # Add missing columns to videos table
    op.add_column('videos', sa.Column('session_id', sa.Integer(), nullable=True))
    op.add_column('videos', sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_training_assignments_id'), table_name='training_assignments')
    op.drop_table('training_assignments')
    op.drop_index(op.f('ix_training_plans_id'), table_name='training_plans')
    op.drop_table('training_plans')
    
    # Remove added columns
    op.drop_column('videos', 'uploaded_at')
    op.drop_column('videos', 'session_id')
    op.drop_column('events', 'notes')
    op.drop_column('events', 'status')
    op.drop_column('events', 'end_timestamp')
    op.drop_column('events', 'duration')
    op.drop_column('events', 'performance_score')
