#!/usr/bin/env python3
"""
Quick script to test how long 1 epoch takes
Run this to get exact timing for your system
"""

import subprocess
import sys
from pathlib import Path

def main():
    project_root = Path(__file__).parent.parent
    dataset_dir = project_root / "dataset" / "raw_videos"
    models_dir = project_root / "models"
    train_script = project_root / "training" / "train_videomae.py"
    
    if not train_script.exists():
        print(f"❌ Training script not found: {train_script}")
        return
    
    if not dataset_dir.exists():
        print(f"❌ Dataset directory not found: {dataset_dir}")
        return
    
    print("=" * 60)
    print("⏱️  EPOCH TIMING TEST")
    print("=" * 60)
    print(f"📂 Dataset: {dataset_dir}")
    print(f"💾 Model output: {models_dir}")
    print(f"🎯 Testing 1 epoch only...")
    print("=" * 60)
    print()
    
    # Build command for 1 epoch test
    python_cmd = sys.executable
    cmd = [
        python_cmd,
        str(train_script),
        "--data-dir", str(dataset_dir),
        "--output-dir", str(models_dir / "test_timing"),
        "--epochs", "1",  # Only 1 epoch!
        "--batch-size", "4",
        "--lr", "1e-4"
    ]
    
    print(f"💻 Running: {' '.join(cmd)}")
    print()
    print("⏳ Starting training (1 epoch only)...")
    print("   This will show you exactly how long 1 epoch takes!")
    print()
    
    # Run training
    result = subprocess.run(cmd, cwd=str(project_root))
    
    if result.returncode == 0:
        print()
        print("=" * 60)
        print("✅ Test complete!")
        print("=" * 60)
        print("Check the output above for timing information.")
        print("Look for: 'Average Time per Epoch'")
    else:
        print()
        print("❌ Test failed. Check error messages above.")


if __name__ == "__main__":
    main()

