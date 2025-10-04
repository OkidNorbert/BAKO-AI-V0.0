"""
Analytics and recommendation endpoints.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.analytics import BasketballAnalytics, PerformanceMetrics, TrainingRecommendation
from app.models.user import User
from app.schemas.analytics import (
    PerformanceMetricsResponse, 
    TrainingRecommendationResponse,
    AnalyticsRequest,
    WeaknessAnalysisResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/performance/{player_id}", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    player_id: int,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive performance metrics for a player."""
    try:
        logger.info(f"📊 Getting performance metrics for player {player_id} over {days} days")
        
        # Initialize analytics engine
        analytics = BasketballAnalytics(db)
        
        # Analyze performance
        metrics = analytics.analyze_player_performance(player_id, days)
        
        # Convert to response format
        response = PerformanceMetricsResponse(
            player_id=metrics.player_id,
            date_range=metrics.date_range,
            total_sessions=metrics.total_sessions,
            total_training_time=metrics.total_training_time,
            shot_attempts=metrics.shot_attempts,
            shot_accuracy=metrics.shot_accuracy,
            three_point_accuracy=metrics.three_point_accuracy,
            free_throw_accuracy=metrics.free_throw_accuracy,
            avg_heart_rate=metrics.avg_heart_rate,
            max_heart_rate=metrics.max_heart_rate,
            avg_jump_height=metrics.avg_jump_height,
            max_jump_height=metrics.max_jump_height,
            avg_sprint_speed=metrics.avg_sprint_speed,
            total_distance=metrics.total_distance,
            total_calories_burned=metrics.total_calories_burned,
            avg_workload=metrics.avg_workload,
            recovery_time=metrics.recovery_time,
            weaknesses=metrics.weaknesses,
            improvement_areas=metrics.improvement_areas
        )
        
        logger.info(f"✅ Performance metrics calculated for player {player_id}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error getting performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing performance: {str(e)}"
        )


