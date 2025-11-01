#!/usr/bin/env python3
"""
Automated Pre-Annotation Script for Basketball Frames
====================================================

This script uses a pre-trained YOLOv8 model to automatically generate initial
bounding box annotations for basketball-related objects (e.g., players, balls)
in a given directory of images. These annotations can then be manually refined
using annotation tools, significantly speeding up the labeling process.

Usage:
    python pre_annotate_frames.py --input_dir datasets/basketball/area_frames/ball/images --output_dir datasets/basketball/area_frames/ball/labels --model_path yolov8n.pt --classes person,sports ball

Prerequisites:
    - Python 3.x
    - `ultralytics` library: `pip install ultralytics`
    - Pre-trained YOLOv8 model weights (e.g., `yolov8n.pt` downloaded to `ai_service/training/`)

Features:
    - Loads a pre-trained YOLOv8 model.
    - Iterates through images in an input directory.
    - Performs object detection and saves predictions in YOLO format (`.txt`).
    - Filters detections by specified classes and confidence threshold.
"""

import os
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Any
import cv2

# Try importing YOLO from ultralytics
try:
    from ultralytics import YOLO
except ImportError:
    logging.error("❌ 'ultralytics' library not found. Please install it: pip install ultralytics")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def pre_annotate_images(
    input_dir: Path,
    output_dir: Path,
    model_path: Path,
    target_classes: List[str],
    confidence_threshold: float = 0.5,
    image_size: int = 640
) -> Dict[str, Any]:
    """Performs automated pre-annotation on images using a pre-trained YOLOv8 model."""
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Loading model from: {model_path}")
    try:
        model = YOLO(str(model_path))
    except Exception as e:
        logger.error(f"❌ Failed to load YOLO model: {e}")
        return {"success": False, "message": f"Failed to load model: {e}"}

    found_images = 0
    annotated_images = 0
    total_detections = 0
    skipped_images = []

    logger.info(f"Starting pre-annotation for images in: {input_dir}")
    
    # Get custom class mapping from the loaded model
    # The COCO classes are usually loaded by default if not specified in model_path's data.yaml
    model_class_to_id = {name: mid for mid, name in model.names.items()}

    for img_path in input_dir.glob("*.jpg"): # Assuming JPG for now
        found_images += 1
        try:
            img = cv2.imread(str(img_path))
            if img is None:
                logger.warning(f"Skipping {img_path}: Could not read image.")
                skipped_images.append(img_path.name)
                continue

            h, w, _ = img.shape

            results = model(str(img_path), conf=confidence_threshold, imgsz=image_size, verbose=False)
            
            annotation_lines = []
            for r in results:
                for box in r.boxes:
                    class_name = model.names[int(box.cls[0])]
                    
                    if class_name in target_classes: # Filter by desired classes
                        # YOLO format: class_id x_center y_center width height (normalized)
                        x_center, y_center, width, height = box.xywhn[0].tolist()
                        class_id = model_class_to_id.get(class_name) # Get numeric ID for target class
                        
                        if class_id is not None: # Ensure class ID is found
                            annotation_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
                            total_detections += 1
            
            if annotation_lines:
                output_label_path = output_dir / f"{img_path.stem}.txt"
                with open(output_label_path, 'w') as f:
                    f.write("\n".join(annotation_lines))
                annotated_images += 1

        except Exception as e:
            logger.error(f"❌ Error processing {img_path}: {e}")
            skipped_images.append(img_path.name)

    logger.info(f"Pre-annotation complete. Processed {found_images} images.")
    logger.info(f"Annotated {annotated_images} images with {total_detections} detections.")
    if skipped_images:
        logger.warning(f"Skipped {len(skipped_images)} images due to errors: {', '.join(skipped_images[:5])}{'...' if len(skipped_images) > 5 else ''}")

    return {
        "success": True,
        "total_images_found": found_images,
        "images_annotated": annotated_images,
        "total_detections": total_detections,
        "skipped_images_count": len(skipped_images),
        "message": "Pre-annotation completed."
    }

def main():
    parser = argparse.ArgumentParser(description="Automated Pre-Annotation Script for Basketball Frames.")
    parser.add_argument(
        "--input_dir", 
        type=str, 
        required=True, 
        help="Directory containing images to pre-annotate (e.g., 'datasets/basketball/area_frames/ball/images')"
    )
    parser.add_argument(
        "--output_dir", 
        type=str, 
        required=True, 
        help="Directory to save generated YOLO format label files (e.g., 'datasets/basketball/area_frames/ball/labels')"
    )
    parser.add_argument(
        "--model_path", 
        type=str, 
        default="yolov8n.pt", # Default to nano model
        help="Path to the pre-trained YOLOv8 model weights (e.g., yolov8n.pt)"
    )
    parser.add_argument(
        "--classes", 
        type=str, 
        default="person,sports ball", 
        help="Comma-separated list of classes to detect (e.g., 'person,sports ball')"
    )
    parser.add_argument(
        "--conf", 
        type=float, 
        default=0.25, # Lower default confidence for pre-annotation
        help="Confidence threshold for object detection (default: 0.25)"
    )
    parser.add_argument(
        "--img_size", 
        type=int, 
        default=640, 
        help="Image size for inference (default: 640)"
    )

    args = parser.parse_args()

    input_path = Path(args.input_dir)
    output_path = Path(args.output_dir)
    model_path = Path(args.model_path)
    target_classes = [c.strip() for c in args.classes.split(',')]

    # Ensure model path is relative to the script or absolute
    if not model_path.is_absolute():
        model_path = Path(__file__).parent / model_path
    
    # Download yolov8n.pt if it doesn't exist
    if not model_path.exists():
        logger.info(f"Downloading default YOLOv8n model weights to {model_path}...")
        try:
            # Use ultralytics to download weights
            YOLO(str(model_path)) # This will download yolov8n.pt if it doesn't exist
            logger.info("✅ YOLOv8n weights downloaded successfully.")
        except Exception as e:
            logger.error(f"❌ Failed to download YOLOv8n weights: {e}. Please ensure you have internet access.")
            return

    pre_annotate_images(
        input_dir=input_path,
        output_dir=output_path,
        model_path=model_path,
        target_classes=target_classes,
        confidence_threshold=args.conf,
        image_size=args.img_size
    )

if __name__ == "__main__":
    main()
