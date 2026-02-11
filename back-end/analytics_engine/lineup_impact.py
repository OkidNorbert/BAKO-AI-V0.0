"""
Lineup Impact Engine - Analyzes performance of specific 5-player combinations.

Segments game by unique lineups and calculates offensive/defensive ratings,
spacing quality, and error rates for each combination.
"""
from typing import Dict, Any, List
import numpy as np
from .base import BaseAnalyticsModule


class LineupImpactEngine(BaseAnalyticsModule):
    """Analyzes performance metrics for specific player combinations."""
    
    def __init__(self):
        """Initialize lineup impact engine."""
        super().__init__("lineup_impact")
    
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
        Analyze lineup performance across the game.
        
        Returns:
            Dictionary with lineup metrics
        """
        # Get spacing metrics and defensive reactions from kwargs if available
        spacing_metrics = kwargs.get("spacing_metrics", [])
        defensive_reactions = kwargs.get("defensive_reactions", [])
        
        # Detect lineup segments
        lineup_segments = self._detect_lineup_segments(
            player_assignment,
            ball_possession,
            fps
        )
        
        lineup_metrics = []
        
        for segment in lineup_segments:
            team_id = segment["team_id"]
            lineup_hash = segment["lineup_hash"]
            player_ids = segment["player_ids"]
            start_frame = segment["start_frame"]
            end_frame = segment["end_frame"]
            
            # Calculate metrics for this lineup segment
            segment_shots = [
                s for s in shots
                if start_frame <= s.get("start_frame", s.get("frame", 0)) < end_frame
                and s.get("team") == team_id
            ]
            
            segment_shots_allowed = [
                s for s in shots
                if start_frame <= s.get("start_frame", s.get("frame", 0)) < end_frame
                and s.get("team") != team_id
            ]
            
            # Points scored (simplified: 2 points per made shot)
            points_scored = sum(2 for s in segment_shots if s.get("outcome") == "made")
            points_allowed = sum(2 for s in segment_shots_allowed if s.get("outcome") == "made")
            
            # Possessions (estimate from shots + turnovers)
            possessions = len(segment_shots)  # Simplified
            
            # Offensive/defensive ratings (per 100 possessions)
            if possessions > 0:
                offensive_rating = (points_scored / possessions) * 100
                defensive_rating = (points_allowed / possessions) * 100
                net_rating = offensive_rating - defensive_rating
            else:
                offensive_rating = 0
                defensive_rating = 0
                net_rating = 0
            
            # Average spacing score for this lineup
            segment_spacing = [
                m for m in spacing_metrics
                if start_frame <= m.get("frame", 0) < end_frame
            ]
            
            if segment_spacing:
                # Convert quality to numeric score
                quality_scores = []
                for m in segment_spacing:
                    if m["spacing_quality"] == "good":
                        quality_scores.append(3.0)
                    elif m["spacing_quality"] == "average":
                        quality_scores.append(2.0)
                    else:
                        quality_scores.append(1.0)
                avg_spacing_score = float(np.mean(quality_scores))
            else:
                avg_spacing_score = 0.0
            
            # Defensive error rate (late closeouts / total defensive events)
            segment_def_reactions = [
                r for r in defensive_reactions
                if start_frame <= r.get("event_frame", 0) < end_frame
            ]
            
            if segment_def_reactions:
                late_closeouts = sum(1 for r in segment_def_reactions if r.get("late_closeout", False))
                defensive_error_rate = late_closeouts / len(segment_def_reactions)
            else:
                defensive_error_rate = 0.0
            
            # Turnovers (from interceptions)
            segment_interceptions = [
                e for e in events
                if e.get("event_type") == "interception"
                and start_frame <= e.get("frame", 0) < end_frame
            ]
            turnovers = len(segment_interceptions)
            
            # Duration
            duration_seconds = (end_frame - start_frame) / fps if fps > 0 else 0
            duration_minutes = duration_seconds / 60
            
            lineup_metrics.append({
                "team_id": team_id,
                "lineup_hash": lineup_hash,
                "player_track_ids": player_ids,
                "possessions_count": possessions,
                "points_scored": points_scored,
                "points_allowed": points_allowed,
                "offensive_rating": float(offensive_rating),
                "defensive_rating": float(defensive_rating),
                "net_rating": float(net_rating),
                "avg_spacing_score": avg_spacing_score,
                "turnovers": turnovers,
                "defensive_error_rate": float(defensive_error_rate),
                "total_minutes": float(duration_minutes),
                "start_frame": start_frame,
                "end_frame": end_frame
            })
        
        # Calculate summary statistics
        if lineup_metrics:
            best_lineup = max(lineup_metrics, key=lambda x: x["net_rating"])
            worst_lineup = min(lineup_metrics, key=lambda x: x["net_rating"])
            
            summary = {
                "total_lineups": len(lineup_metrics),
                "best_lineup_hash": best_lineup["lineup_hash"],
                "best_lineup_net_rating": best_lineup["net_rating"],
                "worst_lineup_hash": worst_lineup["lineup_hash"],
                "worst_lineup_net_rating": worst_lineup["net_rating"],
                "avg_net_rating": float(np.mean([m["net_rating"] for m in lineup_metrics])),
            }
        else:
            summary = {
                "total_lineups": 0,
                "best_lineup_hash": None,
                "best_lineup_net_rating": 0,
                "worst_lineup_hash": None,
                "worst_lineup_net_rating": 0,
                "avg_net_rating": 0,
            }
        
        return {
            "lineup_metrics": lineup_metrics,
            "summary": summary,
            "status": "success"
        }
    
    def _detect_lineup_segments(
        self,
        player_assignment: List[Dict],
        ball_possession: List[int],
        fps: float,
        min_duration_seconds: float = 30.0
    ) -> List[Dict]:
        """
        Detect continuous segments with the same 5-player lineup.
        
        Args:
            player_assignment: Per-frame team assignments
            ball_possession: Per-frame possession
            fps: Frames per second
            min_duration_seconds: Minimum segment duration to track
        
        Returns:
            List of lineup segments
        """
        segments = []
        current_lineups = {1: None, 2: None}  # Track lineup for each team
        segment_starts = {1: 0, 2: 0}
        
        min_frames = int(min_duration_seconds * fps)
        
        for frame_idx in range(len(player_assignment)):
            assignment = player_assignment[frame_idx]
            
            # Get players for each team
            team_1_players = sorted([pid for pid, team in assignment.items() if team == 1])
            team_2_players = sorted([pid for pid, team in assignment.items() if team == 2])
            
            # Create lineup hashes
            lineup_1_hash = "_".join(map(str, team_1_players)) if len(team_1_players) >= 3 else None
            lineup_2_hash = "_".join(map(str, team_2_players)) if len(team_2_players) >= 3 else None
            
            # Check for lineup changes
            for team_id, lineup_hash, players in [
                (1, lineup_1_hash, team_1_players),
                (2, lineup_2_hash, team_2_players)
            ]:
                if lineup_hash is None:
                    continue
                
                if current_lineups[team_id] != lineup_hash:
                    # Lineup changed
                    if current_lineups[team_id] is not None:
                        # Save previous segment if long enough
                        duration = frame_idx - segment_starts[team_id]
                        if duration >= min_frames:
                            segments.append({
                                "team_id": team_id,
                                "lineup_hash": current_lineups[team_id],
                                "player_ids": self._parse_lineup_hash(current_lineups[team_id]),
                                "start_frame": segment_starts[team_id],
                                "end_frame": frame_idx
                            })
                    
                    # Start new segment
                    current_lineups[team_id] = lineup_hash
                    segment_starts[team_id] = frame_idx
        
        # Close final segments
        for team_id in [1, 2]:
            if current_lineups[team_id] is not None:
                duration = len(player_assignment) - segment_starts[team_id]
                if duration >= min_frames:
                    segments.append({
                        "team_id": team_id,
                        "lineup_hash": current_lineups[team_id],
                        "player_ids": self._parse_lineup_hash(current_lineups[team_id]),
                        "start_frame": segment_starts[team_id],
                        "end_frame": len(player_assignment)
                    })
        
        return segments
    
    def _parse_lineup_hash(self, lineup_hash: str) -> List[int]:
        """Parse lineup hash back to list of player IDs."""
        return [int(x) for x in lineup_hash.split("_")]
