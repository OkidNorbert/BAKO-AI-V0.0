"""
Video schemas.
"""

from pydantic import BaseModel
from typing import Optional


class VideoUploadRequest(BaseModel):
    """Video upload request schema."""
    session_id: int
    filename: str
    size: int


class VideoUploadResponse(BaseModel):
    """Video upload response schema."""
    video_id: int
    upload_url: str
    expires_in: int
