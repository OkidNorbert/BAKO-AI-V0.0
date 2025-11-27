"""
Unit tests for Form Quality Analyzer
"""

import pytest
import numpy as np
from app.models.form_quality_analyzer import FormQualityAnalyzer


class TestFormQualityAnalyzer:
    """Test form quality analysis"""
    
    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance"""
        return FormQualityAnalyzer()
    
    @pytest.fixture
    def sample_shooting_keypoints(self):
        """Create sample keypoints for shooting (good form)"""
        # Simplified keypoints: [x, y, z] for each landmark
        # MediaPipe has 33 keypoints (0-32)
        keypoints = []
        for frame in range(16):  # 16 frames
            frame_keypoints = []
            for i in range(33):
                # Create realistic keypoint positions
                x = 0.5 + np.random.normal(0, 0.01)
                y = 0.5 - (i / 33) * 0.5  # Vertical distribution
                z = 0.0
                frame_keypoints.append([x, y, z])
            
            # Adjust specific keypoints for shooting pose
            # Right shoulder (12), elbow (14), wrist (16) for good elbow angle
            frame_keypoints[12] = [0.4, 0.3, 0.0]  # Shoulder
            frame_keypoints[14] = [0.45, 0.4, 0.0]  # Elbow
            frame_keypoints[16] = [0.4, 0.2, 0.0]  # Wrist (high release)
            
            # Hips and knees for proper bend
            frame_keypoints[24] = [0.5, 0.6, 0.0]  # Right hip
            frame_keypoints[26] = [0.5, 0.75, 0.0]  # Right knee
            frame_keypoints[28] = [0.5, 0.9, 0.0]  # Right ankle
            
            keypoints.append(frame_keypoints)
        
        return keypoints
    
    @pytest.fixture
    def sample_dribbling_keypoints(self):
        """Create sample keypoints for dribbling"""
        keypoints = []
        for frame in range(16):
            frame_keypoints = []
            for i in range(33):
                x = 0.5 + np.random.normal(0, 0.02)  # More variance for dribbling
                y = 0.5 - (i / 33) * 0.5
                z = 0.0
                frame_keypoints.append([x, y, z])
            
            # Adjust for dribbling pose (lower stance)
            frame_keypoints[11] = [0.45, 0.4, 0.0]  # Left shoulder
            frame_keypoints[12] = [0.55, 0.4, 0.0]  # Right shoulder
            frame_keypoints[23] = [0.45, 0.6, 0.0]  # Left hip
            frame_keypoints[24] = [0.55, 0.6, 0.0]  # Right hip
            
            keypoints.append(frame_keypoints)
        
        return keypoints
    
    def test_shooting_form_analysis(self, analyzer, sample_shooting_keypoints):
        """Test shooting form analysis"""
        result = analyzer.analyze_shooting_form(
            sample_shooting_keypoints,
            "two_point_shot"
        )
        
        assert result is not None
        assert 'overall_score' in result
        assert 'quality_rating' in result
        assert 'issues' in result
        assert 'strengths' in result
        assert 0.0 <= result['overall_score'] <= 1.0
        assert result['quality_rating'] in ['excellent', 'good', 'needs_improvement', 'poor']
    
    def test_dribbling_form_analysis(self, analyzer, sample_dribbling_keypoints):
        """Test dribbling form analysis"""
        result = analyzer.analyze_dribbling_form(sample_dribbling_keypoints)
        
        assert result is not None
        assert 'overall_score' in result
        assert 'quality_rating' in result
        assert 0.0 <= result['overall_score'] <= 1.0
    
    def test_passing_form_analysis(self, analyzer, sample_shooting_keypoints):
        """Test passing form analysis"""
        # Reuse shooting keypoints as they have similar structure
        result = analyzer.analyze_passing_form(sample_shooting_keypoints)
        
        assert result is not None
        assert 'overall_score' in result
        assert 'quality_rating' in result
    
    def test_elbow_angle_calculation(self, analyzer):
        """Test elbow angle calculation"""
        # Create keypoints with known elbow angle (90 degrees)
        keypoints = [[0.5, 0.5, 0.0] for _ in range(33)]
        keypoints[12] = [0.4, 0.3, 0.0]  # Shoulder
        keypoints[14] = [0.5, 0.3, 0.0]  # Elbow
        keypoints[16] = [0.5, 0.2, 0.0]  # Wrist (90 degree angle)
        
        angle = analyzer._calculate_elbow_angle(keypoints)
        
        assert angle is not None
        # Should be close to 90 degrees
        assert 85 <= angle <= 95
    
    def test_empty_keypoints(self, analyzer):
        """Test with empty keypoints"""
        result = analyzer.analyze_shooting_form([], "two_point_shot")
        
        assert result is not None
        # Should return a default assessment
        assert result['overall_score'] == 0.5
        assert result['quality_rating'] == 'needs_improvement'


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
