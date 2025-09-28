"""
Event schemas.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class EventCreate(BaseModel):
    """Event creation schema."""
    player_id: str
    session_id: int
    timestamp: float
    type: str
    meta: Optional[Dict[str, Any]] = None


class EventResponse(BaseModel):
    """Event response schema."""
    id: int
    player_id: str
    session_id: int
    timestamp: float
    type: str
    meta: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
