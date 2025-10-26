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


class PerformanceMetrics(BaseModel):
    """Performance metrics schema."""
    total_movement: Optional[float] = None
    shot_attempts: Optional[int] = None
    jumps: Optional[int] = None
    sprints: Optional[int] = None
    average_event_confidence: Optional[float] = None
    pose_stability: Optional[float] = None
    activity_intensity: Optional[float] = None


class AnalysisMetadata(BaseModel):
    """Analysis metadata schema."""
    total_frames: int
    processed_frames: int
    video_duration: float
    analysis_fps: int
    processing_time: float


class AnalysisResponse(BaseModel):
    """Video analysis response schema."""
    video_id: int
    session_id: int
    keypoints: List[KeypointData]
    detections: List[DetectionData]
    events: List[EventData]
    performance_metrics: Optional[PerformanceMetrics] = None
    metadata: Optional[AnalysisMetadata] = None
    status: str
