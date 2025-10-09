"""
Application configuration settings.
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database - Using SQLite for development
    DATABASE_URL: str = "sqlite:///./basketball_performance.db"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:8000",
        "http://10.7.17.177:3000",
        "http://10.7.17.177:3001",
        "http://172.19.0.1:3000",
        "http://172.19.0.1:3001",
        "*"  # Allow all origins in development
    ]
    
    # File Upload
    MAX_FILE_SIZE: str = "500MB"
    ALLOWED_VIDEO_EXTENSIONS: List[str] = ["mp4", "mov", "avi", "mkv"]
    
    # MinIO
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_BUCKET: str = "basketball-videos"
    MINIO_EXTERNAL_ENDPOINT: Optional[str] = None
    
    # AI Service
    AI_SERVICE_URL: str = "http://ai-service:8001"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
