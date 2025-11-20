"""
Chat API endpoints for AI Coach
Allows players to interact with AI coach about their performance
"""

from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from app.models.ai_coach import AICoach

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    """Chat request"""
    message: str
    video_id: Optional[str] = None  # If chatting about specific video analysis
    conversation_history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    """Chat response"""
    response: str
    timestamp: datetime


@router.post("/", response_model=ChatResponse)
async def chat_with_coach(
    request: ChatRequest,
    http_request: Request
):
    """
    Chat with AI coach about performance
    
    Requires video analysis data. Either:
    1. Provide video_id to reference previous analysis
    2. Or ensure video was just analyzed (stored in session)
    """
    # Get video processor from app state
    video_processor = getattr(http_request.app.state, 'video_processor', None)
    
    if video_processor is None or not hasattr(video_processor, 'ai_coach') or video_processor.ai_coach is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Coach not available"
        )
    
    # TODO: Load analysis data from video_id or session
    # For now, return error if no analysis data available
    if not request.video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please analyze a video first, then provide video_id"
        )
    
    # Get AI coach response
    try:
        # Convert conversation history
        history = []
        if request.conversation_history:
            for msg in request.conversation_history:
                history.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # TODO: Load actual analysis data from video_id
        # For now, use placeholder
        response = video_processor.ai_coach.chat(
            request.message,
            "free_throw",  # Placeholder - should load from video_id
            {
                "jump_height": 0.5,
                "movement_speed": 5.0,
                "form_score": 0.8,
                "reaction_time": 0.2,
                "pose_stability": 0.85,
                "energy_efficiency": 0.75
            },
            None,
            history
        )
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )

