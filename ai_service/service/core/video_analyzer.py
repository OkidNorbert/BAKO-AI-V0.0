"""
Video analysis service for basketball performance tracking.
Integrates MediaPipe pose detection and YOLOv8 object detection.
"""

import cv2
import numpy as np
import mediapipe as mp
from ultralytics import YOLO
import tempfile
import os
from typing import List, Dict, Any, Tuple, Optional
import logging
from dataclasses import dataclass
from service.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class KeypointData:
    """Pose keypoint data structure."""
    time: float
    player_id: Optional[str]
    keypoints: Dict[int, Dict[str, float]]  # {landmark_id: {x, y, z, visibility}}


@dataclass
class DetectionData:
    """Object detection data structure."""
    time: float
    objects: List[Dict[str, Any]]  # [{label, bbox, confidence}]


@dataclass
class EventData:
    """Basketball event data structure."""
    time: float
    event_type: str
    confidence: float
    player_id: Optional[str]
    meta: Dict[str, Any]


class BasketballVideoAnalyzer:
    """Main video analyzer for basketball performance tracking."""
    
    def __init__(self):
        """Initialize the video analyzer with AI models."""
        self.setup_mediapipe()
        self.setup_yolo()
        self.setup_event_detectors()
        
    def setup_mediapipe(self):
        """Initialize MediaPipe pose detection."""
        try:
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(
                static_image_mode=False,
                model_complexity=settings.MEDIAPIPE_MODEL_COMPLEXITY,
                enable_segmentation=False,
                min_detection_confidence=settings.MEDIAPIPE_MIN_DETECTION_CONFIDENCE,
                min_tracking_confidence=settings.MEDIAPIPE_MIN_TRACKING_CONFIDENCE
            )
            self.mp_drawing = mp.solutions.drawing_utils
            logger.info("✅ MediaPipe pose detection initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize MediaPipe: {e}")
            raise
    
    def setup_yolo(self):
        """Initialize YOLOv8 object detection."""
        try:
            model_path = os.path.join(settings.AI_MODEL_PATH, settings.YOLO_MODEL_NAME)
            if not os.path.exists(model_path):
                # Download model if not exists
                logger.info(f"Downloading YOLOv8 model: {settings.YOLO_MODEL_NAME}")
                self.yolo_model = YOLO(settings.YOLO_MODEL_NAME)
                # Save model to models directory
                os.makedirs(settings.AI_MODEL_PATH, exist_ok=True)
                # Note: YOLO model will be cached automatically
            else:
                self.yolo_model = YOLO(model_path)
            logger.info("✅ YOLOv8 object detection initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize YOLOv8: {e}")
            raise
    
    def setup_event_detectors(self):
        """Initialize basketball event detection algorithms."""
        self.shot_detector = ShotDetector()
        self.jump_detector = JumpDetector()
        self.sprint_detector = SprintDetector()
        self.metrics_calculator = PerformanceMetricsCalculator()
        logger.info("✅ Basketball event detectors and metrics calculator initialized")
    
    def analyze_video(self, video_url: str, session_id: int, video_id: int, fps: int = 10) -> Dict[str, Any]:
        """
        Analyze basketball video for performance metrics.
        
        Args:
            video_url: URL of the video file
            session_id: Training session ID
            video_id: Video ID in database
            fps: Frames per second for analysis
            
        Returns:
            Dict containing keypoints, detections, and events
        """
        logger.info(f"🎬 Starting video analysis for video_id: {video_id}")
        
        # Download video to temporary file
        temp_video_path = self._download_video(video_url)
        
        try:
            # Extract frames and analyze
            keypoints_data = []
            detections_data = []
            events_data = []
            
            cap = cv2.VideoCapture(temp_video_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {temp_video_path}")
            
            frame_count = 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            video_fps = cap.get(cv2.CAP_PROP_FPS)
            fps_interval = max(1, int(video_fps / fps))
            
            logger.info(f"Video info: {total_frames} frames, {video_fps:.2f} FPS, analyzing every {fps_interval} frames")
            
            # Progress tracking
            processed_frames = 0
            last_progress = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Skip frames based on FPS setting
                if frame_count % fps_interval != 0:
                    frame_count += 1
                    continue
                
                timestamp = frame_count / video_fps
                
                try:
                    # Analyze frame
                    frame_keypoints = self._analyze_pose(frame, timestamp)
                    frame_detections = self._analyze_objects(frame, timestamp)
                    frame_events = self._detect_events(frame, timestamp, frame_keypoints, frame_detections)
                    
                    if frame_keypoints:
                        keypoints_data.append(frame_keypoints)
                    if frame_detections:
                        detections_data.append(frame_detections)
                    if frame_events:
                        events_data.extend(frame_events)
                    
                    processed_frames += 1
                    
                    # Progress logging
                    progress = int((frame_count / total_frames) * 100)
                    if progress >= last_progress + 10:  # Log every 10%
                        logger.info(f"Analysis progress: {progress}% ({processed_frames} frames processed)")
                        last_progress = progress
                        
                except Exception as e:
                    logger.warning(f"Error processing frame {frame_count}: {e}")
                    continue
                
                frame_count += 1
            
            cap.release()
            
            # Calculate performance metrics
            total_duration = total_frames / video_fps
            analysis_duration = processed_frames / fps
            performance_metrics = self.metrics_calculator.calculate_performance_metrics(
                keypoints_data, events_data
            )
            
            logger.info(f"✅ Video analysis completed:")
            logger.info(f"  - Duration: {total_duration:.2f}s")
            logger.info(f"  - Analyzed: {analysis_duration:.2f}s ({processed_frames} frames)")
            logger.info(f"  - Keypoints: {len(keypoints_data)} frames")
            logger.info(f"  - Detections: {len(detections_data)} frames")
            logger.info(f"  - Events: {len(events_data)} total")
            logger.info(f"  - Performance metrics calculated: {len(performance_metrics)} metrics")
            
            return {
                "video_id": video_id,
                "session_id": session_id,
                "keypoints": [kp.__dict__ for kp in keypoints_data],
                "detections": [det.__dict__ for det in detections_data],
                "events": [ev.__dict__ for ev in events_data],
                "performance_metrics": performance_metrics,
                "status": "completed",
                "metadata": {
                    "total_frames": total_frames,
                    "processed_frames": processed_frames,
                    "video_duration": total_duration,
                    "analysis_fps": fps,
                    "processing_time": analysis_duration
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Video analysis failed: {e}")
            raise
        finally:
            # Clean up temporary file
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
    
    def _download_video(self, video_url: str) -> str:
        """Download video from URL to temporary file."""
        import requests
        
        logger.info(f"📥 Downloading video from: {video_url}")
        
        try:
            # Set timeout and headers for better reliability
            headers = {
                'User-Agent': 'Basketball-Performance-Analyzer/1.0'
            }
            
            response = requests.get(
                video_url, 
                stream=True, 
                timeout=30,
                headers=headers
            )
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if not any(video_type in content_type for video_type in ['video/', 'application/octet-stream']):
                logger.warning(f"Unexpected content type: {content_type}")
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            
            # Download with progress tracking
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)
                    downloaded += len(chunk)
                    
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        if downloaded % (1024 * 1024) == 0:  # Log every MB
                            logger.info(f"Download progress: {progress:.1f}% ({downloaded / (1024*1024):.1f}MB)")
            
            temp_file.close()
            
            # Verify file was created and has content
            if os.path.getsize(temp_file.name) == 0:
                raise ValueError("Downloaded file is empty")
            
            logger.info(f"✅ Video downloaded successfully: {os.path.getsize(temp_file.name) / (1024*1024):.1f}MB")
            return temp_file.name
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to download video: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error during download: {e}")
            raise
    
    def _analyze_pose(self, frame: np.ndarray, timestamp: float) -> Optional[KeypointData]:
        """Analyze pose using MediaPipe."""
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                keypoints = {}
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    keypoints[idx] = {
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility
                    }
                
                return KeypointData(
                    time=timestamp,
                    player_id="player_1",  # TODO: Implement multi-player tracking
                    keypoints=keypoints
                )
        except Exception as e:
            logger.error(f"Error in pose analysis: {e}")
        
        return None
    
    def _analyze_objects(self, frame: np.ndarray, timestamp: float) -> Optional[DetectionData]:
        """Analyze objects using YOLOv8."""
        try:
            results = self.yolo_model(frame, conf=settings.YOLO_CONFIDENCE_THRESHOLD)
            
            objects = []
            for result in results:
                for box in result.boxes:
                    # Filter for basketball-related objects
                    class_id = int(box.cls[0])
                    class_name = self.yolo_model.names[class_id]
                    
                    # Focus on relevant objects (person, sports ball, etc.)
                    if class_name in ['person', 'sports ball']:
                        objects.append({
                            'label': class_name,
                            'bbox': box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                            'confidence': float(box.conf[0])
                        })
            
            if objects:
                return DetectionData(
                    time=timestamp,
                    objects=objects
                )
        except Exception as e:
            logger.error(f"Error in object detection: {e}")
        
        return None
    
    def _detect_events(self, frame: np.ndarray, timestamp: float, 
                      keypoints: Optional[KeypointData], 
                      detections: Optional[DetectionData]) -> List[EventData]:
        """Detect basketball events from frame data."""
        events = []
        
        if keypoints:
            # Detect shots
            shot_event = self.shot_detector.detect(keypoints, timestamp)
            if shot_event:
                events.append(shot_event)
            
            # Detect jumps
            jump_event = self.jump_detector.detect(keypoints, timestamp)
            if jump_event:
                events.append(jump_event)
            
            # Detect sprints
            sprint_event = self.sprint_detector.detect(keypoints, timestamp)
            if sprint_event:
                events.append(sprint_event)
        
        return events


class ShotDetector:
    """Detect basketball shot attempts."""
    
    def __init__(self):
        self.shot_history = []
        self.last_shot_time = 0
        self.shot_cooldown = 1.0  # seconds
    
    def detect(self, keypoints: KeypointData, timestamp: float) -> Optional[EventData]:
        """Detect shot attempt from keypoints."""
        if timestamp - self.last_shot_time < self.shot_cooldown:
            return None
        
        # Key landmarks for shot detection
        left_wrist = keypoints.keypoints.get(15)  # Left wrist
        right_wrist = keypoints.keypoints.get(16)  # Right wrist
        left_shoulder = keypoints.keypoints.get(11)  # Left shoulder
        right_shoulder = keypoints.keypoints.get(12)  # Right shoulder
        
        if not all([left_wrist, right_wrist, left_shoulder, right_shoulder]):
            return None
        
        # Check if hands are above shoulders (shooting position)
        left_above_shoulder = left_wrist['y'] < left_shoulder['y']
        right_above_shoulder = right_wrist['y'] < right_shoulder['y']
        
        # Check for upward motion (shooting motion)
        upward_motion = self._check_upward_motion(keypoints)
        
        # Calculate shot probability
        shot_probability = 0.0
        if left_above_shoulder or right_above_shoulder:
            shot_probability += 0.4
        if upward_motion:
            shot_probability += 0.3
        if keypoints.keypoints.get(15, {}).get('visibility', 0) > 0.7:  # Good visibility
            shot_probability += 0.3
        
        if shot_probability > 0.6:
            self.last_shot_time = timestamp
            return EventData(
                time=timestamp,
                event_type="shot_attempt",
                confidence=shot_probability,
                player_id=keypoints.player_id,
                meta={
                    "left_hand_above_shoulder": left_above_shoulder,
                    "right_hand_above_shoulder": right_above_shoulder,
                    "upward_motion": upward_motion
                }
            )
        
        return None
    
    def _check_upward_motion(self, keypoints: KeypointData) -> bool:
        """Check for upward motion in recent frames."""
        # Store recent wrist positions
        self.shot_history.append({
            'time': keypoints.time,
            'left_wrist_y': keypoints.keypoints.get(15, {}).get('y', 0),
            'right_wrist_y': keypoints.keypoints.get(16, {}).get('y', 0)
        })
        
        # Keep only recent history
        if len(self.shot_history) > 5:
            self.shot_history.pop(0)
        
        if len(self.shot_history) < 3:
            return False
        
        # Check for upward trend
        recent = self.shot_history[-3:]
        left_trend = recent[0]['left_wrist_y'] - recent[-1]['left_wrist_y']
        right_trend = recent[0]['right_wrist_y'] - recent[-1]['right_wrist_y']
        
        return left_trend > 0.1 or right_trend > 0.1


class JumpDetector:
    """Detect basketball jumps."""
    
    def __init__(self):
        self.jump_history = []
        self.last_jump_time = 0
        self.jump_cooldown = 2.0  # seconds
    
    def detect(self, keypoints: KeypointData, timestamp: float) -> Optional[EventData]:
        """Detect jump from keypoints."""
        if timestamp - self.last_jump_time < self.jump_cooldown:
            return None
        
        # Key landmarks for jump detection
        left_ankle = keypoints.keypoints.get(27)  # Left ankle
        right_ankle = keypoints.keypoints.get(28)  # Right ankle
        left_hip = keypoints.keypoints.get(23)  # Left hip
        right_hip = keypoints.keypoints.get(24)  # Right hip
        
        if not all([left_ankle, right_ankle, left_hip, right_hip]):
            return None
        
        # Calculate jump height estimate
        ankle_height = (left_ankle['y'] + right_ankle['y']) / 2
        hip_height = (left_hip['y'] + right_hip['y']) / 2
        
        # Store height history
        self.jump_history.append({
            'time': timestamp,
            'ankle_height': ankle_height,
            'hip_height': hip_height
        })
        
        # Keep only recent history
        if len(self.jump_history) > 10:
            self.jump_history.pop(0)
        
        if len(self.jump_history) < 5:
            return None
        
        # Detect jump peak
        recent_heights = [h['ankle_height'] for h in self.jump_history[-5:]]
        current_height = recent_heights[-1]
        min_height = min(recent_heights)
        
        jump_height = current_height - min_height
        
        if jump_height > 0.05:  # Significant height change
            self.last_jump_time = timestamp
            return EventData(
                time=timestamp,
                event_type="jump",
                confidence=min(jump_height * 10, 1.0),
                player_id=keypoints.player_id,
                meta={
                    "jump_height": jump_height,
                    "peak_height": current_height
                }
            )
        
        return None


class SprintDetector:
    """Detect basketball sprints."""
    
    def __init__(self):
        self.sprint_history = []
        self.last_sprint_time = 0
        self.sprint_cooldown = 3.0  # seconds
    
    def detect(self, keypoints: KeypointData, timestamp: float) -> Optional[EventData]:
        """Detect sprint from keypoints."""
        if timestamp - self.last_sprint_time < self.sprint_cooldown:
            return None
        
        # Key landmarks for sprint detection
        left_ankle = keypoints.keypoints.get(27)  # Left ankle
        right_ankle = keypoints.keypoints.get(28)  # Right ankle
        
        if not all([left_ankle, right_ankle]):
            return None
        
        # Calculate movement speed
        current_position = (left_ankle['x'] + right_ankle['x']) / 2
        
        self.sprint_history.append({
            'time': timestamp,
            'position': current_position
        })
        
        # Keep only recent history
        if len(self.sprint_history) > 10:
            self.sprint_history.pop(0)
        
        if len(self.sprint_history) < 3:
            return None
        
        # Calculate speed
        recent = self.sprint_history[-3:]
        if len(recent) >= 3:
            time_diff = recent[-1]['time'] - recent[0]['time']
            position_diff = abs(recent[-1]['position'] - recent[0]['position'])
            
            if time_diff > 0:
                speed = position_diff / time_diff
                
                if speed > 0.1:  # Significant movement
                    self.last_sprint_time = timestamp
                    return EventData(
                        time=timestamp,
                        event_type="sprint",
                        confidence=min(speed * 5, 1.0),
                        player_id=keypoints.player_id,
                        meta={
                            "speed": speed,
                            "distance": position_diff
                        }
                    )
        
        return None


class PerformanceMetricsCalculator:
    """Calculate performance metrics from analysis data."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_performance_metrics(self, keypoints_data: List[KeypointData], 
                                    events_data: List[EventData]) -> Dict[str, Any]:
        """Calculate performance metrics from analysis data."""
        if not keypoints_data:
            return {}
        
        metrics = {}
        
        # Calculate movement metrics
        total_movement = self._calculate_total_movement(keypoints_data)
        metrics['total_movement'] = total_movement
        
        # Calculate activity metrics
        shot_attempts = len([e for e in events_data if e.event_type == "shot_attempt"])
        jumps = len([e for e in events_data if e.event_type == "jump"])
        sprints = len([e for e in events_data if e.event_type == "sprint"])
        
        metrics['shot_attempts'] = shot_attempts
        metrics['jumps'] = jumps
        metrics['sprints'] = sprints
        
        # Calculate average confidence
        if events_data:
            avg_confidence = sum(e.confidence for e in events_data) / len(events_data)
            metrics['average_event_confidence'] = avg_confidence
        
        # Calculate pose stability
        pose_stability = self._calculate_pose_stability(keypoints_data)
        metrics['pose_stability'] = pose_stability
        
        # Calculate activity intensity
        activity_intensity = self._calculate_activity_intensity(events_data)
        metrics['activity_intensity'] = activity_intensity
        
        return metrics
    
    def _calculate_total_movement(self, keypoints_data: List[KeypointData]) -> float:
        """Calculate total movement distance from keypoints."""
        if len(keypoints_data) < 2:
            return 0.0
        
        total_distance = 0.0
        for i in range(1, len(keypoints_data)):
            prev_kp = keypoints_data[i-1]
            curr_kp = keypoints_data[i]
            
            # Calculate center of mass movement
            prev_center = self._get_center_of_mass(prev_kp.keypoints)
            curr_center = self._get_center_of_mass(curr_kp.keypoints)
            
            if prev_center and curr_center:
                distance = np.sqrt(
                    (curr_center[0] - prev_center[0])**2 + 
                    (curr_center[1] - prev_center[1])**2
                )
                total_distance += distance
        
        return total_distance
    
    def _get_center_of_mass(self, keypoints: Dict[int, Dict[str, float]]) -> Optional[Tuple[float, float]]:
        """Calculate center of mass from keypoints."""
        valid_points = []
        for kp in keypoints.values():
            if kp.get('visibility', 0) > 0.5:
                valid_points.append([kp['x'], kp['y']])
        
        if not valid_points:
            return None
        
        return np.mean(valid_points, axis=0)
    
    def _calculate_pose_stability(self, keypoints_data: List[KeypointData]) -> float:
        """Calculate pose stability (lower is more stable)."""
        if len(keypoints_data) < 2:
            return 0.0
        
        stability_scores = []
        for i in range(1, len(keypoints_data)):
            prev_kp = keypoints_data[i-1]
            curr_kp = keypoints_data[i]
            
            # Calculate keypoint variance
            variance = 0.0
            count = 0
            
            for landmark_id in prev_kp.keypoints:
                if landmark_id in curr_kp.keypoints:
                    prev_point = prev_kp.keypoints[landmark_id]
                    curr_point = curr_kp.keypoints[landmark_id]
                    
                    if (prev_point.get('visibility', 0) > 0.5 and 
                        curr_point.get('visibility', 0) > 0.5):
                        
                        distance = np.sqrt(
                            (curr_point['x'] - prev_point['x'])**2 + 
                            (curr_point['y'] - prev_point['y'])**2
                        )
                        variance += distance
                        count += 1
            
            if count > 0:
                stability_scores.append(variance / count)
        
        return np.mean(stability_scores) if stability_scores else 0.0
    
    def _calculate_activity_intensity(self, events_data: List[EventData]) -> float:
        """Calculate activity intensity based on events."""
        if not events_data:
            return 0.0
        
        # Weight different event types
        event_weights = {
            'shot_attempt': 1.0,
            'jump': 0.8,
            'sprint': 1.2,
            'dribble': 0.6,
            'pass': 0.4
        }
        
        total_intensity = 0.0
        for event in events_data:
            weight = event_weights.get(event.event_type, 0.5)
            total_intensity += event.confidence * weight
        
        return total_intensity
