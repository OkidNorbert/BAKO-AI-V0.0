"""
Wearable data models for health and fitness tracking.
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class WearableType(str, enum.Enum):
    """Wearable device type enum."""
    APPLE_WATCH = "apple_watch"
    GOOGLE_FIT = "google_fit"
    BLE_HRM = "ble_hrm"
    FITBIT = "fitbit"
    GARMIN = "garmin"


class DataType(str, enum.Enum):
    """Wearable data type enum."""
    HEART_RATE = "heart_rate"
    HEART_RATE_VARIABILITY = "hrv"
    STEPS = "steps"
    CALORIES = "calories"
    DISTANCE = "distance"
    ACTIVE_ENERGY = "active_energy"
    RESTING_ENERGY = "resting_energy"
    SLEEP_ANALYSIS = "sleep_analysis"
    BLOOD_OXYGEN = "blood_oxygen"
    BODY_TEMPERATURE = "body_temperature"


class WearableDevice(Base):
    """Wearable device model."""
    __tablename__ = "wearable_devices"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    device_type = Column(Enum(WearableType), nullable=False)
    device_name = Column(String, nullable=False)
    device_identifier = Column(String, unique=True, nullable=False)
    is_active = Column(String, default="true")  # SQLite doesn't have boolean
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    player = relationship("PlayerProfile", back_populates="devices")
    data_points = relationship("WearableData", back_populates="device")


class WearableData(Base):
    """Wearable data points model."""
    __tablename__ = "wearable_data"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("wearable_devices.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    data_type = Column(Enum(DataType), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # bpm, steps, calories, etc.
    timestamp = Column(DateTime(timezone=True), nullable=False)
    metadata = Column(Text)  # JSON string for additional data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    device = relationship("WearableDevice", back_populates="data_points")
    player = relationship("PlayerProfile", back_populates="wearable_data")


class WearableSession(Base):
    """Wearable data session model."""
    __tablename__ = "wearable_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    session_id = Column(Integer, ForeignKey("training_sessions.id"))
    device_id = Column(Integer, ForeignKey("wearable_devices.id"))
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    total_steps = Column(Integer, default=0)
    avg_heart_rate = Column(Float)
    max_heart_rate = Column(Float)
    min_heart_rate = Column(Float)
    calories_burned = Column(Float)
    distance_covered = Column(Float)
    session_summary = Column(Text)  # JSON string with session metrics
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    player = relationship("PlayerProfile")
    session = relationship("TrainingSession")
    device = relationship("WearableDevice")
