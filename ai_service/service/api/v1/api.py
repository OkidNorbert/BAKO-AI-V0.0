"""
AI Service API v1 router configuration.
"""

from fastapi import APIRouter
from service.api.v1.endpoints import health, analyze

# Create main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["analysis"])
