#!/usr/bin/env python3
"""
Basketball Analysis System Test Script
This script tests the complete basketball analysis pipeline with the downloaded models.
"""

import os
import sys
import argparse
from pathlib import Path
import time

def check_dependencies():
    """Check if all required dependencies are installed."""
    print("=" * 60)
    print("CHECKING DEPENDENCIES")
    print("=" * 60)
    
    required_packages = [
        'cv2',
        'numpy',
        'pandas',
        'torch',
        'ultralytics',
        'supervision',
        'transformers',
        'PIL'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'cv2':
                import cv2
                print(f"✓ OpenCV: {cv2.__version__}")
            elif package == 'PIL':
                from PIL import Image
                print(f"✓ Pillow: {Image.__version__}")
            elif package == 'numpy':
                import numpy as np
                print(f"✓ NumPy: {np.__version__}")
            elif package == 'pandas':
                import pandas as pd
                print(f"✓ Pandas: {pd.__version__}")
            elif package == 'torch':
                import torch
                print(f"✓ PyTorch: {torch.__version__}")
                print(f"  CUDA Available: {torch.cuda.is_available()}")
                if torch.cuda.is_available():
                    print(f"  CUDA Version: {torch.version.cuda}")
            elif package == 'ultralytics':
                import ultralytics
                print(f"✓ Ultralytics: {ultralytics.__version__}")
            elif package == 'supervision':
                import supervision as sv
                print(f"✓ Supervision: {sv.__version__}")
            elif package == 'transformers':
                import transformers
                print(f"✓ Transformers: {transformers.__version__}")
        except ImportError:
            missing_packages.append(package)
            print(f"✗ {package}: NOT INSTALLED")
    
    print()
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("Please install missing packages using: pip install -r requirements.txt")
        return False
    else:
        print("✅ All dependencies are installed!")
        return True

def check_models():
    """Check if all required models are present."""
    print("\n" + "=" * 60)
    print("CHECKING MODELS")
    print("=" * 60)
    
    models_dir = Path("models")
    required_models = {
        'player_detector.pt': 'Player Detection Model',
        'ball_detector_model.pt': 'Ball Detection Model',
        'court_keypoint_detector.pt': 'Court Keypoint Detection Model'
    }
    
    all_present = True
    
    for model_file, description in required_models.items():
        model_path = models_dir / model_file
        if model_path.exists():
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print(f"✓ {description}: {model_file} ({size_mb:.2f} MB)")
        else:
            print(f"✗ {description}: {model_file} NOT FOUND")
            all_present = False
    
    print()
    
    if all_present:
        print("✅ All models are present!")
        return True
    else:
        print("❌ Some models are missing!")
        print("\nDownload models from:")
        print("- ball_detector_model.pt: https://drive.google.com/file/d/1KejdrcEnto2AKjdgdo1U1syr5gODp6EL/view")
        print("- court_keypoint_detector.pt: https://drive.google.com/file/d/1nGoG-pUkSg4bWAUIeQ8aN6n7O1fOkXU0/view")
        print("- player_detector.pt: https://drive.google.com/file/d/1fVBLZtPy9Yu6Tf186oS4siotkioHBLHy/view")
        return False

def check_input_videos():
    """Check for available input videos."""
    print("\n" + "=" * 60)
    print("CHECKING INPUT VIDEOS")
    print("=" * 60)
    
    input_dir = Path("input_videos")
    
    if not input_dir.exists():
        print("✗ input_videos directory not found!")
        return []
    
    video_files = list(input_dir.glob("*.mp4")) + list(input_dir.glob("*.avi"))
    
    if not video_files:
        print("⚠ No video files found in input_videos/")
        print("Please add a basketball video to test the system.")
        return []
    
    print(f"Found {len(video_files)} video file(s):")
    for i, video in enumerate(video_files, 1):
        size_mb = video.stat().st_size / (1024 * 1024)
        print(f"  {i}. {video.name} ({size_mb:.2f} MB)")
    
    print()
    return video_files

def setup_directories():
    """Create necessary directories if they don't exist."""
    print("\n" + "=" * 60)
    print("SETTING UP DIRECTORIES")
    print("=" * 60)
    
    directories = ['stubs', 'output_videos', 'input_videos', 'models', 'images']
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created directory: {directory}/")
        else:
            print(f"✓ Directory exists: {directory}/")
    
    print()

def test_model_loading():
    """Test if models can be loaded successfully."""
    print("\n" + "=" * 60)
    print("TESTING MODEL LOADING")
    print("=" * 60)
    
    try:
        from ultralytics import YOLO
        
        models = {
            'Player Detector': 'models/player_detector.pt',
            'Ball Detector': 'models/ball_detector_model.pt',
            'Court Keypoint Detector': 'models/court_keypoint_detector.pt'
        }
        
        for name, path in models.items():
            print(f"\nLoading {name}...")
            start_time = time.time()
            model = YOLO(path)
            load_time = time.time() - start_time
            print(f"✓ {name} loaded successfully in {load_time:.2f}s")
            print(f"  Model type: {model.task}")
            
        print("\n✅ All models loaded successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error loading models: {str(e)}")
        return False

def run_analysis(video_path, output_path=None):
    """Run the basketball analysis on a video."""
    print("\n" + "=" * 60)
    print("RUNNING BASKETBALL ANALYSIS")
    print("=" * 60)
    
    if output_path is None:
        output_path = f"output_videos/analyzed_{Path(video_path).name}"
    
    print(f"\nInput video: {video_path}")
    print(f"Output video: {output_path}")
    print("\nStarting analysis pipeline...")
    print("This may take several minutes depending on video length and hardware.")
    print("-" * 60)
    
    try:
        # Import main analysis function
        from main import main as run_main
        
        # Set command line arguments
        sys.argv = [
            'test_system.py',
            str(video_path),
            '--output_video', str(output_path),
            '--stub_path', 'stubs'
        ]
        
        start_time = time.time()
        run_main()
        total_time = time.time() - start_time
        
        print("-" * 60)
        print(f"\n✅ Analysis completed in {total_time:.2f}s ({total_time/60:.2f} minutes)")
        print(f"Output saved to: {output_path}")
        
        # Check output file
        if Path(output_path).exists():
            size_mb = Path(output_path).stat().st_size / (1024 * 1024)
            print(f"Output file size: {size_mb:.2f} MB")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    parser = argparse.ArgumentParser(description='Test Basketball Analysis System')
    parser.add_argument('--check-only', action='store_true', 
                       help='Only check system setup without running analysis')
    parser.add_argument('--video', type=str, 
                       help='Specific video file to analyze')
    parser.add_argument('--output', type=str,
                       help='Output video path')
    parser.add_argument('--skip-model-test', action='store_true',
                       help='Skip model loading test (faster)')
    
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("BASKETBALL ANALYSIS SYSTEM TEST")
    print("=" * 60)
    print()
    
    # Setup directories
    setup_directories()
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ System check failed: Missing dependencies")
        return 1
    
    # Check models
    if not check_models():
        print("\n❌ System check failed: Missing models")
        return 1
    
    # Check input videos
    video_files = check_input_videos()
    
    # Test model loading
    if not args.skip_model_test:
        if not test_model_loading():
            print("\n❌ System check failed: Model loading error")
            return 1
    
    # If check-only mode, exit here
    if args.check_only:
        print("\n" + "=" * 60)
        print("✅ SYSTEM CHECK COMPLETE - ALL SYSTEMS READY!")
        print("=" * 60)
        print("\nTo run analysis on a video, use:")
        print("  python test_system.py --video input_videos/your_video.mp4")
        print("\nOr use the main script directly:")
        print("  python main.py input_videos/your_video.mp4")
        return 0
    
    # Run analysis
    if args.video:
        video_path = args.video
    elif video_files:
        video_path = str(video_files[0])
        print(f"\n📹 Using first available video: {video_path}")
    else:
        print("\n⚠ No video specified and no videos found in input_videos/")
        print("Please add a basketball video to input_videos/ or specify with --video")
        return 1
    
    if not Path(video_path).exists():
        print(f"\n❌ Video file not found: {video_path}")
        return 1
    
    success = run_analysis(video_path, args.output)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ TEST COMPLETE - SYSTEM WORKING PERFECTLY!")
        print("=" * 60)
        return 0
    else:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED - CHECK ERRORS ABOVE")
        print("=" * 60)
        return 1

if __name__ == '__main__':
    sys.exit(main())
