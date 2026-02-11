"""
Clip Generator - Automatically extracts coaching highlight clips.

Creates short video clips (±5 seconds) around flagged events for coaching review.
"""
from typing import Dict, Any, List
import os
import subprocess
from .base import BaseAnalyticsModule


class ClipGenerator(BaseAnalyticsModule):
    """Generates coaching highlight clips from flagged events."""
    
    def __init__(
        self,
        clip_duration_seconds: float = 10.0,  # Total duration (5s before + 5s after)
        output_base_dir: str = "output_videos/clips",
    ):
        """
        Initialize clip generator.
        
        Args:
            clip_duration_seconds: Total duration of each clip
            output_base_dir: Base directory for clip output
        """
        super().__init__("clip_generator")
        self.clip_duration = clip_duration_seconds
        self.output_base_dir = output_base_dir
    
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
        Generate coaching clips for flagged events.
        
        Returns:
            Dictionary with clip metadata
        """
        # Get analytics results from kwargs
        spacing_metrics = kwargs.get("spacing_metrics", [])
        defensive_reactions = kwargs.get("defensive_reactions", [])
        transition_efforts = kwargs.get("transition_efforts", [])
        decision_analyses = kwargs.get("decision_analyses", [])
        
        # Identify events to clip
        clip_events = []
        
        # Poor spacing events
        poor_spacing_frames = [
            m for m in spacing_metrics
            if m.get("spacing_quality") == "poor"
        ]
        # Sample every Nth poor spacing event to avoid too many clips
        for i, m in enumerate(poor_spacing_frames):
            if i % 10 == 0:  # Every 10th poor spacing frame
                clip_events.append({
                    "type": "poor_spacing",
                    "frame": m["frame"],
                    "timestamp": m["timestamp"],
                    "players_involved": list(m.get("player_positions", {}).keys()),
                    "metadata": {
                        "spacing_quality": m["spacing_quality"],
                        "avg_distance_m": m["avg_distance_m"],
                        "paint_players": m["paint_players"]
                    }
                })
        
        # Late rotation events
        late_rotations = [
            r for r in defensive_reactions
            if r.get("late_closeout", False)
        ]
        for r in late_rotations[:20]:  # Limit to 20 clips
            clip_events.append({
                "type": "late_rotation",
                "frame": r["event_frame"],
                "timestamp": r["event_frame"] / fps if fps > 0 else 0,
                "players_involved": [r["defender_track_id"], r["offensive_player_track_id"]],
                "metadata": {
                    "reaction_delay_ms": r.get("reaction_delay_ms"),
                    "closeout_speed_mps": r.get("closeout_speed_mps")
                }
            })
        
        # Poor transition effort
        poor_transitions = [
            t for t in transition_efforts
            if t.get("effort_type") == "walk"
        ]
        for t in poor_transitions[:15]:  # Limit to 15 clips
            clip_events.append({
                "type": "poor_transition",
                "frame": t["possession_change_frame"],
                "timestamp": t["possession_change_frame"] / fps if fps > 0 else 0,
                "players_involved": [t["player_track_id"]],
                "metadata": {
                    "effort_type": t["effort_type"],
                    "max_speed_mps": t["max_speed_mps"],
                    "effort_score": t["effort_score"]
                }
            })
        
        # Low decision quality shots
        low_ev_shots = [
            d for d in decision_analyses
            if d.get("decision_quality") == "low_expected_value"
        ]
        for d in low_ev_shots[:20]:  # Limit to 20 clips
            clip_events.append({
                "type": "low_decision_quality",
                "frame": d["shot_frame"],
                "timestamp": d["shot_frame"] / fps if fps > 0 else 0,
                "players_involved": [d["shooter_track_id"]],
                "metadata": {
                    "decision_quality": d["decision_quality"],
                    "open_teammates": d["open_teammates"],
                    "shooter_contested_distance": d["shooter_contested_distance"]
                }
            })
        
        # Generate clips using ffmpeg
        auto_clips = []
        video_id = os.path.splitext(os.path.basename(video_path))[0]
        clip_dir = os.path.join(self.output_base_dir, video_id)
        
        # Create output directory
        os.makedirs(clip_dir, exist_ok=True)
        
        half_duration = self.clip_duration / 2
        
        for i, event in enumerate(clip_events):
            timestamp = event["timestamp"]
            clip_type = event["type"]
            
            # Calculate start and end times
            start_time = max(0, timestamp - half_duration)
            end_time = timestamp + half_duration
            
            # Generate clip filename
            clip_filename = f"{clip_type}_{int(timestamp)}.mp4"
            clip_path = os.path.join(clip_dir, clip_filename)
            
            # Extract clip using ffmpeg
            success = self._extract_clip(
                video_path,
                clip_path,
                start_time,
                end_time
            )
            
            if success:
                # Generate description
                description = self._generate_description(event)
                
                auto_clips.append({
                    "clip_type": clip_type,
                    "timestamp_start": float(start_time),
                    "timestamp_end": float(end_time),
                    "frame_start": int(start_time * fps) if fps > 0 else 0,
                    "frame_end": int(end_time * fps) if fps > 0 else 0,
                    "players_involved": [int(p) for p in event["players_involved"] if isinstance(p, (int, str))],
                    "file_path": clip_path,
                    "description": description,
                    "metadata": event["metadata"]
                })
        
        # Calculate summary
        clip_type_counts = {}
        for clip in auto_clips:
            clip_type = clip["clip_type"]
            clip_type_counts[clip_type] = clip_type_counts.get(clip_type, 0) + 1
        
        summary = {
            "total_clips_generated": len(auto_clips),
            "clips_by_type": clip_type_counts,
            "output_directory": clip_dir
        }
        
        return {
            "auto_clips": auto_clips,
            "summary": summary,
            "status": "success"
        }
    
    def _extract_clip(
        self,
        video_path: str,
        output_path: str,
        start_time: float,
        end_time: float
    ) -> bool:
        """
        Extract a video clip using ffmpeg.
        
        Args:
            video_path: Path to source video
            output_path: Path for output clip
            start_time: Start time in seconds
            end_time: End time in seconds
        
        Returns:
            True if successful, False otherwise
        """
        try:
            duration = end_time - start_time
            
            # ffmpeg command
            cmd = [
                "ffmpeg",
                "-i", video_path,
                "-ss", str(start_time),
                "-t", str(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-y",  # Overwrite output file
                output_path
            ]
            
            # Run ffmpeg (suppress output)
            result = subprocess.run(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=30
            )
            
            return result.returncode == 0
        except Exception as e:
            self.logger.error(f"Failed to extract clip: {e}")
            return False
    
    def _generate_description(self, event: Dict) -> str:
        """Generate human-readable description for clip."""
        clip_type = event["type"]
        metadata = event.get("metadata", {})
        
        if clip_type == "poor_spacing":
            return f"Poor offensive spacing: {metadata.get('paint_players', 0)} players in paint, avg distance {metadata.get('avg_distance_m', 0):.1f}m"
        elif clip_type == "late_rotation":
            return f"Late defensive rotation: {metadata.get('reaction_delay_ms', 0):.0f}ms delay, {metadata.get('closeout_speed_mps', 0):.1f}m/s closeout"
        elif clip_type == "poor_transition":
            return f"Low transition effort: {metadata.get('effort_type', 'unknown')} at {metadata.get('max_speed_mps', 0):.1f}m/s"
        elif clip_type == "low_decision_quality":
            return f"Questionable shot selection: {metadata.get('open_teammates', 0)} open teammates, shooter contested at {metadata.get('shooter_contested_distance', 0):.1f}m"
        else:
            return f"Flagged event: {clip_type}"
