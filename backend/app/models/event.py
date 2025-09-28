"""
Event model for tracking basketball events.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Event(Base):
    """Event model for tracking basketball events."""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(String, nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"))
    timestamp = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # shot_attempt, jump, sprint, etc.
    meta = Column(Text)  # JSON string with additional data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("TrainingSession", back_populates="events")
