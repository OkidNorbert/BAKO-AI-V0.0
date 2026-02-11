"""
Transition Effort Engine - Analyzes player effort during transition phases.

Tracks player speeds during the 3 seconds after possession changes and
classifies effort as sprint, jog, or walk.
"""
from typing import Dict, Any, List
import numpy as np
from .base import BaseAnalyticsModule


class TransitionEffortEngine(BaseAnalyticsModule):
    """Analyzes player effort during offensive/defensive transitions."""
    
    def __init__(
        self,
        sprint_threshold_mps: float = 5.5,
        jog_threshold_mps: float = 3.0,
        transition_duration_seconds: float = 3.0,
    ):
        """
        Initialize transition effort engine.
        
        Args:
            sprint_threshold_mps: Speed threshold for sprint classification
            jog_threshold_mps: Speed threshold for jog classification
            transition_duration_seconds: How long to track after possession change
        """
        super().__init__("transition_effort")
        self.sprint_threshold = sprint_threshold_mps
        self.jog_threshold = jog_threshold_mps
        self.transition_duration = transition_duration_seconds
    
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
        Analyze transition effort for all possession changes.
        
        Returns:
            Dictionary with transition effort metrics
        """
        transition_efforts = []
        
        # Detect possession changes
        possession_changes = self._detect_possession_changes(
            ball_possession,
            player_assignment
        )
        
        transition_window_frames = int(self.transition_duration * fps)
        
        for change in possession_changes:
            frame = change["frame"]
            old_team = change["old_team"]
            new_team = change["new_team"]
            
            # Analyze effort for both teams
            # Team gaining possession: offense transition
            # Team losing possession: defense transition
            
            end_frame = min(frame + transition_window_frames, len(speeds))
            
            for analyze_frame in range(frame, end_frame):
                if analyze_frame >= len(player_assignment) or analyze_frame >= len(speeds):
                    break
                
                assignment = player_assignment[analyze_frame]
                frame_speeds = speeds[analyze_frame]
                
                for player_id, team_id in assignment.items():
                    if player_id not in frame_speeds:
                        continue
                    
                    speed = frame_speeds[player_id]
                    
                    # Classify effort
                    if speed >= self.sprint_threshold:
                        effort_type = "sprint"
                        effort_score = 100
                    elif speed >= self.jog_threshold:
                        effort_type = "jog"
                        effort_score = 60
                    else:
                        effort_type = "walk"
                        effort_score = 20
                    
                    # Determine transition type
                    if team_id == new_team:
                        transition_type = "defense_to_offense"
                    else:
                        transition_type = "offense_to_defense"
                    
                    transition_efforts.append({
                        "possession_change_frame": frame,
                        "player_track_id": player_id,
                        "team_id": team_id,
                        "transition_type": transition_type,
                        "effort_type": effort_type,
                        "max_speed_mps": float(speed),
                        "effort_score": effort_score,
                        "frame": analyze_frame,
                        "timestamp": self._get_frame_time(analyze_frame, fps)
                    })
        
        # Aggregate by possession change
        aggregated_efforts = []
        for change in possession_changes:
            frame = change["frame"]
            change_efforts = [e for e in transition_efforts if e["possession_change_frame"] == frame]
            
            if change_efforts:
                # Group by player
                player_efforts = {}
                for effort in change_efforts:
                    pid = effort["player_track_id"]
                    if pid not in player_efforts:
                        player_efforts[pid] = []
                    player_efforts[pid].append(effort)
                
                # Calculate max speed and avg effort for each player
                for pid, efforts in player_efforts.items():
                    max_speed = max(e["max_speed_mps"] for e in efforts)
                    avg_speed = np.mean([e["max_speed_mps"] for e in efforts])
                    avg_effort_score = np.mean([e["effort_score"] for e in efforts])
                    
                    # Determine overall effort type based on max speed
                    if max_speed >= self.sprint_threshold:
                        overall_effort = "sprint"
                    elif max_speed >= self.jog_threshold:
                        overall_effort = "jog"
                    else:
                        overall_effort = "walk"
                    
                    aggregated_efforts.append({
                        "possession_change_frame": frame,
                        "player_track_id": pid,
                        "team_id": efforts[0]["team_id"],
                        "transition_type": efforts[0]["transition_type"],
                        "effort_type": overall_effort,
                        "max_speed_mps": float(max_speed),
                        "avg_speed_mps": float(avg_speed),
                        "effort_score": float(avg_effort_score),
                        "duration_seconds": self.transition_duration
                    })
        
        # Calculate summary statistics
        if aggregated_efforts:
            sprint_count = sum(1 for e in aggregated_efforts if e["effort_type"] == "sprint")
            jog_count = sum(1 for e in aggregated_efforts if e["effort_type"] == "jog")
            walk_count = sum(1 for e in aggregated_efforts if e["effort_type"] == "walk")
            total = len(aggregated_efforts)
            
            summary = {
                "total_transition_events": total,
                "sprint_count": sprint_count,
                "jog_count": jog_count,
                "walk_count": walk_count,
                "sprint_rate": (sprint_count / total * 100) if total > 0 else 0,
                "avg_effort_score": float(np.mean([e["effort_score"] for e in aggregated_efforts])),
                "avg_max_speed_mps": float(np.mean([e["max_speed_mps"] for e in aggregated_efforts])),
            }
        else:
            summary = {
                "total_transition_events": 0,
                "sprint_count": 0,
                "jog_count": 0,
                "walk_count": 0,
                "sprint_rate": 0,
                "avg_effort_score": 0,
                "avg_max_speed_mps": 0,
            }
        
        return {
            "transition_efforts": aggregated_efforts,
            "summary": summary,
            "status": "success"
        }
    
    def _detect_possession_changes(
        self,
        ball_possession: List[int],
        player_assignment: List[Dict]
    ) -> List[Dict]:
        """
        Detect frames where possession changes between teams.
        
        Args:
            ball_possession: Per-frame possession (track_id or -1)
            player_assignment: Per-frame team assignments
        
        Returns:
            List of possession change events
        """
        changes = []
        prev_team = None
        
        for frame_idx in range(len(ball_possession)):
            if frame_idx >= len(player_assignment):
                break
            
            possession_player = ball_possession[frame_idx]
            if possession_player == -1:
                continue
            
            assignment = player_assignment[frame_idx]
            if possession_player not in assignment:
                continue
            
            current_team = assignment[possession_player]
            
            if prev_team is not None and current_team != prev_team:
                changes.append({
                    "frame": frame_idx,
                    "old_team": prev_team,
                    "new_team": current_team
                })
            
            prev_team = current_team
        
        return changes
