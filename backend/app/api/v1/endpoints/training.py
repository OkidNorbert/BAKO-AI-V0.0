"""
Training endpoints for AI-powered recommendations.
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
import httpx
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

# AI Service URL
AI_SERVICE_URL = "http://localhost:8001"

class TrainingRecommendation:
    def __init__(self, title: str, description: str, category: str, 
                 difficulty: str, duration: int, frequency: str, 
                 priority: int, progress: int = 0):
        self.title = title
        self.description = description
        self.category = category
        self.difficulty = difficulty
        self.duration = duration
        self.frequency = frequency
        self.priority = priority
        self.progress = progress

class TrainingProgress:
    def __init__(self, current_focus: str, next_milestone: str, 
                 completion_rate: int, weekly_goal: int, achievements: List[str]):
        self.current_focus = current_focus
        self.next_milestone = next_milestone
        self.completion_rate = completion_rate
        self.weekly_goal = weekly_goal
        self.achievements = achievements

async def get_ai_service_data(url: str, timeout: float = 5.0) -> Dict[str, Any]:
    """Get data from AI service with fallback."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url)
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        logger.warning(f"AI service unavailable: {e}")
    
    return None

@router.get("/recommendations/{player_id}")
async def get_training_recommendations(
    player_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered training recommendations for a player."""
    try:
        # Try to get data from AI service
        ai_url = f"{AI_SERVICE_URL}/api/v1/training/recommendations/{player_id}?days={days}"
        ai_data = await get_ai_service_data(ai_url)
        
        if ai_data:
            return ai_data
        
        # Check if player has any training data
        try:
            # Query for player's training sessions/events
            player_data_query = """
            SELECT COUNT(*) as session_count, 
                   MAX(timestamp) as last_session,
                   AVG(CAST(meta->>'performance_score' AS FLOAT)) as avg_performance
            FROM events 
            WHERE player_id = :player_id
            """
            
            player_data = db.execute(player_data_query, {"player_id": str(player_id)}).fetchone()
            
            # If player has no training data, return empty recommendations
            if not player_data or player_data.session_count == 0:
                logger.info(f"Player {player_id} has no training data, returning empty recommendations")
                return []
            
            # If player has some data but AI service is unavailable, return empty
            # (This ensures we don't show fake recommendations)
            logger.info(f"Player {player_id} has {player_data.session_count} sessions but AI service unavailable")
            return []
            
        except Exception as db_error:
            logger.warning(f"Database query failed for player {player_id}: {db_error}")
            # Return empty if we can't check player data
            return []
        
    except Exception as e:
        logger.error(f"Error getting training recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching training recommendations: {str(e)}"
        )

@router.get("/progress/{player_id}")
async def get_training_progress(
    player_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get training progress for a player."""
    try:
        # Try to get data from AI service
        ai_url = f"{AI_SERVICE_URL}/api/v1/training/progress/{player_id}"
        ai_data = await get_ai_service_data(ai_url)
        
        if ai_data:
            return ai_data
        
        # Check if player has any training data
        try:
            # Query for player's training sessions/events
            player_data_query = """
            SELECT COUNT(*) as session_count, 
                   MAX(timestamp) as last_session,
                   AVG(CAST(meta->>'performance_score' AS FLOAT)) as avg_performance
            FROM events 
            WHERE player_id = :player_id
            """
            
            player_data = db.execute(player_data_query, {"player_id": str(player_id)}).fetchone()
            
            # If player has no training data, return null
            if not player_data or player_data.session_count == 0:
                logger.info(f"Player {player_id} has no training data, returning null progress")
                return None
            
            # If player has some data but AI service is unavailable, return null
            logger.info(f"Player {player_id} has {player_data.session_count} sessions but AI service unavailable")
            return None
            
        except Exception as db_error:
            logger.warning(f"Database query failed for player {player_id}: {db_error}")
            # Return null if we can't check player data
            return None
        
    except Exception as e:
        logger.error(f"Error getting training progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching training progress: {str(e)}"
        )

@router.get("/status")
async def get_training_status():
    """Get AI training service status."""
    try:
        # Check AI service status
        ai_url = f"{AI_SERVICE_URL}/api/v1/training/status"
        ai_data = await get_ai_service_data(ai_url)
        
        if ai_data:
            return ai_data
        
        # Fallback status
        return {
            "status": "fallback",
            "message": "AI service unavailable, using fallback data",
            "ai_service_available": False
        }
        
    except Exception as e:
        logger.error(f"Error checking training status: {e}")
        return {
            "status": "error",
            "message": f"Error checking status: {str(e)}",
            "ai_service_available": False
        }

@router.get("/models/status")
async def get_models_status():
    """Get AI models status."""
    try:
        # Check AI service models
        ai_url = f"{AI_SERVICE_URL}/api/v1/training/models/status"
        ai_data = await get_ai_service_data(ai_url)
        
        if ai_data:
            return ai_data
        
        # Fallback models status
        return {
            "models": [
                {
                    "name": "performance_analyzer",
                    "status": "fallback",
                    "accuracy": 0.85,
                    "last_trained": "2024-01-01T00:00:00Z"
                },
                {
                    "name": "recommendation_engine",
                    "status": "fallback", 
                    "accuracy": 0.78,
                    "last_trained": "2024-01-01T00:00:00Z"
                }
            ],
            "ai_service_available": False
        }
        
    except Exception as e:
        logger.error(f"Error checking models status: {e}")
        return {
            "models": [],
            "ai_service_available": False,
            "error": str(e)
        }

@router.get("/metrics")
async def get_training_metrics():
    """Get training metrics."""
    try:
        # Try to get metrics from AI service
        ai_url = f"{AI_SERVICE_URL}/api/v1/training/metrics"
        ai_data = await get_ai_service_data(ai_url)
        
        if ai_data:
            return ai_data
        
        # Fallback metrics
        return {
            "total_recommendations_generated": 150,
            "average_accuracy": 0.82,
            "active_models": 2,
            "last_training_run": "2024-01-01T00:00:00Z",
            "ai_service_available": False
        }
        
    except Exception as e:
        logger.error(f"Error getting training metrics: {e}")
        return {
            "error": str(e),
            "ai_service_available": False
        }

@router.post("/train/manual")
async def trigger_manual_training(
    training_type: str = "incremental",
    current_user: User = Depends(get_current_user)
):
    """Trigger manual training of AI models."""
    try:
        # Try to trigger training on AI service
        ai_url = f"{AI_SERVICE_URL}/api/v1/training/train/manual"
        async with httpx.AsyncClient() as client:
            response = await client.post(ai_url, params={"training_type": training_type})
            if response.status_code == 200:
                return response.json()
        
        # Fallback response
        return {
            "status": "fallback",
            "message": "AI service unavailable, training not triggered",
            "training_type": training_type
        }
        
    except Exception as e:
        logger.error(f"Error triggering training: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error triggering training: {str(e)}"
        )
