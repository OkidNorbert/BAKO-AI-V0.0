import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.dependencies import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

class TeamPlayerResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    position: Optional[str]
    height_cm: Optional[int]
    weight_kg: Optional[float]
    team_id: Optional[int]
    created_at: str
    last_session: Optional[str]
    performance_score: Optional[float]
    total_sessions: int

@router.get("/", response_model=List[TeamPlayerResponse])
async def get_team_players(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all players in the coach's team
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can access team players"
            )
        
        # Get team players with their performance data
        try:
            team_players_query = """
            SELECT 
                pp.id,
                pp.user_id,
                u.full_name,
                u.email,
                pp.position,
                pp.height_cm,
                pp.weight_kg,
                pp.team_id,
                pp.created_at,
                MAX(e.timestamp) as last_session_timestamp,
                COUNT(DISTINCT e.id) as total_sessions,
                AVG(CAST(e.meta->>'performance_score' AS FLOAT)) as avg_performance
            FROM player_profiles pp
            JOIN users u ON pp.user_id = u.id
            LEFT JOIN events e ON pp.user_id::text = e.player_id
            WHERE pp.team_id IS NOT NULL
            GROUP BY pp.id, pp.user_id, u.full_name, u.email, pp.position, 
                     pp.height_cm, pp.weight_kg, pp.team_id, pp.created_at
            ORDER BY u.full_name
            """
            
            team_players = db.execute(team_players_query).fetchall()
        except Exception as e:
            logger.warning(f"Database query failed, returning empty data: {e}")
            # Return empty data instead of 503 error
            return []
        
        players = []
        for player in team_players:
            # Format last session date
            last_session = None
            if player.last_session_timestamp:
                last_session = datetime.fromtimestamp(player.last_session_timestamp).isoformat()
            
            players.append(TeamPlayerResponse(
                id=player.id,
                user_id=player.user_id,
                full_name=player.full_name,
                email=player.email,
                position=player.position,
                height_cm=player.height_cm,
                weight_kg=player.weight_kg,
                team_id=player.team_id,
                created_at=player.created_at.isoformat() if player.created_at else None,
                last_session=last_session,
                performance_score=round(player.avg_performance, 1) if player.avg_performance else None,
                total_sessions=player.total_sessions or 0
            ))
        
        return players
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 503 from database errors)
        raise
    except Exception as e:
        logger.error(f"Error fetching team players: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team players: {str(e)}"
        )

@router.get("/team/{player_id}", response_model=TeamPlayerResponse)
async def get_team_player(
    player_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get specific team player details
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can access team player details"
            )
        
        # Get specific player with performance data
        player_query = """
        SELECT 
            pp.id,
            pp.user_id,
            u.full_name,
            u.email,
            pp.position,
            pp.height_cm,
            pp.weight_kg,
            pp.team_id,
            pp.created_at,
            MAX(e.timestamp) as last_session_timestamp,
            COUNT(DISTINCT e.id) as total_sessions,
            AVG(CAST(e.meta->>'performance_score' AS FLOAT)) as avg_performance
        FROM player_profiles pp
        JOIN users u ON pp.user_id = u.id
        LEFT JOIN events e ON pp.user_id::text = e.player_id
        WHERE pp.id = :player_id
        GROUP BY pp.id, pp.user_id, u.full_name, u.email, pp.position, 
                 pp.height_cm, pp.weight_kg, pp.team_id, pp.created_at
        """
        
        player = db.execute(player_query, {"player_id": player_id}).fetchone()
        
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found"
            )
        
        # Format last session date
        last_session = None
        if player.last_session_timestamp:
            last_session = datetime.fromtimestamp(player.last_session_timestamp).isoformat()
        
        return TeamPlayerResponse(
            id=player.id,
            user_id=player.user_id,
            full_name=player.full_name,
            email=player.email,
            position=player.position,
            height_cm=player.height_cm,
            weight_kg=player.weight_kg,
            team_id=player.team_id,
            created_at=player.created_at.isoformat() if player.created_at else None,
            last_session=last_session,
            performance_score=round(player.avg_performance, 1) if player.avg_performance else None,
            total_sessions=player.total_sessions or 0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team player {player_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team player: {str(e)}"
        )

@router.put("/team/{player_id}")
async def update_team_player(
    player_id: int,
    player_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update team player information
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can update team players"
            )
        
        # Update player information
        update_query = """
        UPDATE player_profiles 
        SET position = :position,
            height_cm = :height_cm,
            weight_kg = :weight_kg
        WHERE id = :player_id
        """
        
        db.execute(update_query, {
            "player_id": player_id,
            "position": player_data.get("position"),
            "height_cm": player_data.get("height_cm"),
            "weight_kg": player_data.get("weight_kg")
        })
        db.commit()
        
        return {"message": "Player updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating team player {player_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update team player: {str(e)}"
        )
