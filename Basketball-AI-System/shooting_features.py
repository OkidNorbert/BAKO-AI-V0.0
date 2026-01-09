"""
Shooting Feature Extraction and Data Structures
Defines all shooting-specific features for baseline and analysis
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple, Optional
import numpy as np
import json
from datetime import datetime


@dataclass
class SetupFeatures:
    """Features during setup phase"""
    stance_width: float          # Distance between feet (normalized)
    shoulder_alignment: float    # Shoulder angle relative to basket
    ball_position_x: float       # Ball horizontal position
    ball_position_y: float       # Ball vertical position
    head_alignment: float        # Head angle


@dataclass
class LoadingFeatures:
    """Features during loading phase"""
    knee_flexion: float          # Knee bend angle (degrees)
    hip_flexion: float           # Hip bend angle
    elbow_angle: float           # Shooting arm elbow angle
    loading_depth: float         # How low player goes (normalized)
    loading_duration: float      # Time spent loading (seconds)


@dataclass
class ReleaseFeatures:
    """Features at release moment"""
    elbow_angle: float           # Elbow angle at release (degrees)
    wrist_flexion: float         # Wrist angle at release
    release_height: float        # Height of release point (normalized)
    shoulder_angle: float        # Shoulder alignment
    release_angle: float         # Arm angle relative to vertical
    balance_score: float         # Center of mass stability (0-1)


@dataclass
class FollowThroughFeatures:
    """Features during follow-through"""
    wrist_snap_angle: float      # Final wrist position
    arm_extension: float         # How far arm extends
    followthrough_duration: float # Time holding follow-through
    balance_recovery: float      # How quickly balance recovered


@dataclass
class TimingFeatures:
    """Temporal features"""
    total_shot_duration: float   # Total time from setup to release
    loading_to_release: float    # Time from lowest point to release
    rhythm_consistency: float    # Consistency of timing (0-1)


@dataclass
class ShootingFeatures:
    """Complete shooting feature set"""
    setup: SetupFeatures
    loading: LoadingFeatures
    release: ReleaseFeatures
    followthrough: FollowThroughFeatures
    timing: TimingFeatures
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ShootingFeatures':
        """Create from dictionary"""
        return cls(
            setup=SetupFeatures(**data['setup']),
            loading=LoadingFeatures(**data['loading']),
            release=ReleaseFeatures(**data['release']),
            followthrough=FollowThroughFeatures(**data['followthrough']),
            timing=TimingFeatures(**data['timing'])
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'ShootingFeatures':
        """Create from JSON string"""
        data = json.loads(json_str)
        return cls.from_dict(data)


@dataclass
class ShootingPhases:
    """Detected phases in shooting motion"""
    setup_start: int
    setup_end: int
    loading_start: int
    loading_end: int
    release_frame: int
    followthrough_end: int
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class PlayerBaseline:
    """
    Player-specific shooting baseline
    Stores statistical representation of player's successful shots
    """
    player_id: str
    created_at: str  # ISO format datetime string
    num_shots_captured: int
    num_made_shots: int
    
    # Release features (mean ± std)
    release_elbow_angle_mean: float
    release_elbow_angle_std: float
    release_height_mean: float
    release_height_std: float
    wrist_flexion_mean: float
    wrist_flexion_std: float
    shoulder_angle_mean: float
    shoulder_angle_std: float
    release_angle_mean: float
    release_angle_std: float
    balance_score_mean: float
    balance_score_std: float
    
    # Loading features
    knee_flexion_mean: float
    knee_flexion_std: float
    hip_flexion_mean: float
    hip_flexion_std: float
    elbow_angle_loading_mean: float
    elbow_angle_loading_std: float
    loading_depth_mean: float
    loading_depth_std: float
    loading_duration_mean: float
    loading_duration_std: float
    
    # Timing features
    shot_duration_mean: float
    shot_duration_std: float
    loading_to_release_mean: float
    loading_to_release_std: float
    rhythm_consistency_mean: float
    rhythm_consistency_std: float
    
    # Follow-through features
    wrist_snap_mean: float
    wrist_snap_std: float
    arm_extension_mean: float
    arm_extension_std: float
    followthrough_duration_mean: float
    followthrough_duration_std: float
    balance_recovery_mean: float
    balance_recovery_std: float
    
    # Setup features
    stance_width_mean: float
    stance_width_std: float
    shoulder_alignment_mean: float
    shoulder_alignment_std: float
    
    # Reference shots (video IDs of best examples)
    reference_shots: List[str]
    
    # Acceptable ranges (for deviation detection)
    acceptable_ranges: Dict[str, Tuple[float, float]]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Serialize to JSON for storage"""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'PlayerBaseline':
        """Create from dictionary"""
        return cls(**data)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'PlayerBaseline':
        """Deserialize from JSON"""
        data = json.loads(json_str)
        return cls.from_dict(data)
    
    def get_feature_range(self, feature_name: str, num_std: float = 2.0) -> Tuple[float, float]:
        """
        Get acceptable range for a feature
        
        Args:
            feature_name: Name of the feature
            num_std: Number of standard deviations for range
            
        Returns:
            (lower_bound, upper_bound) tuple
        """
        mean_attr = f"{feature_name}_mean"
        std_attr = f"{feature_name}_std"
        
        if not hasattr(self, mean_attr) or not hasattr(self, std_attr):
            raise ValueError(f"Feature {feature_name} not found in baseline")
        
        mean = getattr(self, mean_attr)
        std = getattr(self, std_attr)
        
        lower = mean - num_std * std
        upper = mean + num_std * std
        
        return (lower, upper)


@dataclass
class Deviation:
    """Deviation from baseline"""
    feature: str
    current_value: float
    baseline_mean: float
    baseline_std: float
    z_score: float
    severity: str  # 'minor', 'moderate', 'major'
    description: str
    recommendation: str


@dataclass
class ShootingAnalysis:
    """Analysis of a single shot"""
    shot_id: str
    player_id: str
    timestamp: str  # ISO format
    outcome: str  # 'made', 'missed', 'unknown'
    outcome_confidence: float
    features: ShootingFeatures
    deviations: List[Deviation]
    consistency_score: float  # 0.0 to 1.0
    recommendations: List[str]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'shot_id': self.shot_id,
            'player_id': self.player_id,
            'timestamp': self.timestamp,
            'outcome': self.outcome,
            'outcome_confidence': self.outcome_confidence,
            'features': self.features.to_dict(),
            'deviations': [asdict(d) for d in self.deviations],
            'consistency_score': self.consistency_score,
            'recommendations': self.recommendations
        }
    
    def to_json(self) -> str:
        """Convert to JSON"""
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class SessionReport:
    """Shooting session report"""
    session_id: str
    player_id: str
    timestamp: str
    num_shots: int
    make_percentage: float
    consistency_score: float
    most_consistent_features: List[str]
    least_consistent_features: List[str]
    feature_variances: Dict[str, float]
    recommendations: List[str]
    shot_analyses: List[ShootingAnalysis]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'session_id': self.session_id,
            'player_id': self.player_id,
            'timestamp': self.timestamp,
            'num_shots': self.num_shots,
            'make_percentage': self.make_percentage,
            'consistency_score': self.consistency_score,
            'most_consistent_features': self.most_consistent_features,
            'least_consistent_features': self.least_consistent_features,
            'feature_variances': self.feature_variances,
            'recommendations': self.recommendations,
            'shot_analyses': [shot.to_dict() for shot in self.shot_analyses]
        }
    
    def to_json(self) -> str:
        """Convert to JSON"""
        return json.dumps(self.to_dict(), indent=2)
