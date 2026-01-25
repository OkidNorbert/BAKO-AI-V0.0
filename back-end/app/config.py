"""
Configuration settings for the Basketball Analysis API.

Uses Pydantic Settings for environment variable management with type validation.
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application settings
    app_name: str = "Basketball Analysis API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Supabase configuration
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_service_key: Optional[str] = None
    
    # JWT settings
    jwt_secret: str = "your-super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24  # 24 hours

    # CORS (comma-separated list). Example: "http://localhost:5173,https://yourapp.com"
    cors_origins: str = ""
    
    # File storage
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 500
    allowed_video_extensions: str = "mp4,avi,mov,mkv"
    serve_uploads_in_debug: bool = True
    
    # GPU settings
    gpu_enabled: bool = True
    cuda_device: int = 0
    
    # Model paths (relative to backend root)
    player_detector_path: str = "models/player_detector.pt"
    ball_detector_path: str = "models/ball_detector_model.pt"
    court_keypoint_detector_path: str = "models/court_keypoint_detector.pt"
    pose_model_path: str = "models/yolov8n-pose.pt"
    
    # Processing settings
    batch_size: int = 20
    detection_confidence: float = 0.5
    
    @property
    def allowed_extensions_list(self) -> list[str]:
        """Get allowed video extensions as a list."""
        return [ext.strip().lower() for ext in self.allowed_video_extensions.split(",")]
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        if not self.cors_origins:
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        """Get max upload size in bytes."""
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
