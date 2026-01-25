"""
Pydantic models for video-related schemas.
"""
from enum import Enum
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class VideoStatus(str, Enum):
    """Video processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalysisMode(str, Enum):
    """Analysis mode for video processing."""
    TEAM = "team"
    PERSONAL = "personal"


class VideoUpload(BaseModel):
    """Request schema for video upload metadata."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    analysis_mode: AnalysisMode
    organization_id: Optional[UUID] = Field(None, description="Required for TEAM analysis")


class VideoBase(BaseModel):
    """Base video fields."""
    title: Optional[str] = None
    description: Optional[str] = None
    analysis_mode: AnalysisMode
    status: VideoStatus = VideoStatus.PENDING


class Video(VideoBase):
    """Complete video model returned from API."""
    id: UUID
    uploader_id: UUID
    # Do not expose local filesystem paths to clients
    download_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    frame_count: Optional[int] = None
    fps: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size_bytes: Optional[int] = None
    organization_id: Optional[UUID] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class VideoStatusResponse(BaseModel):
    """Response schema for video processing status."""
    id: UUID
    status: VideoStatus
    progress_percent: Optional[float] = Field(None, ge=0, le=100)
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    estimated_completion: Optional[datetime] = None


class VideoListResponse(BaseModel):
    """Response schema for listing videos."""
    videos: List[Video]
    total: int
    page: int
    page_size: int
