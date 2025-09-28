"""
Player schemas.
"""

from pydantic import BaseModel
from typing import Optional


class PlayerProfileResponse(BaseModel):
    """Player profile response schema."""
    id: int
    user_id: int
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    position: Optional[str] = None
    team_id: Optional[int] = None
    
    class Config:
        from_attributes = True
