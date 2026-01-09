"""
Baseline Capture Module
Captures player-specific shooting baseline from successful shots
"""

import os
import json
import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from pathlib import Path
from shooting_features import PlayerBaseline, ShootingFeatures
from shooting_feature_extractor import ShootingFeatureExtractor


class BaselineCapture:
    """
    Captures player-specific shooting baseline during account setup
    """
    
    def __init__(self, baselines_dir: str = "baselines"):
        self.min_shots_required = 20  # Minimum shots for baseline
        self.optimal_shots_count = 30  # Optimal for statistical significance
        self.min_made_shots = 10  # Minimum made shots required
        self.baselines_dir = baselines_dir
        self.feature_extractor = ShootingFeatureExtractor()
        
        # Create baselines directory if it doesn't exist
        Path(baselines_dir).mkdir(parents=True, exist_ok=True)
    
    def capture_baseline(
        self, 
        player_id: str,
        shot_videos: List[str],
        shot_outcomes: Optional[List[str]] = None
    ) -> PlayerBaseline:
        """
        Main baseline capture workflow
        
        Args:
            player_id: Unique player identifier
            shot_videos: List of video file paths
            shot_outcomes: Optional list of outcomes ('made', 'missed')
                          If None, will attempt to detect automatically
        
        Returns:
            PlayerBaseline object
            
        Raises:
            ValueError: If insufficient shots or made shots
        """
        print(f"\n🏀 Capturing baseline for player: {player_id}")
        print(f"📹 Processing {len(shot_videos)} shots...")
        
        # Validate input
        if len(shot_videos) < self.min_shots_required:
            raise ValueError(
                f"Need at least {self.min_shots_required} shots for baseline. "
                f"Got {len(shot_videos)}"
            )
        
        # Step 1: Extract features from all shots
        shots = []
        for i, video_path in enumerate(shot_videos):
            try:
                print(f"  Processing shot {i+1}/{len(shot_videos)}...", end=" ")
                
                # Extract features
                features = self.feature_extractor.extract_shot_features(video_path)
                
                # Get outcome
                if shot_outcomes and i < len(shot_outcomes):
                    outcome = shot_outcomes[i]
                else:
                    # TODO: Integrate with shot outcome detector
                    outcome = 'unknown'
                
                shots.append({
                    'video_path': video_path,
                    'features': features,
                    'outcome': outcome
                })
                
                print("✓")
                
            except Exception as e:
                print(f"✗ Error: {e}")
                continue
        
        print(f"\n✅ Successfully processed {len(shots)}/{len(shot_videos)} shots")
        
        # Step 2: Filter for made shots
        made_shots = [s for s in shots if s['outcome'] == 'made']
        
        print(f"🎯 Made shots: {len(made_shots)}")
        
        if len(made_shots) < self.min_made_shots:
            raise ValueError(
                f"Need at least {self.min_made_shots} made shots for baseline. "
                f"Got {len(made_shots)}. Please record more successful shots."
            )
        
        # Step 3: Calculate baseline statistics
        print("\n📊 Calculating baseline statistics...")
        baseline = self.calculate_baseline_statistics(
            player_id=player_id,
            made_shots=made_shots,
            total_shots=len(shots)
        )
        
        # Step 4: Select reference shots
        print("🌟 Selecting reference shots...")
        baseline.reference_shots = self.select_reference_shots(made_shots, n=5)
        
        # Step 5: Calculate acceptable ranges
        print("📏 Calculating acceptable ranges...")
        baseline.acceptable_ranges = self.calculate_acceptable_ranges(baseline)
        
        # Step 6: Save baseline
        self.save_baseline(baseline)
        
        print(f"\n✅ Baseline captured successfully!")
        print(f"📁 Saved to: {self.baselines_dir}/{player_id}.json")
        
        return baseline
    
    def calculate_baseline_statistics(
        self,
        player_id: str,
        made_shots: List[Dict],
        total_shots: int
    ) -> PlayerBaseline:
        """
        Calculate mean and variance for each feature from made shots
        
        Args:
            player_id: Player identifier
            made_shots: List of made shots with features
            total_shots: Total number of shots captured
            
        Returns:
            PlayerBaseline with statistical representations
        """
        # Extract all features
        all_features = [shot['features'] for shot in made_shots]
        
        # Helper function to extract feature values
        def get_feature_values(feature_path: str) -> List[float]:
            """Extract values for a specific feature across all shots"""
            values = []
            for features in all_features:
                # Navigate nested structure
                parts = feature_path.split('.')
                value = features
                for part in parts:
                    value = getattr(value, part)
                values.append(value)
            return values
        
        # Calculate statistics for each feature
        baseline = PlayerBaseline(
            player_id=player_id,
            created_at=datetime.now().isoformat(),
            num_shots_captured=total_shots,
            num_made_shots=len(made_shots),
            
            # Release features
            release_elbow_angle_mean=float(np.mean(get_feature_values('release.elbow_angle'))),
            release_elbow_angle_std=float(np.std(get_feature_values('release.elbow_angle'))),
            release_height_mean=float(np.mean(get_feature_values('release.release_height'))),
            release_height_std=float(np.std(get_feature_values('release.release_height'))),
            wrist_flexion_mean=float(np.mean(get_feature_values('release.wrist_flexion'))),
            wrist_flexion_std=float(np.std(get_feature_values('release.wrist_flexion'))),
            shoulder_angle_mean=float(np.mean(get_feature_values('release.shoulder_angle'))),
            shoulder_angle_std=float(np.std(get_feature_values('release.shoulder_angle'))),
            release_angle_mean=float(np.mean(get_feature_values('release.release_angle'))),
            release_angle_std=float(np.std(get_feature_values('release.release_angle'))),
            balance_score_mean=float(np.mean(get_feature_values('release.balance_score'))),
            balance_score_std=float(np.std(get_feature_values('release.balance_score'))),
            
            # Loading features
            knee_flexion_mean=float(np.mean(get_feature_values('loading.knee_flexion'))),
            knee_flexion_std=float(np.std(get_feature_values('loading.knee_flexion'))),
            hip_flexion_mean=float(np.mean(get_feature_values('loading.hip_flexion'))),
            hip_flexion_std=float(np.std(get_feature_values('loading.hip_flexion'))),
            elbow_angle_loading_mean=float(np.mean(get_feature_values('loading.elbow_angle'))),
            elbow_angle_loading_std=float(np.std(get_feature_values('loading.elbow_angle'))),
            loading_depth_mean=float(np.mean(get_feature_values('loading.loading_depth'))),
            loading_depth_std=float(np.std(get_feature_values('loading.loading_depth'))),
            loading_duration_mean=float(np.mean(get_feature_values('loading.loading_duration'))),
            loading_duration_std=float(np.std(get_feature_values('loading.loading_duration'))),
            
            # Timing features
            shot_duration_mean=float(np.mean(get_feature_values('timing.total_shot_duration'))),
            shot_duration_std=float(np.std(get_feature_values('timing.total_shot_duration'))),
            loading_to_release_mean=float(np.mean(get_feature_values('timing.loading_to_release'))),
            loading_to_release_std=float(np.std(get_feature_values('timing.loading_to_release'))),
            rhythm_consistency_mean=float(np.mean(get_feature_values('timing.rhythm_consistency'))),
            rhythm_consistency_std=float(np.std(get_feature_values('timing.rhythm_consistency'))),
            
            # Follow-through features
            wrist_snap_mean=float(np.mean(get_feature_values('followthrough.wrist_snap_angle'))),
            wrist_snap_std=float(np.std(get_feature_values('followthrough.wrist_snap_angle'))),
            arm_extension_mean=float(np.mean(get_feature_values('followthrough.arm_extension'))),
            arm_extension_std=float(np.std(get_feature_values('followthrough.arm_extension'))),
            followthrough_duration_mean=float(np.mean(get_feature_values('followthrough.followthrough_duration'))),
            followthrough_duration_std=float(np.std(get_feature_values('followthrough.followthrough_duration'))),
            balance_recovery_mean=float(np.mean(get_feature_values('followthrough.balance_recovery'))),
            balance_recovery_std=float(np.std(get_feature_values('followthrough.balance_recovery'))),
            
            # Setup features
            stance_width_mean=float(np.mean(get_feature_values('setup.stance_width'))),
            stance_width_std=float(np.std(get_feature_values('setup.stance_width'))),
            shoulder_alignment_mean=float(np.mean(get_feature_values('setup.shoulder_alignment'))),
            shoulder_alignment_std=float(np.std(get_feature_values('setup.shoulder_alignment'))),
            
            # Placeholder for reference shots and ranges
            reference_shots=[],
            acceptable_ranges={}
        )
        
        return baseline
    
    def select_reference_shots(
        self, 
        made_shots: List[Dict], 
        n: int = 5
    ) -> List[str]:
        """
        Select n best shots as references
        
        Criteria:
        - Made the shot
        - Features close to mean
        - Consistent with other made shots
        
        Args:
            made_shots: List of made shots
            n: Number of reference shots to select
            
        Returns:
            List of video paths for reference shots
        """
        if len(made_shots) <= n:
            # Return all if we have fewer than n
            return [shot['video_path'] for shot in made_shots]
        
        # Calculate consistency score for each shot
        scores = []
        for shot in made_shots:
            consistency = self.calculate_shot_consistency(shot, made_shots)
            scores.append((shot['video_path'], consistency))
        
        # Sort by consistency (higher = more typical/consistent)
        scores.sort(key=lambda x: x[1], reverse=True)
        
        # Return top n
        return [video_path for video_path, _ in scores[:n]]
    
    def calculate_shot_consistency(
        self,
        shot: Dict,
        all_shots: List[Dict]
    ) -> float:
        """
        Calculate how consistent a shot is with the group
        
        Args:
            shot: Single shot to evaluate
            all_shots: All shots for comparison
            
        Returns:
            Consistency score (higher = more consistent)
        """
        # Extract features from all shots
        all_features = [s['features'] for s in all_shots]
        shot_features = shot['features']
        
        # Calculate mean for key features
        key_features = [
            ('release.elbow_angle', 'release', 'elbow_angle'),
            ('release.release_height', 'release', 'release_height'),
            ('loading.knee_flexion', 'loading', 'knee_flexion'),
            ('timing.total_shot_duration', 'timing', 'total_shot_duration'),
        ]
        
        deviations = []
        for _, phase, feature in key_features:
            # Get values from all shots
            values = [getattr(getattr(f, phase), feature) for f in all_features]
            mean = np.mean(values)
            std = np.std(values) + 1e-6  # Avoid division by zero
            
            # Get value from this shot
            shot_value = getattr(getattr(shot_features, phase), feature)
            
            # Calculate z-score
            z_score = abs(shot_value - mean) / std
            deviations.append(z_score)
        
        # Average deviation (lower = more consistent)
        avg_deviation = np.mean(deviations)
        
        # Convert to consistency score (higher = better)
        consistency = max(0.0, 1.0 - (avg_deviation / 4.0))
        
        return consistency
    
    def calculate_acceptable_ranges(
        self,
        baseline: PlayerBaseline,
        num_std: float = 2.0
    ) -> Dict[str, Tuple[float, float]]:
        """
        Calculate acceptable ranges for all features
        
        Args:
            baseline: PlayerBaseline object
            num_std: Number of standard deviations for range
            
        Returns:
            Dict mapping feature names to (lower, upper) tuples
        """
        ranges = {}
        
        # List of all features with mean/std
        feature_names = [
            'release_elbow_angle',
            'release_height',
            'wrist_flexion',
            'shoulder_angle',
            'release_angle',
            'balance_score',
            'knee_flexion',
            'hip_flexion',
            'elbow_angle_loading',
            'loading_depth',
            'loading_duration',
            'shot_duration',
            'loading_to_release',
            'rhythm_consistency',
            'wrist_snap',
            'arm_extension',
            'followthrough_duration',
            'balance_recovery',
            'stance_width',
            'shoulder_alignment',
        ]
        
        for feature_name in feature_names:
            mean_attr = f"{feature_name}_mean"
            std_attr = f"{feature_name}_std"
            
            if hasattr(baseline, mean_attr) and hasattr(baseline, std_attr):
                mean = getattr(baseline, mean_attr)
                std = getattr(baseline, std_attr)
                
                lower = mean - num_std * std
                upper = mean + num_std * std
                
                ranges[feature_name] = (lower, upper)
        
        return ranges
    
    def save_baseline(self, baseline: PlayerBaseline) -> None:
        """
        Save baseline to JSON file
        
        Args:
            baseline: PlayerBaseline object to save
        """
        filepath = os.path.join(self.baselines_dir, f"{baseline.player_id}.json")
        
        with open(filepath, 'w') as f:
            f.write(baseline.to_json())
    
    def load_baseline(self, player_id: str) -> Optional[PlayerBaseline]:
        """
        Load baseline from JSON file
        
        Args:
            player_id: Player identifier
            
        Returns:
            PlayerBaseline object or None if not found
        """
        filepath = os.path.join(self.baselines_dir, f"{player_id}.json")
        
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, 'r') as f:
            json_str = f.read()
            return PlayerBaseline.from_json(json_str)
    
    def list_baselines(self) -> List[str]:
        """
        List all available player baselines
        
        Returns:
            List of player IDs
        """
        if not os.path.exists(self.baselines_dir):
            return []
        
        baselines = []
        for filename in os.listdir(self.baselines_dir):
            if filename.endswith('.json'):
                player_id = filename[:-5]  # Remove .json
                baselines.append(player_id)
        
        return baselines


