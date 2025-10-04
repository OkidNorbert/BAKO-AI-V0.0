"""Add wearable data tables

Revision ID: 0003_add_wearable_tables
Revises: 0002_add_analysis_results
Create Date: 2024-10-04 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0003_add_wearable_tables'
down_revision = '0002_add_analysis_results'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create wearable_devices table
    op.create_table('wearable_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=True),
        sa.Column('device_type', sa.Enum('APPLE_WATCH', 'GOOGLE_FIT', 'BLE_HRM', 'FITBIT', 'GARMIN', name='wearabletype'), nullable=False),
        sa.Column('device_name', sa.String(), nullable=False),
        sa.Column('device_identifier', sa.String(), nullable=False),
        sa.Column('is_active', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wearable_devices_id'), 'wearable_devices', ['id'], unique=False)
    op.create_index(op.f('ix_wearable_devices_device_identifier'), 'wearable_devices', ['device_identifier'], unique=True)
    
    # Create wearable_data table
    op.create_table('wearable_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=True),
        sa.Column('player_id', sa.Integer(), nullable=True),
        sa.Column('data_type', sa.Enum('HEART_RATE', 'HEART_RATE_VARIABILITY', 'STEPS', 'CALORIES', 'DISTANCE', 'ACTIVE_ENERGY', 'RESTING_ENERGY', 'SLEEP_ANALYSIS', 'BLOOD_OXYGEN', 'BODY_TEMPERATURE', name='datatype'), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['wearable_devices.id'], ),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wearable_data_id'), 'wearable_data', ['id'], unique=False)
    op.create_index(op.f('ix_wearable_data_timestamp'), 'wearable_data', ['timestamp'], unique=False)
    
    # Create wearable_sessions table
    op.create_table('wearable_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('device_id', sa.Integer(), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_steps', sa.Integer(), nullable=True),
        sa.Column('avg_heart_rate', sa.Float(), nullable=True),
        sa.Column('max_heart_rate', sa.Float(), nullable=True),
        sa.Column('min_heart_rate', sa.Float(), nullable=True),
        sa.Column('calories_burned', sa.Float(), nullable=True),
        sa.Column('distance_covered', sa.Float(), nullable=True),
        sa.Column('session_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['wearable_devices.id'], ),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['training_sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wearable_sessions_id'), 'wearable_sessions', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_wearable_sessions_id'), table_name='wearable_sessions')
    op.drop_table('wearable_sessions')
    
    op.drop_index(op.f('ix_wearable_data_timestamp'), table_name='wearable_data')
    op.drop_index(op.f('ix_wearable_data_id'), table_name='wearable_data')
    op.drop_table('wearable_data')
    
    op.drop_index(op.f('ix_wearable_devices_device_identifier'), table_name='wearable_devices')
    op.drop_index(op.f('ix_wearable_devices_id'), table_name='wearable_devices')
    op.drop_table('wearable_devices')
