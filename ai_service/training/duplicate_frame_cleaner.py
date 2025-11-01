#!/usr/bin/env python3
"""
Automated Duplicate Frame Cleaner for Basketball Datasets
=======================================================

This script detects and removes near-duplicate image frames from specified
directories using perceptual hashing. This helps to reduce redundancy in
training datasets, leading to potentially faster training and better model
generalization by ensuring a higher diversity of unique frames.

Usage:
    python duplicate_frame_cleaner.py --input_dir datasets/basketball/area_frames/ball/images --hash_size 8 --tolerance 5

Prerequisites:
    - Python 3.x
    - `Pillow` (PIL Fork): `pip install Pillow`
    - `imagehash` library: `pip install imagehash`

Features:
    - Scans an input directory for image files.
    - Computes perceptual hashes (e.g., AHash) for each image.
    - Compares hashes to identify near-duplicate images based on a configurable tolerance.
    - Deletes duplicate images (keeping the first encountered one).
    - Reports on the number of duplicates found and deleted.
"""

import os
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, List

# Try importing required libraries
try:
    from PIL import Image
except ImportError:
    logging.error("❌ 'Pillow' library not found. Please install it: pip install Pillow")
    exit(1)

try:
    import imagehash
except ImportError:
    logging.error("❌ 'imagehash' library not found. Please install it: pip install imagehash")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def find_and_remove_duplicates(
    input_dir: Path,
    hash_size: int = 8,
    tolerance: int = 5,
    delete_duplicates: bool = True
) -> Dict[str, Any]:
    """Finds and optionally removes duplicate images in a directory using perceptual hashing."""
    if not input_dir.is_dir():
        return {"success": False, "message": f"Input directory not found: {input_dir}"}

    logger.info(f"🔍 Scanning {input_dir} for duplicate frames (Hash Size: {hash_size}, Tolerance: {tolerance})...")

    hashes = {}
    duplicates_found = []
    images_processed = 0
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

    for img_path in input_dir.iterdir():
        if img_path.is_file() and img_path.suffix.lower() in image_extensions:
            images_processed += 1
            try:
                img = Image.open(img_path)
                current_hash = imagehash.average_hash(img, hash_size=hash_size)
                
                is_duplicate = False
                for existing_hash, original_path in hashes.items():
                    if abs(current_hash - existing_hash) <= tolerance:
                        is_duplicate = True
                        duplicates_found.append({"duplicate": str(img_path), "original": str(original_path), "hash_diff": abs(current_hash - existing_hash)})
                        logger.info(f"  ⚠️ Duplicate found: {img_path.name} is similar to {original_path.name} (Diff: {abs(current_hash - existing_hash)}) ")
                        if delete_duplicates:
                            os.remove(img_path)
                            logger.info(f"  🗑️ Deleted duplicate: {img_path.name}")
                        break
                
                if not is_duplicate:
                    hashes[current_hash] = img_path

            except Exception as e:
                logger.warning(f"Skipping {img_path.name} due to error: {e}")

    logger.info(f"✅ Finished scanning. Processed {images_processed} images.")
    logger.info(f"Found {len(duplicates_found)} near-duplicate frames.")
    if delete_duplicates:
        logger.info(f"Deleted {len(duplicates_found)} duplicate frames.")

    return {
        "success": True,
        "total_images_processed": images_processed,
        "duplicates_found": len(duplicates_found),
        "duplicates_deleted": len(duplicates_found) if delete_duplicates else 0,
        "details": duplicates_found,
        "message": "Duplicate frame detection and removal completed."
    }

def main():
    parser = argparse.ArgumentParser(description="Automated Duplicate Frame Cleaner.")
    parser.add_argument(
        "--input_dir", 
        type=str, 
        required=True, 
        help="Directory containing image frames to clean (e.g., 'datasets/basketball/area_frames/ball/images')"
    )
    parser.add_argument(
        "--hash_size", 
        type=int, 
        default=8, 
        help="Size of the hash (e.g., 8, 16). Larger sizes are more precise but slower."
    )
    parser.add_argument(
        "--tolerance", 
        type=int, 
        default=5, 
        help="Maximum hash difference to consider two images duplicates (0 for exact match)."
    )
    parser.add_argument(
        "--dry_run", 
        action="store_true", 
        help="If set, only report duplicates but do not delete any files."
    )

    args = parser.parse_args()

    input_path = Path(args.input_dir)
    
    result = find_and_remove_duplicates(
        input_dir=input_path,
        hash_size=args.hash_size,
        tolerance=args.tolerance,
        delete_duplicates=not args.dry_run
    )

    if not result["success"]:
        logger.error(f"❌ Error: {result['message']}")

if __name__ == "__main__":
    main()
