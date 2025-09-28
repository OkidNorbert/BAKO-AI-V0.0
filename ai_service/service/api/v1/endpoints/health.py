"""
Health check endpoints for AI service.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check."""
    return {
        "status": "healthy",
        "service": "basketball-performance-ai-service",
        "version": "1.0.0"
    }


@router.get("/models")
async def models_health():
    """Check AI models status."""
    # TODO: Check if MediaPipe, YOLOv8 models are loaded
    return {
        "status": "healthy",
        "models": {
            "mediapipe": "loaded",
            "yolov8": "loaded"
        }
    }
