#!/usr/bin/env python3
"""
Basketball Dataset Preparation Script
Helps organize and prepare basketball images and annotations for YOLOv8 training
"""

import os
import shutil
import json
from pathlib import Path
import logging
from typing import List, Dict, Any
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BasketballDatasetPreparer:
    """Prepare basketball dataset for YOLOv8 training."""
    
    def __init__(self, dataset_path: str = "training/datasets/basketball"):
        self.dataset_path = Path(dataset_path)
        self.classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
        # Create directory structure
        self._create_directories()
        
        logger.info(f"🏀 Dataset preparer initialized")
        logger.info(f"Dataset path: {self.dataset_path}")
    
    def _create_directories(self):
        """Create the required directory structure."""
        directories = [
            "images/train",
            "images/val", 
            "images/test",
            "labels/train",
            "labels/val",
            "labels/test"
        ]
        
        for dir_path in directories:
            full_path = self.dataset_path / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("📁 Directory structure created")
    
    def add_images(self, source_dir: str, split_ratios: tuple = (0.7, 0.2, 0.1)):
        """Add images from source directory and split into train/val/test."""
        source_path = Path(source_dir)
        
        if not source_path.exists():
            logger.error(f"❌ Source directory not found: {source_dir}")
            return False
        
        # Find all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(source_path.glob(f"*{ext}"))
            image_files.extend(source_path.glob(f"*{ext.upper()}"))
        
        if not image_files:
            logger.error(f"❌ No image files found in: {source_dir}")
            return False
        
        logger.info(f"📸 Found {len(image_files)} images")
        
        # Shuffle and split
        random.shuffle(image_files)
        
        train_ratio, val_ratio, test_ratio = split_ratios
        total_images = len(image_files)
        
        train_end = int(total_images * train_ratio)
        val_end = train_end + int(total_images * val_ratio)
        
        train_files = image_files[:train_end]
        val_files = image_files[train_end:val_end]
        test_files = image_files[val_end:]
        
        # Copy files to respective directories
        self._copy_files(train_files, "images/train")
        self._copy_files(val_files, "images/val")
        self._copy_files(test_files, "images/test")
        
        logger.info(f"✅ Images split: {len(train_files)} train, {len(val_files)} val, {len(test_files)} test")
        return True
    
    def _copy_files(self, files: List[Path], dest_subdir: str):
        """Copy files to destination subdirectory."""
        dest_dir = self.dataset_path / dest_subdir
        
        for file_path in files:
            dest_path = dest_dir / file_path.name
            shutil.copy2(file_path, dest_path)
    
    def create_annotation_template(self, image_name: str, objects: List[Dict[str, Any]]) -> str:
        """Create YOLO format annotation for an image."""
        annotation_lines = []
        
        for obj in objects:
            class_id = obj.get("class_id", 0)
            x_center = obj.get("x_center", 0.5)
            y_center = obj.get("y_center", 0.5)
            width = obj.get("width", 0.1)
            height = obj.get("height", 0.1)
            
            # Ensure values are normalized (0-1)
            x_center = max(0, min(1, x_center))
            y_center = max(0, min(1, y_center))
            width = max(0, min(1, width))
            height = max(0, min(1, height))
            
            annotation_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
        
        return "\n".join(annotation_lines)
    
    def add_annotation(self, image_name: str, objects: List[Dict[str, Any]], split: str = "train"):
        """Add annotation file for an image."""
        # Remove file extension from image name
        base_name = Path(image_name).stem
        
        # Create annotation content
        annotation_content = self.create_annotation_template(image_name, objects)
        
        # Save annotation file
        label_dir = self.dataset_path / "labels" / split
        annotation_file = label_dir / f"{base_name}.txt"
        
        with open(annotation_file, 'w') as f:
            f.write(annotation_content)
        
        logger.info(f"📝 Annotation created: {annotation_file}")
    
    def create_sample_dataset(self):
        """Create a sample dataset for testing."""
        logger.info("🎯 Creating sample basketball dataset...")
        
        # Sample images (you would replace these with actual basketball images)
        sample_images = [
            "basketball_court_001.jpg",
            "basketball_court_002.jpg", 
            "basketball_court_003.jpg",
            "basketball_court_004.jpg",
            "basketball_court_005.jpg"
        ]
        
        # Sample annotations
        sample_annotations = {
            "basketball_court_001.jpg": [
                {"class_id": 0, "x_center": 0.5, "y_center": 0.3, "width": 0.1, "height": 0.1},  # ball
                {"class_id": 1, "x_center": 0.3, "y_center": 0.7, "width": 0.2, "height": 0.4},  # player
                {"class_id": 2, "x_center": 0.1, "y_center": 0.1, "width": 0.8, "height": 0.05},  # court lines
                {"class_id": 3, "x_center": 0.8, "y_center": 0.1, "width": 0.15, "height": 0.2}   # hoop
            ],
            "basketball_court_002.jpg": [
                {"class_id": 0, "x_center": 0.6, "y_center": 0.4, "width": 0.08, "height": 0.08},  # ball
                {"class_id": 1, "x_center": 0.2, "y_center": 0.6, "width": 0.15, "height": 0.3},   # player
                {"class_id": 1, "x_center": 0.7, "y_center": 0.5, "width": 0.12, "height": 0.25},  # player
                {"class_id": 2, "x_center": 0.0, "y_center": 0.0, "width": 1.0, "height": 0.02},   # court lines
                {"class_id": 3, "x_center": 0.9, "y_center": 0.05, "width": 0.08, "height": 0.15}  # hoop
            ],
            "basketball_court_003.jpg": [
                {"class_id": 0, "x_center": 0.4, "y_center": 0.2, "width": 0.12, "height": 0.12},  # ball
                {"class_id": 1, "x_center": 0.5, "y_center": 0.8, "width": 0.18, "height": 0.35},  # player
                {"class_id": 2, "x_center": 0.0, "y_center": 0.0, "width": 1.0, "height": 0.03},   # court lines
                {"class_id": 3, "x_center": 0.1, "y_center": 0.08, "width": 0.12, "height": 0.18}  # hoop
            ],
            "basketball_court_004.jpg": [
                {"class_id": 0, "x_center": 0.7, "y_center": 0.6, "width": 0.09, "height": 0.09},  # ball
                {"class_id": 1, "x_center": 0.4, "y_center": 0.7, "width": 0.16, "height": 0.32},  # player
                {"class_id": 2, "x_center": 0.0, "y_center": 0.0, "width": 1.0, "height": 0.025},  # court lines
                {"class_id": 3, "x_center": 0.85, "y_center": 0.1, "width": 0.1, "height": 0.16}   # hoop
            ],
            "basketball_court_005.jpg": [
                {"class_id": 0, "x_center": 0.3, "y_center": 0.5, "width": 0.11, "height": 0.11},  # ball
                {"class_id": 1, "x_center": 0.6, "y_center": 0.6, "width": 0.14, "height": 0.28},  # player
                {"class_id": 2, "x_center": 0.0, "y_center": 0.0, "width": 1.0, "height": 0.02},   # court lines
                {"class_id": 3, "x_center": 0.05, "y_center": 0.12, "width": 0.14, "height": 0.2}  # hoop
            ]
        }
        
        # Create sample images (placeholder files)
        for image_name in sample_images:
            # Create empty placeholder files
            for split in ["train", "val", "test"]:
                image_path = self.dataset_path / "images" / split / image_name
                image_path.touch()  # Create empty file
        
        # Add annotations
        for image_name, objects in sample_annotations.items():
            # Add to train split
            self.add_annotation(image_name, objects, "train")
        
        logger.info("✅ Sample dataset created")
        logger.info("📋 Note: These are placeholder files. Replace with actual basketball images!")
    
    def validate_dataset(self) -> Dict[str, Any]:
        """Validate the dataset structure and content."""
        logger.info("🔍 Validating dataset...")
        
        validation_results = {
            "valid": True,
            "issues": [],
            "statistics": {}
        }
        
        # Check directory structure
        required_dirs = [
            "images/train", "images/val", "images/test",
            "labels/train", "labels/val", "labels/test"
        ]
        
        for dir_path in required_dirs:
            full_path = self.dataset_path / dir_path
            if not full_path.exists():
                validation_results["valid"] = False
                validation_results["issues"].append(f"Missing directory: {dir_path}")
        
        # Count files in each split
        for split in ["train", "val", "test"]:
            images_dir = self.dataset_path / "images" / split
            labels_dir = self.dataset_path / "labels" / split
            
            image_count = len(list(images_dir.glob("*"))) if images_dir.exists() else 0
            label_count = len(list(labels_dir.glob("*.txt"))) if labels_dir.exists() else 0
            
            validation_results["statistics"][split] = {
                "images": image_count,
                "labels": label_count
            }
            
            if image_count != label_count:
                validation_results["valid"] = False
                validation_results["issues"].append(
                    f"Mismatch in {split}: {image_count} images, {label_count} labels"
                )
        
        if validation_results["valid"]:
            logger.info("✅ Dataset validation passed")
        else:
            logger.warning("⚠️ Dataset validation issues found:")
            for issue in validation_results["issues"]:
                logger.warning(f"   - {issue}")
        
        return validation_results
    
    def print_dataset_info(self):
        """Print dataset information and statistics."""
        print("\n📊 Basketball Dataset Information")
        print("=" * 40)
        
        validation = self.validate_dataset()
        
        print(f"📁 Dataset path: {self.dataset_path}")
        print(f"🏷️  Classes: {list(self.classes.values())}")
        print(f"📈 Total classes: {len(self.classes)}")
        
        print("\n📊 Dataset Statistics:")
        for split, stats in validation["statistics"].items():
            print(f"   {split.capitalize()}: {stats['images']} images, {stats['labels']} labels")
        
        if validation["valid"]:
            print("\n✅ Dataset is ready for training!")
        else:
            print("\n⚠️ Dataset has issues that need to be resolved:")
            for issue in validation["issues"]:
                print(f"   - {issue}")
        
        print("\n📋 Annotation Format (YOLO):")
        print("   class_id x_center y_center width height")
        print("   - All values normalized (0-1)")
        print("   - class_id: 0=ball, 1=player, 2=court_lines, 3=hoop")


def main():
    """Main dataset preparation function."""
    print("🏀 Basketball Dataset Preparation")
    print("=" * 40)
    
    # Initialize preparer
    preparer = BasketballDatasetPreparer()
    
    # Create sample dataset for testing
    preparer.create_sample_dataset()
    
    # Print dataset information
    preparer.print_dataset_info()
    
    print("\n📝 Next Steps:")
    print("1. Replace placeholder images with actual basketball images")
    print("2. Update annotations with correct bounding boxes")
    print("3. Run the training script: python train_basketball_yolo.py")
    print("\n💡 Tip: Use annotation tools like LabelImg or Roboflow for creating annotations")


if __name__ == "__main__":
    main()
