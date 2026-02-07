from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class NotificationBase(BaseModel):
    recipient_id: UUID
    title: str
    message: str
    type: str = "info" # info, warning, success, error
    read: bool = False
    action_link: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None

class Notification(NotificationBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: List[Notification]
    total: int
    unread_count: int
