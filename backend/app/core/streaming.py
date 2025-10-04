"""
Real-time streaming capabilities for live video analysis.
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.event import Event
from app.models.wearable import WearableData, DataType

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time streaming."""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.player_sessions: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str, player_id: str):
        """Accept a WebSocket connection."""
        await websocket.accept()
        
        if player_id not in self.active_connections:
            self.active_connections[player_id] = []
        
        self.active_connections[player_id].append(websocket)
        
        # Initialize player session
        if player_id not in self.player_sessions:
            self.player_sessions[player_id] = {
                "start_time": datetime.now(),
                "events": [],
                "metrics": {},
                "is_active": True
            }
        
        logger.info(f"🔗 WebSocket connected: {client_id} for player {player_id}")
    
    def disconnect(self, websocket: WebSocket, player_id: str):
        """Remove a WebSocket connection."""
        if player_id in self.active_connections:
            if websocket in self.active_connections[player_id]:
                self.active_connections[player_id].remove(websocket)
            
            if not self.active_connections[player_id]:
                del self.active_connections[player_id]
                if player_id in self.player_sessions:
                    self.player_sessions[player_id]["is_active"] = False
        
        logger.info(f"🔌 WebSocket disconnected for player {player_id}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"❌ Error sending message: {e}")
    
    async def broadcast_to_player(self, player_id: str, message: Dict[str, Any]):
        """Broadcast a message to all connections for a specific player."""
        if player_id in self.active_connections:
            message_str = json.dumps(message)
            disconnected = []
            
            for websocket in self.active_connections[player_id]:
                try:
                    await websocket.send_text(message_str)
                except Exception as e:
                    logger.error(f"❌ Error broadcasting to player {player_id}: {e}")
                    disconnected.append(websocket)
            
            # Remove disconnected websockets
            for websocket in disconnected:
                self.disconnect(websocket, player_id)
    
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast a message to all active connections."""
        message_str = json.dumps(message)
        
        for player_id, connections in self.active_connections.items():
            for websocket in connections:
                try:
                    await websocket.send_text(message_str)
                except Exception as e:
                    logger.error(f"❌ Error broadcasting to all: {e}")


class RealTimeAnalyzer:
    """Real-time video and performance analyzer."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.db = SessionLocal()
    
    async def process_live_event(self, player_id: str, event_data: Dict[str, Any]):
        """Process a live event and broadcast updates."""
        try:
            # Store event in database
            event = Event(
                player_id=player_id,
                session_id=event_data.get("session_id"),
                timestamp=event_data.get("timestamp", datetime.now().timestamp()),
                type=event_data.get("type"),
                meta=event_data.get("meta", {})
            )
            
            self.db.add(event)
            self.db.commit()
            
            # Update player session
            if player_id in self.connection_manager.player_sessions:
                session = self.connection_manager.player_sessions[player_id]
                session["events"].append(event_data)
                
                # Update metrics
                await self._update_live_metrics(player_id, event_data)
            
            # Broadcast to player's connections
            broadcast_message = {
                "type": "live_event",
                "player_id": player_id,
                "event": event_data,
                "timestamp": datetime.now().isoformat()
            }
            
            await self.connection_manager.broadcast_to_player(player_id, broadcast_message)
            
            logger.info(f"📡 Live event processed for player {player_id}: {event_data.get('type')}")
            
        except Exception as e:
            logger.error(f"❌ Error processing live event: {e}")
            self.db.rollback()
    
    async def process_wearable_data(self, player_id: str, wearable_data: Dict[str, Any]):
        """Process live wearable data and broadcast updates."""
        try:
            # Store wearable data
            data_point = WearableData(
                player_id=int(player_id),
                device_id=wearable_data.get("device_id"),
                data_type=DataType(wearable_data.get("data_type")),
                value=wearable_data.get("value"),
                unit=wearable_data.get("unit"),
                timestamp=datetime.fromisoformat(wearable_data.get("timestamp")),
                metadata=wearable_data.get("metadata", {})
            )
            
            self.db.add(data_point)
            self.db.commit()
            
            # Update live metrics
            await self._update_live_metrics(player_id, wearable_data)
            
            # Broadcast to player's connections
            broadcast_message = {
                "type": "wearable_data",
                "player_id": player_id,
                "data": wearable_data,
                "timestamp": datetime.now().isoformat()
            }
            
            await self.connection_manager.broadcast_to_player(player_id, broadcast_message)
            
        except Exception as e:
            logger.error(f"❌ Error processing wearable data: {e}")
            self.db.rollback()
    
    async def _update_live_metrics(self, player_id: str, data: Dict[str, Any]):
        """Update live performance metrics."""
        if player_id not in self.connection_manager.player_sessions:
            return
        
        session = self.connection_manager.player_sessions[player_id]
        metrics = session["metrics"]
        
        # Update based on data type
        data_type = data.get("type") or data.get("data_type")
        
        if data_type == "heart_rate" or data_type == "HEART_RATE":
            current_hr = data.get("value", 0)
            if "heart_rate" not in metrics:
                metrics["heart_rate"] = {"current": current_hr, "avg": current_hr, "max": current_hr}
            else:
                hr_data = metrics["heart_rate"]
                hr_data["current"] = current_hr
                hr_data["avg"] = (hr_data["avg"] + current_hr) / 2
                hr_data["max"] = max(hr_data["max"], current_hr)
        
        elif data_type == "shot_attempt":
            if "shots" not in metrics:
                metrics["shots"] = {"attempts": 0, "makes": 0, "accuracy": 0}
            
            metrics["shots"]["attempts"] += 1
            if data.get("meta", {}).get("made", False):
                metrics["shots"]["makes"] += 1
            
            metrics["shots"]["accuracy"] = (
                metrics["shots"]["makes"] / metrics["shots"]["attempts"] * 100
                if metrics["shots"]["attempts"] > 0 else 0
            )
        
        elif data_type == "jump":
            jump_height = data.get("meta", {}).get("jump_height", 0)
            if "jumps" not in metrics:
                metrics["jumps"] = {"count": 0, "avg_height": 0, "max_height": 0}
            
            jump_data = metrics["jumps"]
            jump_data["count"] += 1
            jump_data["avg_height"] = (jump_data["avg_height"] + jump_height) / 2
            jump_data["max_height"] = max(jump_data["max_height"], jump_height)
        
        # Broadcast updated metrics
        metrics_message = {
            "type": "live_metrics",
            "player_id": player_id,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
        await self.connection_manager.broadcast_to_player(player_id, metrics_message)
    
    async def get_live_session_summary(self, player_id: str) -> Dict[str, Any]:
        """Get live session summary for a player."""
        if player_id not in self.connection_manager.player_sessions:
            return {"error": "No active session"}
        
        session = self.connection_manager.player_sessions[player_id]
        start_time = session["start_time"]
        duration = (datetime.now() - start_time).total_seconds() / 60  # minutes
        
        return {
            "player_id": player_id,
            "session_duration": duration,
            "events_count": len(session["events"]),
            "metrics": session["metrics"],
            "is_active": session["is_active"],
            "start_time": start_time.isoformat()
        }


# Global instances
connection_manager = ConnectionManager()
real_time_analyzer = RealTimeAnalyzer(connection_manager)
