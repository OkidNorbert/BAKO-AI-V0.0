"""
Fatigue Tracker - Monitors player fatigue indicators over time.

Tracks speed decline and reaction delay increase to identify fatigue patterns.
"""
from typing import Dict, Any, List
import numpy as np
from .base import BaseAnalyticsModule


class FatigueTracker(BaseAnalyticsModule):
    """Tracks player fatigue indicators using speed and reaction metrics."""
    
    def __init__(
        self,
        time_window_minutes: float = 2.0,
        baseline_window_minutes: float = 3.0,
        low_fatigue_threshold: float = 5.0,
        medium_fatigue_threshold: float = 15.0,
    ):
        """
        Initialize fatigue tracker.
        
        Args:
            time_window_minutes: Size of rolling time window for analysis
            baseline_window_minutes: Duration of early-game baseline period
            low_fatigue_threshold: Percentage decline for low fatigue
            medium_fatigue_threshold: Percentage decline for medium fatigue
        """
        super().__init__("fatigue_tracker")
        self.time_window_minutes = time_window_minutes
        self.baseline_window_minutes = baseline_window_minutes
        self.low_threshold = low_fatigue_threshold
        self.medium_threshold = medium_fatigue_threshold
    
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
        Track fatigue indicators for all players over time.
        
        Returns:
            Dictionary with fatigue metrics per player per time window
        """
        defensive_reactions = kwargs.get("defensive_reactions", [])
        
        fatigue_indices = []
        
        # Get all unique players
        all_players = set()
        for assignment in player_assignment:
            all_players.update(assignment.keys())
        
        # Calculate baseline metrics (first N minutes)
        baseline_frames = int(self.baseline_window_minutes * 60 * fps)
        baseline_metrics = self._calculate_baseline_metrics(
            all_players,
            speeds[:baseline_frames],
            defensive_reactions,
            baseline_frames
        )
        
        # Analyze in time windows
        window_frames = int(self.time_window_minutes * 60 * fps)
        total_frames = len(speeds)
        
        for window_start in range(0, total_frames, window_frames):
            window_end = min(window_start + window_frames, total_frames)
            window_minute = int((window_start / fps) / 60)
            
            # Skip if this is the baseline window
            if window_start < baseline_frames:
                continue
            
            window_speeds = speeds[window_start:window_end]
            
            for player_id in all_players:
                # Calculate current window metrics
                player_speeds = []
                for frame_speeds in window_speeds:
                    if player_id in frame_speeds:
                        player_speeds.append(frame_speeds[player_id])
                
                if not player_speeds:
                    continue
                
                current_avg_speed = np.mean(player_speeds)
                
                # Get baseline for this player
                baseline_speed = baseline_metrics.get(player_id, {}).get("avg_speed", 0)
                baseline_reaction = baseline_metrics.get(player_id, {}).get("avg_reaction_ms")
                
                if baseline_speed == 0:
                    continue
                
                # Calculate speed decline
                speed_drop_pct = ((baseline_speed - current_avg_speed) / baseline_speed) * 100
                
                # Calculate reaction delay increase (if available)
                window_reactions = [
                    r for r in defensive_reactions
                    if r.get("defender_track_id") == player_id
                    and window_start <= r.get("event_frame", 0) < window_end
                    and r.get("reaction_delay_ms") is not None
                ]
                
                if window_reactions and baseline_reaction:
                    current_reaction = np.mean([r["reaction_delay_ms"] for r in window_reactions])
                    reaction_increase_pct = ((current_reaction - baseline_reaction) / baseline_reaction) * 100
                else:
                    current_reaction = None
                    reaction_increase_pct = None
                
                # Classify fatigue level
                if speed_drop_pct < self.low_threshold:
                    fatigue_level = "low"
                elif speed_drop_pct < self.medium_threshold:
                    fatigue_level = "medium"
                else:
                    fatigue_level = "high"
                
                fatigue_indices.append({
                    "player_track_id": player_id,
                    "time_window_start": window_start / fps if fps > 0 else 0,
                    "time_window_end": window_end / fps if fps > 0 else 0,
                    "minute": window_minute,
                    "baseline_speed_mps": float(baseline_speed),
                    "current_speed_mps": float(current_avg_speed),
                    "speed_drop_percentage": float(speed_drop_pct),
                    "baseline_reaction_ms": float(baseline_reaction) if baseline_reaction else None,
                    "current_reaction_ms": float(current_reaction) if current_reaction else None,
                    "reaction_delay_increase_percentage": float(reaction_increase_pct) if reaction_increase_pct else None,
                    "fatigue_level": fatigue_level
                })
        
        # Calculate summary statistics
        if fatigue_indices:
            high_fatigue_count = sum(1 for f in fatigue_indices if f["fatigue_level"] == "high")
            medium_fatigue_count = sum(1 for f in fatigue_indices if f["fatigue_level"] == "medium")
            
            summary = {
                "total_measurements": len(fatigue_indices),
                "high_fatigue_instances": high_fatigue_count,
                "medium_fatigue_instances": medium_fatigue_count,
                "avg_speed_drop_pct": float(np.mean([f["speed_drop_percentage"] for f in fatigue_indices])),
                "max_speed_drop_pct": float(max(f["speed_drop_percentage"] for f in fatigue_indices)),
            }
        else:
            summary = {
                "total_measurements": 0,
                "high_fatigue_instances": 0,
                "medium_fatigue_instances": 0,
                "avg_speed_drop_pct": 0,
                "max_speed_drop_pct": 0,
            }
        
        return {
            "fatigue_indices": fatigue_indices,
            "summary": summary,
            "status": "success"
        }
    
    def _calculate_baseline_metrics(
        self,
        players: set,
        baseline_speeds: List[Dict],
        defensive_reactions: List[Dict],
        baseline_frames: int
    ) -> Dict[int, Dict[str, float]]:
        """
        Calculate baseline metrics for each player from early game.
        
        Args:
            players: Set of player IDs
            baseline_speeds: Speed data from baseline period
            defensive_reactions: All defensive reaction data
            baseline_frames: Number of frames in baseline
        
        Returns:
            Dictionary mapping player_id to baseline metrics
        """
        baseline_metrics = {}
        
        for player_id in players:
            # Collect speeds
            player_speeds = []
            for frame_speeds in baseline_speeds:
                if player_id in frame_speeds:
                    player_speeds.append(frame_speeds[player_id])
            
            if player_speeds:
                avg_speed = np.mean(player_speeds)
            else:
                avg_speed = 0
            
            # Collect reaction times
            player_reactions = [
                r["reaction_delay_ms"]
                for r in defensive_reactions
                if r.get("defender_track_id") == player_id
                and r.get("event_frame", 0) < baseline_frames
                and r.get("reaction_delay_ms") is not None
            ]
            
            if player_reactions:
                avg_reaction = np.mean(player_reactions)
            else:
                avg_reaction = None
            
            baseline_metrics[player_id] = {
                "avg_speed": avg_speed,
                "avg_reaction_ms": avg_reaction
            }
        
        return baseline_metrics
