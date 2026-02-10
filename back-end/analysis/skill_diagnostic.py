import math
import numpy as np
from typing import Dict, List, Any, Optional

class SkillDiagnosticService:
    """
    Analyzes basketball skills (shooting, dribbling) using pose data.
    Implements the 4-phase shot diagnostic logic: DIP, SET, RELEASE, FINISH.
    """
    
    def __init__(self):
        # Ideal thresholds for coaching feedback
        self.THRESHOLDS = {
            'MIN_ELBOW_EXTENSION': 165.0,  # Degrees
            'IDEAL_KNEE_DIP': 125.0,       # Degrees
            'MIN_ARC_ANGLE': 40.0,         # Degrees
            'MAX_ELBOW_FLARE': 15.0        # Degrees from shoulder-wrist line
        }

    def analyze_shooting_session(self, shots: List[Dict], pose_tracks: List[Dict]) -> List[Dict]:
        """
        Analyzes a full session of shots and provides diagnostic feedback.
        """
        diagnostics = []
        for shot in shots:
            diagnostic = self.analyze_single_shot(shot, pose_tracks)
            diagnostics.append(diagnostic)
        return diagnostics

    def analyze_single_shot(self, shot: Dict, pose_tracks: List[Dict]) -> Dict:
        """
        Diagnoses a single shot attempt.
        """
        release_frame = shot.get('release_frame')
        outcome = shot.get('outcome')
        
        # 1. Identify Keyframes (Dip, Set, Release, Finish)
        keyframes = self._extract_keyframes(shot, pose_tracks)
        
        # 2. Calculate Biometrics
        biometrics = self._calculate_biometrics(keyframes)
        
        # 3. Detect Faults based on biometrics & outcome
        faults = self._detect_faults(biometrics, outcome)
        
        # 4. Synthesize AI Coaching Feedback
        feedback = self._generate_feedback(faults, outcome)
        
        return {
            'shot_id': shot.get('id'),
            'outcome': outcome,
            'keyframes': keyframes,
            'biometrics': biometrics,
            'faults': faults,
            'feedback': feedback
        }

    def _extract_keyframes(self, shot: Dict, pose_tracks: List[Dict]) -> Dict:
        """Extracts the 4 critical frames for a shot."""
        # Simple heuristic implementation - in production this would use AI classification
        release_idx = shot.get('release_frame', 0)
        
        # Heuristics for phases (assuming 30fps)
        return {
            'dip': self._get_pose(pose_tracks, release_idx - 20),
            'set': self._get_pose(pose_tracks, release_idx - 5),
            'release': self._get_pose(pose_tracks, release_idx),
            'finish': self._get_pose(pose_tracks, release_idx + 15)
        }

    def _calculate_biometrics(self, keyframes: Dict) -> Dict:
        """Calculates angles and positions for keyframes."""
        metrics = {}
        
        # Elbow Extension at Release
        release_pose = keyframes.get('release')
        if release_pose:
            metrics['elbow_extension'] = self._calculate_angle(
                release_pose[5], release_pose[7], release_pose[9]
            ) # shoulder-elbow-wrist (left or right depends on player, using dummy for now)

        # Knee Dip
        dip_pose = keyframes.get('dip')
        if dip_pose:
            metrics['knee_dip'] = self._calculate_angle(
                dip_pose[11], dip_pose[13], dip_pose[15]
            ) # hip-knee-ankle
            
        return metrics

    def _detect_faults(self, biometrics: Dict, outcome: str) -> List[str]:
        """Identifies technical errors."""
        faults = []
        if outcome == 'missed':
            ext = biometrics.get('elbow_extension')
            if ext and ext < self.THRESHOLDS['MIN_ELBOW_EXTENSION']:
                faults.append('SHORT_ARM')
                
            dip = biometrics.get('knee_dip')
            if dip and dip > 140:
                faults.append('STIFF_LEGS')
                
        return faults

    def _generate_feedback(self, faults: List[str], outcome: str) -> str:
        """Creates human-readable coaching tips."""
        if outcome == 'made' and not faults:
            return "Great shot! Form is consistent. Keep holding that follow-through."
        
        tips = []
        if 'SHORT_ARM' in faults:
            tips.append("Extend your shooting arm fully. You're losing arc by releasing too early.")
        if 'STIFF_LEGS' in faults:
            tips.append("Dip lower into your legs. Your power should come from the ground up.")
            
        if not tips and outcome == 'missed':
            return "Good form, just a bit off. Keep practicing the same motion."
            
        return " ".join(tips)

    def _get_pose(self, pose_tracks: List[Dict], frame_idx: int) -> Optional[List]:
        if 0 <= frame_idx < len(pose_tracks):
            # Return first player pose found in that frame for now
            poses = pose_tracks[frame_idx]
            if poses:
                first_id = list(poses.keys())[0]
                return poses[first_id].get('keypoints')
        return None

    @staticmethod
    def _calculate_angle(p1, p2, p3):
        if not p1 or not p2 or not p3: return None
        try:
            a = np.array(p1[:2])
            b = np.array(p2[:2])
            c = np.array(p3[:2])
            
            ba = a - b
            bc = c - b
            
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(cosine_angle)
            return np.degrees(angle)
        except:
            return None
