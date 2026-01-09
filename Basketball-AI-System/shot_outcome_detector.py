"""
Shot Outcome Detector
Rule-based detection of made vs missed shots using ball trajectory analysis
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class ShotOutcome:
    """Shot outcome detection result"""
    outcome: str  # 'made', 'missed', 'unknown'
    confidence: float  # 0.0 to 1.0
    method: str  # Detection method used
    details: Dict  # Additional details


class ShotOutcomeDetector:
    """
    Rule-based shot outcome detection
    Uses ball trajectory and hoop position
    """
    
    def __init__(self):
        self.hoop_region_tolerance = 50  # pixels
        self.crossing_time_window = 1.0  # seconds
        self.min_confidence = 0.5
        
    def detect_outcome(
        self,
        ball_trajectory: List[Tuple[float, float]],
        hoop_position: Optional[Tuple[float, float]] = None,
        timestamps: Optional[List[float]] = None,
        frame_height: int = 720
    ) -> ShotOutcome:
        """
        Detect shot outcome using trajectory analysis
        
        Algorithm:
        1. Identify hoop region
        2. Track ball trajectory
        3. Detect if ball crosses hoop downward
        4. Determine outcome
        
        Args:
            ball_trajectory: List of (x, y) ball positions
            hoop_position: (x, y) position of hoop center
            timestamps: List of timestamps for each position
            frame_height: Height of video frame
            
        Returns:
            ShotOutcome object
        """
        if len(ball_trajectory) == 0:
            return ShotOutcome(
                outcome='unknown',
                confidence=0.0,
                method='no_trajectory',
                details={'reason': 'No ball trajectory detected'}
            )
        
        # If no hoop position provided, estimate from trajectory
        if hoop_position is None:
            hoop_position = self._estimate_hoop_position(
                ball_trajectory,
                frame_height
            )
        
        if hoop_position is None:
            return ShotOutcome(
                outcome='unknown',
                confidence=0.0,
                method='no_hoop',
                details={'reason': 'Could not detect or estimate hoop position'}
            )
        
        # Define hoop region
        hoop_region = self._define_hoop_region(hoop_position)
        
        # Find ball positions near hoop
        near_hoop_positions = self._find_positions_near_hoop(
            ball_trajectory,
            hoop_region
        )
        
        if len(near_hoop_positions) == 0:
            # Ball never came near hoop - likely an air ball or very short shot
            return ShotOutcome(
                outcome='missed',
                confidence=0.7,
                method='never_near_hoop',
                details={
                    'reason': 'Ball never came near hoop region',
                    'closest_distance': self._min_distance_to_hoop(
                        ball_trajectory,
                        hoop_position
                    )
                }
            )
        
        # Check for downward crossing through hoop
        crossing = self._detect_downward_crossing(
            near_hoop_positions,
            hoop_position,
            timestamps if timestamps else list(range(len(near_hoop_positions)))
        )
        
        if crossing:
            return ShotOutcome(
                outcome='made',
                confidence=crossing['confidence'],
                method='trajectory_crossing',
                details={
                    'crossing_frame': crossing['frame_index'],
                    'crossing_position': crossing.get('position'),
                    'trajectory_angle': crossing.get('angle')
                }
            )
        else:
            # Ball came near but didn't cross - check if it was close
            closest_distance = min([
                self._distance(pos, hoop_position) 
                for pos in near_hoop_positions
            ])
            
            if closest_distance < self.hoop_region_tolerance * 1.5:
                # Very close miss (rim out, etc.)
                return ShotOutcome(
                    outcome='missed',
                    confidence=0.85,
                    method='trajectory_near_miss',
                    details={
                        'reason': 'Ball came very close but did not cross hoop',
                        'closest_distance': closest_distance
                    }
                )
            else:
                # Clear miss
                return ShotOutcome(
                    outcome='missed',
                    confidence=0.9,
                    method='trajectory_miss',
                    details={
                        'reason': 'Ball trajectory did not cross hoop',
                        'closest_distance': closest_distance
                    }
                )
    
    def _estimate_hoop_position(
        self,
        ball_trajectory: List[Tuple[float, float]],
        frame_height: int
    ) -> Optional[Tuple[float, float]]:
        """
        Estimate hoop position from ball trajectory
        
        Heuristic: Hoop is typically in upper 1/3 of frame,
        and ball trajectory peaks near it
        
        Args:
            ball_trajectory: List of ball positions
            frame_height: Height of video frame
            
        Returns:
            Estimated (x, y) hoop position or None
        """
        if len(ball_trajectory) < 5:
            return None
        
        # Find apex of trajectory (minimum y value)
        y_values = [pos[1] for pos in ball_trajectory]
        apex_idx = int(np.argmin(y_values))
        apex_position = ball_trajectory[apex_idx]
        
        # Hoop is typically slightly above and forward of apex
        # Estimate based on trajectory
        hoop_x = apex_position[0]
        hoop_y = apex_position[1] - 20  # Slightly above apex
        
        # Ensure hoop is in upper portion of frame
        if hoop_y > frame_height * 0.4:
            hoop_y = frame_height * 0.3
        
        return (hoop_x, hoop_y)
    
    def _define_hoop_region(
        self,
        hoop_position: Tuple[float, float]
    ) -> Dict:
        """
        Define hoop region for detection
        
        Args:
            hoop_position: (x, y) center of hoop
            
        Returns:
            Dict with center, radius, and bounding box
        """
        hoop_x, hoop_y = hoop_position
        
        return {
            'center': (hoop_x, hoop_y),
            'radius': self.hoop_region_tolerance,
            'bbox': {
                'x_min': hoop_x - self.hoop_region_tolerance,
                'x_max': hoop_x + self.hoop_region_tolerance,
                'y_min': hoop_y - self.hoop_region_tolerance,
                'y_max': hoop_y + self.hoop_region_tolerance
            }
        }
    
    def _find_positions_near_hoop(
        self,
        ball_trajectory: List[Tuple[float, float]],
        hoop_region: Dict
    ) -> List[Tuple[float, float]]:
        """
        Find ball positions that are near the hoop region
        
        Args:
            ball_trajectory: List of ball positions
            hoop_region: Hoop region definition
            
        Returns:
            List of positions near hoop
        """
        near_positions = []
        hoop_center = hoop_region['center']
        radius = hoop_region['radius']
        
        for pos in ball_trajectory:
            distance = self._distance(pos, hoop_center)
            if distance < radius * 2:  # Within 2x radius
                near_positions.append(pos)
        
        return near_positions
    
    def _detect_downward_crossing(
        self,
        positions: List[Tuple[float, float]],
        hoop_position: Tuple[float, float],
        timestamps: List[float]
    ) -> Optional[Dict]:
        """
        Detect if ball crossed hoop region moving downward
        
        Logic:
        1. Ball must be above hoop
        2. Ball must move downward
        3. Ball must pass through hoop region
        4. Crossing must happen within time window
        
        Args:
            positions: Ball positions near hoop
            hoop_position: Hoop center position
            timestamps: Timestamps for each position
            
        Returns:
            Dict with crossing info or None
        """
        hoop_x, hoop_y = hoop_position
        
        for i in range(len(positions) - 1):
            curr_x, curr_y = positions[i]
            next_x, next_y = positions[i + 1]
            
            # Check if moving downward (y increasing in image coords)
            if next_y <= curr_y:
                continue
            
            # Check if crossing hoop y-level
            if curr_y < hoop_y < next_y:
                # Check if x-position is near hoop
                if abs(curr_x - hoop_x) < self.hoop_region_tolerance:
                    # Downward crossing detected!
                    confidence = self._calculate_crossing_confidence(
                        curr_x, curr_y, next_x, next_y, hoop_x, hoop_y
                    )
                    
                    return {
                        'frame_index': i,
                        'timestamp': timestamps[i] if i < len(timestamps) else i,
                        'confidence': confidence,
                        'position': ((curr_x + next_x) / 2, (curr_y + next_y) / 2),
                        'angle': np.arctan2(next_y - curr_y, next_x - curr_x)
                    }
        
        return None
    
    def _calculate_crossing_confidence(
        self,
        curr_x: float, curr_y: float,
        next_x: float, next_y: float,
        hoop_x: float, hoop_y: float
    ) -> float:
        """
        Calculate confidence in crossing detection
        
        Higher confidence if:
        - Crossing is more centered on hoop
        - Trajectory is more vertical
        
        Args:
            curr_x, curr_y: Current ball position
            next_x, next_y: Next ball position
            hoop_x, hoop_y: Hoop position
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        # Distance from hoop center
        crossing_x = (curr_x + next_x) / 2
        horizontal_distance = abs(crossing_x - hoop_x)
        
        # Normalize to 0-1 (closer = higher confidence)
        horizontal_conf = max(0.0, 1.0 - (horizontal_distance / self.hoop_region_tolerance))
        
        # Trajectory angle (more vertical = higher confidence)
        dy = next_y - curr_y
        dx = abs(next_x - curr_x)
        
        if dx < 1e-6:
            vertical_conf = 1.0  # Perfectly vertical
        else:
            angle = np.arctan2(dy, dx)  # radians
            # Vertical is π/2, horizontal is 0
            vertical_conf = min(1.0, angle / (np.pi / 2))
        
        # Combined confidence (weighted average)
        confidence = (0.7 * horizontal_conf + 0.3 * vertical_conf)
        
        # Ensure minimum confidence
        confidence = max(self.min_confidence, confidence)
        
        return min(1.0, confidence)
    
    def _distance(
        self,
        pos1: Tuple[float, float],
        pos2: Tuple[float, float]
    ) -> float:
        """Calculate Euclidean distance between two points"""
        return np.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
    
    def _min_distance_to_hoop(
        self,
        ball_trajectory: List[Tuple[float, float]],
        hoop_position: Tuple[float, float]
    ) -> float:
        """Find minimum distance from trajectory to hoop"""
        if len(ball_trajectory) == 0:
            return float('inf')
        
        distances = [self._distance(pos, hoop_position) for pos in ball_trajectory]
        return min(distances)


