#!/usr/bin/env python3
"""
All-in-one script for training YOLOv5 player detection model.
Downloads dataset from Roboflow and trains on GPU.
"""

import os
import sys
import subprocess
from pathlib import Path

# Configuration
VENV_YOLO = "/home/student/Music/OKIDI-DON'T TOUCH/BAKO-AI-V0.0/back-end/.venv/bin/yolo"
ROBOFLOW_API_KEY = "ZzD21wz5oTPdE0fhb04C"
WORKSPACE = "tomatoes-iicln"
PROJECT = "nbl"
DATASET_VERSION = 6
DATASET_FORMAT = "yolov5"

# Training parameters
MODEL = "yolov5l6u.pt"  # Use yolov5l6u for better accuracy on player detection
EPOCHS = 100
IMG_SIZE = 640
BATCH_SIZE = 8
PLOTS = True

def setup_venv():
    """Verify venv and YOLO are available."""
    if not os.path.exists(VENV_YOLO):
        print(f"✗ YOLO not found at {VENV_YOLO}")
        sys.exit(1)
    print(f"✓ YOLO found: {VENV_YOLO}")

def download_dataset():
    """Download dataset from Roboflow."""
    print("\n" + "="*60)
    print("📥 Downloading Player Detection Dataset from Roboflow")
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
    """Verify dataset structure."""
    print("\n" + "="*60)
    print("✓ Verifying Dataset Structure")
    print("="*60)
    
    if not os.path.exists(dataset_dir):
        print(f"✗ Dataset directory not found: {dataset_dir}")
        sys.exit(1)
    
    train_dir = os.path.join(dataset_dir, "train", "images")
    valid_dir = os.path.join(dataset_dir, "valid", "images")
    test_dir = os.path.join(dataset_dir, "test", "images")
    data_yaml = os.path.join(dataset_dir, "data.yaml")
    
    if not os.path.exists(data_yaml):
        print(f"✗ data.yaml not found: {data_yaml}")
        sys.exit(1)
    
    train_count = len(os.listdir(train_dir)) if os.path.exists(train_dir) else 0
    valid_count = len(os.listdir(valid_dir)) if os.path.exists(valid_dir) else 0
    test_count = len(os.listdir(test_dir)) if os.path.exists(test_dir) else 0
    
    print(f"  Dataset: {dataset_dir}")
    print(f"  ├── train/images: {train_count} files")
    print(f"  ├── valid/images: {valid_count} files")
    print(f"  └── test/images: {test_count} files")
    
    if train_count == 0 or valid_count == 0:
        print("✗ Dataset is missing training or validation images")
        sys.exit(1)
    
    print("\n✓ Dataset structure verified")
    return data_yaml

def train_model(dataset_dir):
    """Start YOLO training."""
    print("\n" + "="*60)
    print("🚀 Starting YOLOv5 Player Detection Training")
    print("="*60)
    print(f"  Model: {MODEL}")
    print(f"  Dataset: {dataset_dir}")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Image Size: {IMG_SIZE}")
    print(f"  Batch Size: {BATCH_SIZE}")
    print(f"  Plots: {PLOTS}")
    print("="*60 + "\n")
    
    cmd = [
        VENV_YOLO,
        "task=detect",
        "mode=train",
        f"model={MODEL}",
        f"data={dataset_dir}/data.yaml",
        f"epochs={EPOCHS}",
        f"imgsz={IMG_SIZE}",
        f"batch={BATCH_SIZE}",
        f"plots={PLOTS}",
    ]
    
    try:
        result = subprocess.run(cmd, check=False)
        if result.returncode == 0:
            print("\n✓ Training completed successfully!")
            print("  Results saved to: runs/detect/trainX (check for highest X)")
        else:
            print("\n✗ Training failed with return code:", result.returncode)
            sys.exit(1)
    except Exception as e:
        print(f"✗ Failed to start training: {e}")
        sys.exit(1)

def main():
    """Main training pipeline."""
    print("\n" + "█"*60)
    print("  YOLOv5 PLAYER DETECTION TRAINING")
    print("█"*60 + "\n")
    
    # Step 1: Setup
    print("Step 1: Verifying Virtual Environment")
    setup_venv()
    
    # Step 2: Download dataset
    print("\nStep 2: Downloading Dataset")
    dataset_location = download_dataset()
    
    # Step 3: Find the actual dataset directory (extracted folder)
    # Roboflow extracts to a subdirectory, typically NBL-VERSION
    nbl_dir = os.path.join(os.getcwd(), "NBL-6")
    if os.path.exists(nbl_dir):
        dataset_location = nbl_dir
        print(f"  Found dataset at: {dataset_location}")
    
    # Step 4: Verify dataset
    print("\nStep 3: Verifying Dataset")
    verify_dataset(dataset_location)
    
    # Step 5: Train
    print("\nStep 4: Starting Training")
    train_model(dataset_location)
    
    print("\n" + "█"*60)
    print("  TRAINING PIPELINE COMPLETE")
    print("█"*60 + "\n")

if __name__ == "__main__":
    main()
