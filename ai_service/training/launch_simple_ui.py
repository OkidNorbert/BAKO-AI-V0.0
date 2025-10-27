#!/usr/bin/env python3
"""
Simple YOLOv8 Basketball Training UI Launcher
=============================================

Launches the simplified UI with only essential features.
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    print("🏀 Simple YOLOv8 Basketball Training UI Launcher")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("simple_yolo_ui.py").exists():
        print("❌ Error: simple_yolo_ui.py not found!")
        print("Please run this script from the training directory.")
        return
    
    # Check if virtual environment exists
    venv_path = Path("../venv")
    if not venv_path.exists():
        print("❌ Error: Virtual environment not found!")
        print("Please run 'python3 -m venv venv' first.")
        return
    
    print("✅ Virtual environment found")
    print("🌐 Starting simple web server on http://localhost:8003")
    print("📱 The UI will open automatically in your browser")
    print("🏀 Essential features only - focused on your project!")
    print()
    
    try:
        # Launch the simple UI
        subprocess.run([
            sys.executable, "simple_yolo_ui.py"
        ], cwd=".")
    except KeyboardInterrupt:
        print("\n👋 Simple UI stopped by user")
    except Exception as e:
        print(f"❌ Error launching simple UI: {e}")

if __name__ == "__main__":
    main()
