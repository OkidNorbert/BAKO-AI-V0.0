"""
Player management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_coach_or_admin
from app.models.player import PlayerProfile
from app.models.user import User
from app.schemas.player import PlayerProfileResponse

router = APIRouter()


@router.get("/{player_id}", response_model=PlayerProfileResponse)
async def get_player(
    player_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get player profile by ID."""
    player = db.query(PlayerProfile).filter(PlayerProfile.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    # Check if user can access this player's data
    if current_user.role.value == "player" and player.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return PlayerProfileResponse(
        id=player.id,
        user_id=player.user_id,
        height_cm=player.height_cm,
        weight_kg=player.weight_kg,
        position=player.position,
        team_id=player.team_id
    )
