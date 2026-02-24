#!/usr/bin/env python3
"""
Test script for independent models on a video.
Tests player detection, ball detection, and court keypoint detection.
"""

import os
import sys
import cv2
import numpy as np
from pathlib import Path

def test_models_on_video():
    """Test all three independent models on a video."""
    
    print("\n" + "="*70)
    print("  INDEPENDENT MODELS TEST ON VIDEO")
    print("="*70)
    
    # Import after setup
    from configs import PLAYER_DETECTOR_PATH, BALL_DETECTOR_PATH, COURT_KEYPOINT_DETECTOR_PATH
    from trackers import PlayerTracker, BallTracker
    from court_keypoint_detector import CourtKeypointDetector
    from utils import read_video
    
    # Find input video
    video_files = [
        "input_videos/video_2.mp4",
        "input_videos/video_1.mp4",
    ]
    
    input_video = None
    for vf in video_files:
        if os.path.exists(vf):
            input_video = vf
            break
    
    if not input_video:
        print(f"✗ No input video found in: {video_files}")
        sys.exit(1)
    
    print(f"\n📹 Input Video: {input_video}")
    print(f"  File Size: {os.path.getsize(input_video) / 1024 / 1024:.1f} MB")
    
    # Read video
    print("\n📖 Reading video frames...")
    try:
        video_frames = read_video(input_video)
        print(f"✓ Loaded {len(video_frames)} frames")
        print(f"  Resolution: {video_frames[0].shape[1]}x{video_frames[0].shape[0]}")
        
        # Use first 30 frames for quick test
        test_frames = video_frames[:30]
        print(f"  Using first {len(test_frames)} frames for testing")
    except Exception as e:
        print(f"✗ Failed to read video: {e}")
        sys.exit(1)
    
    # Test Player Detector
    print("\n" + "-"*70)
    print("🎯 Testing Player Detector")
    print("-"*70)
    print(f"  Model Path: {PLAYER_DETECTOR_PATH}")
    
    if not os.path.exists(PLAYER_DETECTOR_PATH):
        print(f"✗ Model file not found: {PLAYER_DETECTOR_PATH}")
        sys.exit(1)
    
    print(f"  Model Size: {os.path.getsize(PLAYER_DETECTOR_PATH) / 1024 / 1024:.1f} MB")
    
    try:
        player_tracker = PlayerTracker(PLAYER_DETECTOR_PATH)
        print("✓ Player tracker initialized")
        
        print("  Running detections...")
        player_tracks = player_tracker.get_object_tracks(test_frames, read_from_stub=False, stub_path=None)
        
        print("✓ Player detection completed")
        print(f"  Total detections: {len(player_tracks)}")
        for i, track_id in enumerate(list(player_tracks.keys())[:5]):
            print(f"    - Track {track_id}: {len(player_tracks[track_id])} frames")
    except Exception as e:
        print(f"✗ Player detection failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Test Ball Detector
    print("\n" + "-"*70)
    print("⚽ Testing Ball Detector")
    print("-"*70)
    print(f"  Model Path: {BALL_DETECTOR_PATH}")
    
    if not os.path.exists(BALL_DETECTOR_PATH):
        print(f"✗ Model file not found: {BALL_DETECTOR_PATH}")
        sys.exit(1)
    
    print(f"  Model Size: {os.path.getsize(BALL_DETECTOR_PATH) / 1024 / 1024:.1f} MB")
    
    try:
        ball_tracker = BallTracker(BALL_DETECTOR_PATH)
        print("✓ Ball tracker initialized")
        
        print("  Running detections...")
        ball_tracks = ball_tracker.get_object_tracks(test_frames, read_from_stub=False, stub_path=None)
        
        # Clean detections
        ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
        ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)
        
        print("✓ Ball detection completed")
        print(f"  Total detections: {len(ball_tracks)}")
        for i, track_id in enumerate(list(ball_tracks.keys())[:5]):
            print(f"    - Track {track_id}: {len(ball_tracks[track_id])} frames")
    except Exception as e:
        print(f"✗ Ball detection failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Test Court Keypoint Detector
    print("\n" + "-"*70)
    print("🏀 Testing Court Keypoint Detector")
    print("-"*70)
    print(f"  Model Path: {COURT_KEYPOINT_DETECTOR_PATH}")
    
    if not os.path.exists(COURT_KEYPOINT_DETECTOR_PATH):
        print(f"✗ Model file not found: {COURT_KEYPOINT_DETECTOR_PATH}")
        sys.exit(1)
    
    print(f"  Model Size: {os.path.getsize(COURT_KEYPOINT_DETECTOR_PATH) / 1024 / 1024:.1f} MB")
    
    try:
        court_detector = CourtKeypointDetector(COURT_KEYPOINT_DETECTOR_PATH)
        print("✓ Court keypoint detector initialized")
        
        print("  Running detections...")
        court_keypoints = court_detector.get_court_keypoints(test_frames, read_from_stub=False, stub_path=None)
        
        print("✓ Court keypoint detection completed")
        print(f"  Total detections: {len(court_keypoints)}")
        for i, kpts in enumerate(court_keypoints[:3]):
            if kpts is not None:
                print(f"    - Frame {i}: {len(kpts.xy) if hasattr(kpts, 'xy') else 'N/A'} keypoints")
    except Exception as e:
        print(f"✗ Court keypoint detection failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Summary
    print("\n" + "="*70)
    print("  ✓ ALL MODELS TESTED SUCCESSFULLY!")
    print("="*70)
    print("\n📊 Summary:")
    print(f"  ✓ Player Detector: {PLAYER_DETECTOR_PATH}")
    print(f"  ✓ Ball Detector: {BALL_DETECTOR_PATH}")
    print(f"  ✓ Court Keypoint Detector: {COURT_KEYPOINT_DETECTOR_PATH}")
    print(f"\n  Processed {len(test_frames)} frames from {input_video}")
    print("\n✓ System is ready for production deployment!\n")

if __name__ == "__main__":
    test_models_on_video()
