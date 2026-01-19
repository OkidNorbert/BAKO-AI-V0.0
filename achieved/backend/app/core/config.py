"""
Configuration settings for Basketball AI Backend
"""

from pydantic_settings import BaseSettings
from typing import List, Dict, Tuple
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "Bako API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    
    
    # CORS - Allow all origins for development/demo
    # TODO: Restrict to specific domains in production
    CORS_ORIGINS: List[str] = ["*"]  # Allow all origins for now
    
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
    
    # Action Classes (Enhanced with specific shooting types)
    ACTION_CLASSES: List[str] = [
        # Shooting (3 types based on court position)
        "free_throw",           # Free throw line (4.6m from basket)
        "two_point_shot",       # Inside 3-point line
        "three_point_shot",     # Behind 3-point line (6.75m)
        
        # Ball handling
        "dribbling",
        "passing",
        
        # Movement
        "defense",
        "running",
        "walking",
        
        # Game actions
        "blocking",
        "picking",
        "layup",                # Close-range shot
        "dunk",                 # Slam dunk
        
        # Other
        "ball_in_hand",
        "idle"
    ]
    
    # Shooting type detection (based on distance from basket)
    COURT_ZONES: Dict[str, Tuple[float, float]] = {
        "free_throw": (4.2, 4.9),      # Free throw line (4.6m ± margin)
        "paint": (0.0, 1.5),            # Under basket
        "two_point": (1.5, 6.75),       # Inside 3-point line
        "three_point": (6.75, 10.0),    # Behind 3-point line
    }
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4

    # Supabase Settings (loaded from environment variables)
    SUPABASE_URL: str = ""  # Set via SUPABASE_URL environment variable
    SUPABASE_KEY: str = ""  # Set via SUPABASE_KEY environment variable
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Create necessary directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.RESULTS_DIR, exist_ok=True)