def main():
    """Example usage"""
    print("🏀 Baseline Capture Module")
    print("=" * 50)
    
    # Create baseline capture instance
    capture = BaselineCapture()
    
    # Example: Capture baseline for a player
    # In practice, you would provide actual video paths
    player_id = "test_player_001"
    shot_videos = [
        "path/to/shot_001.mp4",
        "path/to/shot_002.mp4",
        # ... more shots
    ]
    shot_outcomes = [
        "made", "made", "missed", "made",
        # ... corresponding outcomes
    ]
    
    try:
        # Capture baseline
        # baseline = capture.capture_baseline(
        #     player_id=player_id,
        #     shot_videos=shot_videos,
        #     shot_outcomes=shot_outcomes
        # )
        
        # Load existing baseline
        baseline = capture.load_baseline(player_id)
        if baseline:
            print(f"\n✅ Loaded baseline for {player_id}")
            print(f"📊 Made shots: {baseline.num_made_shots}/{baseline.num_shots_captured}")
            print(f"🎯 Release elbow angle: {baseline.release_elbow_angle_mean:.1f}° ± {baseline.release_elbow_angle_std:.1f}°")
        else:
            print(f"\n❌ No baseline found for {player_id}")
        
        # List all baselines
        all_baselines = capture.list_baselines()
        print(f"\n📋 Available baselines: {all_baselines}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
