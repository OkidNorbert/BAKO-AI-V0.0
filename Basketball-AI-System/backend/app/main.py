"""
Basketball AI Performance Analysis - FastAPI Backend
Main application with video upload and analysis endpoints
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import torch
from pathlib import Path
import aiofiles
import uuid
from datetime import datetime

from app.core.config import settings
from app.core.schemas import VideoAnalysisResult, HealthResponse, AnalysisStatus
from app.services.video_processor import VideoProcessor

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
        logger.info("✅ Video processor ready!")
    except Exception as e:
        logger.error(f"❌ Failed to initialize video processor: {e}")
        video_processor = None


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


@app.post("/api/analyze", response_model=VideoAnalysisResult)
async def analyze_video(video: UploadFile = File(...)):
    """
    Analyze basketball video
    
    Upload a video file and get:
    - Action classification (shooting, dribbling, etc.)
    - Performance metrics (jump height, speed, form)
    - AI recommendations
    """
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
    
    file_ext = Path(video.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_VIDEO_EXTENSIONS}"
        )
    
    # Read file content
    content = await video.read()
    
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )
    
    # Save video temporarily
    video_id = str(uuid.uuid4())
    temp_video_path = Path(settings.UPLOAD_DIR) / f"{video_id}{file_ext}"
    
    try:
        async with aiofiles.open(temp_video_path, 'wb') as f:
            await f.write(content)
        
        logger.info(f"📥 Video uploaded: {video_id} ({len(content)/(1024*1024):.2f}MB)")
        
        # Process video
        result = await video_processor.process_video(str(temp_video_path))
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {str(e)}"
        )
    
    finally:
        # Cleanup
        if temp_video_path.exists():
            temp_video_path.unlink()


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

