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
    
    # Enhanced biomechanics features (optional)
    elbow_angle: Optional[float] = Field(default=None, description="Elbow angle in degrees")
    release_angle: Optional[float] = Field(default=None, description="Release angle in degrees")
    knee_angle: Optional[float] = Field(default=None, description="Knee angle in degrees")
    shoulder_angle: Optional[float] = Field(default=None, description="Shoulder angle in degrees")
    stability_score: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Balance/stability score")
    com_variance: Optional[float] = Field(default=None, description="Center of mass variance (total)")
    com_variance_x: Optional[float] = Field(default=None, description="Center of mass variance (X-axis)")
    com_variance_y: Optional[float] = Field(default=None, description="Center of mass variance (Y-axis)")
    smoothness_score: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Movement smoothness score")
    follow_through_score: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Follow-through score")
    angular_velocity: Optional[float] = Field(default=None, description="Wrist angular velocity (rad/s)")
    dribble_height: Optional[float] = Field(default=None, description="Dribble height (normalized)")
    dribble_frequency: Optional[float] = Field(default=None, description="Dribble frequency in Hz")
    consistency: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Movement consistency score")
    release_frame: Optional[int] = Field(default=None, description="Frame index where release occurred")
    peak_frame: Optional[int] = Field(default=None, description="Frame index where jump peak occurred")
    baseline_height: Optional[float] = Field(default=None, description="Baseline hip height for jump calculation")
    displacement_pixels: Optional[float] = Field(default=None, description="Jump displacement in pixels")


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


class FormQualityIssue(BaseModel):
    """Specific form quality issue detected"""
    issue_type: str = Field(description="Type: elbow_angle, release_point, body_alignment, knee_bend, follow_through, body_posture, ball_control, head_position, arm_extension, wrist_snap, body_rotation")
    severity: str = Field(description="Severity: minor, moderate, major")
    description: str = Field(description="Human-readable description of the issue")
    current_value: Optional[float] = Field(default=None, description="Current measured value")
    optimal_value: Optional[str] = Field(default=None, description="Optimal value or range")
    recommendation: str = Field(description="Specific drill or correction advice")


class FormQualityAssessment(BaseModel):
    """Form quality assessment for an action"""
    overall_score: float = Field(ge=0.0, le=1.0, description="Overall form quality score")
    quality_rating: str = Field(description="Rating: excellent, good, needs_improvement, poor")
    issues: List[FormQualityIssue] = Field(default_factory=list, description="List of detected issues")
    strengths: List[str] = Field(default_factory=list, description="List of strengths/what they're doing well")


class TimelineSegment(BaseModel):
    """Analysis result for a specific time segment"""
    start_time: float = Field(description="Start time in seconds")
    end_time: float = Field(description="End time in seconds")
    action: ActionClassification
    metrics: PerformanceMetrics
    form_quality: Optional[FormQualityAssessment] = Field(default=None, description="Form quality assessment for this segment")
    shot_outcome: Optional[ShotOutcome] = None



class VideoAnalysisResult(BaseModel):
    """Complete video analysis result"""
    video_id: str
    action: ActionClassification
    metrics: PerformanceMetrics
    recommendations: List[Recommendation]
    shot_outcome: Optional[ShotOutcome] = Field(default=None, description="Shot outcome (only for shooting actions)")
    timeline: Optional[List[TimelineSegment]] = Field(default=None, description="Timeline of actions for long videos")
    annotated_video_url: Optional[str] = None
    annotated_frame: Optional[str] = None  # Base64 string for live analysis
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

