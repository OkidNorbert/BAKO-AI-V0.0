"""
Pydantic models for analysis and detection schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class Detection(BaseModel):
    """Single object detection in a frame."""
    video_id: UUID
    frame: int = Field(..., ge=0)
    object_type: str = Field(..., description="'player' or 'ball'")
    track_id: int
    bbox: List[float] = Field(..., min_length=4, max_length=4, description="[x1, y1, x2, y2]")
    confidence: float = Field(..., ge=0, le=1)
    keypoints: Optional[List[List[float]]] = Field(None, description="Pose keypoints for players")
    team_id: Optional[int] = None
    has_ball: bool = False


class DetectionBatch(BaseModel):
    """Batch of detections for efficient storage."""
    video_id: UUID
    frame_start: int
    frame_end: int
    detections: List[Detection]


class AnalysisRequest(BaseModel):
    """Request schema for triggering analysis."""
    video_id: UUID
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AnalysisEvent(BaseModel):
    """Detected event during analysis (pass, shot, etc.)."""
    event_type: str
    frame: int
    timestamp_seconds: float
    player_id: Optional[int] = None
    team_id: Optional[int] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class AnalysisResult(BaseModel):
    """Complete analysis results for a video."""
    id: UUID
    video_id: UUID
    total_frames: int
    duration_seconds: float
    players_detected: int
    
    # Team analysis specific
    team_1_possession_percent: Optional[float] = None
    team_2_possession_percent: Optional[float] = None
    total_passes: Optional[int] = None
    total_interceptions: Optional[int] = None
    
    # Shot analysis
    shot_attempts: Optional[int] = 0
    shots_made: Optional[int] = 0
    shots_missed: Optional[int] = 0
    shooting_percentage: Optional[float] = None
    
    # Team shooting
    team_1_shot_attempts: Optional[int] = 0
    team_1_shots_made: Optional[int] = 0
    team_2_shot_attempts: Optional[int] = 0
    team_2_shots_made: Optional[int] = 0
    
    # Events
    events: List[AnalysisEvent] = Field(default_factory=list)
    
    # Processing info
    processing_time_seconds: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class PersonalAnalysisResult(BaseModel):
    """Personal analysis results with skill metrics."""
    id: UUID
    video_id: UUID
    player_id: Optional[UUID] = None
    total_frames: int
    duration_seconds: float
    
    # Skill metrics
    shot_attempts: int = 0
    shot_form_consistency: Optional[float] = Field(None, ge=0, le=100, description="Form consistency percentage")
    dribble_count: int = 0
    dribble_frequency_per_minute: Optional[float] = None
    
    # Movement metrics
    total_distance_meters: Optional[float] = None
    avg_speed_kmh: Optional[float] = None
    max_speed_kmh: Optional[float] = None
    acceleration_events: int = 0
    
    # Pose analysis
    avg_knee_bend_angle: Optional[float] = None
    avg_elbow_angle_shooting: Optional[float] = None
    
    # Training load
    training_load_score: Optional[float] = Field(None, ge=0, le=100)
    
    # Processing info
    processing_time_seconds: float
    created_at: datetime
    
    class Config:
        from_attributes = True
