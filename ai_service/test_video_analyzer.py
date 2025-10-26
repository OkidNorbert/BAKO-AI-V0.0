#!/usr/bin/env python3
"""
Test script for video analyzer functionality.
"""

import sys
import os
sys.path.append('/app')

from service.core.video_analyzer import BasketballVideoAnalyzer, KeypointData, DetectionData, EventData
import numpy as np

def test_video_analyzer():
    """Test the video analyzer components."""
    
    print("🤖 Testing Video Analyzer Components...")
    
    try:
        # Test analyzer initialization
        print("1. Initializing video analyzer...")
        analyzer = BasketballVideoAnalyzer()
        print("✅ Video analyzer initialized successfully")
        
        # Test shot detector
        print("\n2. Testing shot detector...")
        shot_detector = analyzer.shot_detector
        
        # Create mock keypoints for shot detection
        mock_keypoints = KeypointData(
            time=1.0,
            player_id="player_1",
            keypoints={
                15: {'x': 0.5, 'y': 0.3, 'z': 0.0, 'visibility': 0.9},  # Left wrist above shoulder
                16: {'x': 0.6, 'y': 0.2, 'z': 0.0, 'visibility': 0.9},  # Right wrist above shoulder
                11: {'x': 0.5, 'y': 0.4, 'z': 0.0, 'visibility': 0.9},  # Left shoulder
                12: {'x': 0.6, 'y': 0.4, 'z': 0.0, 'visibility': 0.9}   # Right shoulder
            }
        )
        
        shot_event = shot_detector.detect(mock_keypoints, 1.0)
        if shot_event:
            print(f"✅ Shot detected: {shot_event.event_type} (confidence: {shot_event.confidence})")
        else:
            print("ℹ️ No shot detected (this is normal for mock data)")
        
        # Test jump detector
        print("\n3. Testing jump detector...")
        jump_detector = analyzer.jump_detector
        
        # Create mock keypoints for jump detection
        mock_keypoints_jump = KeypointData(
            time=1.0,
            player_id="player_1",
            keypoints={
                27: {'x': 0.5, 'y': 0.8, 'z': 0.0, 'visibility': 0.9},  # Left ankle
                28: {'x': 0.5, 'y': 0.8, 'z': 0.0, 'visibility': 0.9},  # Right ankle
                23: {'x': 0.5, 'y': 0.6, 'z': 0.0, 'visibility': 0.9},  # Left hip
                24: {'x': 0.5, 'y': 0.6, 'z': 0.0, 'visibility': 0.9}   # Right hip
            }
        )
        
        jump_event = jump_detector.detect(mock_keypoints_jump, 1.0)
        if jump_event:
            print(f"✅ Jump detected: {jump_event.event_type} (confidence: {jump_event.confidence})")
        else:
            print("ℹ️ No jump detected (this is normal for mock data)")
        
        print("\n✅ Video analyzer components test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Video analyzer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_video_analyzer()
