"""
Video analysis endpoints with WebSocket support
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
import logging
import os
import aiofiles
import uuid
from typing import Optional
from app.core.config import settings
from app.core.schemas import VideoAnalysisResult
from app.services.video_processor import VideoProcessor
from app.main import handle_supabase_upload

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/start", response_class=JSONResponse)
async def start_analysis():
    """
    Start a new video analysis session
    Returns video_id that frontend can use to connect to WebSocket
    """
    video_id = str(uuid.uuid4())
    logger.info(f"📹 New analysis session started: {video_id}")
    return {"video_id": video_id, "status": "ready"}


@router.post("/{video_id}", response_model=VideoAnalysisResult)
async def analyze_video_with_id(
    video_id: str,
    video: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Analyze basketball video with pre-generated video_id
    
    The frontend should:
    1. Call /api/analyze/start to get video_id
    2. Connect to ws://localhost:8000/ws/video-stream/{video_id}
    3. Call this endpoint with the video_id and video file
    """
    # Get video processor from app state
    from fastapi import Request
    import sys
    # We'll need to access app.state, so we'll handle this in main.py instead
    # For now, use a global or pass it differently
    
    # Validate file
    if not video.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )

    ext = os.path.splitext(video.filename)[1].lower()
    if ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_VIDEO_EXTENSIONS}"
        )
    
    # Check file size
    file_content = await video.read()
    if len(file_content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file provided"
        )
        
    if len(file_content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / (1024*1024):.2f}MB"
        )
    
    # Create temp file
    temp_filename = f"{uuid.uuid4()}{ext}"
    temp_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
    
    try:
        # Save uploaded file
        async with aiofiles.open(temp_path, "wb") as buffer:
            await buffer.write(file_content)
            
        logger.info(f"📥 Video uploaded: {temp_filename} ({len(file_content)/(1024*1024):.2f}MB)")
        logger.info(f"📹 Using video_id: {video_id}")

        # Get video processor - we'll need to import it from main or make it accessible
        # For now, return error directing to use main endpoint
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Use /api/analyze endpoint. This endpoint is for future use with WebSocket pre-connection."
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {str(e)}"
        )

