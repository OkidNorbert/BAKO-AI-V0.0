"""
Defensive Reaction Engine - Analyzes defensive reaction times and closeout speeds.

For every offensive event (shot, pass, drive), measures how quickly the nearest
defender reacts and closes out.
"""
from typing import Dict, Any, List
import numpy as np
from .base import BaseAnalyticsModule


class DefensiveReactionEngine(BaseAnalyticsModule):
    """Analyzes defensive reaction times and closeout quality."""
    
    def __init__(
        self,
        late_closeout_delay_ms: float = 500,
        late_closeout_speed_mps: float = 4.0,
        reaction_window_frames: int = 30,  # ~1 second at 30fps
    ):
        """
        Initialize defensive reaction engine.
        
        Args:
            late_closeout_delay_ms: Reaction delay threshold for "late" classification
            late_closeout_speed_mps: Speed threshold for "late" classification
            reaction_window_frames: Number of frames to analyze after event
        """
        super().__init__("defensive_reaction")
        self.late_delay_threshold = late_closeout_delay_ms
        self.late_speed_threshold = late_closeout_speed_mps
        self.reaction_window = reaction_window_frames
    
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
        Analyze defensive reactions for all offensive events.
        
        Returns:
            Dictionary with defensive reaction metrics for each event
        """
        defensive_reactions = []
        
        # Analyze shots (primary offensive events)
        for shot in shots:
            frame = shot.get("start_frame", shot.get("frame", 0))
            if frame >= len(player_assignment) or frame >= len(tactical_positions):
                continue
            
            assignment = player_assignment[frame]
            tactical_pos = tactical_positions[frame]
            
            # Get shooter info
            shooter_id = shot.get("player_id")
            if not shooter_id or shooter_id not in assignment:
                continue
            
            offense_team = assignment[shooter_id]
            defense_team = 1 if offense_team == 2 else 2
            
            # Find nearest defender
            shooter_pos = tactical_pos.get(shooter_id)
            if not shooter_pos:
                continue
            
            nearest_defender = None
            min_distance = float('inf')
            
            for player_id, team_id in assignment.items():
                if team_id == defense_team and player_id in tactical_pos:
                    defender_pos = tactical_pos[player_id]
                    dist = self._euclidean_distance(shooter_pos, defender_pos)
                    if dist < min_distance:
                        min_distance = dist
                        nearest_defender = player_id
            
            if not nearest_defender:
                continue
            
            # Measure reaction (simplified: check if defender moved toward shooter)
            reaction_metrics = self._measure_reaction(
                frame,
                nearest_defender,
                shooter_id,
                tactical_positions,
                speeds,
                fps
            )
            
            defensive_reactions.append({
                "event_id": f"shot_{frame}",
                "event_type": "shot",
                "event_frame": frame,
                "defender_track_id": nearest_defender,
                "offensive_player_track_id": shooter_id,
                "distance_at_event": float(min_distance),
                **reaction_metrics
            })
        
        # Analyze passes
        for event in events:
            if event.get("event_type") != "pass":
                continue
            
            frame = event.get("frame", 0)
            if frame >= len(player_assignment) or frame >= len(tactical_positions):
                continue
            
            assignment = player_assignment[frame]
            tactical_pos = tactical_positions[frame]
            
            passer_id = event.get("player_id")
            if not passer_id or passer_id not in assignment:
                continue
            
            offense_team = assignment[passer_id]
            defense_team = 1 if offense_team == 2 else 2
            
            passer_pos = tactical_pos.get(passer_id)
            if not passer_pos:
                continue
            
            # Find nearest defender
            nearest_defender = None
            min_distance = float('inf')
            
            for player_id, team_id in assignment.items():
                if team_id == defense_team and player_id in tactical_pos:
                    defender_pos = tactical_pos[player_id]
                    dist = self._euclidean_distance(passer_pos, defender_pos)
                    if dist < min_distance:
                        min_distance = dist
                        nearest_defender = player_id
            
            if not nearest_defender:
                continue
            
            reaction_metrics = self._measure_reaction(
                frame,
                nearest_defender,
                passer_id,
                tactical_positions,
                speeds,
                fps
            )
            
            defensive_reactions.append({
                "event_id": f"pass_{frame}",
                "event_type": "pass",
                "event_frame": frame,
                "defender_track_id": nearest_defender,
                "offensive_player_track_id": passer_id,
                "distance_at_event": float(min_distance),
                **reaction_metrics
            })
        
        # Calculate summary statistics
        if defensive_reactions:
            late_closeouts = sum(1 for r in defensive_reactions if r.get("late_closeout", False))
            avg_reaction_delay = np.mean([
                r["reaction_delay_ms"] for r in defensive_reactions 
                if r.get("reaction_delay_ms") is not None
            ])
            avg_closeout_speed = np.mean([
                r["closeout_speed_mps"] for r in defensive_reactions 
                if r.get("closeout_speed_mps") is not None
            ])
            
            summary = {
                "total_defensive_events": len(defensive_reactions),
                "late_closeouts": late_closeouts,
                "late_closeout_rate": (late_closeouts / len(defensive_reactions) * 100),
                "avg_reaction_delay_ms": float(avg_reaction_delay) if not np.isnan(avg_reaction_delay) else None,
                "avg_closeout_speed_mps": float(avg_closeout_speed) if not np.isnan(avg_closeout_speed) else None,
            }
        else:
            summary = {
                "total_defensive_events": 0,
                "late_closeouts": 0,
                "late_closeout_rate": 0,
                "avg_reaction_delay_ms": None,
                "avg_closeout_speed_mps": None,
            }
        
        return {
            "defensive_reactions": defensive_reactions,
            "summary": summary,
            "status": "success"
        }
    
    def _measure_reaction(
        self,
        event_frame: int,
        defender_id: int,
        offensive_player_id: int,
        tactical_positions: List[Dict],
        speeds: List[Dict],
        fps: float
    ) -> Dict[str, Any]:
        """
        Measure defender's reaction to an offensive event.
        
        Args:
            event_frame: Frame when event occurred
            defender_id: Track ID of defender
            offensive_player_id: Track ID of offensive player
            tactical_positions: All tactical positions
            speeds: All speed data
            fps: Frames per second
        
        Returns:
            Dictionary with reaction metrics
        """
        # Simplified reaction measurement
        # In full implementation, would track defender movement vector toward offensive player
        
        reaction_start_frame = None
        max_speed = 0.0
        
        # Look at next N frames after event
        for offset in range(1, min(self.reaction_window, len(tactical_positions) - event_frame)):
            frame_idx = event_frame + offset
            
            if frame_idx >= len(speeds):
                break
            
            # Get defender speed in this frame
            frame_speeds = speeds[frame_idx]
            if defender_id in frame_speeds:
                speed = frame_speeds[defender_id]
                if speed > max_speed:
                    max_speed = speed
                
                # Detect reaction start (speed increase)
                if speed > 3.0 and reaction_start_frame is None:  # 3 m/s threshold
                    reaction_start_frame = frame_idx
        
        # Calculate metrics
        if reaction_start_frame:
            reaction_delay_frames = reaction_start_frame - event_frame
            reaction_delay_ms = (reaction_delay_frames / fps) * 1000 if fps > 0 else 0
        else:
            reaction_delay_ms = None
        
        closeout_speed_mps = max_speed if max_speed > 0 else None
        
        # Determine if late closeout
        late_closeout = False
        if reaction_delay_ms and reaction_delay_ms > self.late_delay_threshold:
            late_closeout = True
        if closeout_speed_mps and closeout_speed_mps < self.late_speed_threshold:
            late_closeout = True
        
        return {
            "reaction_start_frame": reaction_start_frame,
            "reaction_delay_ms": reaction_delay_ms,
            "closeout_speed_mps": closeout_speed_mps,
            "late_closeout": late_closeout
        }
