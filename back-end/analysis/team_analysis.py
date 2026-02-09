"""
Team Analysis Pipeline - Wraps template components for team video analysis.

This module uses the existing template components (PlayerTracker, BallTracker, etc.)
to analyze multi-player basketball footage for team-level insights.
"""
import os
import sys
from typing import Dict, Any, List, Optional

# Add parent directory for template imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def run_team_analysis(video_path: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Run team analysis pipeline on a video.
    
    Uses existing template components:
    - PlayerTracker (YOLO + ByteTrack)
    - BallTracker (YOLO)
    - BallAquisitionDetector
    - TeamAssigner
    - PassAndInterceptionDetector
    - SpeedAndDistanceCalculator
    - TacticalViewConverter
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Dictionary containing analysis results
    """
    # Import template components
    from utils import read_video
    from trackers import PlayerTracker, BallTracker
    from team_assigner import TeamAssigner
    from court_keypoint_detector import CourtKeypointDetector
    from ball_aquisition_detector import BallAquisitionDetector
    from pass_and_interception_detector import PassAndInterceptionDetector
    from tactical_view_converter import TacticalViewConverter
    from speed_and_distance_calculator import SpeedAndDistanceCalculator
    from shot_detector import ShotDetector
    from configs import (
        TEAM_MODEL_PATH,
        COURT_KEYPOINT_DETECTOR_PATH,
    )

    
    # Read video frames
    video_frames = read_video(video_path)
    total_frames = len(video_frames)
    
    if total_frames == 0:
        return {
            "error": "Could not read video frames",
            "total_frames": 0,
        }
    
    # Initialize trackers
    player_tracker = PlayerTracker(TEAM_MODEL_PATH)
    ball_tracker = BallTracker(TEAM_MODEL_PATH)
    court_keypoint_detector = CourtKeypointDetector(COURT_KEYPOINT_DETECTOR_PATH)
    
    # Run detection (no stub caching for API use)
    player_tracks = player_tracker.get_object_tracks(video_frames, read_from_stub=False)
    ball_tracks = ball_tracker.get_object_tracks(video_frames, read_from_stub=False)
    court_keypoints = court_keypoint_detector.get_court_keypoints(video_frames, read_from_stub=False)
    
    # Clean ball tracks
    ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
    ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)
    
    # Team assignment
    team_assigner = TeamAssigner()
    player_assignment = team_assigner.get_player_teams_across_frames(
        video_frames, player_tracks, read_from_stub=False
    )
    
    # Ball possession
    ball_aquisition_detector = BallAquisitionDetector()
    ball_possession = ball_aquisition_detector.detect_ball_possession(player_tracks, ball_tracks)
    
    # Pass and interception detection
    pass_detector = PassAndInterceptionDetector()
    passes = pass_detector.detect_passes(ball_possession, player_assignment)
    interceptions = pass_detector.detect_interceptions(ball_possession, player_assignment)
    
    # Tactical view and speed calculations
    tactical_converter = TacticalViewConverter(
        court_image_path="./images/basketball_court.png"
    )
    court_keypoints = tactical_converter.validate_keypoints(court_keypoints)
    tactical_positions = tactical_converter.transform_players_to_tactical_view(
        court_keypoints, player_tracks
    )
    
    speed_calculator = SpeedAndDistanceCalculator(
        tactical_converter.width,
        tactical_converter.height,
        tactical_converter.actual_width_in_meters,
        tactical_converter.actual_height_in_meters
    )
    distances = speed_calculator.calculate_distance(tactical_positions)
    speeds = speed_calculator.calculate_speed(distances)
    
    # Calculate team possession percentages
    team_1_possession = 0
    team_2_possession = 0
    
    for frame_idx, (possession, assignment) in enumerate(zip(ball_possession, player_assignment)):
        if possession != -1 and possession in assignment:
            team = assignment[possession].get("team", 0)
            if team == 1:
                team_1_possession += 1
            elif team == 2:
                team_2_possession += 1
    
    total_possession = team_1_possession + team_2_possession
    team_1_pct = (team_1_possession / total_possession * 100) if total_possession > 0 else 50
    team_2_pct = (team_2_possession / total_possession * 100) if total_possession > 0 else 50
    
    # Count unique players
    unique_players = set()
    for frame_tracks in player_tracks:
        unique_players.update(frame_tracks.keys())
    
    # Shot Detection and Analysis
    try:
        shot_detector = ShotDetector(
            hoop_detection_model_path=TEAM_MODEL_PATH,  # Use team model for hoop detection
            min_shot_arc_height=50,
            hoop_proximity_threshold=100,
            trajectory_window=30,
            success_time_window=15
        )
        
        # Detect hoop locations
        hoop_detections = shot_detector.detect_hoop_locations(
            video_frames,
            read_from_stub=False
        )
        
        # Get video FPS
        fps = 30  # Default
        try:
            import cv2
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            cap.release()
        except:
            pass
        
        # Detect shots
        shots = shot_detector.detect_shots(
            ball_tracks,
            hoop_detections,
            fps=fps,
            court_keypoints=court_keypoints
        )
        
        # Calculate overall shot statistics
        shot_stats = shot_detector.calculate_shot_statistics(shots)
        
        # Break down shots by team
        team_1_shots = []
        team_2_shots = []
        
        for shot in shots:
            start_frame = shot['start_frame']
            if start_frame < len(ball_possession) and start_frame < len(player_assignment):
                player_with_ball = ball_possession[start_frame]
                if player_with_ball != -1 and player_with_ball in player_assignment[start_frame]:
                    team = player_assignment[start_frame][player_with_ball].get('team', 0)
                    shot_with_team = {**shot, 'team': team, 'player_id': player_with_ball}
                    
                    if team == 1:
                        team_1_shots.append(shot_with_team)
                    elif team == 2:
                        team_2_shots.append(shot_with_team)
        
        team_1_shot_stats = shot_detector.calculate_shot_statistics(team_1_shots)
        team_2_shot_stats = shot_detector.calculate_shot_statistics(team_2_shots)
        
    except Exception as e:
        print(f"Shot detection failed: {e}")
        shot_stats = {
            'total_attempts': 0,
            'total_made': 0,
            'total_missed': 0,
            'overall_percentage': 0.0,
            'by_type': {},
            'shots': []
        }
        team_1_shot_stats = shot_stats.copy()
        team_2_shot_stats = shot_stats.copy()


    # Build per-frame detections for overlays (optional, can be large)
    detections_stride = 1
    max_detections = 200_000
    if options:
        try:
            detections_stride = int(options.get("detections_stride", detections_stride))
        except Exception:
            pass
        try:
            max_detections = int(options.get("max_detections", max_detections))
        except Exception:
            pass

    detections_stride = max(1, min(30, detections_stride))
    max_detections = max(1_000, max_detections)

    detections: List[Dict[str, Any]] = []
    for frame_idx in range(0, total_frames, detections_stride):
        # Players
        assignment = player_assignment[frame_idx] if frame_idx < len(player_assignment) else {}
        possession_player = ball_possession[frame_idx] if frame_idx < len(ball_possession) else -1
        current_player_tracks = player_tracks[frame_idx] if frame_idx < len(player_tracks) else []
        for track_id, track in (current_player_tracks or {}).items():
            bbox = track.get("bbox")
            if not bbox:
                continue
            detections.append({
                "frame": frame_idx,
                "object_type": "player",
                "track_id": int(track_id),
                "bbox": bbox,
                "confidence": float(track.get("confidence", 1.0)),
                "team_id": assignment.get(track_id, {}).get("team"),
                "has_ball": possession_player == track_id,
                "keypoints": None,
            })
            if len(detections) >= max_detections:
                break

        if len(detections) >= max_detections:
            break

        # Ball
        current_ball_tracks = ball_tracks[frame_idx] if frame_idx < len(ball_tracks) else []
        ball = (current_ball_tracks or {}).get(1)
        if ball and ball.get("bbox"):
            detections.append({
                "frame": frame_idx,
                "object_type": "ball",
                "track_id": 1,
                "bbox": ball.get("bbox"),
                "confidence": float(ball.get("confidence", 1.0)),
                "team_id": None,
                "has_ball": False,
                "keypoints": None,
            })
    
    # Build events list
    events = []
    for p in passes:
        events.append({
            "event_type": "pass",
            "frame": p.get("frame", 0),
            "timestamp_seconds": p.get("frame", 0) / 30,  # Assume 30fps
            "player_id": p.get("from_player"),
            "details": {"to_player": p.get("to_player")}
        })
    
    for i in interceptions:
        events.append({
            "event_type": "interception",
            "frame": i.get("frame", 0),
            "timestamp_seconds": i.get("frame", 0) / 30,
            "player_id": i.get("player"),
            "details": {}
        })
    
    # Get video duration
    fps = 30  # Default assumption
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        cap.release()
    except:
        pass
    
    duration_seconds = total_frames / fps
    
    return {
        "total_frames": total_frames,
        "duration_seconds": duration_seconds,
        "players_detected": len(unique_players),
        "team_1_possession_percent": round(team_1_pct, 1),
        "team_2_possession_percent": round(team_2_pct, 1),
        "total_passes": len(passes),
        "total_interceptions": len(interceptions),
        
        # Shot statistics
        "total_shot_attempts": shot_stats['total_attempts'],
        "total_shots_made": shot_stats['total_made'],
        "total_shots_missed": shot_stats['total_missed'],
        "overall_shooting_percentage": shot_stats['overall_percentage'],
        "shot_breakdown_by_type": shot_stats['by_type'],
        
        # Team 1 shooting
        "team_1_shot_attempts": team_1_shot_stats['total_attempts'],
        "team_1_shots_made": team_1_shot_stats['total_made'],
        "team_1_shooting_percentage": team_1_shot_stats['overall_percentage'],
        "team_1_shot_breakdown": team_1_shot_stats['by_type'],
        
        # Team 2 shooting
        "team_2_shot_attempts": team_2_shot_stats['total_attempts'],
        "team_2_shots_made": team_2_shot_stats['total_made'],
        "team_2_shooting_percentage": team_2_shot_stats['overall_percentage'],
        "team_2_shot_breakdown": team_2_shot_stats['by_type'],
        
        "events": events,
        "detections": detections,
    }

