"""
Pydantic models for team and organization schemas.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    """Request schema for creating an organization."""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None
    primary_color: Optional[str] = Field("#FF5733", pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    secondary_color: Optional[str] = Field("#333333", pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    jersey_style: Optional[str] = Field("Solid", max_length=50)
    home_court: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    competition_settings: Optional[dict] = None
    roster_settings: Optional[dict] = None


class OrganizationUpdate(BaseModel):
    """Request schema for updating an organization."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    secondary_color: Optional[str] = Field(None, pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    jersey_style: Optional[str] = Field(None, max_length=50)
    home_court: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    competition_settings: Optional[dict] = None
    roster_settings: Optional[dict] = None


class Organization(BaseModel):
    """Complete organization model returned from API."""
    id: UUID
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#FF5733"
    secondary_color: str = "#333333"
    jersey_style: str = "Solid"
    home_court: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    competition_settings: Optional[dict] = None
    roster_settings: Optional[dict] = None
    owner_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OrganizationWithStats(Organization):
    """Organization with aggregated statistics."""
    player_count: int = 0
    video_count: int = 0
    total_analysis_count: int = 0


class OrganizationListResponse(BaseModel):
    """Response schema for listing organizations."""
    organizations: List[Organization]
    total: int
