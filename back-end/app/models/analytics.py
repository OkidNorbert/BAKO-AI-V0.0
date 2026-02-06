"""
Pydantic models for analytics and metrics schemas.
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class MetricType(BaseModel):
    """Type definition for a metric."""
    name: str
    unit: str
    description: Optional[str] = None


class PlayerMetric(BaseModel):
    """Single metric value for a player."""
    player_id: UUID
    metric_type: str
    value: float
    timestamp: datetime
    video_id: Optional[UUID] = None
    session_id: Optional[UUID] = None


class PlayerAnalyticsSummary(BaseModel):
    """Aggregated analytics summary for a player."""
    player_id: UUID
    period_start: date
    period_end: date
    
    # Performance metrics
    total_training_sessions: int = 0
    total_training_minutes: float = 0.0
    total_videos_analyzed: int = 0
    
    # Movement stats
    total_distance_km: Optional[float] = None
    avg_speed_kmh: Optional[float] = None
    max_speed_kmh: Optional[float] = None
    
    # Skill stats
    total_shot_attempts: int = 0
    total_shots_made: int = 0
    total_shots_missed: int = 0
    shot_success_rate: Optional[float] = Field(None, description="Shot success percentage (0-100)")
    avg_shot_form_consistency: Optional[float] = None
    total_dribbles: int = 0

    
    # Progress indicators
    speed_trend: Optional[str] = Field(None, description="'improving', 'stable', 'declining'")
    form_trend: Optional[str] = None
    
    class Config:
        from_attributes = True


class TeamAnalyticsSummary(BaseModel):
    """Aggregated analytics summary for a team."""
    organization_id: UUID
    period_start: date
    period_end: date
    
    # Team stats
    total_games_analyzed: int = 0
    total_training_sessions: int = 0
    
    # Possession
    avg_possession_percent: Optional[float] = None
    
    # Passing
    total_passes: int = 0
    avg_passes_per_game: Optional[float] = None
    pass_success_rate: Optional[float] = None
    
    # Shooting
    total_shot_attempts: int = 0
    total_shots_made: int = 0
    team_shooting_percentage: Optional[float] = None
    
    # Defense
    total_interceptions: int = 0
    avg_interceptions_per_game: Optional[float] = None

    
    class Config:
        from_attributes = True


class SkillSummary(BaseModel):
    """Personal skill summary for dashboard display."""
    player_id: UUID
    last_updated: datetime
    
    # Overall scores (0-100)
    overall_score: float = Field(..., ge=0, le=100)
    shooting_score: float = Field(..., ge=0, le=100)
    dribbling_score: float = Field(..., ge=0, le=100)
    movement_score: float = Field(..., ge=0, le=100)
    consistency_score: float = Field(..., ge=0, le=100)
    
    # Recent session summary
    last_session_date: Optional[date] = None
    last_session_duration_minutes: Optional[float] = None
    
    # Improvement areas
    strengths: List[str] = Field(default_factory=list)
    areas_to_improve: List[str] = Field(default_factory=list)
    
    # Recommendations
    recommendations: List[str] = Field(default_factory=list)


class ProgressData(BaseModel):
    """Progress tracking data point."""
    date: date
    value: float
    metric_type: str


class ProgressReport(BaseModel):
    """Progress report over time."""
    player_id: UUID
    metric_type: str
    period_start: date
    period_end: date
    data_points: List[ProgressData]
    trend: str = Field(..., description="'improving', 'stable', 'declining'")
    percent_change: Optional[float] = None
