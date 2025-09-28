"""
AI Service configuration settings.
"""

import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AI Service settings."""
    
    # Application
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # AI Model Configuration
    AI_MODEL_PATH: str = "/app/models"
    AI_CONFIDENCE_THRESHOLD: float = 0.5
    AI_FPS: int = 10
    
    # MediaPipe Configuration
    MEDIAPIPE_MODEL_COMPLEXITY: int = 1
    MEDIAPIPE_MIN_DETECTION_CONFIDENCE: float = 0.5
    MEDIAPIPE_MIN_TRACKING_CONFIDENCE: float = 0.5
    
    # YOLOv8 Configuration
    YOLO_MODEL_NAME: str = "yolov8n.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.5
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Backend API
    BACKEND_URL: str = "http://backend:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
