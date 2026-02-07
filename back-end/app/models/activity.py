from uuid import UUID
from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel

class ActivityCreate(BaseModel):
    type: str # training, match, recovery, etc
    description: Optional[str] = None
    date: Optional[datetime] = None
    metadata: Optional[Dict] = None

class Activity(ActivityCreate):
    id: UUID
    player_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