class HoopDetector:
    """
    Detect hoop position in frame
    Uses color-based detection and geometric heuristics
    """
    
    def __init__(self):
        self.orange_lower = np.array([5, 100, 100])  # HSV
        self.orange_upper = np.array([15, 255, 255])
        self.min_circularity = 0.7
        self.min_area = 100
    
    def detect_hoop(
        self,
        frame: np.ndarray,
        court_info: Optional[Dict] = None
    ) -> Optional[Tuple[float, float]]:
        """
        Detect hoop position in frame
        
        Methods (in order of preference):
        1. Color-based detection (orange rim)
        2. Geometric detection (circular shape)
        3. Court-based estimation
        
        Args:
            frame: Video frame (BGR)
            court_info: Optional court detection info
            
        Returns:
            (x, y) hoop position or None
        """
        # Method 1: Color-based detection
        hoop_pos = self._detect_hoop_color(frame)
        if hoop_pos:
            return hoop_pos
        
        # Method 2: Geometric detection
        hoop_pos = self._detect_hoop_geometric(frame)
        if hoop_pos:
            return hoop_pos
        
        # Method 3: Court-based estimation
        if court_info:
            hoop_pos = self._estimate_hoop_from_court(court_info, frame.shape)
            return hoop_pos
        
        return None
    
    def _detect_hoop_color(self, frame: np.ndarray) -> Optional[Tuple[float, float]]:
        """
        Detect hoop using orange color of rim
        
        Args:
            frame: Video frame (BGR)
            
        Returns:
            (x, y) hoop position or None
        """
        # Convert to HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Threshold for orange color
        mask = cv2.inRange(hsv, self.orange_lower, self.orange_upper)
        
        # Find contours
        contours, _ = cv2.findContours(
            mask, 
            cv2.RETR_EXTERNAL, 
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Find circular contours in upper part of frame
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < self.min_area:
                continue
            
            # Check circularity
            perimeter = cv2.arcLength(contour, True)
            if perimeter == 0:
                continue
            
            circularity = 4 * np.pi * area / (perimeter ** 2)
            
            if circularity > self.min_circularity:
                # Get center
                M = cv2.moments(contour)
                if M['m00'] > 0:
                    cx = int(M['m10'] / M['m00'])
                    cy = int(M['m01'] / M['m00'])
                    
                    # Check if in upper half of frame
                    if cy < frame.shape[0] / 2:
                        return (float(cx), float(cy))
        
        return None
    
    def _detect_hoop_geometric(self, frame: np.ndarray) -> Optional[Tuple[float, float]]:
        """
        Detect hoop using geometric shape detection
        
        Args:
            frame: Video frame
            
        Returns:
            (x, y) hoop position or None
        """
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        
        # Detect circles using Hough transform
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=50,
            param1=50,
            param2=30,
            minRadius=10,
            maxRadius=100
        )
        
        if circles is not None:
            circles = np.uint16(np.around(circles))
            
            # Find circle in upper portion of frame
            for circle in circles[0, :]:
                cx, cy, radius = circle
                
                # Check if in upper half
                if cy < frame.shape[0] / 2:
                    return (float(cx), float(cy))
        
        return None
    
    def _estimate_hoop_from_court(
        self,
        court_info: Dict,
        frame_shape: Tuple
    ) -> Optional[Tuple[float, float]]:
        """
        Estimate hoop position from court detection
        
        Args:
            court_info: Court detection information
            frame_shape: (height, width, channels)
            
        Returns:
            Estimated (x, y) hoop position
        """
        # Simple heuristic: hoop is typically in upper-center of frame
        height, width = frame_shape[:2]
        
        # Estimate based on frame dimensions
        hoop_x = width / 2
        hoop_y = height * 0.25  # Upper quarter
        
        return (hoop_x, hoop_y)


