"""
Spacing Engine - Analyzes offensive spacing quality.

Computes pairwise distances, paint density, and clustering to evaluate
how well offensive players are spaced on the court.
"""
from typing import Dict, Any, List
import numpy as np
from .base import BaseAnalyticsModule


class SpacingEngine(BaseAnalyticsModule):
    """Analyzes offensive spacing quality using geometric analysis."""
    
    def __init__(
        self,
        clustering_threshold_m: float = 1.5,
        good_spacing_threshold_m: float = 3.0,
        average_spacing_threshold_m: float = 2.0,
        paint_width_m: float = 4.9,  # Standard NBA paint width
        paint_length_m: float = 5.8,  # Standard NBA paint length
    ):
        """
        Initialize spacing engine.
        
        Args:
            clustering_threshold_m: Distance below which players are considered clustered
            good_spacing_threshold_m: Average distance for "good" spacing
            average_spacing_threshold_m: Average distance for "average" spacing
            paint_width_m: Width of the paint area in meters
            paint_length_m: Length of the paint area in meters
        """
        super().__init__("spacing_engine")
        self.clustering_threshold = clustering_threshold_m
        self.good_threshold = good_spacing_threshold_m
        self.average_threshold = average_spacing_threshold_m
        self.paint_width = paint_width_m
        self.paint_length = paint_length_m
    
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
        Analyze spacing quality across all frames.
        
        Returns:
            Dictionary with spacing metrics for each frame with possession
        """
        spacing_metrics = []
        
        for frame_idx in range(len(player_tracks)):
            if frame_idx >= len(tactical_positions) or frame_idx >= len(player_assignment):
                continue
            
            if frame_idx >= len(ball_possession):
                continue
            
            possession_player = ball_possession[frame_idx]
            if possession_player == -1:
                continue  # No possession, skip
            
            assignment = player_assignment[frame_idx]
            if possession_player not in assignment:
                continue
            
            offense_team = assignment[possession_player]
            
            # Get offensive players' tactical positions
            tactical_pos = tactical_positions[frame_idx]
            offensive_positions = []
            offensive_player_ids = []
            
            for player_id, team_id in assignment.items():
                if team_id == offense_team and player_id in tactical_pos:
                    pos = tactical_pos[player_id]
                    if isinstance(pos, (list, tuple)) and len(pos) >= 2:
                        offensive_positions.append(pos)
                        offensive_player_ids.append(player_id)
            
            if len(offensive_positions) < 2:
                continue  # Need at least 2 players for spacing analysis
            
            # Compute pairwise distances
            distances = []
            for i in range(len(offensive_positions)):
                for j in range(i + 1, len(offensive_positions)):
                    dist = self._euclidean_distance(
                        offensive_positions[i],
                        offensive_positions[j]
                    )
                    if dist != float('inf'):
                        distances.append(dist)
            
            if not distances:
                continue
            
            avg_distance = np.mean(distances)
            
            # Count players in paint (simplified: check if near hoop)
            # Assuming tactical view has hoop at specific location
            # For now, use a heuristic based on y-coordinate
            paint_players = self._count_paint_players(offensive_positions)
            
            # Detect overlaps (clustering)
            overlap_count = sum(1 for d in distances if d < self.clustering_threshold)
            
            # Classify spacing quality
            if avg_distance >= self.good_threshold:
                quality = "good"
            elif avg_distance >= self.average_threshold:
                quality = "average"
            else:
                quality = "poor"
            
            spacing_metrics.append({
                "frame": frame_idx,
                "timestamp": self._get_frame_time(frame_idx, fps),
                "spacing_quality": quality,
                "avg_distance_m": float(avg_distance),
                "paint_players": paint_players,
                "overlap_count": overlap_count,
                "player_positions": {
                    str(pid): pos for pid, pos in zip(offensive_player_ids, offensive_positions)
                },
                "offense_team": offense_team,
            })
        
        # Aggregate statistics
        if spacing_metrics:
            quality_counts = {"good": 0, "average": 0, "poor": 0}
            for metric in spacing_metrics:
                quality_counts[metric["spacing_quality"]] += 1
            
            total = len(spacing_metrics)
            summary = {
                "total_frames_analyzed": total,
                "good_spacing_pct": (quality_counts["good"] / total * 100) if total > 0 else 0,
                "average_spacing_pct": (quality_counts["average"] / total * 100) if total > 0 else 0,
                "poor_spacing_pct": (quality_counts["poor"] / total * 100) if total > 0 else 0,
                "avg_distance_overall": float(np.mean([m["avg_distance_m"] for m in spacing_metrics])),
            }
        else:
            summary = {
                "total_frames_analyzed": 0,
                "good_spacing_pct": 0,
                "average_spacing_pct": 0,
                "poor_spacing_pct": 0,
                "avg_distance_overall": 0,
            }
        
        return {
            "spacing_metrics": spacing_metrics,
            "summary": summary,
            "status": "success"
        }
    
    def _count_paint_players(self, positions: List[List[float]]) -> int:
        """
        Count how many players are in the paint area.
        
        This is a simplified heuristic. In a full implementation, you would
        use court keypoints to define the exact paint boundaries.
        
        Args:
            positions: List of [x, y] positions in tactical view
        
        Returns:
            Number of players in paint
        """
        # Simplified: assume tactical view has hoop at top (y=0) and paint extends downward
        # This is a placeholder - real implementation should use court_keypoints
        paint_count = 0
        for pos in positions:
            if len(pos) >= 2:
                # Heuristic: if y-coordinate is in top portion of court
                # (This assumes tactical view normalization)
                if pos[1] < 6.0:  # Within ~6m of hoop
                    paint_count += 1
        return paint_count
