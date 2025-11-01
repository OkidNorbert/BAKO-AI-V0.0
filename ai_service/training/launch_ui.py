#!/usr/bin/env python3
"""
YOLOv8 Training UI Launcher
==========================

Simple launcher script for the YOLOv8 Basketball Training UI.

Usage:
    python launch_ui.py
"""

import os
import sys
import subprocess
import webbrowser
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import pydantic
        import minio
        logger.info("✅ FastAPI and MinIO dependencies found")
        return True
    except ImportError as e:
        logger.error(f"❌ Missing dependencies: {e}")
        logger.info("📦 Installing required dependencies...")
        
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "fastapi", "uvicorn", "python-multipart", "minio"], check=True)
            logger.info("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to install dependencies: {e}")
            return False

def check_minio():
    """Check if MinIO is running."""
    try:
        from minio import Minio
        client = Minio("localhost:9000", "minioadmin", "minioadmin", secure=False)
        if client.bucket_exists("basketball-videos"):
            logger.info("✅ MinIO is running and bucket exists")
        else:
            logger.info("⚠️ MinIO is running but bucket will be created")
        return True
    except Exception as e:
        logger.warning(f"⚠️ MinIO connection failed: {e}")
        logger.warning("Make sure MinIO is running on localhost:9000")
        return False

def launch_ui():
    """Launch the YOLOv8 Training UI."""
    logger.info("🚀 Launching YOLOv8 Basketball Training UI (MinIO)...")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("❌ Cannot launch UI due to missing dependencies")
        return
    
    # Check MinIO
    check_minio()
    
    # Start the UI server
    try:
        logger.info("🌐 Starting web server on http://localhost:8002")
        logger.info("📱 The UI will open automatically in your browser")
        
        # Open browser after a short delay
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:8002")
        
        import threading
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        # Launch the UI
        subprocess.run([
            sys.executable, "training/yolo_training_ui.py"
        ])
        
    except KeyboardInterrupt:
        logger.info("🛑 UI stopped by user")
    except Exception as e:
        logger.error(f"❌ Error launching UI: {e}")

if __name__ == "__main__":
    print("🏀 YOLOv8 Basketball Training UI Launcher (MinIO)")
    print("=" * 60)
    launch_ui()
