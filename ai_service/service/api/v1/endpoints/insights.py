"""
Performance insights and analytics API endpoints.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter()


class PerformanceInsight(BaseModel):
    """Performance insight data structure."""
    insight_type: str
    title: str
    description: str
    value: float
    unit: str
    trend: str  # "improving", "declining", "stable"
    confidence: float
    recommendation: Optional[str] = None


class PlayerPerformanceSummary(BaseModel):
    """Player performance summary."""
    player_id: str
    session_id: int
    total_shots: int
    shot_accuracy: float
    total_jumps: int
    average_jump_height: float
    total_sprints: int
    average_sprint_speed: float
    activity_intensity: float
    pose_stability: float
    performance_score: float


class SessionInsights(BaseModel):
    """Session insights response."""
    session_id: int
    player_id: str
    insights: List[PerformanceInsight]
    performance_summary: PlayerPerformanceSummary
    comparison_data: Dict[str, Any]
    recommendations: List[str]


class TrendAnalysis(BaseModel):
    """Trend analysis data."""
    metric_name: str
    current_value: float
    previous_value: float
    change_percentage: float
    trend_direction: str
    data_points: List[Dict[str, Any]]


@router.get("/session/{session_id}", response_model=SessionInsights)
async def get_session_insights(session_id: int, player_id: Optional[str] = None):
    """Get performance insights for a specific session."""
    try:
        logger.info(f"Generating insights for session {session_id}")
        
        # This would typically query the database for session data
        # For now, we'll generate mock insights
        
        insights = [
            PerformanceInsight(
                insight_type="shooting",
                title="Shooting Performance",
                description="Your shooting accuracy has improved by 12% compared to last session",
                value=0.78,
                unit="accuracy",
                trend="improving",
                confidence=0.85,
                recommendation="Focus on maintaining your shooting form during high-intensity moments"
            ),
            PerformanceInsight(
                insight_type="movement",
                title="Movement Efficiency",
                description="Your movement patterns show good court coverage with minimal wasted motion",
                value=0.82,
                unit="efficiency",
                trend="stable",
                confidence=0.78,
                recommendation="Continue working on quick direction changes to improve agility"
            ),
            PerformanceInsight(
                insight_type="jumping",
                title="Jump Performance",
                description="Your jump height has increased by 8% with better landing stability",
                value=0.65,
                unit="meters",
                trend="improving",
                confidence=0.72,
                recommendation="Focus on explosive takeoffs to maximize jump height"
            )
        ]
        
        performance_summary = PlayerPerformanceSummary(
            player_id=player_id or "player_1",
            session_id=session_id,
            total_shots=25,
            shot_accuracy=0.78,
            total_jumps=15,
            average_jump_height=0.65,
            total_sprints=8,
            average_sprint_speed=6.2,
            activity_intensity=0.82,
            pose_stability=0.75,
            performance_score=0.79
        )
        
        comparison_data = {
            "previous_session": {
                "shot_accuracy": 0.66,
                "jump_height": 0.60,
                "sprint_speed": 5.8,
                "performance_score": 0.71
            },
            "team_average": {
                "shot_accuracy": 0.72,
                "jump_height": 0.62,
                "sprint_speed": 6.0,
                "performance_score": 0.74
            }
        }
        
        recommendations = [
            "Continue focusing on shooting form consistency",
            "Work on explosive movements for better jump performance",
            "Practice quick direction changes to improve agility",
            "Maintain current training intensity for optimal results"
        ]
        
        return SessionInsights(
            session_id=session_id,
            player_id=player_id or "player_1",
            insights=insights,
            performance_summary=performance_summary,
            comparison_data=comparison_data,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Failed to generate session insights: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate session insights: {str(e)}"
        )


@router.get("/player/{player_id}/trends", response_model=List[TrendAnalysis])
async def get_player_trends(
    player_id: str, 
    days_back: int = 30,
    metric: Optional[str] = None
):
    """Get performance trends for a player over time."""
    try:
        logger.info(f"Generating trends for player {player_id} over {days_back} days")
        
        # This would typically query the database for historical data
        # For now, we'll generate mock trend data
        
        metrics_to_analyze = ["shot_accuracy", "jump_height", "sprint_speed", "performance_score"]
        if metric:
            metrics_to_analyze = [metric]
        
        trends = []
        for metric_name in metrics_to_analyze:
            # Generate mock data points
            data_points = []
            base_value = 0.7 if "accuracy" in metric_name or "score" in metric_name else 0.6
            
            for i in range(days_back):
                date = datetime.now() - timedelta(days=days_back - i)
                # Add some realistic variation
                value = base_value + (i * 0.01) + (0.1 * (i % 7 - 3) / 7)
                value = max(0.0, min(1.0, value))  # Clamp between 0 and 1
                
                data_points.append({
                    "date": date.isoformat(),
                    "value": round(value, 3)
                })
            
            current_value = data_points[-1]["value"]
            previous_value = data_points[-7]["value"] if len(data_points) >= 7 else data_points[0]["value"]
            change_percentage = ((current_value - previous_value) / previous_value) * 100 if previous_value > 0 else 0
            
            trend_direction = "improving" if change_percentage > 2 else "declining" if change_percentage < -2 else "stable"
            
            trends.append(TrendAnalysis(
                metric_name=metric_name,
                current_value=current_value,
                previous_value=previous_value,
                change_percentage=round(change_percentage, 2),
                trend_direction=trend_direction,
                data_points=data_points
            ))
        
        return trends
        
    except Exception as e:
        logger.error(f"Failed to generate player trends: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate player trends: {str(e)}"
        )


@router.get("/team/comparison")
async def get_team_comparison(team_id: Optional[str] = None):
    """Get team performance comparison and rankings."""
    try:
        logger.info(f"Generating team comparison for team {team_id}")
        
        # This would typically query the database for team data
        # For now, we'll generate mock team comparison data
        
        team_data = {
            "team_id": team_id or "team_1",
            "team_name": "Thunder Hawks",
            "total_players": 12,
            "active_players": 10,
            "average_performance_score": 0.76,
            "top_performers": [
                {
                    "player_id": "player_1",
                    "name": "Alex Johnson",
                    "performance_score": 0.89,
                    "improvement": "+12%"
                },
                {
                    "player_id": "player_2", 
                    "name": "Sarah Chen",
                    "performance_score": 0.85,
                    "improvement": "+8%"
                },
                {
                    "player_id": "player_3",
                    "name": "Mike Rodriguez",
                    "performance_score": 0.82,
                    "improvement": "+5%"
                }
            ],
            "team_metrics": {
                "average_shot_accuracy": 0.74,
                "average_jump_height": 0.63,
                "average_sprint_speed": 6.1,
                "team_cohesion_score": 0.81
            },
            "comparison_with_league": {
                "performance_rank": 3,
                "total_teams": 12,
                "above_league_average": True,
                "league_average_score": 0.72
            }
        }
        
        return team_data
        
    except Exception as e:
        logger.error(f"Failed to generate team comparison: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate team comparison: {str(e)}"
        )


@router.get("/recommendations/{player_id}")
async def get_personalized_recommendations(player_id: str):
    """Get personalized training recommendations for a player."""
    try:
        logger.info(f"Generating recommendations for player {player_id}")
        
        # This would typically analyze player's performance data and generate recommendations
        # For now, we'll generate mock recommendations
        
        recommendations = {
            "player_id": player_id,
            "generated_at": datetime.now().isoformat(),
            "recommendations": [
                {
                    "category": "shooting",
                    "priority": "high",
                    "title": "Improve Free Throw Consistency",
                    "description": "Your free throw accuracy is 15% below team average. Focus on consistent form and follow-through.",
                    "exercises": [
                        "Daily free throw practice (50 shots)",
                        "Form shooting drills",
                        "Pressure free throw simulations"
                    ],
                    "expected_improvement": "8-12% increase in accuracy within 2 weeks"
                },
                {
                    "category": "conditioning",
                    "priority": "medium",
                    "title": "Enhance Sprint Speed",
                    "description": "Your sprint speed is good but can be improved for better court coverage.",
                    "exercises": [
                        "Sprint interval training",
                        "Agility ladder drills",
                        "Plyometric exercises"
                    ],
                    "expected_improvement": "5-8% speed increase within 3 weeks"
                },
                {
                    "category": "jumping",
                    "priority": "low",
                    "title": "Maintain Jump Performance",
                    "description": "Your jump height is above average. Focus on maintaining current performance.",
                    "exercises": [
                        "Jump rope exercises",
                        "Box jump variations",
                        "Strength training for legs"
                    ],
                    "expected_improvement": "Maintain current jump height with improved consistency"
                }
            ],
            "training_schedule": {
                "weekly_sessions": 4,
                "session_duration": "90 minutes",
                "focus_areas": ["shooting", "conditioning", "jumping"],
                "rest_days": ["Tuesday", "Friday"]
            }
        }
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Failed to generate recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )
