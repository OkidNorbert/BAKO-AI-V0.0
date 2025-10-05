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

class TeamSessionResponse(BaseModel):
    id: int
    player_id: int
    player_name: str
    session_type: str
    duration: int
    start_time: str
    end_time: Optional[str]
    status: str
    performance_score: Optional[float]
    events_count: int
    video_uploaded: bool
    notes: Optional[str]

@router.get("/team/sessions", response_model=List[TeamSessionResponse])
async def get_team_sessions(
    status_filter: Optional[str] = Query(None, description="Filter by session status"),
    session_type: Optional[str] = Query(None, description="Filter by session type"),
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all team sessions for coaches to monitor
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can access team sessions"
            )
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Build query with filters
        try:
            base_query = """
            SELECT 
                e.id,
                e.player_id,
                u.full_name as player_name,
                e.type as session_type,
                COALESCE(e.duration, 0) as duration,
                e.timestamp as start_time,
                e.end_timestamp as end_time,
                COALESCE(e.status, 'completed') as status,
                e.performance_score,
                COUNT(DISTINCT e2.id) as events_count,
                CASE WHEN v.id IS NOT NULL THEN true ELSE false END as video_uploaded,
                e.notes
            FROM events e
            JOIN users u ON e.player_id = u.id::text
            LEFT JOIN events e2 ON e.id = e2.session_id
            LEFT JOIN videos v ON e.id = v.session_id
            WHERE e.timestamp >= :start_date 
            AND e.timestamp <= :end_date
            AND e.type IN ('training_session', 'game_session', 'practice_session')
            """
            
            params = {
                "start_date": start_date.timestamp(),
                "end_date": end_date.timestamp()
            }
            
            # Add filters
            if status_filter:
                base_query += " AND e.status = :status_filter"
                params["status_filter"] = status_filter
            
            if session_type:
                base_query += " AND e.type = :session_type"
                params["session_type"] = session_type
            
            base_query += """
            GROUP BY e.id, e.player_id, u.full_name, e.type, e.duration, 
                     e.timestamp, e.end_timestamp, e.status, e.performance_score, v.id, e.notes
            ORDER BY e.timestamp DESC
            """
            
            sessions = db.execute(base_query, params).fetchall()
        except Exception as e:
            logger.error(f"Database query failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Team sessions service is currently unavailable. Please try again later."
            )
        
        team_sessions = []
        for session in sessions:
            # Format timestamps
            start_time = datetime.fromtimestamp(session.start_time).isoformat()
            end_time = None
            if session.end_time:
                end_time = datetime.fromtimestamp(session.end_time).isoformat()
            
            team_sessions.append(TeamSessionResponse(
                id=session.id,
                player_id=session.player_id,
                player_name=session.player_name,
                session_type=session.session_type,
                duration=session.duration or 0,
                start_time=start_time,
                end_time=end_time,
                status=session.status or 'completed',
                performance_score=round(session.performance_score, 1) if session.performance_score else None,
                events_count=session.events_count or 0,
                video_uploaded=session.video_uploaded,
                notes=session.notes
            ))
        
        return team_sessions
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 503 from database errors)
        raise
    except Exception as e:
        logger.error(f"Error fetching team sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team sessions: {str(e)}"
        )

@router.get("/team/sessions/{session_id}", response_model=TeamSessionResponse)
async def get_team_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get specific team session details
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can access team session details"
            )
        
        # Get specific session
        session_query = """
        SELECT 
            e.id,
            e.player_id,
            u.full_name as player_name,
            e.type as session_type,
            COALESCE(e.duration, 0) as duration,
            e.timestamp as start_time,
            e.end_timestamp as end_time,
            COALESCE(e.status, 'completed') as status,
            e.performance_score,
            COUNT(DISTINCT e2.id) as events_count,
            CASE WHEN v.id IS NOT NULL THEN true ELSE false END as video_uploaded,
            e.notes
        FROM events e
        JOIN users u ON e.player_id = u.id::text
        LEFT JOIN events e2 ON e.id = e2.session_id
        LEFT JOIN videos v ON e.id = v.session_id
        WHERE e.id = :session_id
        GROUP BY e.id, e.player_id, u.full_name, e.type, e.duration, 
                 e.timestamp, e.end_timestamp, e.status, e.performance_score, v.id, e.notes
        """
        
        session = db.execute(session_query, {"session_id": session_id}).fetchone()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Format timestamps
        start_time = datetime.fromtimestamp(session.start_time).isoformat()
        end_time = None
        if session.end_time:
            end_time = datetime.fromtimestamp(session.end_time).isoformat()
        
        return TeamSessionResponse(
            id=session.id,
            player_id=session.player_id,
            player_name=session.player_name,
            session_type=session.session_type,
            duration=session.duration or 0,
            start_time=start_time,
            end_time=end_time,
            status=session.status or 'completed',
            performance_score=round(session.performance_score, 1) if session.performance_score else None,
            events_count=session.events_count or 0,
            video_uploaded=session.video_uploaded,
            notes=session.notes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team session: {str(e)}"
        )

@router.put("/team/sessions/{session_id}/status")
async def update_session_status(
    session_id: int,
    status_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update session status (pause, resume, complete)
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can update session status"
            )
        
        new_status = status_data.get("status")
        if new_status not in ["active", "paused", "completed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be 'active', 'paused', or 'completed'"
            )
        
        # Update session status
        update_query = """
        UPDATE events 
        SET status = :status,
            end_timestamp = CASE 
                WHEN :status = 'completed' AND end_timestamp IS NULL THEN :current_timestamp
                ELSE end_timestamp
            END
        WHERE id = :session_id
        """
        
        db.execute(update_query, {
            "session_id": session_id,
            "status": new_status,
            "current_timestamp": datetime.now().timestamp()
        })
        db.commit()
        
        return {"message": f"Session status updated to {new_status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session {session_id} status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update session status: {str(e)}"
        )

@router.get("/team/sessions/stats")
async def get_team_session_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get team session statistics
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can access team session statistics"
            )
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get session statistics
        stats_query = """
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
            AVG(duration) as avg_duration,
            COUNT(CASE WHEN v.id IS NOT NULL THEN 1 END) as sessions_with_video,
            AVG(performance_score) as avg_performance
        FROM events e
        LEFT JOIN videos v ON e.id = v.session_id
        WHERE e.timestamp >= :start_date 
        AND e.timestamp <= :end_date
        AND e.type IN ('training_session', 'game_session', 'practice_session')
        """
        
        stats = db.execute(stats_query, {
            "start_date": start_date.timestamp(),
            "end_date": end_date.timestamp()
        }).fetchone()
        
        return {
            "total_sessions": stats.total_sessions or 0,
            "active_sessions": stats.active_sessions or 0,
            "completed_sessions": stats.completed_sessions or 0,
            "avg_duration": round(stats.avg_duration or 0, 1),
            "sessions_with_video": stats.sessions_with_video or 0,
            "avg_performance": round(stats.avg_performance or 0, 1)
        }
        
    except Exception as e:
        logger.error(f"Error fetching team session stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team session statistics: {str(e)}"
        )
