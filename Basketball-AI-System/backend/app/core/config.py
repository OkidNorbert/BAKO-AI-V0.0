"""
Configuration settings for Basketball AI Backend
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "Basketball AI Performance Analysis API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500MB
    ALLOWED_VIDEO_EXTENSIONS: List[str] = [".mp4", ".mov", ".avi", ".mkv"]
    UPLOAD_DIR: str = "uploads"
    RESULTS_DIR: str = "results"
    
    # Model Paths
    YOLO_MODEL: str = "yolo11n.pt"  # YOLOv11 nano
    POSE_MODEL: str = "mediapipe"
    ACTION_MODEL: str = "videoMAE-base"  # or "timesformer-base"
    
    # Processing Settings
    TARGET_FPS: int = 10  # Process 10 frames per second
    FRAME_SIZE: int = 224  # Model input size
    SEQUENCE_LENGTH: int = 16  # Number of frames for action classification
    
    # Performance Thresholds
    CONFIDENCE_THRESHOLD: float = 0.5
    NMS_THRESHOLD: float = 0.4
    POSE_CONFIDENCE: float = 0.5
    
    # Action Classes (based on SpaceJam dataset + Basketball-Action-Recognition)
    ACTION_CLASSES: List[str] = [
        "shooting",
        "dribbling", 
        "passing",
        "defense",
        "running",
        "walking",
        "blocking",
        "picking",
        "ball_in_hand",
        "idle"
    ]
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Create necessary directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.RESULTS_DIR, exist_ok=True)
