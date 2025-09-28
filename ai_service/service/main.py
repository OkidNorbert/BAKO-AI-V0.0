"""
Basketball Performance System - AI Service
Computer vision and machine learning service for video analysis.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from service.core.config import settings
from service.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting Basketball Performance System AI Service...")
    
    # Load AI models
    print("📦 Loading AI models...")
    # TODO: Load MediaPipe, YOLOv8 models here
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Basketball Performance System AI Service...")


# Create FastAPI application
app = FastAPI(
    title="Basketball Performance System AI Service",
    description="AI-powered video analysis for basketball performance tracking",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "message": "Basketball Performance System AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "basketball-performance-ai-service",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "service.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG
    )
