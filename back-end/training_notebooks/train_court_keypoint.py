#!/usr/bin/env python3
"""
All-in-one script for training YOLOv8 court keypoint detection model.
Downloads dataset from Roboflow and trains on GPU.
Court keypoints are used for 2D court display and tactical analysis.
"""

import os
import sys
import subprocess
from pathlib import Path

# Configuration
VENV_YOLO = "../.venv/bin/yolo"
ROBOFLOW_API_KEY = "ZzD21wz5oTPdE0fhb04C"
WORKSPACE = "fyp-3bwmg"
PROJECT = "reloc2-den7l"
DATASET_VERSION = 1
DATASET_FORMAT = "yolov8"
"""
!pip install roboflow

from roboflow import Roboflow
rf = Roboflow(api_key="ZzD21wz5oTPdE0fhb04C")
project = rf.workspace("tomatoes-iicln").project("nbl_court_keypoints")
version = project.version(1)
dataset = version.download("yolov8")"""
                

# Training parameters (pose task for keypoint detection)
MODEL = "yolov8x-pose.pt"  # Extra Large Pose model for precision
EPOCHS = 500  # Industry standard for keypoint precision
IMG_SIZE = 640
BATCH_SIZE = 16  # Safe for 4080 (16GB VRAM)
PLOTS = True

def setup_venv():
    """Verify venv and YOLO are available."""
    if not os.path.exists(VENV_YOLO):
        print(f"✗ YOLO not found at {VENV_YOLO}")
        sys.exit(1)
    print(f"✓ YOLO found: {VENV_YOLO}")

def download_dataset():
    """Download court keypoint dataset from Roboflow."""
    print("\n" + "="*60)
    print("📥 Downloading Court Keypoint Dataset from Roboflow")
    print("="*60)
    
    try:
        from roboflow import Roboflow
        
        print(f"  Workspace: {WORKSPACE}")
        print(f"  Project: {PROJECT}")
        print(f"  Version: {DATASET_VERSION}")
        print(f"  Format: {DATASET_FORMAT}")
        
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        project = rf.workspace(WORKSPACE).project(PROJECT)
        version = project.version(DATASET_VERSION)
        dataset = version.download(DATASET_FORMAT)
        
        print(f"\n✓ Dataset downloaded to: {dataset.location}")
        return dataset.location
        
    except ImportError:
        print("✗ Roboflow not installed. Run: pip install roboflow")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Failed to download dataset: {e}")
        sys.exit(1)

def verify_dataset(dataset_dir):
    """Verify dataset structure for keypoint task."""
    print("\n" + "="*60)
    print("✓ Verifying Court Keypoint Dataset Structure")
    print("="*60)
    
    if not os.path.exists(dataset_dir):
        print(f"✗ Dataset directory not found: {dataset_dir}")
        sys.exit(1)
    
    train_dir = os.path.join(dataset_dir, "train", "images")
    valid_dir = os.path.join(dataset_dir, "valid", "images")
    data_yaml = os.path.join(dataset_dir, "data.yaml")
    
    if not os.path.exists(data_yaml):
        print(f"✗ data.yaml not found: {data_yaml}")
        sys.exit(1)
    
    train_count = len(os.listdir(train_dir)) if os.path.exists(train_dir) else 0
    valid_count = len(os.listdir(valid_dir)) if os.path.exists(valid_dir) else 0
    
    print(f"  Dataset: {dataset_dir}")
    print(f"  ├── train/images: {train_count} files")
    print(f"  ├── valid/images: {valid_count} files")
    print(f"  └── Task: Keypoint detection (pose)")
    
    if train_count == 0 or valid_count == 0:
        print("✗ Dataset is missing training or validation images")
        sys.exit(1)
    
    print("\n✓ Dataset structure verified")
    return data_yaml

def train_model(dataset_dir):
    """Start YOLO training for keypoint detection."""
    print("\n" + "="*60)
    print("🚀 Starting Court Keypoint Detection Training")
    print("="*60)
    print(f"  Model: {MODEL}")
    print(f"  Task: pose (keypoint detection)")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Batch Size: {BATCH_SIZE}")
    print(f"  Image Size: {IMG_SIZE}")
    print(f"  Device: GPU (CUDA)")
    
    data_yaml = os.path.join(dataset_dir, "data.yaml")
    
    try:
        cmd = [
            VENV_YOLO,
            "task=pose",
            "mode=train",
            f"model={MODEL}",
            f"data={data_yaml}",
            f"epochs={EPOCHS}",
            f"imgsz={IMG_SIZE}",
            f"batch={BATCH_SIZE}",
            "patience=50", # Allow more time for keypoints to converge
            f"plots={str(PLOTS).lower()}",
            "device=0",
            "workers=8",
            "amp=True"
        ]
        
        print(f"\nRunning: {' '.join(cmd)}\n")
        result = subprocess.run(cmd, check=True)
        
        if result.returncode == 0:
            print("\n" + "="*60)
            print("✓ Training completed successfully!")
            print("="*60)
            print("\nFind results in: runs/pose/train*")
            print("Best model: runs/pose/trainX/weights/best.pt")
        else:
            print(f"\n✗ Training failed with return code: {result.returncode}")
            sys.exit(1)
            
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Training command failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error during training: {e}")
        sys.exit(1)

def main():
    """Main pipeline."""
    print("\n")
    print("████████████████████████████████████████████████████████████")
    print("  Court Keypoint Detection Training Pipeline")
    print("  YOLOv8 Pose Model | Basketball Court Features")
    print("████████████████████████████████████████████████████████████")
    
    # Step 1: Setup
    setup_venv()
    
    # Step 2: Download dataset
    dataset_dir = download_dataset()
    
    # Step 3: Verify dataset
    verify_dataset(dataset_dir)
    
    # Step 4: Train model
    train_model(dataset_dir)
    
    print("\n" + "="*60)
    print("  NEXT STEPS:")
    print("="*60)
    print("1. Find best model in: runs/pose/trainX/weights/best.pt")
    print("2. Copy to back-end/models/court_keypoint_detector.pt")
    print("3. Update configs if needed")
    print("4. Test with court detection pipeline")
    print("\n")

if __name__ == "__main__":
    main()
