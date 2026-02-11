"""
Base class for all analytics modules.

Provides common interface and error handling for analytics processing.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class BaseAnalyticsModule(ABC):
    """Abstract base class for analytics modules."""
    
    def __init__(self, module_name: str):
        """
        Initialize the analytics module.
        
        Args:
            module_name: Name of the module for logging
        """
        self.module_name = module_name
        self.logger = logging.getLogger(f"analytics_engine.{module_name}")
    
    @abstractmethod
    def process(
        self,
        video_frames: List[Any],
        player_tracks: List[Dict],
        ball_tracks: List[Dict],
        tactical_positions: List[Dict],
        player_assignment: List[Dict],
        ball_possession: List[int],
        events: List[Dict],
        shots: List[Dict],
        court_keypoints: List[Dict],
        speeds: List[Dict],
        video_path: str,
        fps: float,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process analytics for the given video data.
        
        Args:
            video_frames: List of video frames
            player_tracks: Per-frame player tracking data
            ball_tracks: Per-frame ball tracking data
            tactical_positions: 2D court positions for players
            player_assignment: Per-frame team assignments
            ball_possession: Per-frame ball possession (track_id or -1)
            events: List of detected events (passes, interceptions, etc.)
            shots: List of detected shots with metadata
            court_keypoints: Court boundary keypoints
            speeds: Per-frame player speeds
            video_path: Path to original video file
            fps: Video frames per second
            **kwargs: Additional module-specific parameters
        
        Returns:
            Dictionary containing module-specific analytics results
        """
        pass
    
    def safe_process(self, *args, **kwargs) -> Dict[str, Any]:
        """
        Safely execute process() with error handling.
        
        Returns partial results on error instead of crashing.
        """
        try:
            return self.process(*args, **kwargs)
        except Exception as e:
            self.logger.error(f"{self.module_name} processing failed: {e}", exc_info=True)
            return {
                "error": str(e),
                "module": self.module_name,
                "status": "failed"
            }
    
    def _get_frame_time(self, frame_idx: int, fps: float) -> float:
        """Convert frame index to timestamp in seconds."""
        return frame_idx / fps if fps > 0 else 0.0
    
    def _euclidean_distance(self, pos1: List[float], pos2: List[float]) -> float:
        """Calculate Euclidean distance between two 2D positions."""
        if not pos1 or not pos2 or len(pos1) < 2 or len(pos2) < 2:
            return float('inf')
        return ((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2) ** 0.5
