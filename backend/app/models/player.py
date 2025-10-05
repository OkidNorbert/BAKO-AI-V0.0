"""
Player profile model.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PlayerProfile(Base):
    """Player profile model."""
    __tablename__ = "player_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    height_cm = Column(Float)
    weight_kg = Column(Float)
    position = Column(String)  # PG, SG, SF, PF, C
    team_id = Column(Integer, ForeignKey("teams.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")
    team = relationship("Team", back_populates="players")
    devices = relationship("WearableDevice", back_populates="player")
    wearable_data = relationship("WearableData", back_populates="player")
