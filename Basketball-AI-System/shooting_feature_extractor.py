"""
Shooting Feature Extractor
Extracts shooting-specific features from pose keypoints
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import mediapipe as mp
from shooting_features import (
    ShootingFeatures, SetupFeatures, LoadingFeatures,
    ReleaseFeatures, FollowThroughFeatures, TimingFeatures,
    ShootingPhases
)


class ShootingFeatureExtractor:
    """
    Extracts shooting-specific features from pose keypoints
    """
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def extract_shot_features(
        self, 
        video_path: str
    ) -> ShootingFeatures:
        """
        Extract all shooting-relevant features from a shot video
        
        Args:
            video_path: Path to video file
            
        Returns:
            ShootingFeatures object with temporal sequences
        """
        # Process video and extract keypoints
        keypoints_sequence, fps = self.process_video(video_path)
        
        if len(keypoints_sequence) == 0:
            raise ValueError("No keypoints extracted from video")
        
        # Detect key phases
        phases = self.detect_shooting_phases(keypoints_sequence, fps)
        
        # Extract features at each phase
        features = self._extract_features_from_phases(keypoints_sequence, phases, fps)
        
        return features
    
    def process_video(self, video_path: str) -> Tuple[List[Dict], float]:
        """
        Process video and extract keypoints for each frame
        
        Returns:
            (keypoints_sequence, fps) tuple
        """
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        keypoints_sequence = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(frame_rgb)
            
            if results.pose_landmarks:
                # Extract keypoints
                keypoints = self._extract_keypoints(results.pose_landmarks)
                keypoints_sequence.append(keypoints)
        
        cap.release()
        
        return keypoints_sequence, fps
    
    def _extract_keypoints(self, landmarks) -> Dict:
        """
        Extract keypoints from MediaPipe landmarks
        
        Returns:
            Dict with keypoint positions
        """
        keypoints = {}
        
        # Map MediaPipe landmarks to our keypoint names
        landmark_map = {
            'nose': self.mp_pose.PoseLandmark.NOSE,
            'left_shoulder': self.mp_pose.PoseLandmark.LEFT_SHOULDER,
            'right_shoulder': self.mp_pose.PoseLandmark.RIGHT_SHOULDER,
            'left_elbow': self.mp_pose.PoseLandmark.LEFT_ELBOW,
            'right_elbow': self.mp_pose.PoseLandmark.RIGHT_ELBOW,
            'left_wrist': self.mp_pose.PoseLandmark.LEFT_WRIST,
            'right_wrist': self.mp_pose.PoseLandmark.RIGHT_WRIST,
            'left_hip': self.mp_pose.PoseLandmark.LEFT_HIP,
            'right_hip': self.mp_pose.PoseLandmark.RIGHT_HIP,
            'left_knee': self.mp_pose.PoseLandmark.LEFT_KNEE,
            'right_knee': self.mp_pose.PoseLandmark.RIGHT_KNEE,
            'left_ankle': self.mp_pose.PoseLandmark.LEFT_ANKLE,
            'right_ankle': self.mp_pose.PoseLandmark.RIGHT_ANKLE,
        }
        
        for name, landmark_id in landmark_map.items():
            landmark = landmarks.landmark[landmark_id]
            keypoints[name] = {
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            }
        
        return keypoints
    
    def detect_shooting_phases(
        self, 
        keypoints_sequence: List[Dict],
        fps: float
    ) -> ShootingPhases:
        """
        Detect key phases of shooting motion
        
        Phases:
        - Setup: Initial stance
        - Loading: Knee bend, ball preparation
        - Release: Ball leaves hands
        - Follow-through: After release
        
        Returns:
            ShootingPhases object
        """
        # Extract hip heights over time
        hip_heights = [self._get_hip_height(kp) for kp in keypoints_sequence]
        
        # Extract wrist heights over time
        wrist_heights = [self._get_wrist_height(kp) for kp in keypoints_sequence]
        
        # Find loading phase (hip height decreases)
        loading_start = self._find_descent_start(hip_heights)
        loading_end = self._find_lowest_point(hip_heights)
        
        # Find release (wrist height peaks)
        release_frame = self._find_release_point(wrist_heights, loading_end)
        
        # Setup is before loading
        setup_start = 0
        setup_end = max(0, loading_start - 1)
        
        # Follow-through is after release
        followthrough_end = len(keypoints_sequence) - 1
        
        return ShootingPhases(
            setup_start=setup_start,
            setup_end=setup_end,
            loading_start=loading_start,
            loading_end=loading_end,
            release_frame=release_frame,
            followthrough_end=followthrough_end
        )
    
    def _get_hip_height(self, keypoints: Dict) -> float:
        """Get average hip height"""
        left_hip_y = keypoints['left_hip']['y']
        right_hip_y = keypoints['right_hip']['y']
        return (left_hip_y + right_hip_y) / 2
    
    def _get_wrist_height(self, keypoints: Dict) -> float:
        """Get shooting hand wrist height (assume right hand)"""
        # TODO: Detect shooting hand automatically
        return keypoints['right_wrist']['y']
    
    def _find_descent_start(self, hip_heights: List[float]) -> int:
        """Find frame where hip starts descending"""
        for i in range(1, len(hip_heights) - 1):
            # Hip moving down (y increasing in image coords)
            if hip_heights[i] < hip_heights[i-1]:
                return i
        return 0
    
    def _find_lowest_point(self, hip_heights: List[float]) -> int:
        """Find frame with lowest hip position"""
        # Lowest point is maximum y value (image coords)
        return int(np.argmax(hip_heights))
    
    def _find_release_point(
        self, 
        wrist_heights: List[float],
        loading_end: int
    ) -> int:
        """Find frame where ball is released"""
        # Release is typically when wrist reaches peak height after loading
        # Search after loading phase
        search_start = loading_end
        search_end = min(len(wrist_heights), loading_end + 30)  # Search next 1 second
        
        if search_start >= len(wrist_heights):
            return len(wrist_heights) - 1
        
        # Find minimum y (highest point) in search window
        search_window = wrist_heights[search_start:search_end]
        if len(search_window) == 0:
            return search_start
        
        release_offset = int(np.argmin(search_window))
        return search_start + release_offset
    
    def _extract_features_from_phases(
        self,
        keypoints_sequence: List[Dict],
        phases: ShootingPhases,
        fps: float
    ) -> ShootingFeatures:
        """
        Extract features from detected phases
        
        Args:
            keypoints_sequence: List of keypoints for each frame
            phases: Detected shooting phases
            fps: Video frame rate
            
        Returns:
            ShootingFeatures object
        """
        # Extract setup features
        setup_keypoints = keypoints_sequence[phases.setup_start:phases.setup_end+1]
        setup_features = self._extract_setup_features(setup_keypoints)
        
        # Extract loading features
        loading_keypoints = keypoints_sequence[phases.loading_start:phases.loading_end+1]
        loading_features = self._extract_loading_features(loading_keypoints, fps)
        
        # Extract release features
        release_keypoints = keypoints_sequence[phases.release_frame]
        release_features = self._extract_release_features(release_keypoints)
        
        # Extract follow-through features
        followthrough_keypoints = keypoints_sequence[phases.release_frame:phases.followthrough_end+1]
        followthrough_features = self._extract_followthrough_features(followthrough_keypoints, fps)
        
        # Extract timing features
        timing_features = self._extract_timing_features(phases, fps)
        
        return ShootingFeatures(
            setup=setup_features,
            loading=loading_features,
            release=release_features,
            followthrough=followthrough_features,
            timing=timing_features
        )
    
    def _extract_setup_features(self, keypoints_list: List[Dict]) -> SetupFeatures:
        """Extract features from setup phase"""
        if len(keypoints_list) == 0:
            # Return default values
            return SetupFeatures(
                stance_width=0.0,
                shoulder_alignment=0.0,
                ball_position_x=0.5,
                ball_position_y=0.5,
                head_alignment=0.0
            )
        
        # Use first frame of setup
        kp = keypoints_list[0]
        
        # Stance width (distance between ankles)
        left_ankle = np.array([kp['left_ankle']['x'], kp['left_ankle']['y']])
        right_ankle = np.array([kp['right_ankle']['x'], kp['right_ankle']['y']])
        stance_width = np.linalg.norm(left_ankle - right_ankle)
        
        # Shoulder alignment (angle)
        left_shoulder = np.array([kp['left_shoulder']['x'], kp['left_shoulder']['y']])
        right_shoulder = np.array([kp['right_shoulder']['x'], kp['right_shoulder']['y']])
        shoulder_vector = right_shoulder - left_shoulder
        shoulder_alignment = np.arctan2(shoulder_vector[1], shoulder_vector[0])
        
        # Ball position (approximate from wrist position)
        ball_x = kp['right_wrist']['x']
        ball_y = kp['right_wrist']['y']
        
        # Head alignment
        nose = np.array([kp['nose']['x'], kp['nose']['y']])
        mid_shoulder = (left_shoulder + right_shoulder) / 2
        head_vector = nose - mid_shoulder
        head_alignment = np.arctan2(head_vector[1], head_vector[0])
        
        return SetupFeatures(
            stance_width=float(stance_width),
            shoulder_alignment=float(shoulder_alignment),
            ball_position_x=float(ball_x),
            ball_position_y=float(ball_y),
            head_alignment=float(head_alignment)
        )
    
    def _extract_loading_features(
        self, 
        keypoints_list: List[Dict],
        fps: float
    ) -> LoadingFeatures:
        """Extract features from loading phase"""
        if len(keypoints_list) == 0:
            return LoadingFeatures(
                knee_flexion=0.0,
                hip_flexion=0.0,
                elbow_angle=90.0,
                loading_depth=0.0,
                loading_duration=0.0
            )
        
        # Use last frame of loading (deepest point)
        kp = keypoints_list[-1]
        
        # Knee flexion angle (right knee)
        knee_angle = self._calculate_angle(
            kp['right_hip'],
            kp['right_knee'],
            kp['right_ankle']
        )
        
        # Hip flexion
        hip_angle = self._calculate_angle(
            kp['right_shoulder'],
            kp['right_hip'],
            kp['right_knee']
        )
        
        # Elbow angle
        elbow_angle = self._calculate_angle(
            kp['right_shoulder'],
            kp['right_elbow'],
            kp['right_wrist']
        )
        
        # Loading depth (hip displacement)
        hip_heights = [self._get_hip_height(k) for k in keypoints_list]
        loading_depth = max(hip_heights) - min(hip_heights)
        
        # Loading duration
        loading_duration = len(keypoints_list) / fps
        
        return LoadingFeatures(
            knee_flexion=float(knee_angle),
            hip_flexion=float(hip_angle),
            elbow_angle=float(elbow_angle),
            loading_depth=float(loading_depth),
            loading_duration=float(loading_duration)
        )
    
    def _extract_release_features(self, keypoints: Dict) -> ReleaseFeatures:
        """Extract features at release moment"""
        # Elbow angle
        elbow_angle = self._calculate_angle(
            keypoints['right_shoulder'],
            keypoints['right_elbow'],
            keypoints['right_wrist']
        )
        
        # Wrist flexion (approximate)
        wrist_y = keypoints['right_wrist']['y']
        elbow_y = keypoints['right_elbow']['y']
        wrist_flexion = abs(wrist_y - elbow_y) * 100  # Normalized
        
        # Release height
        release_height = 1.0 - keypoints['right_wrist']['y']  # Normalized (0=bottom, 1=top)
        
        # Shoulder angle
        shoulder_angle = self._calculate_angle(
            keypoints['right_elbow'],
            keypoints['right_shoulder'],
            keypoints['right_hip']
        )
        
        # Release angle (arm relative to vertical)
        shoulder = np.array([keypoints['right_shoulder']['x'], keypoints['right_shoulder']['y']])
        wrist = np.array([keypoints['right_wrist']['x'], keypoints['right_wrist']['y']])
        arm_vector = wrist - shoulder
        release_angle = np.arctan2(arm_vector[0], -arm_vector[1])  # Angle from vertical
        release_angle_deg = np.degrees(release_angle)
        
        # Balance score (center of mass stability)
        balance_score = self._calculate_balance_score(keypoints)
        
        return ReleaseFeatures(
            elbow_angle=float(elbow_angle),
            wrist_flexion=float(wrist_flexion),
            release_height=float(release_height),
            shoulder_angle=float(shoulder_angle),
            release_angle=float(release_angle_deg),
            balance_score=float(balance_score)
        )
    
    def _extract_followthrough_features(
        self,
        keypoints_list: List[Dict],
        fps: float
    ) -> FollowThroughFeatures:
        """Extract features from follow-through phase"""
        if len(keypoints_list) < 2:
            return FollowThroughFeatures(
                wrist_snap_angle=0.0,
                arm_extension=0.0,
                followthrough_duration=0.0,
                balance_recovery=0.5
            )
        
        # Use last frame
        kp_final = keypoints_list[-1]
        
        # Wrist snap angle (final wrist position)
        wrist_snap = self._calculate_angle(
            kp_final['right_elbow'],
            kp_final['right_wrist'],
            {'x': kp_final['right_wrist']['x'], 
             'y': kp_final['right_wrist']['y'] + 0.1,  # Point below wrist
             'z': kp_final['right_wrist']['z']}
        )
        
        # Arm extension
        shoulder = np.array([kp_final['right_shoulder']['x'], kp_final['right_shoulder']['y']])
        wrist = np.array([kp_final['right_wrist']['x'], kp_final['right_wrist']['y']])
        arm_extension = np.linalg.norm(wrist - shoulder)
        
        # Follow-through duration
        followthrough_duration = len(keypoints_list) / fps
        
        # Balance recovery (how stable at end)
        balance_recovery = self._calculate_balance_score(kp_final)
        
        return FollowThroughFeatures(
            wrist_snap_angle=float(wrist_snap),
            arm_extension=float(arm_extension),
            followthrough_duration=float(followthrough_duration),
            balance_recovery=float(balance_recovery)
        )
    
    def _extract_timing_features(
        self,
        phases: ShootingPhases,
        fps: float
    ) -> TimingFeatures:
        """Extract timing features"""
        # Total shot duration
        total_frames = phases.followthrough_end - phases.setup_start
        total_duration = total_frames / fps
        
        # Loading to release time
        loading_to_release_frames = phases.release_frame - phases.loading_end
        loading_to_release = loading_to_release_frames / fps
        
        # Rhythm consistency (placeholder - would need multiple shots)
        rhythm_consistency = 0.8  # Default
        
        return TimingFeatures(
            total_shot_duration=float(total_duration),
            loading_to_release=float(loading_to_release),
            rhythm_consistency=float(rhythm_consistency)
        )
    
    def _calculate_angle(
        self,
        point1: Dict,
        point2: Dict,
        point3: Dict
    ) -> float:
        """
        Calculate angle at point2 formed by point1-point2-point3
        
        Returns:
            Angle in degrees
        """
        p1 = np.array([point1['x'], point1['y']])
        p2 = np.array([point2['x'], point2['y']])
        p3 = np.array([point3['x'], point3['y']])
        
        # Vectors
        v1 = p1 - p2
        v2 = p3 - p2
        
        # Angle
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.arccos(cos_angle)
        
        return np.degrees(angle)
    
    def _calculate_balance_score(self, keypoints: Dict) -> float:
        """
        Calculate balance/stability score
        
        Returns:
            Score from 0.0 (unstable) to 1.0 (stable)
        """
        # Calculate center of mass (approximate)
        left_hip = np.array([keypoints['left_hip']['x'], keypoints['left_hip']['y']])
        right_hip = np.array([keypoints['right_hip']['x'], keypoints['right_hip']['y']])
        com = (left_hip + right_hip) / 2
        
        # Calculate base of support (between feet)
        left_ankle = np.array([keypoints['left_ankle']['x'], keypoints['left_ankle']['y']])
        right_ankle = np.array([keypoints['right_ankle']['x'], keypoints['right_ankle']['y']])
        base_center = (left_ankle + right_ankle) / 2
        
        # Distance from COM to base center
        com_offset = np.linalg.norm(com - base_center)
        
        # Convert to score (closer = more stable)
        balance_score = max(0.0, 1.0 - (com_offset * 5.0))  # Scale factor
        
        return balance_score
