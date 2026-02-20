"""
Team Analysis Pipeline - Wraps template components for team video analysis.

This module uses the existing template components (PlayerTracker, BallTracker, etc.)
to analyze multi-player basketball footage for team-level insights.
"""
import os
import sys
import shutil
from typing import Dict, Any, List, Optional

# Add parent directory for template imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def clear_video_stubs(stub_root: str) -> bool:
    """
    Clear all stub files for a video to prepare for fresh analysis.
    
    Args:
        stub_root: Root directory containing stubs for this video
        
    Returns:
        True if successful, False otherwise
    """
    try:
        if os.path.exists(stub_root):
            shutil.rmtree(stub_root)
            os.makedirs(stub_root, exist_ok=True)
            return True
    except Exception as e:
        print(f"⚠️  Warning: Could not clear video stubs at {stub_root}: {e}")
        return False
    
    return True


async def run_team_analysis(video_path: str, options: Optional[Dict[str, Any]] = None, video_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Run team analysis pipeline on a video.
    """
    # Import template components (keep aligned with back-end/main.py)
    from utils import read_video, save_video
    from trackers import PlayerTracker, BallTracker
    from team_assigner import TeamAssigner
    from court_keypoint_detector import CourtKeypointDetector
    from ball_aquisition.ball_aquisition_detector import BallAquisitionDetector
    from pass_and_interception_detector import PassAndInterceptionDetector
    from tactical_view_converter import TacticalViewConverter
    from speed_and_distance_calculator import SpeedAndDistanceCalculator
    from shot_detector import ShotDetector
    from drawers import (
        PlayerTracksDrawer,
        BallTracksDrawer,
        FrameNumberDrawer,
        TeamBallControlDrawer,
        PassInterceptionDrawer,
        TacticalViewDrawer,
        SpeedAndDistanceDrawer,
        ShotDrawer,
    )
    from configs import (
        STUBS_DEFAULT_PATH,
        PLAYER_DETECTOR_PATH,
        BALL_DETECTOR_PATH,
        TEAM_MODEL_PATH,
        COURT_KEYPOINT_DETECTOR_PATH,
    )
    from app.services.supabase_client import get_supabase_service
    supabase = get_supabase_service()

    async def update_progress(step: str, percent: int):
        if video_id and supabase:
            try:
                await supabase.update("videos", video_id, {
                    "current_step": step,
                    "progress_percent": percent
                })
            except Exception as e:
                print(f"Error updating progress: {e}")

    await update_progress("Reading video", 5)
    video_frames = read_video(video_path)
    total_frames = len(video_frames)
    
    if total_frames == 0:
        return {"error": "Could not read video frames", "total_frames": 0}

    # Options (align with CLI args in back-end/main.py)
    options = options or {}
    our_team_jersey = str(options.get("our_team_jersey") or "white jersey")
    opponent_jersey = str(options.get("opponent_jersey") or "dark blue jersey")
    try:
        our_team_id = int(options.get("our_team_id") or 1)
    except Exception:
        our_team_id = 1
    our_team_id = 1 if our_team_id not in (1, 2) else our_team_id
    max_players = 10
    try:
        max_players = int(options.get("max_players_on_court") or max_players)
    except Exception:
        pass
    max_players = max(1, min(20, max_players))
    
    # Stub management options
    clear_stubs_after = bool(options.get("clear_stubs_after", True))
    read_from_stub = bool(options.get("read_from_stub", False))

    # Use a per-video stub folder to avoid cross-video contamination.
    stub_root = os.path.join(STUBS_DEFAULT_PATH, "api", str(video_id or "no-id"))
    os.makedirs(stub_root, exist_ok=True)

    # Initialize trackers/detectors
    await update_progress("Initializing tracking models", 10)
    player_tracker = PlayerTracker(PLAYER_DETECTOR_PATH)
    ball_tracker = BallTracker(BALL_DETECTOR_PATH)
    court_keypoint_detector = CourtKeypointDetector(COURT_KEYPOINT_DETECTOR_PATH)

    # Detection & tracking (this path already enforces a max player limit inside PlayerTracker)
    await update_progress("Tracking players and referees", 20)
    player_tracks = player_tracker.get_object_tracks(
        video_frames,
        read_from_stub=read_from_stub,
        stub_path=os.path.join(stub_root, "player_track_stubs.pkl"),
    )

    # Optional: tighten per-frame player cap if caller requests a smaller number than 10
    if max_players < 10:
        capped_tracks: List[Dict[int, Dict[str, Any]]] = []
        for frame_tracks in player_tracks:
            players = [(tid, t) for tid, t in (frame_tracks or {}).items() if str(t.get("class", "")).lower() == "player"]
            refs = [(tid, t) for tid, t in (frame_tracks or {}).items() if str(t.get("class", "")).lower() == "referee"]
            players.sort(key=lambda x: float(x[1].get("confidence", 0.0)), reverse=True)
            keep = {tid: t for tid, t in players[:max_players]}
            for tid, t in refs:
                keep[tid] = t
            capped_tracks.append(keep)
        player_tracks = capped_tracks

    await update_progress("Detecting and tracking ball", 35)
    ball_tracks = ball_tracker.get_object_tracks(
        video_frames,
        read_from_stub=read_from_stub,
        stub_path=os.path.join(stub_root, "ball_track_stubs.pkl"),
    )

    # Ball cleaning (improves continuity & reduces false positives)
    ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
    ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)

    # Court keypoints
    await update_progress("Detecting court layout", 50)
    court_keypoints = court_keypoint_detector.get_court_keypoints(
        video_frames,
        read_from_stub=read_from_stub,
        stub_path=os.path.join(stub_root, "court_key_points_stub.pkl"),
    )

    # Team assignment (jersey descriptions are critical for team accounts)
    await update_progress("Assigning players to teams", 65)
    team_assigner = TeamAssigner(team_1_class_name=our_team_jersey, team_2_class_name=opponent_jersey)
    player_assignment = team_assigner.get_player_teams_across_frames(
        video_frames,
        player_tracks,
        read_from_stub=read_from_stub,
        stub_path=os.path.join(stub_root, "player_assignment_stub.pkl"),
    )

    # Ball possession + events
    await update_progress("Analyzing ball possession", 75)
    ball_aquisition_detector = BallAquisitionDetector()
    ball_possession = ball_aquisition_detector.detect_ball_possession(player_tracks, ball_tracks)

    await update_progress("Detecting passes and interceptions", 82)
    pass_detector = PassAndInterceptionDetector()
    passes = pass_detector.detect_passes(ball_possession, player_assignment)
    interceptions = pass_detector.detect_interceptions(ball_possession, player_assignment)
    
    # Tactical view and speed calculations
    tactical_converter = TacticalViewConverter(court_image_path="./images/basketball_court.png")
    court_keypoints = tactical_converter.validate_keypoints(court_keypoints)
    tactical_positions = tactical_converter.transform_players_to_tactical_view(court_keypoints, player_tracks)
    
    # Transform ball to tactical view
    ball_xy_frames = []
    for f_tracks in ball_tracks:
        f_ball = {}
        for b_id, b_data in (f_tracks or {}).items():
            bbox = (b_data or {}).get("bbox")
            if not bbox:
                continue
            f_ball[b_id] = [(bbox[0] + bbox[2]) / 2, bbox[3]]  # bottom-center
        ball_xy_frames.append(f_ball)
    tactical_ball_positions = tactical_converter.transform_points_to_tactical(court_keypoints, ball_xy_frames)
    
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
            team = assignment[possession]
            if team == 1:
                team_1_possession += 1
            elif team == 2:
                team_2_possession += 1
    
    total_possession = team_1_possession + team_2_possession
    team_1_pct = (team_1_possession / total_possession * 100) if total_possession > 0 else 50
    team_2_pct = (team_2_possession / total_possession * 100) if total_possession > 0 else 50
    
    # Count unique tracked entities (players + referees)
    unique_players = set()
    for frame_tracks in player_tracks:
        unique_players.update((frame_tracks or {}).keys())
    
    # Shot Detection and Analysis (also gives hoop locations for overlays)
    await update_progress("Detecting hoop and shots", 88)
    try:
        shot_detector = ShotDetector(
            hoop_detection_model_path=TEAM_MODEL_PATH,
            min_shot_arc_height=50,
            hoop_proximity_threshold=100,
            trajectory_window=30,
            success_time_window=15
        )

        hoop_detections = shot_detector.detect_hoop_locations(
            video_frames,
            read_from_stub=read_from_stub,
            stub_path=os.path.join(stub_root, "hoop_detections_stub.pkl"),
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
            player_tracks=player_tracks,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            fps=fps,
            court_keypoints=court_keypoints
        )
        
        # Calculate overall shot statistics
        shot_stats = shot_detector.calculate_shot_statistics(shots)
        
        # Break down shots by team
        team_1_shots = []
        team_2_shots = []
        
        for shot in shots:
            start_frame = int(shot['start_frame'])
            if start_frame < len(ball_possession) and start_frame < len(player_assignment):
                player_with_ball = ball_possession[start_frame]
                if player_with_ball != -1 and player_with_ball in player_assignment[start_frame]:
                    team = player_assignment[start_frame][player_with_ball]
                    # Update the shot in the main list so it's attribution stays for events
                    shot['team_id'] = int(team)
                    shot['player_id'] = int(player_with_ball)
                    
                    if team == 1:
                        team_1_shots.append(shot)
                    elif team == 2:
                        team_2_shots.append(shot)
        
        team_1_shot_stats = shot_detector.calculate_shot_statistics(team_1_shots)
        team_2_shot_stats = shot_detector.calculate_shot_statistics(team_2_shots)
        
    except Exception as e:
        print(f"Shot detection failed: {e}")
        hoop_detections = [None for _ in range(total_frames)]
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

    # Render annotated output video (clean, consistent overlays)
    await update_progress("Rendering annotated video", 92)
    try:
        if our_team_id == 1:
            our_color = [0, 120, 255]
            opp_color = [0, 0, 200]
        else:
            our_color = [0, 0, 200]
            opp_color = [0, 120, 255]

        player_tracks_drawer = PlayerTracksDrawer(team_1_color=our_color, team_2_color=opp_color)
        ball_tracks_drawer = BallTracksDrawer()
        frame_number_drawer = FrameNumberDrawer()
        team_ball_control_drawer = TeamBallControlDrawer()
        pass_and_interceptions_drawer = PassInterceptionDrawer()
        tactical_view_drawer = TacticalViewDrawer()
        speed_and_distance_drawer = SpeedAndDistanceDrawer()
        shot_drawer = ShotDrawer()

        output_video_frames = player_tracks_drawer.draw(video_frames, player_tracks, player_assignment, ball_possession)
        output_video_frames = ball_tracks_drawer.draw(output_video_frames, ball_tracks)
        output_video_frames = frame_number_drawer.draw(output_video_frames)
        output_video_frames = team_ball_control_drawer.draw(output_video_frames, player_assignment, ball_possession)
        output_video_frames = pass_and_interceptions_drawer.draw(output_video_frames, passes, interceptions)
        output_video_frames = shot_drawer.draw(output_video_frames, shots, hoop_detections=hoop_detections)
        output_video_frames = speed_and_distance_drawer.draw(output_video_frames, player_tracks, distances, speeds)
        output_video_frames = tactical_view_drawer.draw(
            output_video_frames,
            tactical_converter.court_image_path,
            tactical_converter.width,
            tactical_converter.height,
            tactical_converter.key_points,
            tactical_positions,
            player_assignment,
            ball_possession,
        )

        annotated_path = os.path.join("output_videos", "annotated", f"{video_id or 'latest'}.mp4")
        save_video(output_video_frames, annotated_path)
    except Exception as e:
        print(f"Annotated video rendering failed: {e}")

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
            # Get tactical position for this player in this frame
            current_tactical = tactical_positions[frame_idx] if frame_idx < len(tactical_positions) else {}
            player_tactical = current_tactical.get(track_id)
            
            detections.append({
                "frame": int(frame_idx),
                "object_type": str(track.get("class", "player")),
                "track_id": int(track_id),
                "bbox": [float(b) for b in bbox] if bbox else None,
                "confidence": float(track.get("confidence", 1.0)),
                "team_id": int(assignment.get(track_id)) if assignment.get(track_id) is not None else None,
                "has_ball": bool(possession_player == track_id),
                "tactical_x": float(player_tactical[0]) if player_tactical else None,
                "tactical_y": float(player_tactical[1]) if player_tactical else None,
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
            # Get tactical ball position
            current_ball_tactical = tactical_ball_positions[frame_idx] if frame_idx < len(tactical_ball_positions) else {}
            ball_tactical = current_ball_tactical.get(1)
            
            detections.append({
                "frame": int(frame_idx),
                "object_type": "ball",
                "track_id": 1,
                "bbox": [float(b) for b in ball.get("bbox")] if ball.get("bbox") else None,
                "confidence": float(ball.get("confidence", 1.0)),
                "team_id": None,
                "has_ball": False,
                "tactical_x": float(ball_tactical[0]) if ball_tactical else None,
                "tactical_y": float(ball_tactical[1]) if ball_tactical else None,
                "keypoints": None,
            })
        # Hoops
        hoop = hoop_detections[frame_idx] if frame_idx < len(hoop_detections) else None
        if hoop and hoop.get("bbox"):
            detections.append({
                "frame": int(frame_idx),
                "object_type": "hoop",
                "track_id": 0,
                "bbox": [float(b) for b in hoop.get("bbox")] if hoop.get("bbox") else None,
                "confidence": float(hoop.get("confidence", 1.0)),
                "team_id": None,
                "has_ball": False,
                "keypoints": None,
            })
    
    # Build events list
    events = []
    for frame_num, team_id in enumerate(passes):
        if team_id != -1:
            events.append({
                "event_type": "pass",
                "frame": frame_num,
                "timestamp_seconds": frame_num / fps,
                "details": {"team": team_id}
            })
    
    for frame_num, team_id in enumerate(interceptions):
        if team_id != -1:
            events.append({
                "event_type": "interception",
                "frame": frame_num,
                "timestamp_seconds": frame_num / fps,
                "details": {"team": team_id}
            })
    
    # Add shots to events
    for shot in shots:
        events.append({
            "event_type": "shot",
            "frame": int(shot['start_frame']),
            "timestamp_seconds": float(shot['start_frame'] / fps),
            "details": {
                "outcome": str(shot['outcome']),
                "team": int(shot.get('team_id')) if shot.get('team_id') is not None else None,
                "player": int(shot.get('player_id')) if shot.get('player_id') is not None else None,
                "type": str(shot.get('shot_type', 'unknown'))
            }
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
    
    # ============================================
    # ADVANCED ANALYTICS (OPT-IN)
    # ============================================
    advanced_analytics = None
    if options and options.get("enable_advanced_analytics", False):
        try:
            print("Running advanced analytics...")
            from analytics_engine import AnalyticsCoordinator
            
            coordinator = AnalyticsCoordinator()
            advanced_analytics = coordinator.process_all(
                video_frames=video_frames,
                player_tracks=player_tracks,
                ball_tracks=ball_tracks,
                tactical_positions=tactical_positions,
                player_assignment=player_assignment,
                ball_possession=ball_possession,
                events=events,
                shots=shots,
                court_keypoints=court_keypoints,
                speeds=speeds,
                video_path=video_path,
                fps=fps
            )
            print(f"Advanced analytics complete: {len(advanced_analytics.get('modules_executed', []))} modules succeeded")
        except Exception as e:
            print(f"Advanced analytics failed: {e}")
            advanced_analytics = {"error": str(e), "status": "failed"}
    
    # Build result dictionary
    result = {
        "total_frames": int(total_frames),
        "duration_seconds": float(duration_seconds),
        "players_detected": int(len(unique_players)),
        "team_1_possession_percent": float(round(team_1_pct, 1)),
        "team_2_possession_percent": float(round(team_2_pct, 1)),
        "total_passes": int(len([p for p in passes if p != -1])),
        "total_interceptions": int(len([i for i in interceptions if i != -1])),
        
        # Shot statistics
        "shot_attempts": int(shot_stats['total_attempts']),
        "shots_made": int(shot_stats['total_made']),
        "shots_missed": int(shot_stats['total_missed']),
        "shooting_percentage": float(shot_stats['overall_percentage']),
        "shot_breakdown_by_type": shot_stats['by_type'],
        
        # Team 1 shooting
        "team_1_shot_attempts": int(team_1_shot_stats['total_attempts']),
        "team_1_shots_made": int(team_1_shot_stats['total_made']),
        
        # Team 2 shooting
        "team_2_shot_attempts": int(team_2_shot_stats['total_attempts']),
        "team_2_shots_made": int(team_2_shot_stats['total_made']),
        
        "events": events,
        "detections": detections,
    }
    
    # Add advanced analytics if available
    if advanced_analytics:
        result["advanced_analytics"] = advanced_analytics
    
    # Clear stubs if requested (ensures fresh analysis on next run)
    if clear_stubs_after:
        await update_progress("Cleaning up cached data", 98)
        try:
            clear_video_stubs(stub_root)
            print(f"✅ Cleared stubs for video {video_id or 'unknown'}")
        except Exception as e:
            print(f"⚠️  Could not clear stubs: {e}")
    
    return result

