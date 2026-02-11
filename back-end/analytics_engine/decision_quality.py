"""
Decision Quality Engine - Analyzes shot decision quality.

Compares shooter's contested distance vs. teammate openness to evaluate
whether the shot was the best available option.
"""
from typing import Dict, Any, List
import numpy as np
from .base import BaseAnalyticsModule


class DecisionQualityEngine(BaseAnalyticsModule):
    """Analyzes shot decision quality based on player openness."""
    
    def __init__(
        self,
        open_threshold_m: float = 2.5,
        contested_threshold_m: float = 1.5,
    ):
        """
        Initialize decision quality engine.
        
        Args:
            open_threshold_m: Distance to defender for "open" classification
            contested_threshold_m: Distance to defender for "contested" classification
        """
        super().__init__("decision_quality")
        self.open_threshold = open_threshold_m
        self.contested_threshold = contested_threshold_m
    
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
        Analyze decision quality for all shots.
        
        Returns:
            Dictionary with decision analysis for each shot
        """
        decision_analyses = []
        
        for shot in shots:
            frame = shot.get("start_frame", shot.get("frame", 0))
            if frame >= len(player_assignment) or frame >= len(tactical_positions):
                continue
            
            assignment = player_assignment[frame]
            tactical_pos = tactical_positions[frame]
            
            shooter_id = shot.get("player_id")
            if not shooter_id or shooter_id not in assignment:
                continue
            
            offense_team = assignment[shooter_id]
            defense_team = 1 if offense_team == 2 else 2
            
            shooter_pos = tactical_pos.get(shooter_id)
            if not shooter_pos:
                continue
            
            # Find nearest defender to shooter
            shooter_contested_distance = float('inf')
            for player_id, team_id in assignment.items():
                if team_id == defense_team and player_id in tactical_pos:
                    defender_pos = tactical_pos[player_id]
                    dist = self._euclidean_distance(shooter_pos, defender_pos)
                    if dist < shooter_contested_distance:
                        shooter_contested_distance = dist
            
            # Analyze teammates' openness
            open_teammates = 0
            best_teammate_openness = 0.0
            teammate_data = []
            
            for player_id, team_id in assignment.items():
                if team_id == offense_team and player_id != shooter_id and player_id in tactical_pos:
                    teammate_pos = tactical_pos[player_id]
                    
                    # Find nearest defender to this teammate
                    min_defender_dist = float('inf')
                    for def_id, def_team in assignment.items():
                        if def_team == defense_team and def_id in tactical_pos:
                            def_pos = tactical_pos[def_id]
                            dist = self._euclidean_distance(teammate_pos, def_pos)
                            if dist < min_defender_dist:
                                min_defender_dist = dist
                    
                    teammate_data.append({
                        "player_id": player_id,
                        "defender_distance": float(min_defender_dist)
                    })
                    
                    if min_defender_dist > self.open_threshold:
                        open_teammates += 1
                        if min_defender_dist > best_teammate_openness:
                            best_teammate_openness = min_defender_dist
            
            # Determine decision quality
            shooter_is_contested = shooter_contested_distance < self.contested_threshold
            has_open_teammate = open_teammates > 0
            
            if shooter_is_contested and has_open_teammate:
                # Bad decision: shooter contested but open teammate available
                decision_quality = "low_expected_value"
            elif not shooter_is_contested:
                # Good decision: shooter is open
                decision_quality = "high_expected_value"
            else:
                # Acceptable: shooter contested but no better options
                decision_quality = "acceptable"
            
            decision_analyses.append({
                "event_id": f"shot_{frame}",
                "shot_frame": frame,
                "shooter_track_id": shooter_id,
                "shooter_contested_distance": float(shooter_contested_distance),
                "open_teammates": open_teammates,
                "best_teammate_openness": float(best_teammate_openness) if best_teammate_openness > 0 else None,
                "decision_quality": decision_quality,
                "teammate_positions": teammate_data,
                "shot_outcome": shot.get("outcome", "unknown")
            })
        
        # Calculate summary statistics
        if decision_analyses:
            quality_counts = {
                "high_expected_value": 0,
                "acceptable": 0,
                "low_expected_value": 0
            }
            for analysis in decision_analyses:
                quality_counts[analysis["decision_quality"]] += 1
            
            total = len(decision_analyses)
            
            summary = {
                "total_shots_analyzed": total,
                "high_ev_shots": quality_counts["high_expected_value"],
                "acceptable_shots": quality_counts["acceptable"],
                "low_ev_shots": quality_counts["low_expected_value"],
                "low_ev_rate": (quality_counts["low_expected_value"] / total * 100) if total > 0 else 0,
                "avg_shooter_contested_distance": float(np.mean([
                    a["shooter_contested_distance"] for a in decision_analyses
                ])),
            }
        else:
            summary = {
                "total_shots_analyzed": 0,
                "high_ev_shots": 0,
                "acceptable_shots": 0,
                "low_ev_shots": 0,
                "low_ev_rate": 0,
                "avg_shooter_contested_distance": 0,
            }
        
        return {
            "decision_analyses": decision_analyses,
            "summary": summary,
            "status": "success"
        }
