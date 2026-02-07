from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ScheduleBase(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    type: str # training, match, meeting, other
    location: Optional[str] = None
    description: Optional[str] = None

class ScheduleCreate(ScheduleBase):
    organization_id: Optional[UUID] = None

class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    type: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class Schedule(ScheduleBase):
    id: UUID
    organization_id: Optional[UUID]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
