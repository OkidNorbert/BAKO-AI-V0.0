"""
Analytics and recommendation schemas.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class PerformanceMetricsResponse(BaseModel):
    """Performance metrics response schema."""
    player_id: int
    date_range: str
    total_sessions: int
    total_training_time: float  # hours
    
    # Shooting metrics
    shot_attempts: int
    shot_accuracy: float
    three_point_accuracy: float
    free_throw_accuracy: float
    
    # Physical metrics
    avg_heart_rate: float
    max_heart_rate: float
    avg_jump_height: float
    max_jump_height: float
    avg_sprint_speed: float
    total_distance: float
    
    # Workload metrics
    total_calories_burned: float
    avg_workload: float
    recovery_time: float
    
    # Analysis results
    weaknesses: List[str]
    improvement_areas: List[str]


class TrainingRecommendationResponse(BaseModel):
    """Training recommendation response schema."""
    title: str
    description: str
    category: str  # shooting, conditioning, strength, skill
    priority: int  # 1-5 (5 = highest)
    duration: str  # "15 min", "30 min", "1 hour"
    frequency: str  # "daily", "3x/week", "weekly"
    exercises: List[str]
    expected_improvement: str
    rationale: str


class AnalyticsRequest(BaseModel):
    """Analytics request schema."""
    player_id: int
    days: int = Field(30, ge=1, le=365, description="Number of days to analyze")


class WeaknessAnalysisResponse(BaseModel):
    """Weakness analysis response schema."""
    player_id: int
    analysis_date: str
    weaknesses: List[str]
    improvement_areas: List[str]
    recommendations: int
    priority_weakness: Optional[str]
    overall_score: float
    insights: List[str]


class BenchmarkComparison(BaseModel):
    """Benchmark comparison schema."""
    metric_name: str
    player_value: float
    benchmark_value: float
    rating: str  # excellent, good, average, needs_improvement
    percentile: Optional[float]


class PerformanceComparison(BaseModel):
    """Performance comparison response schema."""
    player_id: int
    comparison_date: str
    benchmarks: Dict[str, BenchmarkComparison]
    overall_rating: str
    recommendations: List[str]


class TrainingPlanRequest(BaseModel):
    """Training plan request schema."""
    player_id: int
    focus_areas: List[str]  # shooting, conditioning, strength, skill
    duration_weeks: int = Field(4, ge=1, le=12)
    sessions_per_week: int = Field(3, ge=1, le=7)
    session_duration: int = Field(60, ge=15, le=180)  # minutes


class TrainingPlanResponse(BaseModel):
    """Training plan response schema."""
    player_id: int
    plan_name: str
    duration_weeks: int
    total_sessions: int
    weekly_schedule: Dict[str, List[Dict[str, Any]]]  # day -> sessions
    focus_areas: List[str]
    expected_improvements: List[str]
    created_at: str


class ProgressTrackingRequest(BaseModel):
    """Progress tracking request schema."""
    player_id: int
    metric_name: str
    current_value: float
    target_value: float
    timeframe: str  # "1 week", "1 month", "3 months"


class ProgressTrackingResponse(BaseModel):
    """Progress tracking response schema."""
    player_id: int
    metric_name: str
    current_value: float
    target_value: float
    progress_percentage: float
    days_remaining: int
    on_track: bool
    recommendations: List[str]


class TeamAnalyticsRequest(BaseModel):
    """Team analytics request schema."""
    team_id: int
    days: int = Field(30, ge=1, le=365)
    include_comparisons: bool = True


class TeamAnalyticsResponse(BaseModel):
    """Team analytics response schema."""
    team_id: int
    analysis_date: str
    total_players: int
    team_averages: Dict[str, float]
    top_performers: Dict[str, List[int]]  # metric -> player_ids
    improvement_areas: List[str]
    team_recommendations: List[str]
    individual_insights: Dict[int, List[str]]  # player_id -> insights
