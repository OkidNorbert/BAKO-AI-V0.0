"""
Pydantic models for player schemas.
"""
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class PlayerCreate(BaseModel):
    """Request schema for creating a player profile."""
    name: str = Field(..., min_length=1, max_length=100)
    jersey_number: Optional[int] = Field(None, ge=0, le=99)
    position: Optional[str] = Field(None, max_length=50)
    height_cm: Optional[float] = Field(None, ge=100, le=250)
    weight_kg: Optional[float] = Field(None, ge=30, le=200)
    date_of_birth: Optional[date] = None
    organization_id: Optional[UUID] = Field(None, description="Required for TEAM players")
    phone: Optional[str] = None
    address: Optional[str] = None
    experience_years: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = "active"


class PlayerUpdate(BaseModel):
    """Request schema for updating a player profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    jersey_number: Optional[int] = Field(None, ge=0, le=99)
    position: Optional[str] = Field(None, max_length=50)
    height_cm: Optional[float] = Field(None, ge=100, le=250)
    weight_kg: Optional[float] = Field(None, ge=30, le=200)
    date_of_birth: Optional[date] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    experience_years: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None


class Player(BaseModel):
    """Complete player model returned from API."""
    id: UUID
    name: str
    jersey_number: Optional[int] = None
    position: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    date_of_birth: Optional[date] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    experience_years: Optional[str] = None
    bio: Optional[str] = None
    organization_id: Optional[UUID] = None
    user_id: Optional[UUID] = None  # For PERSONAL accounts
    email: Optional[str] = None
    status: Optional[str] = "active"
    ppg: Optional[float] = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

    @field_validator("experience_years", mode="before")
    @classmethod
    def coerce_experience_years(cls, v):
        """Convert numeric experience_years to string (handles DB int values)."""
        if v is not None and not isinstance(v, str):
            return str(v)
        return v


class PlayerWithStats(Player):
    """Player with aggregated performance statistics."""
    total_videos: int = 0
    total_training_minutes: float = 0.0
    avg_speed_kmh: Optional[float] = None
    total_distance_km: Optional[float] = None


class PlayerListResponse(BaseModel):
    """Response schema for listing players."""
    players: List[Player]
    total: int
