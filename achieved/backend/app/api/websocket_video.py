"""
WebSocket endpoint for streaming annotated video frames during upload processing
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import cv2
import numpy as np
import base64
from typing import Optional
from starlette.websockets import WebSocketState

router = APIRouter()
logger = logging.getLogger(__name__)

# Store active WebSocket connections for video processing
active_connections: dict[str, WebSocket] = {}


@router.websocket("/ws/video-stream/{video_id}")
async def video_stream_websocket(websocket: WebSocket, video_id: str):
    """
    WebSocket endpoint for streaming annotated video frames during processing
    
    Client connects with video_id, and backend sends annotated frames as they're processed
    """
    await websocket.accept()
    logger.info(f"🔌 Video stream WebSocket connected: {video_id}")
    
    try:
        # Store connection
        active_connections[video_id] = websocket
        
        # Keep connection alive and wait for frames
        while True:
            # Wait for ping or close message
            try:
                message = await websocket.receive_text()
                if message == "close":
                    break
            except:
                # Connection closed
                break
                
    except WebSocketDisconnect:
        logger.info(f"🔌 Video stream WebSocket disconnected: {video_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {video_id}: {e}")
    finally:
        # Clean up
        if video_id in active_connections:
            del active_connections[video_id]
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close()


async def send_annotated_frame_async(video_id: str, frame: np.ndarray) -> bool:
    """
    Send an annotated frame to the connected WebSocket client (async version)
    
    Args:
        video_id: Video ID to identify the connection
        frame: Annotated frame (BGR format from OpenCV)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if video_id not in active_connections:
        return False
    
    websocket = active_connections[video_id]
    
    try:
        # Encode frame to JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        
        # Convert to base64
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Send as JSON
        await websocket.send_json({
            "type": "frame",
            "data": frame_base64,
            "format": "jpg"
        })
        
        return True
    except Exception as e:
        logger.error(f"Failed to send frame for {video_id}: {e}")
        return False


def has_connection(video_id: str) -> bool:
    """Check if there's an active connection for this video_id"""
    return video_id in active_connections

