"""
Event ingestion endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse

router = APIRouter()


@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new event."""
    event = Event(
        player_id=event_data.player_id,
        session_id=event_data.session_id,
        timestamp=event_data.timestamp,
        type=event_data.type,
        meta=event_data.meta
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return EventResponse(
        id=event.id,
        player_id=event.player_id,
        session_id=event.session_id,
        timestamp=event.timestamp,
        type=event.type,
        meta=event.meta
    )


@router.get("/player/{player_id}")
async def get_player_events(
    player_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get events for a specific player."""
    events = db.query(Event).filter(Event.player_id == player_id).all()
    
    return [
        EventResponse(
            id=event.id,
            player_id=event.player_id,
            session_id=event.session_id,
            timestamp=event.timestamp,
            type=event.type,
            meta=event.meta
        )
        for event in events
    ]
