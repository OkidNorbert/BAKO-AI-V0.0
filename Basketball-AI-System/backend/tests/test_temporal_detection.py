"""
Integration tests for Temporal Action Detection
"""

import pytest
from unittest.mock import MagicMock, patch
from app.services.video_processor import VideoProcessor
from app.core.schemas import TimelineSegment, ActionClassification, PerformanceMetrics, ActionProbabilities, FormQualityAssessment

class TestTemporalDetection:
    """Test temporal action detection and coalescing"""
    
    @pytest.fixture
    def processor(self):
        """Create video processor with mocked models"""
        with patch('app.services.video_processor.PlayerDetector'), \
             patch('app.services.video_processor.PoseExtractor'), \
             patch('app.services.video_processor.ActionClassifier'), \
             patch('app.services.video_processor.PerformanceMetricsEngine'), \
             patch('app.services.video_processor.ShotOutcomeDetector'), \
             patch('app.services.video_processor.CourtDetector'), \
             patch('app.services.video_processor.AICoach'), \
             patch('app.services.video_processor.FormQualityAnalyzer'):
            
            processor = VideoProcessor()
            # Mock the form quality analyzer specifically
            processor.form_quality_analyzer = MagicMock()
            processor.form_quality_analyzer._get_quality_rating.return_value = "good"
            return processor

    def test_coalesce_timeline(self, processor):
        """Test merging of overlapping segments"""
        # Create segments: 
        # 1. Dribbling (0-1s)
        # 2. Dribbling (0.5-1.5s) -> Should merge with 1
        # 3. Shooting (2-3s) -> Distinct
        # 4. Shooting (2.5-3.5s) -> Should merge with 3
        
        segments = [
            self._create_segment(0.0, 1.0, "dribbling", 0.8),
            self._create_segment(0.5, 1.5, "dribbling", 0.9),
            self._create_segment(2.0, 3.0, "shooting", 0.85),
            self._create_segment(2.5, 3.5, "shooting", 0.95),
        ]
        
        merged = processor._coalesce_timeline(segments)
        
        assert len(merged) == 2
        
        # Check first merged segment (Dribbling)
        assert merged[0].action.label == "dribbling"
        assert merged[0].start_time == 0.0
        assert merged[0].end_time == 1.5
        assert merged[0].action.confidence == 0.9  # Took highest confidence
        
        # Check second merged segment (Shooting)
        assert merged[1].action.label == "shooting"
        assert merged[1].start_time == 2.0
        assert merged[1].end_time == 3.5
        assert merged[1].action.confidence == 0.95

    def test_coalesce_different_actions(self, processor):
        """Test that different actions are not merged"""
        segments = [
            self._create_segment(0.0, 1.0, "dribbling", 0.8),
            self._create_segment(1.0, 2.0, "passing", 0.8),
        ]
        
        merged = processor._coalesce_timeline(segments)
        
        assert len(merged) == 2
        assert merged[0].action.label == "dribbling"
        assert merged[1].action.label == "passing"

    def test_coalesce_gap(self, processor):
        """Test that segments with large gap are not merged"""
        segments = [
            self._create_segment(0.0, 1.0, "dribbling", 0.8),
            self._create_segment(2.0, 3.0, "dribbling", 0.8),  # > 0.5s gap
        ]
        
        merged = processor._coalesce_timeline(segments)
        
        assert len(merged) == 2

    def test_averaging_metrics(self, processor):
        """Test that metrics are averaged correctly"""
        segments = [
            self._create_segment(0.0, 1.0, "shooting", 0.8, form_score=0.8),
            self._create_segment(0.5, 1.5, "shooting", 0.9, form_score=0.9),
        ]
        
        merged = processor._coalesce_timeline(segments)
        
        assert len(merged) == 1
        # Form score should be average of 0.8 and 0.9 = 0.85
        assert merged[0].metrics.form_score == 0.85

    def _create_segment(self, start, end, label, confidence, form_score=0.8):
        """Helper to create timeline segment"""
        return TimelineSegment(
            start_time=start,
            end_time=end,
            action=ActionClassification(
                label=label,
                confidence=confidence,
                probabilities=ActionProbabilities(
                    shooting=0.1, dribbling=0.1, passing=0.1, defense=0.1, dunk=0.1, layup=0.1, idle=0.1
                )
            ),
            metrics=PerformanceMetrics(
                jump_height=0.5,
                movement_speed=5.0,
                form_score=form_score,
                reaction_time=0.2,
                pose_stability=0.9,
                energy_efficiency=0.8
            ),
            form_quality=FormQualityAssessment(
                overall_score=form_score,
                quality_rating="good",
                issues=[],
                strengths=["Good form"]
            )
        )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
