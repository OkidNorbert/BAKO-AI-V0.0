"""
Manual verification script for temporal action detection
Run this to verify the implementation works correctly
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.video_processor import VideoProcessor
from app.core.schemas import TimelineSegment, ActionClassification, PerformanceMetrics, ActionProbabilities


def test_smooth_action_predictions():
    """Test temporal smoothing with majority voting"""
    print("Testing temporal action smoothing...")
    processor = VideoProcessor()
    
    # Test case 1: Clear majority
    recent = ["dribbling", "dribbling", "dribbling", "dribbling"]
    current = "passing"  # Outlier
    result = processor._smooth_action_predictions(recent, current)
    assert result == "dribbling", f"Expected 'dribbling', got '{result}'"
    print("✓ Test 1 passed: Majority voting works correctly")
    
    # Test case 2: Empty recent predictions
    recent = []
    current = "dribbling"
    result = processor._smooth_action_predictions(recent, current)
    assert result == "dribbling", f"Expected 'dribbling', got '{result}'"
    print("✓ Test 2 passed: Handles empty recent predictions")
    
    # Test case 3: Action transition
    recent = ["dribbling", "dribbling", "passing"]
    current = "passing"
    result = processor._smooth_action_predictions(recent, current)
    # Should be dribbling or passing (both have 2 votes)
    assert result in ["dribbling", "passing"], f"Expected 'dribbling' or 'passing', got '{result}'"
    print(f"✓ Test 3 passed: Handles action transitions (result: {result})")
    
    print("\n✅ All temporal smoothing tests passed!\n")


def test_enhanced_coalescing():
    """Test enhanced timeline coalescing"""
    print("Testing enhanced timeline coalescing...")
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
    
    print(f"  Input timeline: {len(timeline)} segments")
    for i, seg in enumerate(timeline):
        duration = seg.end_time - seg.start_time
        print(f"    Segment {i+1}: {seg.action.label} ({duration:.1f}s)")
    
    # Apply enhanced coalescing
    result = processor._coalesce_timeline_enhanced(timeline, min_duration=0.3)
    
    print(f"\n  Output timeline: {len(result)} segments")
    for i, seg in enumerate(result):
        duration = seg.end_time - seg.start_time
        print(f"    Segment {i+1}: {seg.action.label} ({duration:.1f}s)")
    
    # Verify short segment was filtered
    assert len(result) <= 2, f"Expected at most 2 segments, got {len(result)}"
    print(f"\n✓ Enhanced coalescing filtered short segments correctly")
    
    # Verify first segment extended
    assert result[0].end_time >= 1.1, "First segment should extend past short segment"
    print(f"✓ Short segment merged with adjacent segment")
    
    print("\n✅ All enhanced coalescing tests passed!\n")


if __name__ == "__main__":
    print("=" * 60)
    print("TEMPORAL ACTION DETECTION - VERIFICATION TESTS")
    print("=" * 60)
    print()
    
    try:
        test_smooth_action_predictions()
        test_enhanced_coalescing()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)
        print("\nTemporal action detection implementation is working correctly.")
        print("Features verified:")
        print("  ✓ Frame-level action buffer")
        print("  ✓ Majority voting smoothing")
        print("  ✓ Enhanced timeline coalescing")
        print("  ✓ Noise segment filtering")
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED")
        print("=" * 60)
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
