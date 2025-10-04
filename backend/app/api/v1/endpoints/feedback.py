"""
User feedback collection endpoints for pilot program validation.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for feedback
class FeedbackCreate(BaseModel):
    feedback_type: str = Field(..., description="Type of feedback: bug, feature, general, performance")
    title: str = Field(..., description="Brief title of the feedback")
    description: str = Field(..., description="Detailed description")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1-5")
    feature_used: Optional[str] = Field(None, description="Specific feature being feedback on")
    user_experience: Optional[str] = Field(None, description="User experience description")
    suggestions: Optional[str] = Field(None, description="Suggestions for improvement")
    device_info: Optional[Dict[str, Any]] = Field(None, description="Device and browser information")

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    feedback_type: str
    title: str
    description: str
    rating: Optional[int]
    feature_used: Optional[str]
    user_experience: Optional[str]
    suggestions: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

class FeedbackUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Status: open, in_progress, resolved, closed")
    admin_response: Optional[str] = Field(None, description="Admin response to feedback")

class SurveyResponse(BaseModel):
    survey_id: str
    user_id: int
    responses: Dict[str, Any]
    completed_at: datetime

class UsageAnalytics(BaseModel):
    user_id: int
    session_id: str
    feature: str
    duration: int
    success: bool
    timestamp: datetime

@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new user feedback."""
    try:
        logger.info(f"Creating feedback from user {current_user.id}: {feedback.title}")
        
        # Create feedback record
        feedback_data = {
            "user_id": current_user.id,
            "feedback_type": feedback.feedback_type,
            "title": feedback.title,
            "description": feedback.description,
            "rating": feedback.rating,
            "feature_used": feedback.feature_used,
            "user_experience": feedback.user_experience,
            "suggestions": feedback.suggestions,
            "device_info": feedback.device_info,
            "status": "open",
            "created_at": datetime.now()
        }
        
        # In a real implementation, this would save to database
        # For now, we'll simulate the response
        feedback_response = FeedbackResponse(
            id=1,
            user_id=current_user.id,
            feedback_type=feedback.feedback_type,
            title=feedback.title,
            description=feedback.description,
            rating=feedback.rating,
            feature_used=feedback.feature_used,
            user_experience=feedback.user_experience,
            suggestions=feedback.suggestions,
            status="open",
            created_at=datetime.now(),
            updated_at=None
        )
        
        logger.info(f"Feedback created successfully: {feedback_response.id}")
        return feedback_response
        
    except Exception as e:
        logger.error(f"Failed to create feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create feedback: {str(e)}"
        )

@router.get("/feedback", response_model=List[FeedbackResponse])
async def get_user_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get user's feedback history."""
    try:
        logger.info(f"Retrieving feedback for user {current_user.id}")
        
        # In a real implementation, this would query the database
        # For now, we'll return sample data
        sample_feedback = [
            FeedbackResponse(
                id=1,
                user_id=current_user.id,
                feedback_type="feature",
                title="Great video analysis feature",
                description="The pose detection is very accurate and helpful for improving my shooting form.",
                rating=5,
                feature_used="video_analysis",
                user_experience="Excellent",
                suggestions="Maybe add more detailed breakdown of shooting mechanics",
                status="open",
                created_at=datetime.now(),
                updated_at=None
            )
        ]
        
        return sample_feedback
        
    except Exception as e:
        logger.error(f"Failed to retrieve feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve feedback: {str(e)}"
        )

@router.post("/survey", response_model=SurveyResponse)
async def submit_survey(
    survey_id: str,
    responses: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit survey responses."""
    try:
        logger.info(f"Submitting survey {survey_id} for user {current_user.id}")
        
        # Process survey responses
        survey_response = SurveyResponse(
            survey_id=survey_id,
            user_id=current_user.id,
            responses=responses,
            completed_at=datetime.now()
        )
        
        logger.info(f"Survey submitted successfully: {survey_id}")
        return survey_response
        
    except Exception as e:
        logger.error(f"Failed to submit survey: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit survey: {str(e)}"
        )

@router.post("/analytics/usage")
async def track_usage(
    analytics: UsageAnalytics,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track user usage analytics."""
    try:
        logger.info(f"Tracking usage for user {current_user.id}: {analytics.feature}")
        
        # In a real implementation, this would save to analytics database
        # For now, we'll just log the usage
        
        return {"status": "success", "message": "Usage tracked successfully"}
        
    except Exception as e:
        logger.error(f"Failed to track usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track usage: {str(e)}"
        )

@router.get("/analytics/summary")
async def get_usage_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365)
):
    """Get user usage analytics summary."""
    try:
        logger.info(f"Generating usage summary for user {current_user.id}")
        
        # In a real implementation, this would query analytics database
        # For now, we'll return sample analytics
        summary = {
            "user_id": current_user.id,
            "period_days": days,
            "total_sessions": 45,
            "total_video_analysis": 23,
            "total_wearable_data_points": 1250,
            "most_used_features": [
                {"feature": "video_analysis", "count": 23},
                {"feature": "performance_metrics", "count": 18},
                {"feature": "training_recommendations", "count": 12}
            ],
            "average_session_duration": 25.5,
            "success_rate": 0.92,
            "improvement_metrics": {
                "shooting_accuracy": 0.15,
                "jump_height": 0.08,
                "sprint_speed": 0.12
            }
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"Failed to generate usage summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate usage summary: {str(e)}"
        )

@router.get("/feedback/stats")
async def get_feedback_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get feedback statistics for admin users."""
    try:
        logger.info(f"Generating feedback stats for user {current_user.id}")
        
        # In a real implementation, this would query feedback database
        # For now, we'll return sample stats
        stats = {
            "total_feedback": 156,
            "open_feedback": 23,
            "resolved_feedback": 133,
            "average_rating": 4.2,
            "feedback_by_type": {
                "bug": 45,
                "feature": 67,
                "general": 32,
                "performance": 12
            },
            "top_features": [
                {"feature": "video_analysis", "feedback_count": 45},
                {"feature": "wearable_integration", "feedback_count": 32},
                {"feature": "analytics_dashboard", "feedback_count": 28}
            ],
            "user_satisfaction": {
                "very_satisfied": 0.45,
                "satisfied": 0.35,
                "neutral": 0.15,
                "dissatisfied": 0.05
            }
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to generate feedback stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate feedback stats: {str(e)}"
        )
