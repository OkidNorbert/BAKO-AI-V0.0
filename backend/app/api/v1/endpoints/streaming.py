"""
Real-time streaming WebSocket endpoints.
"""

import logging
import json
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.dependencies import get_current_user
from app.core.streaming import connection_manager, real_time_analyzer
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


@router.websocket("/live/{player_id}")
async def websocket_live_stream(websocket: WebSocket, player_id: str):
    """WebSocket endpoint for live player streaming."""
    client_id = f"client_{player_id}_{hash(websocket)}"
    
    try:
        await connection_manager.connect(websocket, client_id, player_id)
        
        # Send initial connection confirmation
        await connection_manager.send_personal_message(
            json.dumps({
                "type": "connection_established",
                "player_id": player_id,
                "client_id": client_id,
                "timestamp": datetime.now().isoformat()
            }),
            websocket
        )
        
        # Keep connection alive and handle messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Process different message types
                await _handle_client_message(player_id, message, websocket)
                
            except WebSocketDisconnect:
                logger.info(f"🔌 WebSocket disconnected: {client_id}")
                break
            except Exception as e:
                logger.error(f"❌ Error handling WebSocket message: {e}")
                await connection_manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": str(e),
                        "timestamp": datetime.now().isoformat()
                    }),
                    websocket
                )
    
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {client_id}")
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
    finally:
        connection_manager.disconnect(websocket, player_id)


@router.websocket("/coach/{team_id}")
async def websocket_coach_dashboard(websocket: WebSocket, team_id: str):
    """WebSocket endpoint for coach dashboard streaming."""
    client_id = f"coach_{team_id}_{hash(websocket)}"
    
    try:
        await connection_manager.connect(websocket, client_id, f"team_{team_id}")
        
        # Send initial connection confirmation
        await connection_manager.send_personal_message(
            json.dumps({
                "type": "coach_connection_established",
                "team_id": team_id,
                "client_id": client_id,
                "timestamp": datetime.now().isoformat()
            }),
            websocket
        )
        
        # Keep connection alive
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                await _handle_coach_message(team_id, message, websocket)
                
            except WebSocketDisconnect:
                logger.info(f"🔌 Coach WebSocket disconnected: {client_id}")
                break
            except Exception as e:
                logger.error(f"❌ Error handling coach WebSocket: {e}")
    
    except WebSocketDisconnect:
        logger.info(f"🔌 Coach WebSocket disconnected: {client_id}")
    except Exception as e:
        logger.error(f"❌ Coach WebSocket error: {e}")
    finally:
        connection_manager.disconnect(websocket, f"team_{team_id}")


@router.post("/live/event")
async def send_live_event(
    event_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Send a live event to be processed and broadcast."""
    try:
        player_id = str(event_data.get("player_id"))
        
        if not player_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player ID is required"
            )
        
        # Process the live event
        await real_time_analyzer.process_live_event(player_id, event_data)
        
        return {
            "status": "success",
            "message": "Live event processed and broadcast",
            "player_id": player_id
        }
        
    except Exception as e:
        logger.error(f"❌ Error sending live event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing live event: {str(e)}"
        )


@router.post("/live/wearable")
async def send_live_wearable_data(
    wearable_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Send live wearable data to be processed and broadcast."""
    try:
        player_id = str(wearable_data.get("player_id"))
        
        if not player_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player ID is required"
            )
        
        # Process the wearable data
        await real_time_analyzer.process_wearable_data(player_id, wearable_data)
        
        return {
            "status": "success",
            "message": "Wearable data processed and broadcast",
            "player_id": player_id
        }
        
    except Exception as e:
        logger.error(f"❌ Error sending wearable data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing wearable data: {str(e)}"
        )


@router.get("/live/session/{player_id}")
async def get_live_session_summary(
    player_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get live session summary for a player."""
    try:
        summary = await real_time_analyzer.get_live_session_summary(player_id)
        return summary
        
    except Exception as e:
        logger.error(f"❌ Error getting live session summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting session summary: {str(e)}"
        )


async def _handle_client_message(player_id: str, message: Dict[str, Any], websocket: WebSocket):
    """Handle messages from client WebSocket."""
    message_type = message.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        await connection_manager.send_personal_message(
            json.dumps({
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }),
            websocket
        )
    
    elif message_type == "request_metrics":
        # Send current live metrics
        if player_id in connection_manager.player_sessions:
            session = connection_manager.player_sessions[player_id]
            await connection_manager.send_personal_message(
                json.dumps({
                    "type": "live_metrics",
                    "player_id": player_id,
                    "metrics": session["metrics"],
                    "timestamp": datetime.now().isoformat()
                }),
                websocket
            )
    
    elif message_type == "request_summary":
        # Send session summary
        summary = await real_time_analyzer.get_live_session_summary(player_id)
        await connection_manager.send_personal_message(
            json.dumps({
                "type": "session_summary",
                "player_id": player_id,
                "summary": summary,
                "timestamp": datetime.now().isoformat()
            }),
            websocket
        )


async def _handle_coach_message(team_id: str, message: Dict[str, Any], websocket: WebSocket):
    """Handle messages from coach WebSocket."""
    message_type = message.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        await connection_manager.send_personal_message(
            json.dumps({
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }),
            websocket
        )
    
    elif message_type == "request_team_status":
        # Send team status
        team_status = await _get_team_status(team_id)
        await connection_manager.send_personal_message(
            json.dumps({
                "type": "team_status",
                "team_id": team_id,
                "status": team_status,
                "timestamp": datetime.now().isoformat()
            }),
            websocket
        )


async def _get_team_status(team_id: str) -> Dict[str, Any]:
    """Get team status for coach dashboard."""
    # TODO: Implement team status logic
    return {
        "team_id": team_id,
        "active_players": 0,
        "total_sessions": 0,
        "team_metrics": {}
    }
