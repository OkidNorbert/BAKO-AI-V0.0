"""
API v1 router configuration.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, players, videos, events, jobs, wearables, analytics, streaming, metrics, feedback, stats, training, team_analytics, team_players, team_training, team_sessions

# Create main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(players.router, prefix="/players", tags=["players"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(wearables.router, prefix="/wearables", tags=["wearables"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(streaming.router, prefix="/streaming", tags=["streaming"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(stats.router, prefix="/stats", tags=["statistics"])
api_router.include_router(training.router, prefix="/training", tags=["training"])

# Team management endpoints for coaches
api_router.include_router(team_analytics.router, prefix="/analytics", tags=["team-analytics"])
api_router.include_router(team_players.router, prefix="/players", tags=["team-players"])
api_router.include_router(team_training.router, prefix="/training", tags=["team-training"])
api_router.include_router(team_sessions.router, prefix="/events", tags=["team-sessions"])
