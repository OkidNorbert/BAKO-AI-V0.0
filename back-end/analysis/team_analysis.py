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


async def run_team_analysis(video_path: str, options: Optional[Dict[str, Any]] = None, video_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Run team analysis pipeline on a video.
    """
    # Import template components
    from utils import read_video
    from trackers import PlayerTracker, BallTracker
    from team_assigner import TeamAssigner
    from court_keypoint_detector import CourtKeypointDetector
    from ball_aquisition.ball_aquisition_detector import BallAquisitionDetector
    from pass_and_interception_detector import PassAndInterceptionDetector
    from tactical_view_converter import TacticalViewConverter
    from speed_and_distance_calculator import SpeedAndDistanceCalculator
    from shot_detector import ShotDetector
    from configs import (
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
    
    # Initialize trackers
    await update_progress("Initializing tracking models", 10)
    player_tracker = PlayerTracker(TEAM_MODEL_PATH)
    # Reuse the same model instance to save massive RAM and avoid re-loading
    ball_tracker = BallTracker(TEAM_MODEL_PATH)
    ball_tracker.model = player_tracker.model
    
    court_keypoint_detector = CourtKeypointDetector(COURT_KEYPOINT_DETECTOR_PATH)
    
    # Run Combined Detection Pass to save 3x processing time
    await update_progress("Detecting players and ball", 15)
    
    # We'll run the player tracker's detection since it has slightly higher conf for players
    # but we will extract basketballs and hoops in the same pass if possible.
    # To keep it simple but fast, we run detecting_frames once and share the results.
    batch_size = 10
    all_detections = []
    player_tracks = []
    ball_tracks = [{} for _ in range(total_frames)]
    hoop_detections = [None for _ in range(total_frames)]

    from ultralytics import YOLO
    import supervision as sv
    import numpy as np

    # Combined pass
    for i in range(0, total_frames, batch_size):
        batch = video_frames[i : i + batch_size]
        results = player_tracker.model.predict(batch, conf=0.05, imgsz=1080)
        
        for j, res in enumerate(results):
            frame_idx = i + j
            cls_names = res.names 
            detection_sv = sv.Detections.from_ultralytics(res)
            
            # 1. Process for Player Tracking (ByteTrack)
            player_mask = []
            for class_id, conf in zip(detection_sv.class_id, detection_sv.confidence):
                name = cls_names[class_id].lower()
                if name == 'player' and conf >= 0.1:
                    player_mask.append(True)
                elif name == 'referee' and conf >= 0.25:
                    player_mask.append(True)
                else:
                    player_mask.append(False)
            
            player_dets = detection_sv[np.array(player_mask)]
            tracks_batch = player_tracker.tracker.update_with_detections(player_dets)
            
            frame_player_tracks = {}
            for frame_det in tracks_batch:
                bbox = frame_det[0].tolist()
                tid = frame_det[4]
                frame_player_tracks[tid] = {
                    "bbox": bbox,
                    "confidence": float(frame_det[2]),
                    "class": cls_names[frame_det[3]]
                }
            player_tracks.append(frame_player_tracks)

            # 2. Process for Ball Tracking (One best ball)
            max_ball_conf = -1
            best_ball_bbox = None
            for bbox, conf, class_id in zip(detection_sv.xyxy, detection_sv.confidence, detection_sv.class_id):
                if cls_names[class_id].lower() == 'basketball':
                    if conf > max_ball_conf:
                        max_ball_conf = conf
                        best_ball_bbox = bbox.tolist()
            if best_ball_bbox:
                ball_tracks[frame_idx][1] = {"bbox": best_ball_bbox, "confidence": float(max_ball_conf)}
            
            # 3. Process for Hoop Locations (Single best hoop with center and rim_y)
            # Re-calculating from res.boxes to be sure about format
            best_hoop_conf = -1
            best_hoop_bbox = None
            for bbox_tensor, conf, class_id in zip(res.boxes.xyxy, res.boxes.conf, res.boxes.cls):
                if cls_names[int(class_id)].lower() == 'hoop' and conf > 0.2:
                    if conf > best_hoop_conf:
                        best_hoop_conf = float(conf)
                        best_hoop_bbox = bbox_tensor.tolist()
            
            if best_hoop_bbox:
                hoop_detections[frame_idx] = {
                    "bbox": best_hoop_bbox,
                    "center": ((best_hoop_bbox[0] + best_hoop_bbox[2]) / 2, (best_hoop_bbox[1] + best_hoop_bbox[3]) / 2),
                    "rim_y": best_hoop_bbox[1],
                    "confidence": float(best_hoop_conf)
                }

        if i % 50 == 0:
            pct = 15 + int((i / total_frames) * 50)
            await update_progress(f"Detection: Frame {i}/{total_frames}", pct)

    await update_progress("Detecting court layout", 70)
    # Optimization: Detect layout every 10 frames and fill gaps
    # This speeds up this phase by 10x on CPU
    step = 10
    key_frames = video_frames[::step]
    
    # Check if detector has a way to change imgsz, or just rely on its internal default
    # Looking at the class, it uses 1080 in the method. 
    # I will patch the method call or the class if needed, but for now let's just use the every-10-frames logic.
    
    key_court_kpts = court_keypoint_detector.get_court_keypoints(key_frames, read_from_stub=False, stub_path=None)
    
    court_keypoints = []
    for i in range(total_frames):
        idx = min(i // step, len(key_court_kpts) - 1)
        court_keypoints.append(key_court_kpts[idx])
    
    # Clean ball tracks
    ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
    ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)
    
    # Team assignment
    await update_progress("Assigning players to teams", 80)
    team_assigner = TeamAssigner()
    player_assignment = team_assigner.get_player_teams_across_frames(
        video_frames, player_tracks, read_from_stub=False, stub_path=None
    )
    
    # Ball possession
    await update_progress("Analyzing ball possession", 85)
    ball_aquisition_detector = BallAquisitionDetector()
    ball_possession = ball_aquisition_detector.detect_ball_possession(player_tracks, ball_tracks)
    
    # Pass and interception detection
    await update_progress("Detecting passes and shots", 90)
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
            team = assignment[possession]
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
        
        # Use hoop detections from the combined pass
        # hoop_detections already exists from Step 70
        
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
            start_frame = shot['start_frame']
            if start_frame < len(ball_possession) and start_frame < len(player_assignment):
                player_with_ball = ball_possession[start_frame]
                if player_with_ball != -1 and player_with_ball in player_assignment[start_frame]:
                    team = player_assignment[start_frame][player_with_ball]
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
                "team_id": assignment.get(track_id),
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
        
        # Hoops
        hoop = hoop_detections[frame_idx] if frame_idx < len(hoop_detections) else None
        if hoop and hoop.get("bbox"):
            detections.append({
                "frame": frame_idx,
                "object_type": "hoop",
                "track_id": 0,
                "bbox": hoop.get("bbox"),
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
            "frame": shot['start_frame'],
            "timestamp_seconds": shot['start_frame'] / fps,
            "details": {
                "outcome": shot['outcome'],
                "team": shot.get('team_id'),
                "player": shot.get('player_id'),
                "type": shot.get('shot_type')
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
        "total_frames": total_frames,
        "duration_seconds": duration_seconds,
        "players_detected": len(unique_players),
        "team_1_possession_percent": round(team_1_pct, 1),
        "team_2_possession_percent": round(team_2_pct, 1),
        "total_passes": len([p for p in passes if p != -1]),
        "total_interceptions": len([i for i in interceptions if i != -1]),
        
        # Shot statistics
        "shot_attempts": shot_stats['total_attempts'],
        "shots_made": shot_stats['total_made'],
        "shots_missed": shot_stats['total_missed'],
        "shooting_percentage": shot_stats['overall_percentage'],
        "shot_breakdown_by_type": shot_stats['by_type'],
        
        # Team 1 shooting
        "team_1_shot_attempts": team_1_shot_stats['total_attempts'],
        "team_1_shots_made": team_1_shot_stats['total_made'],
        
        # Team 2 shooting
        "team_2_shot_attempts": team_2_shot_stats['total_attempts'],
        "team_2_shots_made": team_2_shot_stats['total_made'],
        
        "events": events,
        "detections": detections,
    }
    
    # Add advanced analytics if available
    if advanced_analytics:
        result["advanced_analytics"] = advanced_analytics
    
    return result

