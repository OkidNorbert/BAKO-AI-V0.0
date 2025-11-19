"""
Pydantic schemas for Basketball AI API
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class ActionProbabilities(BaseModel):
    """Action classification probabilities"""
    shooting: float = Field(ge=0.0, le=1.0)
    dribbling: float = Field(ge=0.0, le=1.0)
    passing: float = Field(ge=0.0, le=1.0)
    defense: float = Field(ge=0.0, le=1.0)
    running: float = Field(ge=0.0, le=1.0)
    walking: float = Field(ge=0.0, le=1.0)
    blocking: float = Field(ge=0.0, le=1.0)
    picking: float = Field(ge=0.0, le=1.0)
    ball_in_hand: float = Field(ge=0.0, le=1.0)
    idle: float = Field(ge=0.0, le=1.0)


class ActionClassification(BaseModel):
    """Action classification result"""
    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: ActionProbabilities


class PerformanceMetrics(BaseModel):
    """Performance metrics calculated from pose and video analysis"""
    jump_height: float = Field(description="Jump height in meters")
    movement_speed: float = Field(description="Movement speed in m/s")
    form_score: float = Field(ge=0.0, le=1.0, description="Overall form score")
    reaction_time: float = Field(description="Reaction time in seconds")
    pose_stability: float = Field(ge=0.0, le=1.0, description="Pose stability score")
    energy_efficiency: float = Field(ge=0.0, le=1.0, description="Energy efficiency score")


class Recommendation(BaseModel):
    """AI-generated recommendation"""
    type: str = Field(description="Type: excellent, improvement, focus, warning")
    title: str
    message: str
    priority: str = Field(description="Priority: low, medium, high")


class VideoAnalysisResult(BaseModel):
    """Complete video analysis result"""
    video_id: str
    action: ActionClassification
    metrics: PerformanceMetrics
    recommendations: List[Recommendation]
    keypoints: Optional[List] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class AnalysisStatus(BaseModel):
    """Analysis status response"""
    video_id: str
    status: str = Field(description="Status: pending, processing, complete, failed")
    progress: int = Field(ge=0, le=100, description="Processing progress percentage")
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    models_loaded: bool
    gpu_available: bool

