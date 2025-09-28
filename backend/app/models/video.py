"""
Video model.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class VideoStatus(str, enum.Enum):
    """Video processing status enum."""
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Video(Base):
    """Video model."""
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"))
    filename = Column(String, nullable=False)
    file_size = Column(Integer)
    storage_url = Column(String)
    status = Column(Enum(VideoStatus), default=VideoStatus.UPLOADING)
    analysis_result = Column(Text)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    session = relationship("TrainingSession", back_populates="videos")
