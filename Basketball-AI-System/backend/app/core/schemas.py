"""
Pydantic schemas for Basketball AI API
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class ActionProbabilities(BaseModel):
    """Action classification probabilities - Enhanced with specific shooting types"""
    # Shooting types (based on court position)
    free_throw: float = Field(ge=0.0, le=1.0, description="Free throw shot")
    two_point_shot: float = Field(ge=0.0, le=1.0, description="2-point shot")
    three_point_shot: float = Field(ge=0.0, le=1.0, description="3-point shot")
    layup: float = Field(ge=0.0, le=1.0, description="Layup")
    dunk: float = Field(ge=0.0, le=1.0, description="Dunk")
    
    # Ball handling
    dribbling: float = Field(ge=0.0, le=1.0, description="Dribbling")
    passing: float = Field(ge=0.0, le=1.0, description="Passing")
    
    # Movement
    defense: float = Field(ge=0.0, le=1.0, description="Defense")
    running: float = Field(ge=0.0, le=1.0, description="Running")
    walking: float = Field(ge=0.0, le=1.0, description="Walking")
    
    # Game actions
    blocking: float = Field(ge=0.0, le=1.0, description="Blocking")
    picking: float = Field(ge=0.0, le=1.0, description="Setting pick/screen")
    
    # Other
    ball_in_hand: float = Field(ge=0.0, le=1.0, description="Holding ball")
    idle: float = Field(ge=0.0, le=1.0, description="Idle/No action")


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


class ShotOutcome(BaseModel):
    """Shot outcome detection (made/missed)"""
    outcome: str = Field(description="Outcome: made, missed, unknown, not_applicable")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in outcome")
    method: str = Field(description="Detection method: ball_trajectory, form_based_prediction, player_reaction, form_and_reaction")
    make_probability: float = Field(ge=0.0, le=1.0, description="Statistical probability of make")


class VideoAnalysisResult(BaseModel):
    """Complete video analysis result"""
    video_id: str
    action: ActionClassification
    metrics: PerformanceMetrics
    recommendations: List[Recommendation]
    shot_outcome: Optional[ShotOutcome] = Field(default=None, description="Shot outcome (only for shooting actions)")
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

