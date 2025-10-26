#!/usr/bin/env python3
"""
Basketball Annotation Helper for YOLOv8 Training
===============================================

This script helps with the annotation workflow for basketball object detection.
It provides utilities to manage and validate YOLO format annotations.

Usage:
    python annotation_helper.py --frames-dir frames/ --labels-dir labels/
"""

import os
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Tuple
import json
import random

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BasketballAnnotationHelper:
    """
    Helper class for managing basketball object annotations in YOLO format.
    """
    
    def __init__(self, frames_dir: str, labels_dir: str):
        self.frames_dir = Path(frames_dir)
        self.labels_dir = Path(labels_dir)
        
        # Basketball classes for YOLOv8 training
        self.classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
        # Class colors for visualization (BGR format for OpenCV)
        self.class_colors = {
            0: (0, 255, 0),    # Green for ball
            1: (255, 0, 0),    # Blue for player
            2: (0, 0, 255),    # Red for court lines
            3: (255, 255, 0)   # Cyan for hoop
        }
    
    def validate_annotations(self) -> Dict[str, List[str]]:
        """
        Validate annotation files and return issues found.
        
        Returns:
            Dictionary with validation results
        """
        logger.info("🔍 Validating basketball annotations...")
        
        issues = {
            "missing_annotations": [],
            "invalid_format": [],
            "invalid_classes": [],
            "invalid_coordinates": []
        }
        
        # Get all frame files
        frame_files = list(self.frames_dir.glob("*.jpg")) + list(self.frames_dir.glob("*.png"))
        
        for frame_file in frame_files:
            frame_name = frame_file.stem
            label_file = self.labels_dir / f"{frame_name}.txt"
            
            # Check if annotation file exists
            if not label_file.exists():
                issues["missing_annotations"].append(str(frame_file))
                continue
                
            # Validate annotation format
            try:
                with open(label_file, 'r') as f:
                    lines = f.readlines()
                    
                for line_num, line in enumerate(lines, 1):
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                        
                    parts = line.split()
                    if len(parts) != 5:
                        issues["invalid_format"].append(f"{label_file}:{line_num} - Expected 5 values, got {len(parts)}")
                        continue
                        
                    try:
                        class_id = int(parts[0])
                        x_center = float(parts[1])
                        y_center = float(parts[2])
                        width = float(parts[3])
                        height = float(parts[4])
                        
                        # Validate class ID
                        if class_id not in self.classes:
                            issues["invalid_classes"].append(f"{label_file}:{line_num} - Invalid class ID: {class_id}")
                            
                        # Validate coordinates (should be 0-1)
                        coords = [x_center, y_center, width, height]
                        if not all(0 <= coord <= 1 for coord in coords):
                            issues["invalid_coordinates"].append(f"{label_file}:{line_num} - Coordinates out of range: {coords}")
                            
                    except ValueError as e:
                        issues["invalid_format"].append(f"{label_file}:{line_num} - Invalid number format: {e}")
                        
            except Exception as e:
                issues["invalid_format"].append(f"{label_file} - File read error: {e}")
                
        return issues
    
    def generate_annotation_stats(self) -> Dict:
        """
        Generate statistics about the annotation dataset.
        
        Returns:
            Dictionary with annotation statistics
        """
        logger.info("📊 Generating annotation statistics...")
        
        stats = {
            "total_frames": 0,
            "annotated_frames": 0,
            "total_annotations": 0,
            "class_counts": {name: 0 for name in self.classes.values()},
            "frames_per_class": {name: 0 for name in self.classes.values()}
        }
        
        # Get all frame files
        frame_files = list(self.frames_dir.glob("*.jpg")) + list(self.frames_dir.glob("*.png"))
        stats["total_frames"] = len(frame_files)
        
        annotated_frames = set()
        
        for frame_file in frame_files:
            frame_name = frame_file.stem
            label_file = self.labels_dir / f"{frame_name}.txt"
            
            if label_file.exists():
                stats["annotated_frames"] += 1
                annotated_frames.add(frame_name)
                
                try:
                    with open(label_file, 'r') as f:
                        lines = f.readlines()
                        
                    frame_classes = set()
                    for line in lines:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                            
                        parts = line.split()
                        if len(parts) == 5:
                            class_id = int(parts[0])
                            if class_id in self.classes:
                                class_name = self.classes[class_id]
                                stats["class_counts"][class_name] += 1
                                frame_classes.add(class_name)
                                stats["total_annotations"] += 1
                                
                    # Count frames per class
                    for class_name in frame_classes:
                        stats["frames_per_class"][class_name] += 1
                        
                except Exception as e:
                    logger.warning(f"⚠️ Error reading {label_file}: {e}")
                    
        return stats
    
    def create_dataset_splits(self, train_ratio: float = 0.7, val_ratio: float = 0.2, test_ratio: float = 0.1) -> None:
        """
        Create train/validation/test splits for the dataset.
        
        Args:
            train_ratio: Ratio of data for training
            val_ratio: Ratio of data for validation  
            test_ratio: Ratio of data for testing
        """
        logger.info(f"📊 Creating dataset splits: {train_ratio:.1%} train, {val_ratio:.1%} val, {test_ratio:.1%} test")
        
        # Get all annotated frames
        annotated_frames = []
        for frame_file in self.frames_dir.glob("*.jpg"):
            frame_name = frame_file.stem
            label_file = self.labels_dir / f"{frame_name}.txt"
            if label_file.exists():
                annotated_frames.append(frame_name)
                
        # Shuffle frames
        random.shuffle(annotated_frames)
        
        # Calculate split indices
        total_frames = len(annotated_frames)
        train_end = int(total_frames * train_ratio)
        val_end = train_end + int(total_frames * val_ratio)
        
        # Create splits
        train_frames = annotated_frames[:train_end]
        val_frames = annotated_frames[train_end:val_end]
        test_frames = annotated_frames[val_end:]
        
        # Create directories
        for split in ['train', 'val', 'test']:
            (self.frames_dir.parent / 'images' / split).mkdir(parents=True, exist_ok=True)
            (self.labels_dir.parent / 'labels' / split).mkdir(parents=True, exist_ok=True)
            
        # Move files to appropriate directories
        splits = {
            'train': train_frames,
            'val': val_frames, 
            'test': test_frames
        }
        
        for split_name, frames in splits.items():
            logger.info(f"📁 Moving {len(frames)} frames to {split_name} split")
            
            for frame_name in frames:
                # Move image
                src_img = self.frames_dir / f"{frame_name}.jpg"
                dst_img = self.frames_dir.parent / 'images' / split_name / f"{frame_name}.jpg"
                if src_img.exists():
                    src_img.rename(dst_img)
                    
                # Move label
                src_label = self.labels_dir / f"{frame_name}.txt"
                dst_label = self.labels_dir.parent / 'labels' / split_name / f"{frame_name}.txt"
                if src_label.exists():
                    src_label.rename(dst_label)
                    
        logger.info("✅ Dataset splits created successfully")
        
        # Print split summary
        print(f"\n📊 Dataset Split Summary:")
        print(f"   Train: {len(train_frames)} frames")
        print(f"   Validation: {len(val_frames)} frames") 
        print(f"   Test: {len(test_frames)} frames")
        print(f"   Total: {total_frames} frames")
    
    def create_sample_annotations(self, num_samples: int = 5) -> None:
        """
        Create sample annotation files for demonstration.
        
        Args:
            num_samples: Number of sample annotations to create
        """
        logger.info(f"📝 Creating {num_samples} sample annotations...")
        
        # Get first few frame files
        frame_files = list(self.frames_dir.glob("*.jpg"))[:num_samples]
        
        for i, frame_file in enumerate(frame_files):
            frame_name = frame_file.stem
            label_file = self.labels_dir / f"{frame_name}.txt"
            
            # Create sample annotation
            with open(label_file, 'w') as f:
                f.write("# YOLO format: class_id x_center y_center width height\n")
                f.write("# 0=ball, 1=player, 2=court_lines, 3=hoop\n")
                f.write("# All values normalized (0-1)\n\n")
                
                # Add sample annotations
                if i % 4 == 0:  # Ball
                    f.write("0 0.5 0.3 0.1 0.1\n")
                elif i % 4 == 1:  # Player
                    f.write("1 0.3 0.7 0.2 0.4\n")
                elif i % 4 == 2:  # Court lines
                    f.write("2 0.5 0.8 0.8 0.1\n")
                else:  # Hoop
                    f.write("3 0.8 0.2 0.15 0.2\n")
                    
            logger.info(f"📝 Created sample annotation: {label_file}")
            
        logger.info("✅ Sample annotations created")
    
    def print_annotation_guide(self) -> None:
        """
        Print annotation guidelines for basketball objects.
        """
        print("\n🏀 Basketball Annotation Guide")
        print("=" * 50)
        print("\n📋 YOLO Format:")
        print("   class_id x_center y_center width height")
        print("   - All values normalized (0-1)")
        print("   - x_center, y_center: center of bounding box")
        print("   - width, height: size of bounding box")
        
        print("\n🏷️ Basketball Classes:")
        for class_id, class_name in self.classes.items():
            print(f"   {class_id}: {class_name}")
            
        print("\n📐 Annotation Guidelines:")
        print("   🏀 Ball: Tight bounding box around the basketball")
        print("   👤 Player: Full body from head to feet")
        print("   📏 Court Lines: Key court boundary lines")
        print("   🏀 Hoop: Basketball rim and backboard")
        
        print("\n🛠️ Recommended Tools:")
        print("   - LabelImg: pip install labelImg && labelImg")
        print("   - Roboflow: Online annotation platform")
        print("   - CVAT: Computer Vision Annotation Tool")
        
        print("\n💡 Tips:")
        print("   - Annotate consistently across all frames")
        print("   - Include partial objects if >50% visible")
        print("   - Use tight bounding boxes for better accuracy")
        print("   - Validate annotations before training")

