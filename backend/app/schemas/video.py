"""
Video-related Pydantic schemas.
"""

from typing import Optional
from pydantic import BaseModel, Field, validator
from app.models.video import VideoStatus

class VideoUploadRequest(BaseModel):
    """Request schema for video upload metadata."""
    session_id: int = Field(..., description="Training session ID")
    filename: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes", gt=0)
    
    @validator('filename')
    def validate_filename(cls, v):
        """Validate filename extension."""
        allowed_extensions = ['mp4', 'mov', 'avi', 'mkv', 'webm']
        if not any(v.lower().endswith(f'.{ext}') for ext in allowed_extensions):
            raise ValueError('File must be a video file (mp4, mov, avi, mkv, webm)')
        return v
    
    @validator('size')
    def validate_size(cls, v):
        """Validate file size (max 500MB)."""
        max_size = 500 * 1024 * 1024  # 500MB
        if v > max_size:
            raise ValueError('File size must be less than 500MB')
        return v

class VideoUploadResponse(BaseModel):
    """Response schema for video upload metadata."""
    video_id: int = Field(..., description="Video ID in database")
    upload_url: str = Field(..., description="Presigned upload URL")
    object_name: str = Field(..., description="Object name in storage")
    expires_in: int = Field(..., description="URL expiration time in seconds")

class VideoConfirmRequest(BaseModel):
    """Request schema for confirming video upload."""
    video_id: int = Field(..., description="Video ID")

class VideoStatusResponse(BaseModel):
    """Response schema for video status."""
    video_id: int
    status: str
    filename: str
    file_size: Optional[int] = None
    created_at: Optional[str] = None
    analysis_result: Optional[str] = None

class VideoDownloadResponse(BaseModel):
    """Response schema for video download URL."""
    video_id: int
    download_url: str
    expires_in: int