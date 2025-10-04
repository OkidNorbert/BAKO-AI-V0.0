"""Add analysis_results field to videos table

Revision ID: 0002_add_analysis_results
Revises: 0001_initial_migration
Create Date: 2024-10-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_analysis_results'
down_revision = '0001_initial_migration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add analysis_results column to videos table
    op.add_column('videos', sa.Column('analysis_results', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove analysis_results column from videos table
    op.drop_column('videos', 'analysis_results')
