#!/usr/bin/env python3
"""
Automated Motion Blur Detector and Cleaner for Basketball Datasets
=================================================================

This script detects and optionally removes blurry image frames from specified
directories using the variance of the Laplacian. Blurry images can negatively
impact model training, and removing them improves dataset quality.

Usage:
    python blur_frame_cleaner.py --input_dir datasets/basketball/area_frames/ball/images --threshold 100

Prerequisites:
    - Python 3.x
    - `opencv-python` library: `pip install opencv-python`

Features:
    - Scans an input directory for image files.
    - Calculates the variance of the Laplacian for each image to assess blurriness.
    - Identifies and optionally deletes images below a configurable blurriness threshold.
    - Reports on the number of blurry images found and deleted.
"""

import os
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, List

# Try importing required libraries
try:
    import cv2
    import numpy as np
except ImportError:
    logging.error("❌ 'opencv-python' library not found. Please install it: pip install opencv-python")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def find_and_remove_blurry_frames(
    input_dir: Path,
    threshold: float = 100.0, # Default threshold, may need tuning
    delete_blurry: bool = True
) -> Dict[str, Any]:
    """Finds and optionally removes blurry images in a directory using Laplacian variance."""
    if not input_dir.is_dir():
        return {"success": False, "message": f"Input directory not found: {input_dir}"}

    logger.info(f"🔍 Scanning {input_dir} for blurry frames (Threshold: {threshold})...")

    blurry_frames_found = []
    images_processed = 0
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

    for img_path in input_dir.iterdir():
        if img_path.is_file() and img_path.suffix.lower() in image_extensions:
            images_processed += 1
            try:
                img = cv2.imread(str(img_path))
                if img is None:
                    logger.warning(f"Skipping {img_path.name}: Could not read image.")
                    continue

                # Convert to grayscale for Laplacian
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                # Compute the Laplacian of the image and then return the focus measure
                # which is the variance of the Laplacian
                fm = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                if fm < threshold:
                    blurry_frames_found.append({"path": str(img_path), "laplacian_variance": fm})
                    logger.info(f"  ⚠️ Blurry frame found: {img_path.name} (Laplacian Variance: {fm:.2f}) ")
                    if delete_blurry:
                        os.remove(img_path)
                        logger.info(f"  🗑️ Deleted blurry frame: {img_path.name}")

            except Exception as e:
                logger.warning(f"Skipping {img_path.name} due to error: {e}")

    logger.info(f"✅ Finished scanning. Processed {images_processed} images.")
    logger.info(f"Found {len(blurry_frames_found)} blurry frames.")
    if delete_blurry:
        logger.info(f"Deleted {len(blurry_frames_found)} blurry frames.")

    return {
        "success": True,
        "total_images_processed": images_processed,
        "blurry_frames_found": len(blurry_frames_found),
        "blurry_frames_deleted": len(blurry_frames_found) if delete_blurry else 0,
        "details": blurry_frames_found,
        "message": "Blurry frame detection and removal completed."
    }

def main():
    parser = argparse.ArgumentParser(description="Automated Motion Blur Detector and Cleaner.")
    parser.add_argument(
        "--input_dir", 
        type=str, 
        required=True, 
        help="Directory containing image frames to clean (e.g., 'datasets/basketball/area_frames/ball/images')"
    )
    parser.add_argument(
        "--threshold", 
        type=float, 
        default=100.0, # Default value, may need tuning
        help="Laplacian variance threshold. Frames with variance below this are considered blurry."
    )
    parser.add_argument(
        "--dry_run", 
        action="store_true", 
        help="If set, only report blurry frames but do not delete any files."
    )

    args = parser.parse_args()

    input_path = Path(args.input_dir)
    
    result = find_and_remove_blurry_frames(
        input_dir=input_path,
        threshold=args.threshold,
        delete_blurry=not args.dry_run
    )

    if not result["success"]:
        logger.error(f"❌ Error: {result['message']}")

if __name__ == "__main__":
    main()
