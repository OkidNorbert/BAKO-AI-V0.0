"""
Analytics and metrics API endpoints.
"""
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import (
    get_current_user,
    require_team_account,
    require_personal_account,
    get_supabase,
)
from app.models.user import AccountType
from app.models.analytics import (
    PlayerAnalyticsSummary,
    TeamAnalyticsSummary,
    SkillSummary,
    ProgressReport,
    ProgressData,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()

def _parse_ts(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        # Accept both "Z" and "+00:00" ISO formats
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


@router.get("/player/{player_id}", response_model=PlayerAnalyticsSummary)
async def get_player_analytics(
    player_id: str,
    period_days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get aggregated analytics for a player over a time period.
    """
    # Verify player access
    player = await supabase.select_one("players", player_id)
    
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    # Check access based on account type
    if current_user.get("account_type") == AccountType.TEAM.value:
        if player.get("organization_id"):
            org = await supabase.select_one("organizations", player["organization_id"])
            if not org or org["owner_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Access denied")
    else:
        if player.get("user_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Calculate period
    period_end = date.today()
    period_start = period_end - timedelta(days=period_days)
    period_start_dt = datetime.combine(period_start, datetime.min.time())
    period_end_dt = datetime.combine(period_end, datetime.max.time())
    
    # Get analytics data
    analytics = await supabase.select("analytics", filters={"player_id": player_id})
    # Filter by period when timestamps exist
    analytics = [
        a for a in analytics
        if (ts := _parse_ts(a.get("timestamp"))) is None or (period_start_dt <= ts <= period_end_dt)
    ]
    
    # Aggregate metrics
    total_distance = sum(a.get("value", 0) for a in analytics if a.get("metric_type") == "distance_km")
    speed_values = [a.get("value") for a in analytics if a.get("metric_type") == "avg_speed_kmh" and a.get("value")]
    max_speed_values = [a.get("value") for a in analytics if a.get("metric_type") == "max_speed_kmh" and a.get("value")]
    shot_attempts = sum(
        int(a.get("value", 0) or 0)
        for a in analytics
        if a.get("metric_type") == "shot_attempt"
    )
    form_scores = [a.get("value") for a in analytics if a.get("metric_type") == "form_consistency" and a.get("value")]
    dribbles = sum(a.get("value", 0) for a in analytics if a.get("metric_type") == "dribble_count")
    
    # Get unique video count
    video_ids = set(a.get("video_id") for a in analytics if a.get("video_id"))
    
    # Calculate training time from videos
    training_minutes = 0.0
    if video_ids:
        # Best-effort batch fetch if supported
        try:
            vids = await supabase.select_in("videos", "id", list(video_ids), columns="id,duration_seconds")
            for v in vids:
                if v and v.get("duration_seconds"):
                    training_minutes += float(v["duration_seconds"]) / 60
        except Exception:
            for vid in video_ids:
                video = await supabase.select_one("videos", vid)
                if video and video.get("duration_seconds"):
                    training_minutes += float(video["duration_seconds"]) / 60
    
    return PlayerAnalyticsSummary(
        player_id=player_id,
        period_start=period_start,
        period_end=period_end,
        total_training_sessions=len(video_ids),
        total_training_minutes=training_minutes,
        total_videos_analyzed=len(video_ids),
        total_distance_km=total_distance if total_distance > 0 else None,
        avg_speed_kmh=sum(speed_values) / len(speed_values) if speed_values else None,
        max_speed_kmh=max(max_speed_values) if max_speed_values else None,
        total_shot_attempts=shot_attempts,
        avg_shot_form_consistency=sum(form_scores) / len(form_scores) if form_scores else None,
        total_dribbles=int(dribbles),
    )


@router.get("/team/{org_id}", response_model=TeamAnalyticsSummary)
async def get_team_analytics(
    org_id: str,
    period_days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get aggregated team analytics over a time period.
    
    **Requires TEAM account.**
    """
    # Verify org access
    org = await supabase.select_one("organizations", org_id)
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if org["owner_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    period_end = date.today()
    period_start = period_end - timedelta(days=period_days)
    period_start_dt = datetime.combine(period_start, datetime.min.time())
    period_end_dt = datetime.combine(period_end, datetime.max.time())
    
    # Get team videos
    videos = await supabase.select("videos", filters={"organization_id": org_id})
    completed_videos = [v for v in videos if v.get("status") == "completed"]
    
    # Get analytics for team players
    players = await supabase.select("players", filters={"organization_id": org_id})
    player_ids = [p["id"] for p in players]
    
    all_analytics = []
    for pid in player_ids:
        analytics = await supabase.select("analytics", filters={"player_id": pid})
        # Filter by period when timestamps exist
        analytics = [
            a for a in analytics
            if (ts := _parse_ts(a.get("timestamp"))) is None or (period_start_dt <= ts <= period_end_dt)
        ]
        all_analytics.extend(analytics)
    
    # Aggregate team metrics
    total_passes = sum(1 for a in all_analytics if a.get("metric_type") == "pass")
    total_interceptions = sum(1 for a in all_analytics if a.get("metric_type") == "interception")
    
    return TeamAnalyticsSummary(
        organization_id=org_id,
        period_start=period_start,
        period_end=period_end,
        total_games_analyzed=len([v for v in completed_videos if v.get("analysis_mode") == "team"]),
        total_training_sessions=len(completed_videos),
        total_passes=total_passes,
        avg_passes_per_game=total_passes / len(completed_videos) if completed_videos else None,
        total_interceptions=total_interceptions,
        avg_interceptions_per_game=total_interceptions / len(completed_videos) if completed_videos else None,
    )


@router.get("/skills/summary", response_model=SkillSummary)
async def get_skill_summary(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get personal skill summary for dashboard display.
    
    **Requires PERSONAL account.**
    """
    # Get user's player profile
    players = await supabase.select("players", filters={"user_id": current_user["id"]})
    
    if not players:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No player profile found. Create one first."
        )
    
    player = players[0]
    player_id = player["id"]
    
    # Get all analytics
    analytics = await supabase.select("analytics", filters={"player_id": player_id})
    
    # Calculate scores (0-100 scale)
    def calculate_score(values, target_min=0, target_max=100):
        if not values:
            return 50.0  # Neutral score if no data
        avg = sum(values) / len(values)
        return min(100, max(0, avg))
    
    # Extract metrics
    form_scores = [a.get("value", 50) for a in analytics if a.get("metric_type") == "form_consistency"]
    speed_scores = [a.get("value", 50) for a in analytics if a.get("metric_type") == "movement_score"]
    dribble_scores = [a.get("value", 50) for a in analytics if a.get("metric_type") == "dribble_score"]
    
    shooting_score = calculate_score(form_scores)
    movement_score = calculate_score(speed_scores)
    dribbling_score = calculate_score(dribble_scores)
    consistency_score = calculate_score([shooting_score, movement_score, dribbling_score])
    overall_score = (shooting_score + movement_score + dribbling_score + consistency_score) / 4
    
    # Determine strengths and areas to improve
    scores = {
        "Shooting Form": shooting_score,
        "Movement": movement_score,
        "Ball Handling": dribbling_score,
    }
    
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    strengths = [s[0] for s in sorted_scores if s[1] >= 70][:2]
    areas_to_improve = [s[0] for s in sorted_scores if s[1] < 60][:2]
    
    # Generate recommendations
    recommendations = []
    if shooting_score < 60:
        recommendations.append("Focus on shooting form consistency - practice elbow alignment")
    if movement_score < 60:
        recommendations.append("Work on lateral movement drills to improve court coverage")
    if dribbling_score < 60:
        recommendations.append("Practice dribbling with both hands to improve ball control")
    
    if not recommendations:
        recommendations.append("Keep up the great work! Try advanced drills to maintain progress")
    
    return SkillSummary(
        player_id=player_id,
        last_updated=datetime.utcnow(),
        overall_score=overall_score,
        shooting_score=shooting_score,
        dribbling_score=dribbling_score,
        movement_score=movement_score,
        consistency_score=consistency_score,
        strengths=strengths,
        areas_to_improve=areas_to_improve,
        recommendations=recommendations[:3],
    )


@router.get("/progress/{player_id}", response_model=ProgressReport)
async def get_player_progress(
    player_id: str,
    metric_type: str = Query(..., description="Metric to track: 'speed', 'form', 'distance'"),
    period_days: int = Query(30, ge=7, le=365),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get progress report for a specific metric over time.
    """
    # Verify access (same as player analytics)
    player = await supabase.select_one("players", player_id)
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check access
    has_access = False
    if current_user.get("account_type") == AccountType.TEAM.value:
        if player.get("organization_id"):
            org = await supabase.select_one("organizations", player["organization_id"])
            has_access = org and org["owner_id"] == current_user["id"]
    else:
        has_access = player.get("user_id") == current_user["id"]
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    period_end = date.today()
    period_start = period_end - timedelta(days=period_days)
    period_start_dt = datetime.combine(period_start, datetime.min.time())
    period_end_dt = datetime.combine(period_end, datetime.max.time())
    
    # Map user-friendly names to internal metric types
    metric_map = {
        "speed": "avg_speed_kmh",
        "form": "form_consistency",
        "distance": "distance_km",
    }
    
    internal_metric = metric_map.get(metric_type, metric_type)
    
    # Get analytics data
    analytics = await supabase.select("analytics", filters={"player_id": player_id})
    metric_data = [a for a in analytics if a.get("metric_type") == internal_metric]
    metric_data = [
        a for a in metric_data
        if (ts := _parse_ts(a.get("timestamp"))) is None or (period_start_dt <= ts <= period_end_dt)
    ]
    
    # Build data points (mock aggregation by date)
    data_points = []
    for a in metric_data:
        timestamp = a.get("timestamp")
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                data_points.append(ProgressData(
                    date=dt.date(),
                    value=a.get("value", 0),
                    metric_type=metric_type,
                ))
            except (ValueError, TypeError):
                pass
    
    # Calculate trend
    if len(data_points) >= 2:
        sorted_points = sorted(data_points, key=lambda x: x.date)
        first_value = sorted_points[0].value
        last_value = sorted_points[-1].value
        
        if first_value > 0:
            percent_change = ((last_value - first_value) / first_value) * 100
        else:
            percent_change = 0
        
        if percent_change > 5:
            trend = "improving"
        elif percent_change < -5:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"
        percent_change = 0
    
    return ProgressReport(
        player_id=player_id,
        metric_type=metric_type,
        period_start=period_start,
        period_end=period_end,
        data_points=data_points,
        trend=trend,
        percent_change=percent_change,
    )
