"""
Pydantic models for advanced analytics data structures.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


# ============================================
# SPACING METRICS
# ============================================

class SpacingMetric(BaseModel):
    """Single spacing quality measurement."""
    frame: int
    timestamp: float
    spacing_quality: str = Field(..., description="'good', 'average', or 'poor'")
    avg_distance_m: float
    paint_players: int
    overlap_count: int
    offense_team: int


class SpacingSummary(BaseModel):
    """Aggregated spacing statistics."""
    total_frames_analyzed: int
    good_spacing_pct: float
    average_spacing_pct: float
    poor_spacing_pct: float
    avg_distance_overall: float


# ============================================
# DEFENSIVE REACTIONS
# ============================================

class DefensiveReaction(BaseModel):
    """Single defensive reaction measurement."""
    event_id: str
    event_type: str
    event_frame: int
    defender_track_id: int
    offensive_player_track_id: int
    distance_at_event: float
    reaction_start_frame: Optional[int] = None
    reaction_delay_ms: Optional[float] = None
    closeout_speed_mps: Optional[float] = None
    late_closeout: bool


class DefensiveReactionSummary(BaseModel):
    """Aggregated defensive reaction statistics."""
    total_defensive_events: int
    late_closeouts: int
    late_closeout_rate: float
    avg_reaction_delay_ms: Optional[float] = None
    avg_closeout_speed_mps: Optional[float] = None


# ============================================
# TRANSITION EFFORT
# ============================================

class TransitionEffort(BaseModel):
    """Transition effort measurement for a player."""
    possession_change_frame: int
    player_track_id: int
    team_id: int
    transition_type: str = Field(..., description="'offense_to_defense' or 'defense_to_offense'")
    effort_type: str = Field(..., description="'sprint', 'jog', or 'walk'")
    max_speed_mps: float
    avg_speed_mps: float
    effort_score: float
    duration_seconds: float


class TransitionEffortSummary(BaseModel):
    """Aggregated transition effort statistics."""
    total_transition_events: int
    sprint_count: int
    jog_count: int
    walk_count: int
    sprint_rate: float
    avg_effort_score: float
    avg_max_speed_mps: float


# ============================================
# DECISION QUALITY
# ============================================

class DecisionAnalysis(BaseModel):
    """Shot decision quality analysis."""
    event_id: str
    shot_frame: int
    shooter_track_id: int
    shooter_contested_distance: float
    open_teammates: int
    best_teammate_openness: Optional[float] = None
    decision_quality: str = Field(..., description="'high_expected_value', 'acceptable', or 'low_expected_value'")
    shot_outcome: str


class DecisionQualitySummary(BaseModel):
    """Aggregated decision quality statistics."""
    total_shots_analyzed: int
    high_ev_shots: int
    acceptable_shots: int
    low_ev_shots: int
    low_ev_rate: float
    avg_shooter_contested_distance: float


# ============================================
# LINEUP IMPACT
# ============================================

class LineupMetric(BaseModel):
    """Performance metrics for a specific lineup."""
    team_id: int
    lineup_hash: str
    player_track_ids: List[int]
    possessions_count: int
    points_scored: int
    points_allowed: int
    offensive_rating: float
    defensive_rating: float
    net_rating: float
    avg_spacing_score: float
    turnovers: int
    defensive_error_rate: float
    total_minutes: float


class LineupImpactSummary(BaseModel):
    """Aggregated lineup statistics."""
    total_lineups: int
    best_lineup_hash: Optional[str] = None
    best_lineup_net_rating: float
    worst_lineup_hash: Optional[str] = None
    worst_lineup_net_rating: float
    avg_net_rating: float


# ============================================
# FATIGUE INDEX
# ============================================

class FatigueIndex(BaseModel):
    """Fatigue measurement for a player in a time window."""
    player_track_id: int
    time_window_start: float
    time_window_end: float
    minute: int
    baseline_speed_mps: float
    current_speed_mps: float
    speed_drop_percentage: float
    baseline_reaction_ms: Optional[float] = None
    current_reaction_ms: Optional[float] = None
    reaction_delay_increase_percentage: Optional[float] = None
    fatigue_level: str = Field(..., description="'low', 'medium', or 'high'")


class FatigueSummary(BaseModel):
    """Aggregated fatigue statistics."""
    total_measurements: int
    high_fatigue_instances: int
    medium_fatigue_instances: int
    avg_speed_drop_pct: float
    max_speed_drop_pct: float


# ============================================
# AUTO CLIPS
# ============================================

class AutoClip(BaseModel):
    """Metadata for an automatically generated clip."""
    clip_type: str
    timestamp_start: float
    timestamp_end: float
    frame_start: int
    frame_end: int
    players_involved: List[int]
    file_path: str
    description: str
    metadata: Dict[str, Any]


class ClipSummary(BaseModel):
    """Aggregated clip generation statistics."""
    total_clips_generated: int
    clips_by_type: Dict[str, int]
    output_directory: str


# ============================================
# AGGREGATED RESPONSES
# ============================================

class TeamAdvancedSummary(BaseModel):
    """Complete advanced analytics summary for a team/game."""
    video_id: UUID
    spacing_summary: Optional[SpacingSummary] = None
    defensive_summary: Optional[DefensiveReactionSummary] = None
    transition_summary: Optional[TransitionEffortSummary] = None
    decision_summary: Optional[DecisionQualitySummary] = None
    lineup_summary: Optional[LineupImpactSummary] = None
    fatigue_summary: Optional[FatigueSummary] = None
    clip_summary: Optional[ClipSummary] = None
    modules_executed: List[str]
    modules_failed: List[str]


class PlayerAdvancedAnalysis(BaseModel):
    """Advanced analytics for a specific player."""
    player_track_id: int
    video_id: UUID
    spacing_involvement: int = Field(..., description="Number of frames player was in spacing analysis")
    defensive_reactions: List[DefensiveReaction]
    transition_efforts: List[TransitionEffort]
    decision_analyses: List[DecisionAnalysis]
    fatigue_indices: List[FatigueIndex]
    avg_effort_score: float
    avg_reaction_delay_ms: Optional[float] = None
    fatigue_level: str


class LineupComparison(BaseModel):
    """Comparison of all lineups in a game."""
    video_id: UUID
    team_1_lineups: List[LineupMetric]
    team_2_lineups: List[LineupMetric]
    best_overall_lineup: LineupMetric
    worst_overall_lineup: LineupMetric


class ClipCatalog(BaseModel):
    """Catalog of all generated clips."""
    video_id: UUID
    clips: List[AutoClip]
    summary: ClipSummary
