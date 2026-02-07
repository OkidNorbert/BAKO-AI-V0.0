from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class MatchBase(BaseModel):
    opponent: str
    date: datetime
    location: Optional[str] = None
    result: Optional[str] = None
    score_us: Optional[int] = None
    score_them: Optional[int] = None
    notes: Optional[str] = None

class MatchCreate(MatchBase):
    organization_id: UUID

class MatchUpdate(BaseModel):
    opponent: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    result: Optional[str] = None
    score_us: Optional[int] = None
    score_them: Optional[int] = None
    notes: Optional[str] = None

class Match(MatchBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
