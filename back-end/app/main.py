"""
Basketball Analysis API - Main FastAPI Application

This module sets up the FastAPI application with all routes, middleware,
and exception handlers for the basketball performance analysis platform.
"""
import os
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.core import BasketballAPIException
from app.api import (
    auth, 
    videos, 
    analysis, 
    teams, 
    players, 
    analytics, 
    admin, 
    player_routes, 
    advanced_analytics,
    communications
)
from app.middleware.timeout import TimeoutMiddleware

# Basic rate limiting for abuse protection
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler for startup and shutdown events.
    """
    # Startup
    settings = get_settings()
    print(f"🏀 Starting {settings.app_name} v{settings.app_version}")

    # Basic production hardening
    if not settings.debug and settings.jwt_secret == "your-super-secret-key-change-in-production":
        raise ValueError("JWT_SECRET must be set in production (refusing to start with default secret).")
    
    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    # Check GPU availability
    if settings.gpu_enabled:
        try:
            import torch
            if torch.cuda.is_available():
                print(f"✅ GPU acceleration enabled: {torch.cuda.get_device_name(settings.cuda_device)}")
            else:
                print("⚠️ GPU requested but CUDA not available, falling back to CPU")
        except ImportError:
            print("⚠️ PyTorch not installed, running without GPU check")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down application")


def create_app() -> FastAPI:
    """
    Application factory for creating the FastAPI instance.
    """
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="""
        AI-driven basketball performance analysis platform.
        
        ## Features
        - **Video Analysis**: Upload and analyze basketball footage
        - **Team Analysis**: Multi-player tracking, passes, interceptions  
        - **Personal Analysis**: Individual skill metrics and pose analysis
        - **Progress Tracking**: Monitor improvement over time
        
        ## Account Types
        - **TEAM**: Manage organizations, players, and team analytics
        - **PERSONAL**: Focus on individual training and skill development
        """,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # Attach a rate limiter to the app. We keep limits conservative but safe by default.
    limiter = Limiter(key_func=get_remote_address, default_limits=[settings.default_rate_limit])
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    # Configure CORS
    # - In production, require explicit origins (settings.cors_origins)
    # - In debug, allow "*" but disable credentials to avoid insecure/invalid combo
    cors_origins = settings.cors_origins_list
    if settings.debug and not cors_origins:
        allow_origins = ["*"]
        allow_credentials = False
    else:
        allow_origins = cors_origins
        allow_credentials = True

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request timeout (avoid resource exhaustion)
    app.add_middleware(TimeoutMiddleware, timeout_seconds=settings.request_timeout_seconds)
    
    # Register exception handlers
    register_exception_handlers(app)
    
    # Register API routes
    register_routes(app)
    
    # Static files for uploads (debug/dev only). In production, use authenticated download endpoints
    # or signed object storage URLs instead of exposing a filesystem-backed directory.
    if settings.debug and settings.serve_uploads_in_debug and os.path.exists(settings.upload_dir):
        app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
    
    # Serve generated clips (highlights)
    # Note: In production, consider signed URLs or authenticated proxies.
    clips_dir = os.path.join(os.getcwd(), "output_videos", "clips")
    os.makedirs(clips_dir, exist_ok=True)
    app.mount("/clips", StaticFiles(directory=clips_dir), name="clips")
    
    return app


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers."""
    
    @app.exception_handler(BasketballAPIException)
    async def basketball_exception_handler(
        request: Request, exc: BasketballAPIException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.message,
                "details": exc.details,
            },
        )
    
    from fastapi.exceptions import RequestValidationError
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        print(f"Validation Error: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors()},
        )
    
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(
        request: Request, exc: RateLimitExceeded
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Too many requests",
                "details": {"message": str(exc)},
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # Log the error without leaking internals to clients
        settings = get_settings()
        # Use standard logging so deployments can aggregate logs
        import logging

        logger = logging.getLogger("basketball_api")
        logger.exception("Unhandled error", exc_info=exc)

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "An unexpected error occurred",
                # Only expose minimal type information; no stack traces or messages.
                "details": {"type": type(exc).__name__} if settings.debug else {},
            },
        )


def register_routes(app: FastAPI) -> None:
    """Register all API routers."""
    
    # Health check endpoint
    @app.get("/api/health", tags=["Health"])
    async def health_check() -> Dict[str, Any]:
        """Check API health status."""
        settings = get_settings()
        return {
            "status": "healthy",
            "version": settings.app_version,
            "gpu_enabled": settings.gpu_enabled,
        }
    
    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root() -> Dict[str, str]:
        """API root endpoint."""
        settings = get_settings()
        return {
            "message": f"Welcome to {settings.app_name}",
            "docs": "/docs",
            "health": "/api/health",
        }

    @app.get("/api/test-proxy")
    async def test_proxy():
        return {"status": "proxy-ok"}
    
    # Register API routers
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
    app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
    app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
    app.include_router(players.router, prefix="/api/players", tags=["Players"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
    app.include_router(advanced_analytics.router, prefix="/api/analytics/advanced", tags=["Advanced Analytics"])
    app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
    app.include_router(player_routes.router, prefix="/api/player", tags=["Player Portal"])
    app.include_router(communications.router, prefix="/api/communications", tags=["Communication"])


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
