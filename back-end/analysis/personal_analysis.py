"""
Personal Analysis Pipeline - Individual skill analysis with pose estimation.

This module provides personal training video analysis focused on a single player,
extracting skill metrics like shot form, dribbling patterns, and movement quality.
"""
import os
import sys
import math
from typing import Dict, Any, List, Tuple, Optional

# Add parent directory for template imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def run_personal_analysis(video_path: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Run personal analysis pipeline on a training video.
    
    Focuses on a single primary subject and extracts:
    - Pose keypoints and joint angles
    - Shot form analysis and success rate
    - Dribbling patterns
    - Movement metrics (speed, distance)
    
    Args:
        video_path: Path to the video file
        options: Optional configuration dict with keys:
            - detections_stride: Frame stride for detections
            - max_detections: Max detections to return
            - detect_shots: Whether to run shot detection (default: True)
        
    Returns:
        Dictionary containing personal analysis results
    """
    from utils import read_video
    from app.config import get_settings
    from shot_detector import ShotDetector
    from trackers import BallTracker
    from configs import PERSONAL_MODEL_PATH
    
    settings = get_settings()
    
    # Read video frames
    video_frames = read_video(video_path)
    total_frames = len(video_frames)
    
    if total_frames == 0:
        return {
            "error": "Could not read video frames",
            "total_frames": 0,
        }
    
    # Get video FPS
    fps = 30
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        cap.release()
    except:
        pass
    
    duration_seconds = total_frames / fps
    
    # Initialize YOLO pose model
    try:
        from ultralytics import YOLO
        pose_model = YOLO(settings.pose_model_path)
        has_pose = True
    except Exception as e:
        print(f"Could not load pose model: {e}")
        has_pose = False
    
    # Track all detections and select primary subject
    all_detections = []
    player_stats = {}  # track_id -> {frames: int, total_area: float, ball_interaction: int}
    
    if has_pose:
        # Run pose detection with tracking
        batch_size = 20
        for i in range(0, len(video_frames), batch_size):
            batch = video_frames[i:i+batch_size]
            results = pose_model.track(batch, conf=0.5, classes=[0], persist=True)  # Class 0 = person
            
            # Check for ball in these frames to find interaction
            # (Heuristic: who is closest to the ball or hoop later)
            
            for frame_offset, result in enumerate(results):
                frame_idx = i + frame_offset
                
                if result.boxes is not None and len(result.boxes) > 0:
                    for j, box in enumerate(result.boxes):
                        bbox = box.xyxy[0].tolist()
                        track_id = int(box.id[0]) if box.id is not None else -1
                        if track_id == -1: continue
                        
                        # Calculate bbox area
                        area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                        
                        if track_id not in player_stats:
                            player_stats[track_id] = {'frames': 0, 'total_area': 0, 'interaction_score': 0}
                        
                        player_stats[track_id]['frames'] += 1
                        player_stats[track_id]['total_area'] += area
                        
                        # Get keypoints
                        keypoints = None
                        if result.keypoints is not None and j < len(result.keypoints):
                            kp = result.keypoints[j].xy[0].tolist()
                            keypoints = kp
                            
                            # Heuristic: person moving their arms significantly or near the center
                            # tends to be the player.
                            if len(kp) > 10:
                                wrist_y = kp[10][1]
                                shoulder_y = kp[6][1]
                                if wrist_y < shoulder_y: # Arm raised
                                    player_stats[track_id]['interaction_score'] += 1
                        
                        all_detections.append({
                            "frame": frame_idx,
                            "track_id": track_id,
                            "bbox": bbox,
                            "keypoints": keypoints,
                        })
    
    # Select primary subject (Prioritize interaction > presence > size)
    if player_stats:
        scores = {}
        for tid, stats in player_stats.items():
            presence = stats['frames'] / total_frames
            avg_size = stats['total_area'] / stats['frames']
            interaction = stats['interaction_score'] / stats['frames']
            
            # Weighted score
            scores[tid] = (interaction * 1.0) + (presence * 0.5) + (avg_size / 200000 * 0.3)
        
        primary_player = max(scores, key=scores.get)
    else:
        primary_player = None
    
    # Filter detections for primary player
    primary_detections = [d for d in all_detections if d["track_id"] == primary_player]

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
    for det in primary_detections:
        frame_num = int(det.get("frame", 0))
        if frame_num % detections_stride != 0:
            continue
        bbox = det.get("bbox")
        if not bbox:
            continue
        detections.append({
            "frame": frame_num,
            "object_type": "player",
            "track_id": int(det.get("track_id", 0) or 0),
            "bbox": bbox,
            "confidence": 1.0,
            "keypoints": det.get("keypoints"),
            "team_id": None,
            "has_ball": False,
        })
        if len(detections) >= max_detections:
            break
    
    # Analyze pose data for skill metrics
    shot_attempts = 0
    form_scores = []
    dribble_count = 0
    positions = []
    
    knee_angles = []
    elbow_angles = []
    
    for det in primary_detections:
        kp = det.get("keypoints")
        if kp and len(kp) >= 17:
            # Extract key joint positions (COCO keypoint format)
            # 0:nose, 5:left_shoulder, 6:right_shoulder, 7:left_elbow, 8:right_elbow
            # 9:left_wrist, 10:right_wrist, 11:left_hip, 12:right_hip
            # 13:left_knee, 14:right_knee, 15:left_ankle, 16:right_ankle
            
            # Calculate knee angle (for shot form)
            left_knee_angle = calculate_angle(kp[11], kp[13], kp[15])  # hip-knee-ankle
            right_knee_angle = calculate_angle(kp[12], kp[14], kp[16])
            
            if left_knee_angle:
                knee_angles.append(left_knee_angle)
            if right_knee_angle:
                knee_angles.append(right_knee_angle)
            
            # Calculate elbow angle (for shooting form)
            left_elbow_angle = calculate_angle(kp[5], kp[7], kp[9])  # shoulder-elbow-wrist
            right_elbow_angle = calculate_angle(kp[6], kp[8], kp[10])
            
            if left_elbow_angle:
                elbow_angles.append(left_elbow_angle)
            if right_elbow_angle:
                elbow_angles.append(right_elbow_angle)
            
            # Track wrist position for dribble detection
            left_wrist = kp[9] if len(kp) > 9 else None
            right_wrist = kp[10] if len(kp) > 10 else None
            
            # Store position (hip center) for movement tracking
            if len(kp) > 12:
                hip_center = [
                    (kp[11][0] + kp[12][0]) / 2,
                    (kp[11][1] + kp[12][1]) / 2
                ]
                positions.append({
                    "frame": det["frame"],
                    "position": hip_center
                })
    
    # Detect shot attempts (arm raise events)
    shot_attempts = detect_shot_attempts(primary_detections)
    
    # Detect dribbles (rapid vertical wrist movements)
    dribble_count = detect_dribbles(primary_detections)
    
    # Calculate movement metrics
    total_distance = 0
    speeds = []
    
    for i in range(1, len(positions)):
        prev_pos = positions[i-1]["position"]
        curr_pos = positions[i]["position"]
        frame_diff = positions[i]["frame"] - positions[i-1]["frame"]
        
        # Calculate pixel distance
        dist = math.sqrt((curr_pos[0] - prev_pos[0])**2 + (curr_pos[1] - prev_pos[1])**2)
        
        # Convert to approximate meters (assuming standard court proportions)
        # This is a rough estimate - 1 pixel ≈ 0.01 meters for normalized view
        dist_meters = dist * 0.01
        total_distance += dist_meters
        
        # Calculate speed (m/s)
        if frame_diff > 0:
            time_diff = frame_diff / fps
            speed = dist_meters / time_diff
            speeds.append(speed)
    
    # Calculate averages
    avg_speed = sum(speeds) / len(speeds) if speeds else 0
    max_speed = max(speeds) if speeds else 0
    
    # Convert to km/h
    avg_speed_kmh = avg_speed * 3.6
    max_speed_kmh = max_speed * 3.6
    
    # Calculate form consistency (standard deviation of angles)
    form_consistency = 100 - min(100, calculate_consistency(elbow_angles) * 2)
    
    # Calculate averages
    avg_knee_angle = sum(knee_angles) / len(knee_angles) if knee_angles else None
    avg_elbow_angle = sum(elbow_angles) / len(elbow_angles) if elbow_angles else None
    
    # Dribbles per minute
    dribble_frequency = (dribble_count / duration_seconds) * 60 if duration_seconds > 0 else 0
    
    # Acceleration events (significant speed changes)
    acceleration_events = 0
    for i in range(1, len(speeds)):
        accel = abs(speeds[i] - speeds[i-1])
        if accel > 2:  # Threshold for significant acceleration
            acceleration_events += 1
    
    # Shot Success Detection
    shot_stats = {
        'total_attempts': shot_attempts,
        'total_made': 0,
        'total_missed': 0,
        'overall_percentage': 0.0,
        'by_type': {},
        'shots': []
    }
    
    # Run shot detection if enabled (default: True)
    detect_shots = options.get('detect_shots', True) if options else True
    
    if detect_shots:
        try:
            # Check if ball detector model exists
            model_path = PERSONAL_MODEL_PATH
            if model_path is None or not os.path.exists(str(model_path)):
                # Try relative path if absolute fails
                if os.path.exists('models/nbl_v2_combined.pt'):
                    model_path = 'models/nbl_v2_combined.pt'
                else:
                    model_path = None
            
            if model_path is None:
                print(f"Warning: Ball detector model not found, skipping shot detection")
            else:
                # Initialize ball tracker and shot detector
                ball_tracker = BallTracker(model_path)
                shot_detector = ShotDetector(
                    hoop_detection_model_path=model_path,
                    min_shot_arc_height=50,
                    hoop_proximity_threshold=100,
                    trajectory_window=30,
                    success_time_window=15
                )
                
                # Track ball
                ball_tracks = ball_tracker.get_object_tracks(
                    video_frames, 
                    read_from_stub=False
                )
                ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)
                
                # Detect hoop (if model available, otherwise use heuristics)
                hoop_detections = shot_detector.detect_hoop_locations(
                    video_frames,
                    read_from_stub=False
                )
                
                # Detect and analyze shots
                shots = shot_detector.detect_shots(
                    ball_tracks,
                    hoop_detections,
                    fps=fps
                )
                
                # Calculate shot statistics
                shot_stats = shot_detector.calculate_shot_statistics(shots)
                
                # Add ball and hoop detections to the main detections list for visualization
                for f_idx, tracks in enumerate(ball_tracks):
                    for b_id, b_track in tracks.items():
                        if 'bbox' in b_track:
                            detections.append({
                                "frame": f_idx,
                                "object_type": "ball",
                                "track_id": b_id,
                                "bbox": b_track['bbox']
                            })
                
                for f_idx, hoop in enumerate(hoop_detections):
                    if hoop and 'bbox' in hoop:
                        detections.append({
                            "frame": f_idx,
                            "object_type": "hoop",
                            "track_id": 0,
                            "bbox": hoop['bbox']
                        })
                
        except Exception as e:
            print(f"Shot detection failed: {e}")
            # Keep default shot_stats

    
    # Training load score (composite metric)
    training_load = min(100, (
        (dribble_count * 0.5) +
        (shot_stats['total_attempts'] * 5) +
        (total_distance * 2) +
        (acceleration_events * 1)
    ))

    
    return {
        "total_frames": total_frames,
        "duration_seconds": duration_seconds,
        "primary_player_frames": len(primary_detections),
        
        # Skill metrics
        "shot_attempts": shot_stats['total_attempts'],
        "shots_made": shot_stats['total_made'],
        "shots_missed": shot_stats['total_missed'],
        "shot_success_rate": shot_stats['overall_percentage'],
        "shot_form_consistency": round(form_consistency, 1),
        "shot_breakdown_by_type": shot_stats['by_type'],
        "shot_details": shot_stats.get('shots', []),
        "dribble_count": dribble_count,
        "dribble_frequency_per_minute": round(dribble_frequency, 1),
        
        # Movement metrics
        "total_distance_meters": round(total_distance, 1),
        "avg_speed_kmh": round(avg_speed_kmh, 1),
        "max_speed_kmh": round(max_speed_kmh, 1),
        "acceleration_events": acceleration_events,
        
        # Pose analysis
        "avg_knee_bend_angle": round(avg_knee_angle, 1) if avg_knee_angle else None,
        "avg_elbow_angle_shooting": round(avg_elbow_angle, 1) if avg_elbow_angle else None,
        
        # Training load
        "training_load_score": round(training_load, 1),
        "detections": detections,
    }



def calculate_angle(p1: List[float], p2: List[float], p3: List[float]) -> Optional[float]:
    """
    Calculate angle at p2 given three points.
    
    Args:
        p1, p2, p3: Points as [x, y] coordinates
        
    Returns:
        Angle in degrees at p2, or None if invalid
    """
    if not all([p1, p2, p3]) or len(p1) < 2 or len(p2) < 2 or len(p3) < 2:
        return None
    
    # Check for valid coordinates (not 0,0)
    if p1[0] == 0 and p1[1] == 0:
        return None
    if p2[0] == 0 and p2[1] == 0:
        return None
    if p3[0] == 0 and p3[1] == 0:
        return None
    
    try:
        v1 = [p1[0] - p2[0], p1[1] - p2[1]]
        v2 = [p3[0] - p2[0], p3[1] - p2[1]]
        
        dot = v1[0] * v2[0] + v1[1] * v2[1]
        mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
        mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
        
        if mag1 * mag2 == 0:
            return None
        
        cos_angle = dot / (mag1 * mag2)
        cos_angle = max(-1, min(1, cos_angle))  # Clamp to valid range
        
        angle = math.degrees(math.acos(cos_angle))
        return angle
    except:
        return None


def calculate_consistency(values: List[float]) -> float:
    """Calculate standard deviation as a measure of consistency."""
    if not values or len(values) < 2:
        return 0
    
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    return math.sqrt(variance)


def detect_shot_attempts(detections: List[Dict]) -> int:
    """
    Detect shot attempts by analyzing arm raise patterns.
    
    A shot attempt is detected when the wrist rises significantly above
    the shoulder and then drops.
    """
    shots = 0
    arm_raised = False
    
    for det in detections:
        kp = det.get("keypoints")
        if not kp or len(kp) < 11:
            continue
        
        # Check right arm (more common for right-handed shooters)
        shoulder_y = kp[6][1] if len(kp) > 6 else 0
        wrist_y = kp[10][1] if len(kp) > 10 else 0
        
        # Check if wrist is significantly above shoulder (negative Y is up)
        if shoulder_y > 0 and wrist_y > 0:
            if wrist_y < shoulder_y - 50:  # Wrist 50+ pixels above shoulder
                if not arm_raised:
                    arm_raised = True
            elif wrist_y > shoulder_y:
                if arm_raised:
                    shots += 1
                    arm_raised = False
    
    return shots


def detect_dribbles(detections: List[Dict]) -> int:
    """
    Detect dribbles by analyzing rapid vertical wrist movements.
    """
    dribbles = 0
    prev_wrist_y = None
    direction = None  # 'up' or 'down'
    
    for det in detections:
        kp = det.get("keypoints")
        if not kp or len(kp) < 11:
            continue
        
        # Track dominant hand wrist
        wrist_y = kp[10][1] if len(kp) > 10 and kp[10][1] > 0 else None
        
        if wrist_y is None or prev_wrist_y is None:
            prev_wrist_y = wrist_y
            continue
        
        diff = wrist_y - prev_wrist_y
        
        # Detect direction change (dribble = down then up motion)
        if diff > 10:  # Moving down
            if direction == 'up':
                dribbles += 1
            direction = 'down'
        elif diff < -10:  # Moving up
            direction = 'up'
        
        prev_wrist_y = wrist_y
    
    return dribbles