@router.get("/recommendations/{player_id}", response_model=List[TrainingRecommendationResponse])
async def get_training_recommendations(
    player_id: int,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized training recommendations for a player."""
    try:
        logger.info(f"💡 Getting training recommendations for player {player_id}")
        
        # Initialize analytics engine
        analytics = BasketballAnalytics(db)
        
        # Analyze performance
        metrics = analytics.analyze_player_performance(player_id, days)
        
        # Generate recommendations
        recommendations = analytics.generate_recommendations(metrics)
        
        # Convert to response format
        response = []
        for rec in recommendations:
            response.append(TrainingRecommendationResponse(
                title=rec.title,
                description=rec.description,
                category=rec.category,
                priority=rec.priority,
                duration=rec.duration,
                frequency=rec.frequency,
                exercises=rec.exercises,
                expected_improvement=rec.expected_improvement,
                rationale=rec.rationale
            ))
        
        logger.info(f"✅ Generated {len(recommendations)} recommendations for player {player_id}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error getting recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating recommendations: {str(e)}"
        )


@router.post("/analyze", response_model=WeaknessAnalysisResponse)
async def analyze_player_weaknesses(
    request: AnalyticsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze player weaknesses and provide detailed insights."""
    try:
        logger.info(f"🔍 Analyzing weaknesses for player {request.player_id}")
        
        # Initialize analytics engine
        analytics = BasketballAnalytics(db)
        
        # Analyze performance
        metrics = analytics.analyze_player_performance(request.player_id, request.days)
        
        # Generate recommendations
        recommendations = analytics.generate_recommendations(metrics)
        
        # Create weakness analysis
        weakness_analysis = WeaknessAnalysisResponse(
            player_id=request.player_id,
            analysis_date=datetime.now().isoformat(),
            weaknesses=metrics.weaknesses,
            improvement_areas=metrics.improvement_areas,
            recommendations=len(recommendations),
            priority_weakness=metrics.weaknesses[0] if metrics.weaknesses else None,
            overall_score=self._calculate_overall_score(metrics),
            insights=self._generate_insights(metrics)
        )
        
        logger.info(f"✅ Weakness analysis completed for player {request.player_id}")
        return weakness_analysis
        
    except Exception as e:
        logger.error(f"❌ Error analyzing weaknesses: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing weaknesses: {str(e)}"
        )


@router.get("/comparison/{player_id}")
async def compare_with_benchmarks(
    player_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare player performance with benchmarks and peers."""
    try:
        logger.info(f"📈 Comparing player {player_id} with benchmarks")
        
        # Initialize analytics engine
        analytics = BasketballAnalytics(db)
        
        # Get player metrics
        metrics = analytics.analyze_player_performance(player_id, 30)
        
        # Define benchmarks (these would come from a database in production)
        benchmarks = {
            "shot_accuracy": {"excellent": 60, "good": 50, "average": 40, "needs_improvement": 30},
            "jump_height": {"excellent": 30, "good": 25, "average": 20, "needs_improvement": 15},
            "sprint_speed": {"excellent": 4.0, "good": 3.5, "average": 3.0, "needs_improvement": 2.5},
            "heart_rate": {"excellent": 140, "good": 150, "average": 160, "needs_improvement": 170}
        }
        
        # Compare with benchmarks
        comparison = {
            "shot_accuracy": self._compare_metric(metrics.shot_accuracy, benchmarks["shot_accuracy"]),
            "jump_height": self._compare_metric(metrics.avg_jump_height, benchmarks["jump_height"]),
            "sprint_speed": self._compare_metric(metrics.avg_sprint_speed, benchmarks["sprint_speed"]),
            "heart_rate": self._compare_metric(metrics.avg_heart_rate, benchmarks["heart_rate"], reverse=True)
        }
        
        return {
            "player_id": player_id,
            "comparison_date": datetime.now().isoformat(),
            "benchmarks": comparison,
            "overall_rating": self._calculate_overall_rating(comparison)
        }
        
    except Exception as e:
        logger.error(f"❌ Error comparing with benchmarks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error comparing with benchmarks: {str(e)}"
        )


def _calculate_overall_score(self, metrics: PerformanceMetrics) -> float:
    """Calculate overall performance score (0-100)."""
    score = 0.0
    
    # Shooting score (30% weight)
    shooting_score = min(metrics.shot_accuracy, 100) / 100
    score += shooting_score * 0.3
    
    # Physical score (40% weight)
    physical_score = 0.0
    if metrics.avg_jump_height > 0:
        physical_score += min(metrics.avg_jump_height / 30, 1.0) * 0.2
    if metrics.avg_sprint_speed > 0:
        physical_score += min(metrics.avg_sprint_speed / 4.0, 1.0) * 0.2
    score += physical_score * 0.4
    
    # Consistency score (30% weight)
    consistency_score = min(metrics.total_sessions / 10, 1.0)  # 10 sessions = 100%
    score += consistency_score * 0.3
    
    return round(score * 100, 1)


def _generate_insights(self, metrics: PerformanceMetrics) -> List[str]:
    """Generate performance insights."""
    insights = []
    
    if metrics.shot_accuracy > 50:
        insights.append("Strong shooting performance - keep up the good work!")
    elif metrics.shot_accuracy < 30:
        insights.append("Shooting accuracy needs significant improvement")
    
    if metrics.avg_jump_height > 25:
        insights.append("Excellent vertical jump - great athleticism!")
    elif metrics.avg_jump_height < 20:
        insights.append("Jump height could be improved with plyometric training")
    
    if metrics.total_sessions > 5:
        insights.append("Good training consistency - keep it up!")
    elif metrics.total_sessions < 2:
        insights.append("Training frequency could be increased")
    
    return insights


def _compare_metric(self, value: float, benchmarks: dict, reverse: bool = False) -> dict:
    """Compare a metric with benchmarks."""
    if reverse:
        # For heart rate, lower is better
        if value <= benchmarks["excellent"]:
            return {"rating": "excellent", "value": value, "benchmark": benchmarks["excellent"]}
        elif value <= benchmarks["good"]:
            return {"rating": "good", "value": value, "benchmark": benchmarks["good"]}
        elif value <= benchmarks["average"]:
            return {"rating": "average", "value": value, "benchmark": benchmarks["average"]}
        else:
            return {"rating": "needs_improvement", "value": value, "benchmark": benchmarks["needs_improvement"]}
    else:
        # For other metrics, higher is better
        if value >= benchmarks["excellent"]:
            return {"rating": "excellent", "value": value, "benchmark": benchmarks["excellent"]}
        elif value >= benchmarks["good"]:
            return {"rating": "good", "value": value, "benchmark": benchmarks["good"]}
        elif value >= benchmarks["average"]:
            return {"rating": "average", "value": value, "benchmark": benchmarks["average"]}
        else:
            return {"rating": "needs_improvement", "value": value, "benchmark": benchmarks["needs_improvement"]}


def _calculate_overall_rating(self, comparison: dict) -> str:
    """Calculate overall rating from comparison results."""
    ratings = [comp["rating"] for comp in comparison.values()]
    
    if all(rating == "excellent" for rating in ratings):
        return "excellent"
    elif all(rating in ["excellent", "good"] for rating in ratings):
        return "good"
    elif all(rating in ["excellent", "good", "average"] for rating in ratings):
        return "average"
    else:
        return "needs_improvement"
