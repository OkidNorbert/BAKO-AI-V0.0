"""
Shooting Form Analyzer
Analyzes shooting form against player-specific baseline
"""

import numpy as np
from typing import List, Dict, Optional
from datetime import datetime
from shooting_features import (
    ShootingFeatures, PlayerBaseline, Deviation, 
    ShootingAnalysis, SessionReport
)
from baseline_capture import BaselineCapture


class ShootingFormAnalyzer:
    """
    Analyzes shooting form against player-specific baseline
    """
    
    def __init__(self, baseline: Optional[PlayerBaseline] = None):
        self.baseline = baseline
        self.baseline_capture = BaselineCapture()
        
    def set_baseline(self, baseline: PlayerBaseline):
        """Set the baseline for analysis"""
        self.baseline = baseline
    
    def load_baseline(self, player_id: str) -> bool:
        """
        Load baseline from file
        
        Returns:
            True if baseline loaded successfully, False otherwise
        """
        baseline = self.baseline_capture.load_baseline(player_id)
        if baseline:
            self.baseline = baseline
            return True
        return False
    
    def analyze_shot(
        self,
        shot_id: str,
        player_id: str,
        features: ShootingFeatures,
        outcome: str = 'unknown',
        outcome_confidence: float = 0.0
    ) -> ShootingAnalysis:
        """
        Analyze a single shot against baseline
        
        Args:
            shot_id: Unique shot identifier
            player_id: Player identifier
            features: Extracted shooting features
            outcome: Shot outcome ('made', 'missed', 'unknown')
            outcome_confidence: Confidence in outcome detection
            
        Returns:
            ShootingAnalysis with deviations and recommendations
        """
        if self.baseline is None:
            # Try to load baseline
            if not self.load_baseline(player_id):
                raise ValueError(
                    f"No baseline found for player {player_id}. "
                    "Please capture baseline first."
                )
        
        # Ensure baseline matches player
        if self.baseline.player_id != player_id:
            if not self.load_baseline(player_id):
                raise ValueError(
                    f"Baseline mismatch. Expected {player_id}, "
                    f"got {self.baseline.player_id}"
                )
        
        # Detect deviations
        deviations = self.detect_deviations(features, self.baseline)
        
        # Calculate consistency score
        consistency = self.calculate_consistency_score(features, self.baseline)
        
        # Generate recommendations
        recommendations = self.generate_recommendations(
            deviations, 
            outcome, 
            consistency
        )
        
        # Create analysis
        analysis = ShootingAnalysis(
            shot_id=shot_id,
            player_id=player_id,
            timestamp=datetime.now().isoformat(),
            outcome=outcome,
            outcome_confidence=outcome_confidence,
            features=features,
            deviations=deviations,
            consistency_score=consistency,
            recommendations=recommendations
        )
        
        return analysis
    
    def detect_deviations(
        self,
        current: ShootingFeatures,
        baseline: PlayerBaseline
    ) -> List[Deviation]:
        """
        Detect deviations from baseline
        
        Uses statistical thresholds (mean ± 2*std by default)
        
        Args:
            current: Current shot features
            baseline: Player baseline
            
        Returns:
            List of detected deviations
        """
        deviations = []
        
        # Define features to check with their paths and descriptions
        features_to_check = [
            # Release features
            ('release_elbow_angle', 'release.elbow_angle', 'Release elbow angle'),
            ('release_height', 'release.release_height', 'Release height'),
            ('wrist_flexion', 'release.wrist_flexion', 'Wrist flexion'),
            ('shoulder_angle', 'release.shoulder_angle', 'Shoulder angle'),
            ('release_angle', 'release.release_angle', 'Release angle'),
            ('balance_score', 'release.balance_score', 'Balance at release'),
            
            # Loading features
            ('knee_flexion', 'loading.knee_flexion', 'Knee flexion'),
            ('hip_flexion', 'loading.hip_flexion', 'Hip flexion'),
            ('elbow_angle_loading', 'loading.elbow_angle', 'Elbow angle during loading'),
            ('loading_depth', 'loading.loading_depth', 'Loading depth'),
            ('loading_duration', 'loading.loading_duration', 'Loading duration'),
            
            # Timing features
            ('shot_duration', 'timing.total_shot_duration', 'Total shot duration'),
            ('loading_to_release', 'timing.loading_to_release', 'Loading to release time'),
            
            # Follow-through features
            ('wrist_snap', 'followthrough.wrist_snap_angle', 'Wrist snap'),
            ('arm_extension', 'followthrough.arm_extension', 'Arm extension'),
            ('followthrough_duration', 'followthrough.followthrough_duration', 'Follow-through duration'),
            ('balance_recovery', 'followthrough.balance_recovery', 'Balance recovery'),
            
            # Setup features
            ('stance_width', 'setup.stance_width', 'Stance width'),
            ('shoulder_alignment', 'setup.shoulder_alignment', 'Shoulder alignment'),
        ]
        
        for feature_name, feature_path, description in features_to_check:
            # Get current value
            current_value = self._get_feature_value(current, feature_path)
            
            # Get baseline statistics
            mean_attr = f"{feature_name}_mean"
            std_attr = f"{feature_name}_std"
            
            if not hasattr(baseline, mean_attr) or not hasattr(baseline, std_attr):
                continue
            
            baseline_mean = getattr(baseline, mean_attr)
            baseline_std = getattr(baseline, std_attr)
            
            # Check if within acceptable range
            if not self._is_within_range(
                current_value, 
                baseline_mean, 
                baseline_std,
                num_std=2.0
            ):
                # Calculate z-score
                z_score = abs(current_value - baseline_mean) / (baseline_std + 1e-6)
                
                # Determine severity
                severity = self._calculate_severity(z_score)
                
                # Generate description
                deviation_desc = self._generate_deviation_description(
                    description,
                    current_value,
                    baseline_mean,
                    baseline_std
                )
                
                # Generate recommendation
                recommendation = self._generate_deviation_recommendation(
                    feature_name,
                    current_value,
                    baseline_mean
                )
                
                # Create deviation
                deviation = Deviation(
                    feature=feature_name,
                    current_value=current_value,
                    baseline_mean=baseline_mean,
                    baseline_std=baseline_std,
                    z_score=z_score,
                    severity=severity,
                    description=deviation_desc,
                    recommendation=recommendation
                )
                
                deviations.append(deviation)
        
        # Sort by severity (major first)
        severity_order = {'major': 0, 'moderate': 1, 'minor': 2}
        deviations.sort(key=lambda d: severity_order.get(d.severity, 3))
        
        return deviations
    
    def calculate_consistency_score(
        self,
        current: ShootingFeatures,
        baseline: PlayerBaseline
    ) -> float:
        """
        Calculate how consistent current shot is with baseline
        
        Returns:
            Score from 0.0 (very inconsistent) to 1.0 (perfectly consistent)
        """
        # Calculate z-scores for all features
        z_scores = []
        
        feature_paths = [
            ('release_elbow_angle', 'release.elbow_angle'),
            ('release_height', 'release.release_height'),
            ('knee_flexion', 'loading.knee_flexion'),
            ('shot_duration', 'timing.total_shot_duration'),
            ('wrist_snap', 'followthrough.wrist_snap_angle'),
            ('balance_score', 'release.balance_score'),
        ]
        
        for feature_name, feature_path in feature_paths:
            current_value = self._get_feature_value(current, feature_path)
            
            mean_attr = f"{feature_name}_mean"
            std_attr = f"{feature_name}_std"
            
            if hasattr(baseline, mean_attr) and hasattr(baseline, std_attr):
                baseline_mean = getattr(baseline, mean_attr)
                baseline_std = getattr(baseline, std_attr)
                
                z_score = abs(current_value - baseline_mean) / (baseline_std + 1e-6)
                z_scores.append(z_score)
        
        if len(z_scores) == 0:
            return 0.5  # Default if no features available
        
        # Average z-score
        avg_z = np.mean(z_scores)
        
        # Convert to 0-1 score
        # z=0 → score=1.0 (perfect)
        # z=2 → score=0.5 (acceptable)
        # z=4 → score=0.0 (poor)
        consistency = max(0.0, 1.0 - (avg_z / 4.0))
        
        return float(consistency)
    
    def generate_recommendations(
        self,
        deviations: List[Deviation],
        outcome: str,
        consistency: float
    ) -> List[str]:
        """
        Generate actionable recommendations
        
        Args:
            deviations: List of detected deviations
            outcome: Shot outcome
            consistency: Consistency score
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Outcome-based recommendations
        if outcome == 'missed':
            if len(deviations) > 0:
                recommendations.append(
                    f"Shot missed. Focus on correcting {len(deviations)} "
                    f"deviation(s) from your baseline form."
                )
            else:
                recommendations.append(
                    "Shot missed despite good form consistency. "
                    "This may be due to external factors (fatigue, pressure, etc.)."
                )
        elif outcome == 'made':
            if consistency > 0.8:
                recommendations.append(
                    "Excellent! Shot made with consistent form. "
                    "Keep repeating this motion."
                )
            else:
                recommendations.append(
                    "Shot made, but form was inconsistent. "
                    "Focus on repeatability for better long-term results."
                )
        
        # Deviation-based recommendations (prioritize major deviations)
        major_deviations = [d for d in deviations if d.severity == 'major']
        moderate_deviations = [d for d in deviations if d.severity == 'moderate']
        
        if len(major_deviations) > 0:
            recommendations.append(
                f"⚠️ {len(major_deviations)} major deviation(s) detected:"
            )
            for dev in major_deviations[:3]:  # Top 3
                recommendations.append(f"  • {dev.recommendation}")
        
        if len(moderate_deviations) > 0 and len(major_deviations) == 0:
            recommendations.append(
                f"Minor adjustments needed ({len(moderate_deviations)} deviation(s)):"
            )
            for dev in moderate_deviations[:2]:  # Top 2
                recommendations.append(f"  • {dev.recommendation}")
        
        # Consistency-based recommendations
        if consistency < 0.5:
            recommendations.append(
                "Low consistency score. Focus on developing muscle memory "
                "through repetition of your baseline form."
            )
        elif consistency > 0.9:
            recommendations.append(
                "Excellent consistency! Your form is very repeatable."
            )
        
        # General recommendations if no specific issues
        if len(recommendations) == 0:
            recommendations.append(
                "Good shot! Continue practicing to maintain consistency."
            )
        
        return recommendations
    
    def _get_feature_value(self, features: ShootingFeatures, path: str) -> float:
        """Get feature value from nested structure"""
        parts = path.split('.')
        value = features
        for part in parts:
            value = getattr(value, part)
        return float(value)
    
    def _is_within_range(
        self,
        value: float,
        mean: float,
        std: float,
        num_std: float = 2.0
    ) -> bool:
        """Check if value is within acceptable range"""
        lower_bound = mean - num_std * std
        upper_bound = mean + num_std * std
        return lower_bound <= value <= upper_bound
    
    def _calculate_severity(self, z_score: float) -> str:
        """
        Calculate deviation severity
        
        - minor: 2.0 ≤ z < 3.0
        - moderate: 3.0 ≤ z < 4.0
        - major: z ≥ 4.0
        """
        if z_score < 2.0:
            return 'none'
        elif z_score < 3.0:
            return 'minor'
        elif z_score < 4.0:
            return 'moderate'
        else:
            return 'major'
    
    def _generate_deviation_description(
        self,
        feature_desc: str,
        current: float,
        mean: float,
        std: float
    ) -> str:
        """Generate human-readable deviation description"""
        diff = current - mean
        direction = "higher" if diff > 0 else "lower"
        
        return (
            f"{feature_desc} is {abs(diff):.1f} {direction} than your baseline "
            f"(baseline: {mean:.1f} ± {std:.1f})"
        )
    
    def _generate_deviation_recommendation(
        self,
        feature_name: str,
        current: float,
        baseline_mean: float
    ) -> str:
        """Generate specific recommendation for deviation"""
        diff = current - baseline_mean
        
        recommendations_map = {
            'release_elbow_angle': {
                'high': "Lower your elbow angle at release for better arc",
                'low': "Raise your elbow angle at release for more power"
            },
            'release_height': {
                'high': "Release point is too high, may affect consistency",
                'low': "Release higher for better shot trajectory"
            },
            'knee_flexion': {
                'high': "You're bending your knees more than usual",
                'low': "Bend your knees more for better power generation"
            },
            'loading_depth': {
                'high': "You're loading deeper than usual",
                'low': "Load deeper for more consistent power"
            },
            'shot_duration': {
                'high': "Shot is slower than your baseline rhythm",
                'low': "Shot is faster than your baseline rhythm"
            },
            'balance_score': {
                'high': "Good balance, maintain this",
                'low': "Focus on balance and stability at release"
            },
        }
        
        if feature_name in recommendations_map:
            direction = 'high' if diff > 0 else 'low'
            return recommendations_map[feature_name].get(
                direction,
                f"Adjust {feature_name} to match your baseline"
            )
        else:
            return f"Adjust {feature_name} to match your baseline ({baseline_mean:.1f})"


class ConsistencyTracker:
    """
    Track shooting consistency across multiple sessions
    """
    
    def __init__(self, player_id: str):
        self.player_id = player_id
        self.baseline_capture = BaselineCapture()
        self.baseline = self.baseline_capture.load_baseline(player_id)
    
    def track_session(
        self,
        session_shots: List[ShootingAnalysis]
    ) -> SessionReport:
        """
        Analyze consistency for a shooting session
        
        Args:
            session_shots: List of shot analyses
            
        Returns:
            SessionReport with consistency metrics
        """
        if len(session_shots) == 0:
            raise ValueError("No shots provided for session analysis")
        
        # Calculate session-level metrics
        session_consistency = np.mean([
            shot.consistency_score 
            for shot in session_shots
        ])
        
        # Calculate make percentage
        made_shots = [s for s in session_shots if s.outcome == 'made']
        make_percentage = len(made_shots) / len(session_shots)
        
        # Calculate feature variances
        feature_variances = self._calculate_feature_variances(session_shots)
        
        # Identify most/least consistent features
        most_consistent = self._find_most_consistent_features(feature_variances, n=3)
        least_consistent = self._find_least_consistent_features(feature_variances, n=3)
        
        # Generate session recommendations
        recommendations = self._generate_session_recommendations(
            session_shots,
            session_consistency,
            make_percentage,
            least_consistent
        )
        
        # Create report
        report = SessionReport(
            session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            player_id=self.player_id,
            timestamp=datetime.now().isoformat(),
            num_shots=len(session_shots),
            make_percentage=make_percentage,
            consistency_score=session_consistency,
            most_consistent_features=most_consistent,
            least_consistent_features=least_consistent,
            feature_variances=feature_variances,
            recommendations=recommendations,
            shot_analyses=session_shots
        )
        
        return report
    
    def _calculate_feature_variances(
        self,
        session_shots: List[ShootingAnalysis]
    ) -> Dict[str, float]:
        """Calculate variance for each feature across session"""
        variances = {}
        
        # Key features to track
        features = [
            'release_elbow_angle',
            'release_height',
            'knee_flexion',
            'shot_duration',
            'balance_score',
        ]
        
        for feature in features:
            values = []
            for shot in session_shots:
                # Extract feature value from shot
                if feature.startswith('release'):
                    value = getattr(shot.features.release, feature.replace('release_', ''))
                elif feature.startswith('loading'):
                    value = getattr(shot.features.loading, feature.replace('loading_', ''))
                elif feature.startswith('timing'):
                    value = getattr(shot.features.timing, feature.replace('timing_', '').replace('shot_', 'total_shot_'))
                else:
                    continue
                values.append(value)
            
            if len(values) > 0:
                variances[feature] = float(np.var(values))
        
        return variances
    
    def _find_most_consistent_features(
        self,
        variances: Dict[str, float],
        n: int = 3
    ) -> List[str]:
        """Find features with lowest variance (most consistent)"""
        sorted_features = sorted(variances.items(), key=lambda x: x[1])
        return [feature for feature, _ in sorted_features[:n]]
    
    def _find_least_consistent_features(
        self,
        variances: Dict[str, float],
        n: int = 3
    ) -> List[str]:
        """Find features with highest variance (least consistent)"""
        sorted_features = sorted(variances.items(), key=lambda x: x[1], reverse=True)
        return [feature for feature, _ in sorted_features[:n]]
    
    def _generate_session_recommendations(
        self,
        session_shots: List[ShootingAnalysis],
        consistency: float,
        make_percentage: float,
        least_consistent: List[str]
    ) -> List[str]:
        """Generate session-level recommendations"""
        recommendations = []
        
        # Overall performance
        recommendations.append(
            f"Session Summary: {len(session_shots)} shots, "
            f"{make_percentage*100:.1f}% made, "
            f"{consistency*100:.1f}% consistency"
        )
        
        # Make percentage feedback
        if make_percentage > 0.7:
            recommendations.append("Excellent shooting percentage! Keep it up.")
        elif make_percentage > 0.5:
            recommendations.append("Good shooting percentage. Focus on consistency for improvement.")
        else:
            recommendations.append("Work on form consistency to improve make percentage.")
        
        # Consistency feedback
        if consistency > 0.8:
            recommendations.append("Very consistent form throughout session.")
        elif consistency > 0.6:
            recommendations.append("Moderate consistency. Focus on repeatability.")
        else:
            recommendations.append(
                "Low consistency detected. Practice your baseline form more."
            )
        
        # Feature-specific recommendations
        if len(least_consistent) > 0:
            recommendations.append(
                f"Focus on improving consistency in: {', '.join(least_consistent)}"
            )
        
        return recommendations


def main():
    """Example usage"""
    print("🏀 Shooting Form Analyzer")
    print("=" * 50)
    
    # Example: Load baseline and analyze shot
    from shooting_feature_extractor import ShootingFeatureExtractor
    
    player_id = "test_player_001"
    
    # Create analyzer
    analyzer = ShootingFormAnalyzer()
    
    # Try to load baseline
    if analyzer.load_baseline(player_id):
        print(f"✅ Loaded baseline for {player_id}")
        
        # Example: Analyze a shot
        # extractor = ShootingFeatureExtractor()
        # features = extractor.extract_shot_features("shot.mp4")
        # analysis = analyzer.analyze_shot(
        #     shot_id="shot_001",
        #     player_id=player_id,
        #     features=features,
        #     outcome="made",
        #     outcome_confidence=0.9
        # )
        # print(f"Consistency: {analysis.consistency_score:.2f}")
        # print(f"Deviations: {len(analysis.deviations)}")
    else:
        print(f"❌ No baseline found for {player_id}")
        print("Please capture baseline first using baseline_capture.py")


if __name__ == "__main__":
    main()
