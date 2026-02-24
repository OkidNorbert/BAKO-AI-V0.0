"""
Advanced Analytics API endpoints.

Provides access to advanced basketball analytics including spacing, defensive reactions,
transition effort, decision quality, lineup impact, fatigue tracking, and auto-generated clips.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.dependencies import get_current_user, get_supabase
from app.models.advanced_analytics import (
    TeamAdvancedSummary,
    PlayerAdvancedAnalysis,
    LineupComparison,
    ClipCatalog,
    SpacingSummary,
    DefensiveReactionSummary,
    TransitionEffortSummary,
    DecisionQualitySummary,
    LineupImpactSummary,
    FatigueSummary,
    ClipSummary,
    LineupMetric,
    AutoClip,
    DefensiveReaction,
    TransitionEffort,
    DecisionAnalysis,
    FatigueIndex,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()


@router.get("/team-summary/{video_id}", response_model=TeamAdvancedSummary)
async def get_team_advanced_summary(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get aggregated advanced analytics summary for a team game.
    
    Returns high-level statistics from all 7 analytics modules.
    """
    # Verify video access
    video = await supabase.select_one("videos", video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Get analysis results
    analysis_results = await supabase.select(
        "analysis_results",
        filters={"video_id": video_id},
        order_by="created_at",
        ascending=False,
        limit=1
    )
    
    if not analysis_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis results found for this video"
        )
    
    analysis = analysis_results[0]
    advanced_analytics = analysis.get("advanced_analytics")
    
    if not advanced_analytics:
        return TeamAdvancedSummary(
            video_id=UUID(video_id),
            spacing_summary=None,
            defensive_summary=None,
            transition_summary=None,
            decision_summary=None,
            lineup_summary=None,
            fatigue_summary=None,
            clip_summary=None,
            modules_executed=[],
            modules_failed=[]
        )
    
    # Extract summaries from each module
    spacing_summary = None
    if "spacing" in advanced_analytics and advanced_analytics["spacing"].get("status") == "success":
        spacing_summary = SpacingSummary(**advanced_analytics["spacing"]["summary"])
    
    defensive_summary = None
    if "defensive_reactions" in advanced_analytics and advanced_analytics["defensive_reactions"].get("status") == "success":
        defensive_summary = DefensiveReactionSummary(**advanced_analytics["defensive_reactions"]["summary"])
    
    transition_summary = None
    if "transition_effort" in advanced_analytics and advanced_analytics["transition_effort"].get("status") == "success":
        transition_summary = TransitionEffortSummary(**advanced_analytics["transition_effort"]["summary"])
    
    decision_summary = None
    if "decision_quality" in advanced_analytics and advanced_analytics["decision_quality"].get("status") == "success":
        decision_summary = DecisionQualitySummary(**advanced_analytics["decision_quality"]["summary"])
    
    lineup_summary = None
    if "lineup_impact" in advanced_analytics and advanced_analytics["lineup_impact"].get("status") == "success":
        lineup_summary = LineupImpactSummary(**advanced_analytics["lineup_impact"]["summary"])
    
    fatigue_summary = None
    if "fatigue" in advanced_analytics and advanced_analytics["fatigue"].get("status") == "success":
        fatigue_summary = FatigueSummary(**advanced_analytics["fatigue"]["summary"])
    
    clip_summary = None
    if "clips" in advanced_analytics and advanced_analytics["clips"].get("status") == "success":
        clip_summary = ClipSummary(**advanced_analytics["clips"]["summary"])
    
    return TeamAdvancedSummary(
        video_id=UUID(video_id),
        spacing_summary=spacing_summary,
        defensive_summary=defensive_summary,
        transition_summary=transition_summary,
        decision_summary=decision_summary,
        lineup_summary=lineup_summary,
        fatigue_summary=fatigue_summary,
        clip_summary=clip_summary,
        modules_executed=advanced_analytics.get("modules_executed", []),
        modules_failed=advanced_analytics.get("modules_failed", [])
    )


