"""
Shot Detector - Detects shot attempts and determines success/failure.

This module analyzes ball trajectory relative to the hoop to determine:
1. When a shot is attempted
2. Whether the shot was successful (made) or unsuccessful (missed)
3. Shot type (layup, mid-range, 3-pointer)
4. Shot location on the court
"""
import math
from typing import Dict, List, Tuple, Optional, Any
import numpy as np


class ShotDetector:
    """Detects basketball shots and determines their success."""
    
    def __init__(
        self,
        hoop_detection_model_path: Optional[str] = None,
        min_shot_arc_height: int = 50,
        hoop_proximity_threshold: int = 100,
        trajectory_window: int = 40,
        success_time_window: int = 45,
    ):
        """
        Initialize the shot detector.
        
        Args:
            hoop_detection_model_path: Path to YOLO model that detects hoops (optional)
            min_shot_arc_height: Minimum pixel height for a shot arc
            hoop_proximity_threshold: Max distance (pixels) from hoop to count as potential make
            trajectory_window: Number of frames to analyze for trajectory
            success_time_window: Frames after peak to check for successful shot
        """
        self.hoop_model_path = hoop_detection_model_path
        self.min_shot_arc_height = min_shot_arc_height
        self.hoop_proximity_threshold = hoop_proximity_threshold
        self.trajectory_window = trajectory_window
        self.success_time_window = success_time_window
        
        self.hoop_model = None
        if hoop_detection_model_path:
            try:
                from ultralytics import YOLO
                self.hoop_model = YOLO(hoop_detection_model_path)
            except Exception as e:
                print(f"Warning: Could not load hoop detection model: {e}")
    
    def detect_hoop_locations(
        self, 
        video_frames: List[np.ndarray],
        read_from_stub: bool = False,
        stub_path: Optional[str] = None
    ) -> List[Optional[Dict[str, Any]]]:
        """
        Detect hoop locations in video frames.
        
        Args:
            video_frames: List of video frames
            read_from_stub: Whether to read from cached results
            stub_path: Path to stub file
            
        Returns:
            List of hoop detections per frame (None if no hoop detected)
        """
        # Try to read from stub if requested
        if read_from_stub and stub_path:
            try:
                from utils import read_stub
                hoop_detections = read_stub(stub_path)
                if hoop_detections:
                    return hoop_detections
            except:
                pass
        
        hoop_detections = []
        
        if not self.hoop_model:
            # Return None for all frames if no model available
            return [None] * len(video_frames)
        
        # Run detection in batches
        batch_size = 20
        for i in range(0, len(video_frames), batch_size):
            batch = video_frames[i:i+batch_size]
            
            # Find hoop class index dynamically
            hoop_indices = [idx for idx, name in self.hoop_model.names.items() if 'hoop' in name.lower()]
            if not hoop_indices:
                # Fallback to class 2 if names aren't clear, but log warning
                hoop_class = 2
            else:
                hoop_class = hoop_indices[0]
                
            results = self.hoop_model.predict(batch, conf=0.5, classes=[hoop_class])
            
            for result in results:
                if result.boxes is not None and len(result.boxes) > 0:
                    # Take the highest confidence hoop detection
                    best_box = max(result.boxes, key=lambda b: float(b.conf[0]))
                    bbox = best_box.xyxy[0].tolist()
                    
                    hoop_detections.append({
                        'bbox': bbox,
                        'center': self._get_bbox_center(bbox),
                        'rim_y': bbox[1],  # Top of bbox approximates rim level
                        'confidence': float(best_box.conf[0])
                    })
                else:
                    hoop_detections.append(None)
        
        # Save to stub if requested
        if stub_path:
            try:
                from utils import save_stub
                save_stub(hoop_detections, stub_path)
            except:
                pass
        
        return hoop_detections
    
    def detect_shots(
        self,
        ball_tracks: List[Dict[int, Dict]],
        hoop_detections: List[Optional[Dict]],
        player_tracks: Optional[List[Dict[int, Dict]]] = None,
        player_assignment: Optional[List[Dict[int, Any]]] = None,
        ball_possession: Optional[List[int]] = None,
        fps: float = 30.0,
        court_keypoints: Optional[List] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect shot attempts and their outcomes with tactical analysis.
        """
        shots = []
        
        # Extract ball trajectory
        ball_trajectory = self._extract_ball_trajectory(ball_tracks)
        
        if len(ball_trajectory) < 10:
            return shots
        
        hoop_location_stable = self._get_stable_hoop_location(hoop_detections)
        shot_attempts = self._detect_shot_attempts(ball_trajectory, hoop_location_stable)
        
        for attempt in shot_attempts:
            # For each attempt, get the hoop location at the time of the shot
            shot_hoop_location = self._get_hoop_at_frame(hoop_detections, attempt['peak_frame'])
            if not shot_hoop_location:
                shot_hoop_location = hoop_location_stable

            shot_outcome = self._analyze_shot_outcome(
                attempt,
                ball_trajectory,
                hoop_detections,
                fps
            )
            
            if shot_outcome:
                # Filter out shots where no hoop was seen during the core window
                if shot_outcome.get('hoop_seen_count', 0) == 0:
                    continue

                # Add shot type classification
                shot_outcome['shot_type'] = self._classify_shot_type(
                    attempt,
                    ball_trajectory,
                    shot_hoop_location,
                    court_keypoints
                )
                
                # --- Tactical Analysis: Contestedness & Quality & 2pt/3pt ---
                if player_tracks and player_assignment and ball_possession:
                    start_frame = attempt['start_frame']
                    
                    # Search for shooter in a window around the shot start (up to 20 frames back)
                    shooter_id = -1
                    search_range = range(max(0, start_frame - 20), min(len(ball_possession), start_frame + 5))
                    for f_search in reversed(search_range):
                        if ball_possession[f_search] != -1:
                            shooter_id = ball_possession[f_search]
                            break
                    
                    if shooter_id != -1 and shooter_id in player_assignment[start_frame]:
                        shooter_team = player_assignment[start_frame][shooter_id]
                        shooter_pos = self._get_bbox_center(player_tracks[start_frame][shooter_id]['bbox'])
                        
                        # Find nearest defender (different team)
                        min_dist_def = float('inf')
                        for p_id, p_track in player_tracks[start_frame].items():
                            if p_id in player_assignment[start_frame]:
                                p_team = player_assignment[start_frame][p_id]
                                if p_team and p_team != shooter_team:
                                    defender_pos = self._get_bbox_center(p_track['bbox'])
                                    dist_def = math.sqrt((shooter_pos[0]-defender_pos[0])**2 + (defender_pos[1]-defender_pos[1])**2)
                                    if dist_def < min_dist_def:
                                        min_dist_def = dist_def
                        
                        shot_outcome['defender_distance'] = round(min_dist_def, 2)
                        # Thresholds (pixels, relative to typical resolution)
                        if min_dist_def < 80:
                            shot_outcome['contestedness'] = "Heavily Contested"
                            shot_outcome['shot_quality'] = "Low (IQ Problem)" if shot_outcome['outcome'] == 'missed' else "Difficult Make"
                        elif min_dist_def < 180:
                            shot_outcome['contestedness'] = "Contested"
                            shot_outcome['shot_quality'] = "Average"
                        else:
                            shot_outcome['contestedness'] = "Wide Open"
                            shot_outcome['shot_quality'] = "High Quality"
                        
                        # Realistic 2-point vs 3-point based on distance in meters (if possible)
                        # Using shot-time location strictly
                        current_hoop = self._get_hoop_at_frame(hoop_detections, start_frame)
                        dist_to_hoop_target = current_hoop if current_hoop else shot_hoop_location

                        # Try to calculate distance in meters using keypoints
                        dist_meters = None
                        if court_keypoints and start_frame < len(court_keypoints):
                            dist_meters = self._get_distance_meters(
                                shooter_pos, 
                                (dist_to_hoop_target['x'], dist_to_hoop_target['y']), 
                                court_keypoints[start_frame]
                            )
                        
                        if dist_meters is not None:
                            shot_outcome['shot_type'] = "three-pointer" if dist_meters > 6.75 else "two-pointer"
                            shot_outcome['shooter_distance_meters'] = round(dist_meters, 2)
                        else:
                            # Use Euclidean distance in pixels
                            dist_to_hoop_px = math.sqrt((shooter_pos[0]-dist_to_hoop_target['x'])**2 + (shooter_pos[1]-dist_to_hoop_target['y'])**2)
                            # Threshold calibrated for roughly 1080p: 550px is a safer 3-point line proxy
                            shot_outcome['shot_type'] = "three-pointer" if dist_to_hoop_px > 500 else "two-pointer"
                            shot_outcome['shooter_distance_px'] = round(dist_to_hoop_px, 2)
                        
                        shot_outcome['player_id'] = shooter_id
                        shot_outcome['team_id'] = shooter_team
                
                shots.append(shot_outcome)
        
        return shots
    
    def _extract_ball_trajectory(
        self, 
        ball_tracks: List[Dict[int, Dict]]
    ) -> List[Dict[str, Any]]:
        """Extract clean ball trajectory with position and velocity."""
        trajectory = []
        
        for frame_idx, tracks in enumerate(ball_tracks):
            if 1 in tracks:  # Ball typically has track_id = 1
                ball = tracks[1]
                bbox = ball.get('bbox')
                
                if bbox:
                    center = self._get_bbox_center(bbox)
                    trajectory.append({
                        'frame': frame_idx,
                        'x': center[0],
                        'y': center[1],
                        'bbox': bbox
                    })
        
        # Calculate velocities
        for i in range(1, len(trajectory)):
            prev = trajectory[i-1]
            curr = trajectory[i]
            
            dx = curr['x'] - prev['x']
            dy = curr['y'] - prev['y']
            frame_diff = curr['frame'] - prev['frame']
            
            if frame_diff > 0:
                curr['vx'] = dx / frame_diff
                curr['vy'] = dy / frame_diff
                curr['speed'] = math.sqrt(dx**2 + dy**2) / frame_diff
            else:
                curr['vx'] = 0
                curr['vy'] = 0
                curr['speed'] = 0
        
        if trajectory:
            trajectory[0]['vx'] = trajectory[0]['vy'] = trajectory[0]['speed'] = 0
        
        return trajectory
    
    def _get_stable_hoop_location(
        self, 
        hoop_detections: List[Optional[Dict]]
    ) -> Optional[Dict[str, float]]:
        """Get stable hoop location from detections."""
        valid_detections = [h for h in hoop_detections if h is not None]
        
        if not valid_detections:
            return None
        
        # Use median position for stability
        centers = [d['center'] for d in valid_detections]
        rim_ys = [d['rim_y'] for d in valid_detections]
        
        # If we have very few detections, just use the first valid one
        if len(valid_detections) < 3:
            return {
                'x': valid_detections[0]['center'][0],
                'y': valid_detections[0]['center'][1],
                'rim_y': valid_detections[0]['rim_y']
            }
        
        return {
            'x': np.median([c[0] for c in centers]),
            'y': np.median([c[1] for c in centers]),
            'rim_y': np.median(rim_ys)
        }

    def _get_hoop_at_frame(self, hoop_detections, frame_num):
        """Get hoop location at a specific frame, or closest detection if missing."""
        if frame_num < 0 or frame_num >= len(hoop_detections):
            return None
            
        if hoop_detections[frame_num]:
            h = hoop_detections[frame_num]
            return {
                'x': h['center'][0],
                'y': h['center'][1],
                'rim_y': h['rim_y']
            }
            
        # Search nearby frames if missing (ONLY 5 frames now for panning safety)
        for i in range(1, 6):
            for side in [-1, 1]:
                f = frame_num + i * side
                if 0 <= f < len(hoop_detections) and hoop_detections[f]:
                    h = hoop_detections[f]
                    return {
                        'x': h['center'][0],
                        'y': h['center'][1],
                        'rim_y': h['rim_y']
                    }
        return None
    
    def _detect_shot_attempts(
        self,
        trajectory: List[Dict],
        hoop_location: Optional[Dict]
    ) -> List[Dict[str, Any]]:
        """Detect shot attempts by finding upward arcs toward the hoop."""
        attempts = []
        
        i = 0
        while i < len(trajectory) - 5:
            point = trajectory[i]
            
            # Smooth velocity check (average over 3 frames)
            avg_vy = sum(trajectory[k].get('vy', 0) for k in range(i, min(i+3, len(trajectory)))) / 3
            if avg_vy < -4:  # Moving up consistently
                
                # Find the peak of this arc
                peak_idx = i
                peak_y = point['y']
                
                j = i + 1
                while j < len(trajectory) and j < i + self.trajectory_window:
                    if trajectory[j]['y'] < peak_y:
                        peak_y = trajectory[j]['y']
                        peak_idx = j
                    elif trajectory[j]['y'] > peak_y + 20:
                        # Ball is descending significantly
                        break
                    j += 1
                
                # Validate this is a shot arc
                arc_height = point['y'] - peak_y
                
                if arc_height >= self.min_shot_arc_height:
                    # Check if trajectory is toward hoop (if hoop detected)
                    toward_hoop = True
                    if hoop_location:
                        # Check horizontal distance to hoop
                        start_dist = abs(point['x'] - hoop_location['x'])
                        peak_dist = abs(trajectory[peak_idx]['x'] - hoop_location['x'])
                        toward_hoop = peak_dist < start_dist * 1.5  # Allow some variance
                    
                    if toward_hoop and peak_y < (hoop_location['y'] + 100 if hoop_location else 1000):
                        attempts.append({
                            'start_frame': point['frame'],
                            'start_idx': i,
                            'peak_frame': trajectory[peak_idx]['frame'],
                            'peak_idx': peak_idx,
                            'arc_height': arc_height,
                            'start_position': (point['x'], point['y']),
                            'peak_position': (trajectory[peak_idx]['x'], trajectory[peak_idx]['y'])
                        })
                        
                        # Skip ahead significantly to avoid duplicate detection of the same shot
                        i = peak_idx + self.success_time_window
                        continue

            
            i += 1
        
        return attempts
    
    def _analyze_shot_outcome(
        self,
        attempt: Dict,
        trajectory: List[Dict],
        hoop_detections: List[Optional[Dict]],
        fps: float
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze whether a shot attempt was successful by checking frame-by-frame
        for "meeting" events between the ball and the hoop.
        """
        peak_idx = attempt['peak_idx']
        end_idx = min(peak_idx + self.success_time_window, len(trajectory))
        
        made_detected = False
        min_dist_at_rim = float('inf')
        outcome_frame = None
        hoop_seen_count = 0
        
        # Look for the moment of intersection or crossing
        # We check every frame in the success window
        for i in range(max(0, peak_idx - 5), end_idx):
            ball_point = trajectory[i]
            frame_num = ball_point['frame']
            
            # STRICT CHECK: Was the hoop actually detected by the model in this frame?
            if frame_num < len(hoop_detections) and hoop_detections[frame_num]:
                hoop_seen_count += 1

            # Get the hoop location (interpolated slightly)
            hoop = self._get_hoop_at_frame(hoop_detections, frame_num)
            if not hoop:
                continue
                
            # Horizontal distance to the rim center
            horizontal_dist = abs(ball_point['x'] - hoop['x'])
            is_falling = ball_point.get('vy', 1) > 0  # Ball must be dropping
            
            # Check if ball has passed rim level with a small buffer to avoid "too early" detection.
            if ball_point['y'] >= hoop['rim_y'] + 10 and outcome_frame is None:
                outcome_frame = frame_num
                min_dist_at_rim = horizontal_dist
                
                # SUCCESS CONDITION: 
                # Ball center must be within the rim's diameter.
                # Must be dropping and tightly horizontally aligned (< 40px)
                if horizontal_dist < 40 and is_falling: 
                    made_detected = True
                    break

            # SECONDARY CHECK: Collision/Meeting (Ball slightly below rim and very close horizontally)
            if horizontal_dist < 35 and 10 <= (ball_point['y'] - hoop['rim_y']) < 80 and is_falling:
                made_detected = True
                outcome_frame = frame_num
                min_dist_at_rim = horizontal_dist
                break
        
        # If we never crossed rim but window ended
        if outcome_frame is None:
            outcome_frame = trajectory[end_idx-1]['frame']
            # Find closest distance seen
            for i in range(peak_idx, end_idx):
                h = self._get_hoop_at_frame(hoop_detections, trajectory[i]['frame'])
                if h:
                    dist = math.sqrt((trajectory[i]['x'] - h['x'])**2 + (trajectory[i]['y'] - h['rim_y'])**2)
                    if dist < min_dist_at_rim:
                        min_dist_at_rim = dist

        # Determine final outcome
        if made_detected:
            outcome = 'made'
            confidence = 0.90
        else:
            # If tracking was lost before the ball reached reasonably below the rim
            last_idx = end_idx - 1
            if last_idx >= 0:
                last_point = trajectory[last_idx]
                h_last = self._get_hoop_at_frame(hoop_detections, last_point['frame'])
                if h_last:
                    if last_point['y'] < h_last['rim_y'] - 10:
                        # Ball tracking lost high in the air
                        outcome = 'unknown'
                        confidence = 0.0
                    else:
                        # Ball tracking survived to the rim level but didn't pass the "made" criteria
                        outcome = 'missed'
                        confidence = 0.7 if min_dist_at_rim < 150 else 0.4
                else:
                    outcome = 'unknown'
                    confidence = 0.0
            else:
                outcome = 'unknown'
                confidence = 0.0
        
        return {
            'start_frame': attempt['start_frame'],
            'peak_frame': attempt['peak_frame'],
            'outcome_frame': outcome_frame or (trajectory[end_idx-1]['frame'] if end_idx > 0 else attempt['start_frame']),
            'outcome': outcome,
            'confidence': confidence,
            'timestamp_seconds': attempt['start_frame'] / fps,
            'arc_height_pixels': attempt['arc_height'],
            'distance_at_rim': round(min_dist_at_rim, 2),
            'start_position': attempt['start_position'],
            'peak_position': attempt['peak_position'],
            'hoop_seen_count': hoop_seen_count
        }

    def _get_distance_meters(self, pos1, pos2, frame_keypoints):
        """Calculate real-world distance between two points using homography."""
        try:
            # Handle keypoints for current frame
            kp_list = frame_keypoints.xy.tolist() if hasattr(frame_keypoints, 'xy') else []
            if not kp_list: return None
            
            detected_keypoints = kp_list[0]
            valid_indices = [i for i, kp in enumerate(detected_keypoints) if kp[0] > 0 and kp[1] > 0]
            
            if len(valid_indices) < 4: return None
            
            # Standard dimensions for mapping
            actual_width = 28.0
            actual_height = 15.0
            tactical_w = 300
            tactical_h = 161
            
            # Simple tactical keypoints mapping (from TacticalViewConverter)
            tactical_kps = [
                (0,0), (0,10), (0,55), (0,107), (0,151), (0,161), # Left Edge
                (150,161), (150,0), # Middle
                (62,55), (62,107), # Left Free Throw
                (300,161), (300,151), (300,107), (300,55), (300,10), (300,0), # Right Edge
                (238,55), (238,107) # Right Free Throw
            ]
            
            # Map detected pixels to tactical pixels
            src = np.array([detected_keypoints[i] for i in valid_indices], dtype=np.float32)
            dst = np.array([tactical_kps[i] for i in valid_indices], dtype=np.float32)
            
            M, _ = cv2.findHomography(src, dst)
            if M is None: return None
            
            # Transform positions
            pts = np.array([pos1, pos2], dtype=np.float32).reshape(-1, 1, 2)
            trans_pts = cv2.perspectiveTransform(pts, M).reshape(-1, 2)
            
            # Convert tactical pixels to meters
            m1 = (trans_pts[0][0] * actual_width / tactical_w, trans_pts[0][1] * actual_height / tactical_h)
            m2 = (trans_pts[1][0] * actual_width / tactical_w, trans_pts[1][1] * actual_height / tactical_h)
            
            return math.sqrt((m1[0]-m2[0])**2 + (m1[1]-m2[1])**2)
        except:
            return None
    
    def _classify_shot_type(
        self,
        attempt: Dict,
        trajectory: List[Dict],
        hoop_location: Optional[Dict],
        court_keypoints: Optional[List]
    ) -> str:
        """
        Classify shot type based on trajectory and location.
        
        Types:
        - layup: Short arc, close to hoop
        - dunk: Very close to hoop, minimal arc
        - mid-range: Medium distance
        - three-pointer: Far from hoop
        - free-throw: Specific location and arc
        """
        arc_height = attempt['arc_height']
        start_pos = attempt['start_position']
        
        if not hoop_location:
            return 'unknown'
        
        # Calculate Euclidean distance to hoop (much more reliable than horizontal only)
        euclidean_distance = math.sqrt((start_pos[0] - hoop_location['x'])**2 + (start_pos[1] - hoop_location['y'])**2)
        
        # Shot type classification thresholds (in pixels, calibrated for 1080p)
        if euclidean_distance < 180:
            return 'layup'
        elif euclidean_distance > 500:
            return 'three-pointer'
        else:
            return 'mid-range'
    
    def calculate_shot_statistics(
        self, 
        shots: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive shot statistics.
        
        Args:
            shots: List of shot events
            
        Returns:
            Dictionary with shot statistics
        """
        if not shots:
            return {
                'total_attempts': 0,
                'total_made': 0,
                'total_missed': 0,
                'total_unknown': 0,
                'overall_percentage': 0.0,
                'by_type': {},
                'avg_confidence': 0.0
            }
        
        total_attempts = len(shots)
        made = [s for s in shots if s['outcome'] == 'made']
        missed = [s for s in shots if s['outcome'] == 'missed']
        unknown = [s for s in shots if s['outcome'] == 'unknown']
        
        total_made = len(made)
        total_missed = len(missed)
        total_unknown = len(unknown)
        
        # Calculate percentage (exclude unknown)
        known_attempts = total_made + total_missed
        overall_pct = (total_made / known_attempts * 100) if known_attempts > 0 else 0.0
        
        # Statistics by shot type
        shot_types = set(s.get('shot_type', 'unknown') for s in shots)
        by_type = {}
        
        for shot_type in shot_types:
            type_shots = [s for s in shots if s.get('shot_type') == shot_type]
            type_made = len([s for s in type_shots if s['outcome'] == 'made'])
            type_missed = len([s for s in type_shots if s['outcome'] == 'missed'])
            type_known = type_made + type_missed
            
            by_type[shot_type] = {
                'attempts': len(type_shots),
                'made': type_made,
                'missed': type_missed,
                'percentage': (type_made / type_known * 100) if type_known > 0 else 0.0
            }
        
        # Average confidence
        avg_confidence = sum(s.get('confidence', 0) for s in shots) / len(shots)
        
        return {
            'total_attempts': total_attempts,
            'total_made': total_made,
            'total_missed': total_missed,
            'total_unknown': total_unknown,
            'overall_percentage': round(overall_pct, 1),
            'by_type': by_type,
            'avg_confidence': round(avg_confidence, 2),
            'shots': shots  # Include detailed shot data
        }
    
    @staticmethod
    def _get_bbox_center(bbox: List[float]) -> Tuple[float, float]:
        """Get center point of bounding box."""
        return (
            (bbox[0] + bbox[2]) / 2,
            (bbox[1] + bbox[3]) / 2
        )
