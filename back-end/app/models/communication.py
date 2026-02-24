from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=2000)

class AnnouncementCreate(AnnouncementBase):
    pass

class Announcement(AnnouncementBase):
    id: UUID
    organization_id: UUID
    author_id: UUID
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AnnouncementListResponse(BaseModel):
    announcements: List[Announcement]
    total: int
