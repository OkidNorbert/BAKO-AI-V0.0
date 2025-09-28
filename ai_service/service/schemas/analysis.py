"""
Video analysis schemas.
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class AnalysisRequest(BaseModel):
    """Video analysis request schema."""
    video_url: str
    session_id: int
    video_id: int
    fps: Optional[int] = 10


class KeypointData(BaseModel):
    """Keypoint data schema."""
    time: float
    players: List[Dict[str, Any]]


class DetectionData(BaseModel):
    """Object detection data schema."""
    time: float
    objects: List[Dict[str, Any]]


class EventData(BaseModel):
    """Basketball event data schema."""
    time: float
    type: str
    confidence: float
    meta: Dict[str, Any]


class AnalysisResponse(BaseModel):
    """Video analysis response schema."""
    video_id: int
    session_id: int
    keypoints: List[KeypointData]
    detections: List[DetectionData]
    events: List[EventData]
    status: str
