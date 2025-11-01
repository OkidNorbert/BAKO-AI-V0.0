#!/usr/bin/env python3
"""
Automated Empty Label Cleaner for YOLOv8 Datasets
=================================================

This script identifies and removes image files and their corresponding
YOLO-format label files (`.txt`) if the label file is empty. This is useful
after frame extraction and pre-annotation, where some frames might genuinely
not contain any objects of interest or where the pre-annotation failed to
detect anything relevant.

Removing these empty-labeled frames helps to reduce noise in the dataset
and focuses training on relevant examples.

Usage:
    python empty_label_cleaner.py --input_images_dir datasets/basketball/area_frames/ball/images --input_labels_dir datasets/basketball/area_frames/ball/labels

Prerequisites:
    - Python 3.x

Features:
    - Scans an input labels directory for empty `.txt` files.
    - For each empty label file, deletes both the `.txt` file and its corresponding image file (`.jpg`, etc.).
    - Reports on the number of empty labels and associated images deleted.
"""

import os
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, List

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def find_and_remove_empty_labels(
    input_images_dir: Path,
    input_labels_dir: Path,
    delete_files: bool = True
) -> Dict[str, Any]:
    """Finds and optionally removes images and their empty label files."""
    if not input_images_dir.is_dir():
        return {"success": False, "message": f"Input images directory not found: {input_images_dir}"}
    if not input_labels_dir.is_dir():
        return {"success": False, "message": f"Input labels directory not found: {input_labels_dir}"}

    logger.info(f"🔍 Scanning {input_labels_dir} for empty label files...")

    empty_labels_found = []
    files_processed = 0
    
    # Image extensions for corresponding deletion
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

    for label_path in input_labels_dir.glob("*.txt"):
        files_processed += 1
        try:
            if label_path.stat().st_size == 0: # Check if file is empty
                empty_labels_found.append(str(label_path))
                logger.info(f"  ⚠️ Empty label found: {label_path.name}")
                
                if delete_files:
                    # Delete the empty label file
                    os.remove(label_path)
                    logger.info(f"  🗑️ Deleted empty label file: {label_path.name}")

                    # Attempt to delete the corresponding image file
                    image_stem = label_path.stem
                    deleted_image = False
                    for ext in image_extensions:
                        image_path = input_images_dir / f"{image_stem}{ext}"
                        if image_path.is_file():
                            os.remove(image_path)
                            logger.info(f"  🗑️ Deleted corresponding image: {image_path.name}")
                            deleted_image = True
                            break
                    if not deleted_image:
                        logger.warning(f"  Could not find corresponding image for {label_path.name} in {input_images_dir}")

        except Exception as e:
            logger.warning(f"Skipping {label_path.name} due to error: {e}")

    logger.info(f"✅ Finished scanning. Processed {files_processed} label files.")
    logger.info(f"Found and {('deleted' if delete_files else 'reported')} {len(empty_labels_found)} empty label files and their images.")

    return {
        "success": True,
        "total_label_files_processed": files_processed,
        "empty_labels_found": len(empty_labels_found),
        "empty_labels_deleted": len(empty_labels_found) if delete_files else 0,
        "details": empty_labels_found,
        "message": "Empty label detection and removal completed."
    }

def main():
    parser = argparse.ArgumentParser(description="Automated Empty Label Cleaner.")
    parser.add_argument(
        "--input_images_dir", 
        type=str, 
        required=True, 
        help="Directory containing image files (e.g., 'datasets/basketball/area_frames/ball/images')"
    )
    parser.add_argument(
        "--input_labels_dir", 
        type=str, 
        required=True, 
        help="Directory containing label files to clean (e.g., 'datasets/basketball/area_frames/ball/labels')"
    )
    parser.add_argument(
        "--dry_run", 
        action="store_true", 
        help="If set, only report empty labels but do not delete any files."
    )

    args = parser.parse_args()

    input_images_path = Path(args.input_images_dir)
    input_labels_path = Path(args.input_labels_dir)
    
    result = find_and_remove_empty_labels(
        input_images_dir=input_images_path,
        input_labels_dir=input_labels_path,
        delete_files=not args.dry_run
    )

    if not result["success"]:
        logger.error(f"❌ Error: {result['message']}")

if __name__ == "__main__":
    main()
