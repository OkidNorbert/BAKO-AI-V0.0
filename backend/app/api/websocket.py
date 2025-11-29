from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import cv2
import numpy as np
import base64
import json
from typing import List
from app.services.video_processor import VideoProcessor
from starlette.websockets import WebSocketState

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/analyze")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("🔌 WebSocket connected")
    
    # Get video processor from app state
    video_processor: VideoProcessor = websocket.app.state.video_processor
    
    if not video_processor:
        logger.error("❌ Video processor not initialized")
        await websocket.close(code=1011)
        return
    
    buffer: List[np.ndarray] = []
    BUFFER_SIZE = 16
    
    try:
        while True:
            # Receive frame (base64 string)
            data = await websocket.receive_text()
            
            # Decode base64 to image
            try:
                # Remove header if present (data:image/jpeg;base64,...)
                if "base64," in data:
                    data = data.split("base64,")[1]
                
                image_bytes = base64.b64decode(data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is None:
                    continue
                    
                buffer.append(frame)
                
                # Process when buffer is full
                if len(buffer) >= BUFFER_SIZE:
                    # Process sequence
                    result = await video_processor.process_sequence(buffer)
                    
                    if result:
                        # Send result back
                        await websocket.send_json(result.dict())
                    
                    # Slide window (keep last 8 frames for overlap, or clear all?)
                    # For real-time, maybe clear all to avoid lag?
                    # Or keep some for continuity. Let's keep 8.
                    buffer = buffer[8:]
                    
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                # Continue loop
                
    except WebSocketDisconnect:
        logger.info("🔌 WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close()