def main():
    """Example usage"""
    print("🏀 Shot Outcome Detector")
    print("=" * 50)
    
    # Create detector
    detector = ShotOutcomeDetector()
    
    # Example trajectory (simulated made shot)
    made_trajectory = [
        (320, 400),  # Start
        (325, 350),  # Rising
        (330, 300),  # Peak
        (335, 250),  # Descending
        (340, 200),  # Near hoop
        (345, 150),  # Through hoop
        (350, 100),  # After hoop
    ]
    
    hoop_position = (340, 180)
    
    # Detect outcome
    outcome = detector.detect_outcome(
        ball_trajectory=made_trajectory,
        hoop_position=hoop_position
    )
    
    print(f"\n✅ Outcome: {outcome.outcome}")
    print(f"📊 Confidence: {outcome.confidence:.2f}")
    print(f"🔍 Method: {outcome.method}")
    print(f"📝 Details: {outcome.details}")
    
    # Example missed shot
    missed_trajectory = [
        (320, 400),
        (325, 350),
        (330, 300),
        (335, 250),
        (380, 220),  # Off to the side
        (400, 200),
        (420, 180),
    ]
    
    outcome2 = detector.detect_outcome(
        ball_trajectory=missed_trajectory,
        hoop_position=hoop_position
    )
    
    print(f"\n✅ Outcome: {outcome2.outcome}")
    print(f"📊 Confidence: {outcome2.confidence:.2f}")
    print(f"🔍 Method: {outcome2.method}")


if __name__ == "__main__":
    main()
