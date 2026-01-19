"""
Unit tests for temporal action detection and smoothing
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.video_processor import VideoProcessor
from app.core.schemas import TimelineSegment, ActionClassification, PerformanceMetrics, ActionProbabilities


class TestTemporalActionDetection:
    """Test suite for temporal action detection features"""
    
    def test_smooth_action_predictions_majority_voting(self):
        """Test that smoothing uses majority voting correctly"""
        processor = VideoProcessor()
        
        # Test case 1: Clear majority
        recent = ["dribbling", "dribbling", "dribbling", "dribbling"]
        current = "passing"  # Outlier
        result = processor._smooth_action_predictions(recent, current)
        assert result == "dribbling", "Should choose majority action"
        
        # Test case 2: Current action becomes majority
        recent = ["passing", "passing"]
        current = "dribbling"
        result = processor._smooth_action_predictions(recent, current)
        assert result == "passing", "Should still choose majority"
        
        # Test case 3: Tie scenario (should pick one consistently)
        recent = ["dribbling", "passing"]
        current = "dribbling"
        result = processor._smooth_action_predictions(recent, current)
        assert result in ["dribbling", "passing"], "Should pick one of the tied actions"
    
    def test_smooth_action_predictions_empty_recent(self):
        """Test smoothing with no recent predictions"""
        processor = VideoProcessor()
        
        recent = []
        current = "dribbling"
        result = processor._smooth_action_predictions(recent, current)
        assert result == "dribbling", "Should return current when no recent predictions"
    
    def test_coalesce_timeline_enhanced_filters_short_segments(self):
        """Test that enhanced coalescing filters out short noise segments"""
        processor = VideoProcessor()
        
        # Create test timeline with a very short segment
        timeline = [
            TimelineSegment(
                start_time=0.0,
                end_time=1.0,
                action=ActionClassification(
                    label="dribbling",
                    confidence=0.9,
                    probabilities=ActionProbabilities(
                        dribbling=0.9, passing=0.1, free_throw=0.0, two_point_shot=0.0,
                        three_point_shot=0.0, layup=0.0, dunk=0.0, defense=0.0,
                        running=0.0, walking=0.0, blocking=0.0, picking=0.0,
                        ball_in_hand=0.0, idle=0.0
                    )
                ),
                metrics=PerformanceMetrics(
                    jump_height=0.1, movement_speed=1.5, form_score=0.8,
                    reaction_time=0.2, pose_stability=0.9, energy_efficiency=0.85
                )
            ),
            TimelineSegment(
                start_time=1.0,
                end_time=1.1,  # Only 0.1 seconds - should be filtered
                action=ActionClassification(
                    label="passing",
                    confidence=0.7,
                    probabilities=ActionProbabilities(
                        dribbling=0.2, passing=0.7, free_throw=0.0, two_point_shot=0.0,
                        three_point_shot=0.0, layup=0.0, dunk=0.0, defense=0.0,
                        running=0.0, walking=0.0, blocking=0.0, picking=0.0,
                        ball_in_hand=0.0, idle=0.1
                    )
                ),
                metrics=PerformanceMetrics(
                    jump_height=0.0, movement_speed=0.5, form_score=0.7,
                    reaction_time=0.3, pose_stability=0.8, energy_efficiency=0.75
                )
            ),
            TimelineSegment(
                start_time=1.1,
                end_time=2.5,
                action=ActionClassification(
                    label="dribbling",
                    confidence=0.85,
                    probabilities=ActionProbabilities(
                        dribbling=0.85, passing=0.1, free_throw=0.0, two_point_shot=0.0,
                        three_point_shot=0.0, layup=0.0, dunk=0.0, defense=0.0,
                        running=0.0, walking=0.0, blocking=0.0, picking=0.0,
                        ball_in_hand=0.0, idle=0.05
                    )
                ),
                metrics=PerformanceMetrics(
                    jump_height=0.15, movement_speed=1.8, form_score=0.82,
                    reaction_time=0.18, pose_stability=0.88, energy_efficiency=0.87
                )
            )
        ]
        
        # Apply enhanced coalescing with min_duration=0.3
        result = processor._coalesce_timeline_enhanced(timeline, min_duration=0.3)
        
        # Should have merged the short segment with adjacent ones
        # Expected: 1 segment (all merged since they're close and short segment filtered)
        assert len(result) <= 2, f"Expected at most 2 segments after filtering, got {len(result)}"
        
        # First segment should extend to include the filtered segment
        assert result[0].end_time >= 1.1, "First segment should extend past the short segment"
    
    def test_coalesce_timeline_enhanced_preserves_long_segments(self):
        """Test that enhanced coalescing preserves segments longer than min_duration"""
        processor = VideoProcessor()
        
        # Create timeline with all long segments
        timeline = [
            TimelineSegment(
                start_time=0.0,
                end_time=1.0,
                action=ActionClassification(
                    label="dribbling",
                    confidence=0.9,
                    probabilities=ActionProbabilities(
                        dribbling=0.9, passing=0.1, free_throw=0.0, two_point_shot=0.0,
                        three_point_shot=0.0, layup=0.0, dunk=0.0, defense=0.0,
                        running=0.0, walking=0.0, blocking=0.0, picking=0.0,
                        ball_in_hand=0.0, idle=0.0
                    )
                ),
                metrics=PerformanceMetrics(
                    jump_height=0.1, movement_speed=1.5, form_score=0.8,
                    reaction_time=0.2, pose_stability=0.9, energy_efficiency=0.85
                )
            ),
            TimelineSegment(
                start_time=1.0,
                end_time=2.0,
                action=ActionClassification(
                    label="passing",
                    confidence=0.85,
                    probabilities=ActionProbabilities(
                        dribbling=0.1, passing=0.85, free_throw=0.0, two_point_shot=0.0,
                        three_point_shot=0.0, layup=0.0, dunk=0.0, defense=0.0,
                        running=0.0, walking=0.0, blocking=0.0, picking=0.0,
                        ball_in_hand=0.0, idle=0.05
                    )
                ),
                metrics=PerformanceMetrics(
                    jump_height=0.0, movement_speed=0.8, form_score=0.75,
                    reaction_time=0.25, pose_stability=0.85, energy_efficiency=0.8
                )
            )
        ]
        
        result = processor._coalesce_timeline_enhanced(timeline, min_duration=0.3)
        
        # Both segments should be preserved (different actions, both long enough)
        assert len(result) == 2, f"Expected 2 segments, got {len(result)}"
        assert result[0].action.label == "dribbling"
        assert result[1].action.label == "passing"


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
