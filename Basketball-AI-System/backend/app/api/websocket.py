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
                
                # Process when buffer is full (or every few frames for faster response)
                if len(buffer) >= BUFFER_SIZE:
                    # Process sequence
                    result = await video_processor.process_sequence(buffer)
                    
                    if result:
                        # Convert to dict and ensure JSON serializable
                        result_dict = result.model_dump(mode='json') if hasattr(result, 'model_dump') else result.dict()
                        
                        # Format response to match frontend expectations
                        response = {
                            "action": {
                                "label": result_dict.get("action", {}).get("label", "unknown"),
                                "confidence": result_dict.get("action", {}).get("confidence", 0.0)
                            },
                            "metrics": {
                                "jump_height": result_dict.get("metrics", {}).get("jump_height", 0.0),
                                "movement_speed": result_dict.get("metrics", {}).get("movement_speed", 0.0),
                                "form_score": result_dict.get("metrics", {}).get("form_score", 0.0),
                                "pose_stability": result_dict.get("metrics", {}).get("pose_stability", 0.0),
                                "reaction_time": result_dict.get("metrics", {}).get("reaction_time", 0.0),
                                "energy_efficiency": result_dict.get("metrics", {}).get("energy_efficiency", 0.0)
                            },
                            "annotated_frame": result_dict.get("annotated_frame")
                        }
                        
                        # Send result back
                        await websocket.send_json(response)
                    
                    # Slide window (keep last 8 frames for overlap)
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
