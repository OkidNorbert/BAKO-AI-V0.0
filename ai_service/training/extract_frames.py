#!/usr/bin/env python3
"""
Basketball Video Frame Extraction for YOLOv8 Training
====================================================

This script extracts frames from basketball videos to create a training dataset.
It supports various extraction strategies and formats suitable for YOLOv8 training.

Usage:
    python extract_frames.py --input video.mp4 --output frames/ --strategy uniform
"""

import os
import cv2
import argparse
import logging
from pathlib import Path
from typing import List, Tuple, Optional
import json
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BasketballFrameExtractor:
    """
    Extracts frames from basketball videos for YOLOv8 training dataset creation.
    """
    
    def __init__(self, output_dir: str = "training/datasets/basketball/frames"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Basketball-specific frame extraction settings
        self.basketball_classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
        # Frame quality settings
        self.target_width = 640
        self.target_height = 640
        self.quality_threshold = 0.7  # Minimum frame quality score
        
    def extract_frames_uniform(self, video_path: str, interval: int = 30) -> List[str]:
        """
        Extract frames at uniform intervals (every N frames).
        
        Args:
            video_path: Path to input video
            interval: Extract every Nth frame (default: 30 frames = ~1 second at 30fps)
            
        Returns:
            List of extracted frame file paths
        """
        logger.info(f"🎬 Extracting frames uniformly (every {interval} frames) from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
            
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = frame_count / fps if fps > 0 else 0
        
        logger.info(f"📊 Video info: {frame_count} frames, {fps:.2f} FPS, {duration:.2f}s duration")
        
        extracted_frames = []
        frame_idx = 0
        saved_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Extract every Nth frame
            if frame_idx % interval == 0:
                # Resize frame to target dimensions
                frame_resized = cv2.resize(frame, (self.target_width, self.target_height))
                
                # Save frame
                frame_filename = f"frame_{frame_idx:06d}.jpg"
                frame_path = self.output_dir / frame_filename
                
                cv2.imwrite(str(frame_path), frame_resized)
                extracted_frames.append(str(frame_path))
                saved_count += 1
                
                if saved_count % 10 == 0:
                    logger.info(f"💾 Saved {saved_count} frames...")
                    
            frame_idx += 1
            
        cap.release()
        logger.info(f"✅ Extracted {saved_count} frames uniformly from {video_path}")
        return extracted_frames
    
    def extract_frames_temporal(self, video_path: str, num_frames: int = 100) -> List[str]:
        """
        Extract frames distributed evenly across video duration.
        
        Args:
            video_path: Path to input video
            num_frames: Total number of frames to extract
            
        Returns:
            List of extracted frame file paths
        """
        logger.info(f"🎬 Extracting {num_frames} frames temporally from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
            
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Calculate frame indices to extract
        step = frame_count // num_frames
        frame_indices = [i * step for i in range(num_frames)]
        
        logger.info(f"📊 Video: {frame_count} frames, extracting at indices: {frame_indices[:5]}...")
        
        extracted_frames = []
        
        for i, target_frame in enumerate(frame_indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
            ret, frame = cap.read()
            
            if ret:
                # Resize frame
                frame_resized = cv2.resize(frame, (self.target_width, self.target_height))
                
                # Save frame
                frame_filename = f"temporal_{i:04d}_frame_{target_frame:06d}.jpg"
                frame_path = self.output_dir / frame_filename
                
                cv2.imwrite(str(frame_path), frame_resized)
                extracted_frames.append(str(frame_path))
                
                if (i + 1) % 20 == 0:
                    logger.info(f"💾 Saved {i + 1}/{num_frames} frames...")
            else:
                logger.warning(f"⚠️ Could not read frame at index {target_frame}")
                
        cap.release()
        logger.info(f"✅ Extracted {len(extracted_frames)} frames temporally from {video_path}")
        return extracted_frames
    
    def extract_frames_motion(self, video_path: str, motion_threshold: float = 0.1) -> List[str]:
        """
        Extract frames with significant motion/activity.
        
        Args:
            video_path: Path to input video
            motion_threshold: Minimum motion score to extract frame
            
        Returns:
            List of extracted frame file paths
        """
        logger.info(f"🎬 Extracting frames with motion (threshold: {motion_threshold}) from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
            
        # Initialize background subtractor
        bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        
        extracted_frames = []
        frame_idx = 0
        prev_frame = None
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Convert to grayscale for motion detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Apply background subtraction
            fg_mask = bg_subtractor.apply(gray)
            
            # Calculate motion score
            motion_score = cv2.countNonZero(fg_mask) / (frame.shape[0] * frame.shape[1])
            
            # Extract frame if motion is significant
            if motion_score > motion_threshold:
                # Resize frame
                frame_resized = cv2.resize(frame, (self.target_width, self.target_height))
                
                # Save frame
                frame_filename = f"motion_{frame_idx:06d}_score_{motion_score:.3f}.jpg"
                frame_path = self.output_dir / frame_filename
                
                cv2.imwrite(str(frame_path), frame_resized)
                extracted_frames.append(str(frame_path))
                
                if len(extracted_frames) % 10 == 0:
                    logger.info(f"💾 Saved {len(extracted_frames)} motion frames...")
                    
            frame_idx += 1
            
        cap.release()
        logger.info(f"✅ Extracted {len(extracted_frames)} motion frames from {video_path}")
        return extracted_frames
    
    def extract_frames_key_moments(self, video_path: str) -> List[str]:
        """
        Extract frames at key basketball moments (shots, jumps, etc.).
        This is a simplified version - in practice, you'd use more sophisticated detection.
        
        Args:
            video_path: Path to input video
            
        Returns:
            List of extracted frame file paths
        """
        logger.info(f"🎬 Extracting key moment frames from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
            
        extracted_frames = []
        frame_idx = 0
        
        # Simple key moment detection based on frame differences
        prev_frame = None
        key_moment_threshold = 0.3
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if prev_frame is not None:
                # Calculate frame difference
                diff = cv2.absdiff(frame, prev_frame)
                diff_score = cv2.countNonZero(cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)) / (frame.shape[0] * frame.shape[1])
                
                # Extract if significant change detected
                if diff_score > key_moment_threshold:
                    frame_resized = cv2.resize(frame, (self.target_width, self.target_height))
                    
                    frame_filename = f"key_moment_{frame_idx:06d}_diff_{diff_score:.3f}.jpg"
                    frame_path = self.output_dir / frame_filename
                    
                    cv2.imwrite(str(frame_path), frame_resized)
                    extracted_frames.append(str(frame_path))
                    
                    if len(extracted_frames) % 5 == 0:
                        logger.info(f"💾 Saved {len(extracted_frames)} key moment frames...")
                        
            prev_frame = frame.copy()
            frame_idx += 1
            
        cap.release()
        logger.info(f"✅ Extracted {len(extracted_frames)} key moment frames from {video_path}")
        return extracted_frames
    
    def create_annotation_template(self, frame_paths: List[str]) -> None:
        """
        Create empty annotation files for each extracted frame.
        
        Args:
            frame_paths: List of extracted frame file paths
        """
        logger.info(f"📝 Creating annotation templates for {len(frame_paths)} frames")
        
        # Create labels directory
        labels_dir = self.output_dir.parent / "labels"
        labels_dir.mkdir(exist_ok=True)
        
        for frame_path in frame_paths:
            frame_name = Path(frame_path).stem
            label_path = labels_dir / f"{frame_name}.txt"
            
            # Create empty annotation file
            with open(label_path, 'w') as f:
                f.write("# YOLO format: class_id x_center y_center width height\n")
                f.write("# 0=ball, 1=player, 2=court_lines, 3=hoop\n")
                f.write("# All values normalized (0-1)\n")
                
        logger.info(f"✅ Created {len(frame_paths)} annotation templates in {labels_dir}")
    
    def generate_dataset_info(self, frame_paths: List[str], video_path: str) -> None:
        """
        Generate dataset information and statistics.
        
        Args:
            frame_paths: List of extracted frame file paths
            video_path: Original video path
        """
        info = {
            "extraction_date": datetime.now().isoformat(),
            "source_video": str(video_path),
            "extraction_strategy": "multiple",
            "total_frames": len(frame_paths),
            "frame_dimensions": f"{self.target_width}x{self.target_height}",
            "basketball_classes": self.basketball_classes,
            "frame_files": [str(Path(p).name) for p in frame_paths]
        }
        
        info_path = self.output_dir / "extraction_info.json"
        with open(info_path, 'w') as f:
            json.dump(info, f, indent=2)
            
        logger.info(f"📊 Dataset info saved to {info_path}")
        
        # Print summary
        print("\n🏀 Basketball Frame Extraction Summary")
        print("=" * 50)
        print(f"📹 Source Video: {Path(video_path).name}")
        print(f"📊 Total Frames Extracted: {len(frame_paths)}")
        print(f"📐 Frame Size: {self.target_width}x{self.target_height}")
        print(f"📁 Output Directory: {self.output_dir}")
        print(f"🏷️  Classes: {list(self.basketball_classes.values())}")
        print(f"📝 Annotation Templates: Created")
        print("\n🚀 Next Steps:")
        print("1. Review extracted frames")
        print("2. Annotate frames using LabelImg or similar tool")
        print("3. Update data.yaml with correct paths")
        print("4. Start YOLOv8 training")

def main():
    parser = argparse.ArgumentParser(description="Extract frames from basketball videos for YOLOv8 training")
    parser.add_argument("--input", "-i", required=True, help="Input video file path")
    parser.add_argument("--output", "-o", default="training/datasets/basketball/frames", help="Output directory for frames")
    parser.add_argument("--strategy", "-s", choices=["uniform", "temporal", "motion", "key_moments", "all"], 
                       default="all", help="Frame extraction strategy")
    parser.add_argument("--interval", type=int, default=30, help="Frame interval for uniform extraction")
    parser.add_argument("--num_frames", type=int, default=100, help="Number of frames for temporal extraction")
    parser.add_argument("--motion_threshold", type=float, default=0.1, help="Motion threshold for motion extraction")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        logger.error(f"❌ Input video not found: {args.input}")
        return
        
    extractor = BasketballFrameExtractor(args.output)
    all_extracted_frames = []
    
    try:
        if args.strategy in ["uniform", "all"]:
            frames = extractor.extract_frames_uniform(args.input, args.interval)
            all_extracted_frames.extend(frames)
            
        if args.strategy in ["temporal", "all"]:
            frames = extractor.extract_frames_temporal(args.input, args.num_frames)
            all_extracted_frames.extend(frames)
            
        if args.strategy in ["motion", "all"]:
            frames = extractor.extract_frames_motion(args.input, args.motion_threshold)
            all_extracted_frames.extend(frames)
            
        if args.strategy in ["key_moments", "all"]:
            frames = extractor.extract_frames_key_moments(args.input)
            all_extracted_frames.extend(frames)
            
        # Remove duplicates
        unique_frames = list(set(all_extracted_frames))
        
        # Create annotation templates
        extractor.create_annotation_template(unique_frames)
        
        # Generate dataset info
        extractor.generate_dataset_info(unique_frames, args.input)
        
        logger.info(f"🎉 Frame extraction completed! {len(unique_frames)} unique frames extracted.")
        
    except Exception as e:
        logger.error(f"❌ Frame extraction failed: {e}")
        raise

if __name__ == "__main__":
    main()