@router.get("/player/{video_id}/{player_track_id}", response_model=PlayerAdvancedAnalysis)
async def get_player_advanced_analysis(
    video_id: str,
    player_track_id: int,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get advanced analytics for a specific player in a game.
    
    Returns player-specific metrics from all applicable modules.
    """
    # Verify video access
    video = await supabase.select_one("videos", video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Get analysis results
    analysis_results = await supabase.select(
        "analysis_results",
        filters={"video_id": video_id},
        order_by="created_at",
        ascending=False,
        limit=1
    )
    
    if not analysis_results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No analysis results found")
    
    analysis = analysis_results[0]
    advanced_analytics = analysis.get("advanced_analytics")
    
    if not advanced_analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advanced analytics not available"
        )
    
    # Filter data for this specific player
    player_defensive_reactions = []
    if "defensive_reactions" in advanced_analytics:
        all_reactions = advanced_analytics["defensive_reactions"].get("defensive_reactions", [])
        player_defensive_reactions = [
            DefensiveReaction(**r) for r in all_reactions
            if r.get("defender_track_id") == player_track_id
        ]
    
    player_transition_efforts = []
    if "transition_effort" in advanced_analytics:
        all_efforts = advanced_analytics["transition_effort"].get("transition_efforts", [])
        player_transition_efforts = [
            TransitionEffort(**e) for e in all_efforts
            if e.get("player_track_id") == player_track_id
        ]
    
    player_decision_analyses = []
    if "decision_quality" in advanced_analytics:
        all_decisions = advanced_analytics["decision_quality"].get("decision_analyses", [])
        player_decision_analyses = [
            DecisionAnalysis(**d) for d in all_decisions
            if d.get("shooter_track_id") == player_track_id
        ]
    
    player_fatigue_indices = []
    if "fatigue" in advanced_analytics:
        all_fatigue = advanced_analytics["fatigue"].get("fatigue_indices", [])
        player_fatigue_indices = [
            FatigueIndex(**f) for f in all_fatigue
            if f.get("player_track_id") == player_track_id
        ]
    
    # Calculate player-specific aggregates
    spacing_involvement = 0
    if "spacing" in advanced_analytics:
        all_spacing = advanced_analytics["spacing"].get("spacing_metrics", [])
        for metric in all_spacing:
            player_positions = metric.get("player_positions", {})
            if str(player_track_id) in player_positions:
                spacing_involvement += 1
    
    avg_effort_score = 0.0
    if player_transition_efforts:
        avg_effort_score = sum(e.effort_score for e in player_transition_efforts) / len(player_transition_efforts)
    
    avg_reaction_delay_ms = None
    if player_defensive_reactions:
        valid_delays = [r.reaction_delay_ms for r in player_defensive_reactions if r.reaction_delay_ms is not None]
        if valid_delays:
            avg_reaction_delay_ms = sum(valid_delays) / len(valid_delays)
    
    fatigue_level = "low"
    if player_fatigue_indices:
        latest_fatigue = player_fatigue_indices[-1]
        fatigue_level = latest_fatigue.fatigue_level
    
    return PlayerAdvancedAnalysis(
        player_track_id=player_track_id,
        video_id=UUID(video_id),
        spacing_involvement=spacing_involvement,
        defensive_reactions=player_defensive_reactions,
        transition_efforts=player_transition_efforts,
        decision_analyses=player_decision_analyses,
        fatigue_indices=player_fatigue_indices,
        avg_effort_score=avg_effort_score,
        avg_reaction_delay_ms=avg_reaction_delay_ms,
        fatigue_level=fatigue_level
    )


@router.get("/lineups/{video_id}", response_model=LineupComparison)
async def get_lineup_comparison(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get lineup performance comparison for a game.
    
    Returns metrics for all 5-player combinations from both teams.
    """
    # Verify video access
    video = await supabase.select_one("videos", video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Get analysis results
    analysis_results = await supabase.select(
        "analysis_results",
        filters={"video_id": video_id},
        order_by="created_at",
        ascending=False,
        limit=1
    )
    
    if not analysis_results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No analysis results found")
    
    analysis = analysis_results[0]
    advanced_analytics = analysis.get("advanced_analytics")
    
    if not advanced_analytics or "lineup_impact" not in advanced_analytics:
        return LineupComparison(
            video_id=UUID(video_id),
            team_1_lineups=[],
            team_2_lineups=[],
            best_overall_lineup=None,
            worst_overall_lineup=None
        )
    
    lineup_data = advanced_analytics["lineup_impact"]
    all_lineups = lineup_data.get("lineup_metrics", [])
    
    team_1_lineups = [LineupMetric(**l) for l in all_lineups if l.get("team_id") == 1]
    team_2_lineups = [LineupMetric(**l) for l in all_lineups if l.get("team_id") == 2]
    
    if not all_lineups:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No lineup data available"
        )
    
    # Find best and worst lineups
    best_lineup = max(all_lineups, key=lambda x: x.get("net_rating", 0))
    worst_lineup = min(all_lineups, key=lambda x: x.get("net_rating", 0))
    
    return LineupComparison(
        video_id=UUID(video_id),
        team_1_lineups=team_1_lineups,
        team_2_lineups=team_2_lineups,
        best_overall_lineup=LineupMetric(**best_lineup),
        worst_overall_lineup=LineupMetric(**worst_lineup)
    )


@router.get("/clips/{video_id}", response_model=ClipCatalog)
async def get_coaching_clips(
    video_id: str,
    clip_type: str = None,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get automatically generated coaching clips for a game.
    
    Optionally filter by clip type (poor_spacing, late_rotation, etc.).
    """
    # Verify video access
    video = await supabase.select_one("videos", video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Get analysis results
    analysis_results = await supabase.select(
        "analysis_results",
        filters={"video_id": video_id},
        order_by="created_at",
        ascending=False,
        limit=1
    )
    
    if not analysis_results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No analysis results found")
    
    analysis = analysis_results[0]
    advanced_analytics = analysis.get("advanced_analytics")
    
    if not advanced_analytics or "clips" not in advanced_analytics:
        return ClipCatalog(
            video_id=UUID(video_id),
            clips=[],
            summary=ClipSummary(
                total_clips=0,
                breakdown={}
            )
        )
    
    clip_data = advanced_analytics["clips"]
    all_clips = clip_data.get("auto_clips", [])
    
    # Filter by clip type if specified
    if clip_type:
        all_clips = [c for c in all_clips if c.get("clip_type") == clip_type]
    
    clips = [AutoClip(**c) for c in all_clips]
    summary = ClipSummary(**clip_data.get("summary", {}))
    
    return ClipCatalog(
        video_id=UUID(video_id),
        clips=clips,
        summary=summary
    )