def main():
    parser = argparse.ArgumentParser(description="Basketball annotation helper for YOLOv8 training")
    parser.add_argument("--frames-dir", "-f", required=True, help="Directory containing frame images")
    parser.add_argument("--labels-dir", "-l", required=True, help="Directory containing label files")
    parser.add_argument("--action", "-a", choices=["validate", "stats", "splits", "samples", "guide"], 
                       default="guide", help="Action to perform")
    parser.add_argument("--train-ratio", type=float, default=0.7, help="Training set ratio")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation set ratio")
    parser.add_argument("--test-ratio", type=float, default=0.1, help="Test set ratio")
    parser.add_argument("--num-samples", type=int, default=5, help="Number of sample annotations to create")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.frames_dir):
        logger.error(f"❌ Frames directory not found: {args.frames_dir}")
        return
        
    if not os.path.exists(args.labels_dir):
        logger.error(f"❌ Labels directory not found: {args.labels_dir}")
        return
        
    helper = BasketballAnnotationHelper(args.frames_dir, args.labels_dir)
    
    try:
        if args.action == "validate":
            issues = helper.validate_annotations()
            print("\n🔍 Annotation Validation Results:")
            for issue_type, issue_list in issues.items():
                if issue_list:
                    print(f"\n❌ {issue_type.replace('_', ' ').title()}:")
                    for issue in issue_list[:10]:  # Show first 10 issues
                        print(f"   - {issue}")
                    if len(issue_list) > 10:
                        print(f"   ... and {len(issue_list) - 10} more")
                else:
                    print(f"✅ {issue_type.replace('_', ' ').title()}: No issues found")
                    
        elif args.action == "stats":
            stats = helper.generate_annotation_stats()
            print("\n📊 Annotation Statistics:")
            print(f"   Total Frames: {stats['total_frames']}")
            print(f"   Annotated Frames: {stats['annotated_frames']}")
            print(f"   Total Annotations: {stats['total_annotations']}")
            print(f"   Annotation Rate: {stats['annotated_frames']/stats['total_frames']*100:.1f}%")
            
            print("\n🏷️ Class Distribution:")
            for class_name, count in stats['class_counts'].items():
                print(f"   {class_name}: {count} annotations")
                
            print("\n📊 Frames per Class:")
            for class_name, count in stats['frames_per_class'].items():
                print(f"   {class_name}: {count} frames")
                
        elif args.action == "splits":
            helper.create_dataset_splits(args.train_ratio, args.val_ratio, args.test_ratio)
            
        elif args.action == "samples":
            helper.create_sample_annotations(args.num_samples)
            
        elif args.action == "guide":
            helper.print_annotation_guide()
            
    except Exception as e:
        logger.error(f"❌ Action failed: {e}")
        raise

if __name__ == "__main__":
    main()
