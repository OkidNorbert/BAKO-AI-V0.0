"""
Basketball AI Performance Analysis - FastAPI Backend
Main application with video upload and analysis endpoints
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import torch
from pathlib import Path
import aiofiles
import uuid
import shutil
from datetime import datetime
from typing import Optional

from app.core.config import settings
from app.core.schemas import VideoAnalysisResult, HealthResponse, AnalysisStatus
from app.services.video_processor import VideoProcessor
from app.services.supabase_service import supabase_service
from app.api import chat, websocket

# Suppress noisy warnings (optional - doesn't affect functionality)
import warnings
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings
warnings.filterwarnings('ignore', category=UserWarning, message='.*SymbolDatabase.*')
warnings.filterwarnings('ignore', message='.*absl.*')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered basketball performance analysis with action classification and metrics",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(websocket.router)

# Initialize video processor
video_processor: Optional[VideoProcessor] = None


@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global video_processor
    
    logger.info("🚀 Starting Basketball AI Backend...")
    logger.info(f"   GPU Available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        logger.info(f"   GPU: {torch.cuda.get_device_name(0)}")
    
    try:
        video_processor = VideoProcessor()
        # Store in app state for dependency injection
        app.state.video_processor = video_processor
        logger.info("✅ Video processor ready!")
    except Exception as e:
        logger.error(f"❌ Failed to initialize video processor: {e}")
        video_processor = None
        app.state.video_processor = None


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down Basketball AI Backend...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Basketball AI Performance Analysis API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running"
    }


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        models_loaded=video_processor is not None,
        gpu_available=torch.cuda.is_available()
    )


def handle_supabase_upload(file_path: str, filename: str, result: dict):
    """Background task to upload to Supabase and clean up"""
    try:
        # Upload video
        video_url = supabase_service.upload_video(file_path, filename)
        
        # Save result
        supabase_service.save_analysis(result, video_url)
        
    except Exception as e:
        logger.error(f"Background Supabase task failed: {e}")
    finally:
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted temp file: {file_path}")


@app.post("/api/analyze", response_model=VideoAnalysisResult)
async def analyze_video(
    video: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Analyze basketball video
    
    Upload a video file and get:
    - Action classification (shooting, dribbling, etc.)
    - Performance metrics (jump height, speed, form)
    - AI recommendations
    """
    global video_processor
    if video_processor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Video processor not initialized. Please try again later."
        )
    
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

        # Process video (NOT async)
        try:
            result = await video_processor.process_video(temp_path)
            
            # Upload to Supabase (Background Task)
            if background_tasks:
                # Convert Pydantic model to dict with JSON-serializable values
                result_dict = result.model_dump(mode='json') if hasattr(result, 'model_dump') else result.dict()
                background_tasks.add_task(handle_supabase_upload, temp_path, temp_filename, result_dict)
            else:
                # If no background tasks, clean up immediately
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            return result
            
        except ValueError as e:
            # Handle specific errors from video processor
            error_msg = str(e)
            logger.warning(f"⚠️ Analysis rejected: {error_msg}")
            
            if "Insufficient frames with detected poses" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "code": "NO_PLAYER_DETECTED",
                        "message": "No basketball player detected in the video.",
                        "suggestions": [
                            "Ensure the player is fully visible in the frame",
                            "Check for good lighting conditions",
                            "Make sure the video contains basketball action",
                            "Try a video with a clear view of the player"
                        ]
                    }
                )
            elif "Video too short" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "code": "VIDEO_TOO_SHORT",
                        "message": str(e),
                        "suggestions": [
                            "Upload a longer video (at least 1 second)",
                            "Ensure the video file is not corrupted"
                        ]
                    }
                )
                
            logger.error(f"❌ Analysis failed (ValueError): {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {str(e)}"
        )


@app.get("/api/results/{video_id}", response_model=VideoAnalysisResult)
async def get_result(video_id: str):
    """
    Get analysis result by video ID
    (For future implementation with database)
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Results storage not implemented yet. Use /api/analyze for real-time analysis."
    )


@app.get("/api/history")
async def get_history(limit: int = 10):
    """
    Get historical analysis results
    (For future implementation with database)
    """
    return []


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )

