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
        trajectory_window: int = 30,
        success_time_window: int = 15,
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
            results = self.hoop_model.predict(batch, conf=0.5, classes=[2])  # Class 2 = hoop
            
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
        fps: float = 30.0,
        court_keypoints: Optional[List] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect shot attempts and their outcomes.
        
        Args:
            ball_tracks: Ball tracking data per frame
            hoop_detections: Hoop detection data per frame
            fps: Video frames per second
            court_keypoints: Optional court keypoint data for shot location
            
        Returns:
            List of shot events with outcome information
        """
        shots = []
        
        # Extract ball trajectory
        ball_trajectory = self._extract_ball_trajectory(ball_tracks)
        
        if len(ball_trajectory) < 10:
            return shots  # Need minimum trajectory data
        
        # Find hoop location (use most common or median position)
        hoop_location = self._get_stable_hoop_location(hoop_detections)
        
        # Detect shot attempts by identifying upward trajectories
        shot_attempts = self._detect_shot_attempts(ball_trajectory, hoop_location)
        
        # Analyze each shot attempt for success/failure
        for attempt in shot_attempts:
            shot_outcome = self._analyze_shot_outcome(
                attempt,
                ball_trajectory,
                hoop_location,
                fps
            )
            
            if shot_outcome:
                # Add shot type classification
                shot_outcome['shot_type'] = self._classify_shot_type(
                    attempt,
                    ball_trajectory,
                    hoop_location,
                    court_keypoints
                )
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
        
        return {
            'x': np.median([c[0] for c in centers]),
            'y': np.median([c[1] for c in centers]),
            'rim_y': np.median(rim_ys)
        }
    
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
            
            # Look for upward movement (negative dy in screen coords)
            if point.get('vy', 0) < -5:  # Moving up significantly
                
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
                    
                    if toward_hoop:
                        attempts.append({
                            'start_frame': point['frame'],
                            'start_idx': i,
                            'peak_frame': trajectory[peak_idx]['frame'],
                            'peak_idx': peak_idx,
                            'arc_height': arc_height,
                            'start_position': (point['x'], point['y']),
                            'peak_position': (trajectory[peak_idx]['x'], trajectory[peak_idx]['y'])
                        })
                        
                        # Skip ahead to avoid duplicate detection
                        i = peak_idx + 5
                        continue
            
            i += 1
        
        return attempts
    
    def _analyze_shot_outcome(
        self,
        attempt: Dict,
        trajectory: List[Dict],
        hoop_location: Optional[Dict],
        fps: float
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze whether a shot attempt was successful.
        
        A shot is successful if:
        1. The ball passes through/near the hoop location
        2. The ball is descending (positive vy)
        3. This occurs within a reasonable time window after the peak
        """
        if not hoop_location:
            # Can't determine success without hoop location
            return {
                'start_frame': attempt['start_frame'],
                'peak_frame': attempt['peak_frame'],
                'outcome': 'unknown',
                'confidence': 0.0,
                'timestamp_seconds': attempt['start_frame'] / fps
            }
        
        peak_idx = attempt['peak_idx']
        
        # Look for ball passing through hoop region after peak
        success_detected = False
        outcome_frame = None
        min_distance = float('inf')
        
        end_idx = min(peak_idx + self.success_time_window, len(trajectory))
        
        for i in range(peak_idx, end_idx):
            point = trajectory[i]
            
            # Check if ball is near hoop horizontally
            horizontal_dist = abs(point['x'] - hoop_location['x'])
            
            # Check if ball is at or passing through rim level (descending)
            vertical_dist = abs(point['y'] - hoop_location['rim_y'])
            is_descending = point.get('vy', 0) > 0
            
            # Calculate distance to hoop center
            dist_to_hoop = math.sqrt(horizontal_dist**2 + vertical_dist**2)
            
            if dist_to_hoop < min_distance:
                min_distance = dist_to_hoop
            
            # Success condition: close to hoop and descending
            if (horizontal_dist < self.hoop_proximity_threshold and 
                vertical_dist < 50 and 
                is_descending):
                success_detected = True
                outcome_frame = point['frame']
                break
        
        # Determine outcome
        if success_detected:
            outcome = 'made'
            confidence = min(1.0, self.hoop_proximity_threshold / (min_distance + 1))
        else:
            # Check if ball came close to hoop
            if min_distance < self.hoop_proximity_threshold * 2:
                outcome = 'missed'
                confidence = 0.7
            else:
                outcome = 'missed'
                confidence = 0.5
        
        return {
            'start_frame': attempt['start_frame'],
            'peak_frame': attempt['peak_frame'],
            'outcome_frame': outcome_frame or attempt['peak_frame'],
            'outcome': outcome,
            'confidence': confidence,
            'timestamp_seconds': attempt['start_frame'] / fps,
            'arc_height_pixels': attempt['arc_height'],
            'distance_to_hoop_pixels': min_distance,
            'start_position': attempt['start_position'],
            'peak_position': attempt['peak_position']
        }
    
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
        
        # Calculate horizontal distance to hoop
        horizontal_distance = abs(start_pos[0] - hoop_location['x'])
        
        # Layup/Dunk detection (close range, low arc)
        if horizontal_distance < 150:
            if arc_height < 80:
                return 'layup'
            else:
                return 'layup'
        
        # Three-pointer (far range)
        elif horizontal_distance > 400:
            return 'three-pointer'
        
        # Mid-range
        elif horizontal_distance > 150:
            return 'mid-range'
        
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
