#!/usr/bin/env python3
"""
Recording Sanity Check
Run this script on your first recorded video to ensure everything is perfect.
"""

import sys
import os
import cv2
import mediapipe as mp
from shooting_feature_extractor import ShootingFeatureExtractor

def run_check(video_path):
    print(f"🔍 Starting sanity check for: {video_path}")
    
    # 1. Check if file exists
    if not os.path.exists(video_path):
        print(f"❌ Error: File {video_path} not found.")
        return False
    
    # 2. Check OpenCV and Video Read
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("❌ Error: Could not open video file with OpenCV.")
        return False
    
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"✅ OpenCV connected: {width}x{height} @ {fps:.1f} FPS")
    cap.release()
    
    # 3. Check MediaPipe
    try:
        mp_pose = mp.solutions.pose
        with mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5) as pose:
            print("✅ MediaPipe Pose initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing MediaPipe: {e}")
        return False
        
    # 4. Run Feature Extractor
    print("\n🚀 Running Shooting Feature Extractor...")
    try:
        extractor = ShootingFeatureExtractor()
        features = extractor.extract_shot_features(video_path)
        
        print("\n✅ ANALYSIS SUCCESSFUL!")
        print("-" * 30)
        print(f"Release Elbow Angle: {features.release.elbow_angle:.1f}°")
        print(f"Knee Flexion: {features.loading.knee_flexion:.1f}°")
        print(f"Total Shot Duration: {features.timing.total_shot_duration:.2f}s")
        print("-" * 30)
        print("\n🌟 YOUR SYSTEM IS FULLY READY FOR RECORDING 300 VIDEOS! 🌟")
        return True
    except Exception as e:
        print(f"\n❌ Error during feature extraction: {e}")
        print("\nTIP: Make sure your full body is visible in the video!")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 sanity_check.py <path_to_first_video>")
    else:
        run_check(sys.argv[1])
