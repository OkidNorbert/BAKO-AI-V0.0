#!/usr/bin/env python3
"""
Area-Specific Basketball Frame Extraction for YOLOv8 Training
============================================================

This script extracts frames specifically for each basketball area:
- Ball detection frames
- Player detection frames  
- Court line detection frames
- Hoop detection frames

Usage:
    python area_specific_extraction.py --input video.mp4 --output frames/ --areas ball,player,court_lines,hoop
"""

import os
import cv2
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import json
from datetime import datetime
import numpy as np

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AreaSpecificBasketballExtractor:
    """
    Extracts frames specifically for each basketball area to ensure balanced training data.
    """
    
    def __init__(self, output_dir: str = "training/datasets/basketball/area_frames"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Basketball areas and their characteristics (NOTE: These are defaults, actual max_frames will come from UI)
        self.basketball_areas = {
            "ball": {
                "description": "Basketball object",
                "color_range": [(0, 100, 100), (20, 255, 255)],  # Orange color range
                "size_range": (0.01, 0.1),  # Relative size range
                "motion_threshold": 0.05,  # Ball moves frequently
                "extraction_interval": 5  # Reduced to every 5th frame for ball
            },
            "player": {
                "description": "Basketball player",
                "color_range": None,  # Players have varied colors
                "size_range": (0.1, 0.4),  # Players are larger
                "motion_threshold": 0.1,  # Players move actively
                "extraction_interval": 10  # Reduced to every 10th frame for players
            },
            "court_lines": {
                "description": "Court boundary lines",
                "color_range": [(0, 0, 200), (180, 30, 255)],  # White/light colors
                "size_range": (0.05, 0.3),  # Lines can be various sizes
                "motion_threshold": 0.02,  # Lines are mostly static
                "extraction_interval": 25  # Reduced to every 25th frame for lines
            },
            "hoop": {
                "description": "Basketball hoop/rim",
                "color_range": [(0, 0, 0), (180, 255, 50)],  # Dark colors (rim)
                "size_range": (0.05, 0.2),  # Hoops are medium-sized
                "motion_threshold": 0.01,  # Hoops are static
                "extraction_interval": 50  # Reduced to every 50th frame for hoops
            }
        }
        
        # Create area-specific directories
        for area in self.basketball_areas.keys():
            (self.output_dir / area / "images").mkdir(parents=True, exist_ok=True)
            (self.output_dir / area / "labels").mkdir(parents=True, exist_ok=True)
    
    def extract_ball_frames(self, video_path: str, max_frames: int = 100) -> List[str]:
        """
        Extract frames that likely contain basketballs.
        Uses color detection to find orange basketballs.
        """
        logger.info(f"🏀 Extracting ball-specific frames from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
        
        extracted_frames = []
        frame_idx = 0
        ball_frames_found = 0
        
        # Orange color range for basketball detection
        lower_orange = np.array([0, 100, 100])
        upper_orange = np.array([20, 255, 255])
        
        while cap.isOpened() and ball_frames_found < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Extract every 15th frame for ball detection
            if frame_idx % 15 == 0:
                # Convert to HSV for better color detection
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                
                # Create mask for orange color (basketball)
                mask = cv2.inRange(hsv, lower_orange, upper_orange)
                
                # Count orange pixels
                orange_pixels = cv2.countNonZero(mask)
                total_pixels = frame.shape[0] * frame.shape[1]
                orange_ratio = orange_pixels / total_pixels
                
                # If significant orange detected, likely has basketball
                if orange_ratio > 0.0005:  # Lowered threshold to 0.05% of frame is orange
                    # Resize frame
                    frame_resized = cv2.resize(frame, (640, 640))
                    
                    # Save frame
                    frame_filename = f"ball_frame_{ball_frames_found:04d}.jpg"
                    frame_path = self.output_dir / "ball" / "images" / frame_filename
                    
                    cv2.imwrite(str(frame_path), frame_resized)
                    extracted_frames.append(str(frame_path))
                    ball_frames_found += 1
                    
                    if ball_frames_found % 10 == 0:
                        logger.info(f"🏀 Found {ball_frames_found} ball frames...")
            
            frame_idx += 1
        
        cap.release()
        logger.info(f"✅ Extracted {ball_frames_found} ball-specific frames")
        return extracted_frames
    
    def extract_player_frames(self, video_path: str, max_frames: int = 100) -> List[str]:
        """
        Extract frames that likely contain basketball players.
        Uses motion detection and size analysis.
        """
        logger.info(f"👤 Extracting player-specific frames from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
        
        # Initialize background subtractor for motion detection
        bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        
        extracted_frames = []
        frame_idx = 0
        player_frames_found = 0
        
        while cap.isOpened() and player_frames_found < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Extract every 20th frame for player detection
            if frame_idx % 20 == 0:
                # Convert to grayscale for motion detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Apply background subtraction
                fg_mask = bg_subtractor.apply(gray)
                
                # Find contours (potential players)
                contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                # Check for player-sized objects
                has_player = False
                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area > 1000:  # Minimum area for a player
                        x, y, w, h = cv2.boundingRect(contour)
                        aspect_ratio = h / w
                        
                        # Players typically have height > width
                        if aspect_ratio > 1.0 and area > 1500: # Slightly more lenient aspect ratio and smaller min area
                            has_player = True
                            break
                
                if has_player:
                    # Resize frame
                    frame_resized = cv2.resize(frame, (640, 640))
                    
                    # Save frame
                    frame_filename = f"player_frame_{player_frames_found:04d}.jpg"
                    frame_path = self.output_dir / "player" / "images" / frame_filename
                    
                    cv2.imwrite(str(frame_path), frame_resized)
                    extracted_frames.append(str(frame_path))
                    player_frames_found += 1
                    
                    if player_frames_found % 10 == 0:
                        logger.info(f"👤 Found {player_frames_found} player frames...")
            
            frame_idx += 1
        
        cap.release()
        logger.info(f"✅ Extracted {player_frames_found} player-specific frames")
        return extracted_frames
    
    def extract_court_line_frames(self, video_path: str, max_frames: int = 50) -> List[str]:
        """
        Extract frames that likely contain court lines.
        Uses edge detection and line detection.
        """
        logger.info(f"📏 Extracting court line-specific frames from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
        
        extracted_frames = []
        frame_idx = 0
        line_frames_found = 0
        
        while cap.isOpened() and line_frames_found < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Extract frames based on configured interval
            if frame_idx % self.basketball_areas["court_lines"]["extraction_interval"] == 0:
                # Convert to grayscale
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Apply edge detection
                edges = cv2.Canny(gray, 50, 150)
                
                # Detect lines using Hough transform
                lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=100, maxLineGap=10)
                
                # Count significant lines
                if lines is not None and len(lines) > 3:  # Lowered line count threshold slightly
                    # Resize frame
                    frame_resized = cv2.resize(frame, (640, 640))
                    
                    # Save frame
                    frame_filename = f"court_line_frame_{line_frames_found:04d}.jpg"
                    frame_path = self.output_dir / "court_lines" / "images" / frame_filename
                    
                    cv2.imwrite(str(frame_path), frame_resized)
                    extracted_frames.append(str(frame_path))
                    line_frames_found += 1
                    
                    if line_frames_found % 5 == 0:
                        logger.info(f"📏 Found {line_frames_found} court line frames...")
            
            frame_idx += 1
        
        cap.release()
        logger.info(f"✅ Extracted {line_frames_found} court line-specific frames")
        return extracted_frames
    
    def extract_hoop_frames(self, video_path: str, max_frames: int = 50) -> List[str]:
        """
        Extract frames that likely contain basketball hoops.
        Uses circle detection and dark object detection.
        """
        logger.info(f"🏀 Extracting hoop-specific frames from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"❌ Could not open video: {video_path}")
        
        extracted_frames = []
        frame_idx = 0
        hoop_frames_found = 0
        
        while cap.isOpened() and hoop_frames_found < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Extract frames based on configured interval
            if frame_idx % self.basketball_areas["hoop"]["extraction_interval"] == 0:
                # Convert to grayscale
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Detect circles (hoop rims)
                circles = cv2.HoughCircles(
                    gray, cv2.HOUGH_GRADIENT, 1, 20,
                    param1=50, param2=25, minRadius=15, maxRadius=80 # Adjusted parameters for better hoop detection
                )
                
                # Check for hoop-like structures
                has_hoop = False
                if circles is not None:
                    circles = np.round(circles[0, :]).astype("int")
                    for (x, y, r) in circles:
                        # Hoops are typically in upper portion of frame and reasonable size
                        if y < frame.shape[0] * 0.7 and r > 15 and r < 80: # Adjusted y-position and radius range
                            has_hoop = True
                            break
                
                if has_hoop:
                    # Resize frame
                    frame_resized = cv2.resize(frame, (640, 640))
                    
                    # Save frame
                    frame_filename = f"hoop_frame_{hoop_frames_found:04d}.jpg"
                    frame_path = self.output_dir / "hoop" / "images" / frame_filename
                    
                    cv2.imwrite(str(frame_path), frame_resized)
                    extracted_frames.append(str(frame_path))
                    hoop_frames_found += 1
                    
                    if hoop_frames_found % 5 == 0:
                        logger.info(f"🏀 Found {hoop_frames_found} hoop frames...")
            
            frame_idx += 1
        
        cap.release()
        logger.info(f"✅ Extracted {hoop_frames_found} hoop-specific frames")
        return extracted_frames
    
    def extract_all_areas(self, video_path: str, areas: List[str] = None, max_frames_per_area: int = 100) -> Dict[str, List[str]]:
        """
        Extract frames for all specified basketball areas.
        """
        if areas is None:
            areas = list(self.basketball_areas.keys())
        
        logger.info(f"🎬 Starting area-specific extraction for: {areas} (Max frames per area: {max_frames_per_area})")
        
        results = {}
        
        for area in areas:
            if area == "ball":
                results[area] = self.extract_ball_frames(video_path, max_frames=max_frames_per_area)
            elif area == "player":
                results[area] = self.extract_player_frames(video_path, max_frames=max_frames_per_area)
            elif area == "court_lines":
                results[area] = self.extract_court_line_frames(video_path, max_frames=max_frames_per_area)
            elif area == "hoop":
                results[area] = self.extract_hoop_frames(video_path, max_frames=max_frames_per_area)
        
        return results
    
    def create_annotation_templates(self, results: Dict[str, List[str]]) -> None:
        """
        Create annotation template files for each area.
        """
        logger.info("📝 Creating area-specific annotation templates...")
        
        for area, frame_paths in results.items():
            for frame_path in frame_paths:
                frame_name = Path(frame_path).stem
                label_path = self.output_dir / area / "labels" / f"{frame_name}.txt"
                
                # Create annotation template with area-specific guidance
                with open(label_path, 'w') as f:
                    f.write(f"# YOLO format: class_id x_center y_center width height\n")
                    f.write(f"# Area: {area}\n")
                    f.write(f"# Class mapping: 0=ball, 1=player, 2=court_lines, 3=hoop\n")
                    f.write(f"# All values normalized (0-1)\n\n")
                    
                    # Add area-specific annotation guidance
                    if area == "ball":
                        f.write("# Example ball annotation:\n")
                        f.write("# 0 0.5 0.3 0.1 0.1\n")
                    elif area == "player":
                        f.write("# Example player annotation:\n")
                        f.write("# 1 0.3 0.7 0.2 0.4\n")
                    elif area == "court_lines":
                        f.write("# Example court line annotation:\n")
                        f.write("# 2 0.5 0.8 0.8 0.1\n")
                    elif area == "hoop":
                        f.write("# Example hoop annotation:\n")
                        f.write("# 3 0.8 0.2 0.15 0.2\n")
        
        logger.info("✅ Annotation templates created for all areas")
    
    def generate_extraction_report(self, results: Dict[str, List[str]], video_path: str) -> None:
        """
        Generate a comprehensive extraction report.
        """
        report = {
            "extraction_date": datetime.now().isoformat(),
            "source_video": str(video_path),
            "extraction_type": "area_specific",
            "areas_extracted": list(results.keys()),
            "total_frames": sum(len(frames) for frames in results.values()),
            "area_breakdown": {area: len(frames) for area, frames in results.items()},
            "frame_dimensions": "640x640",
            "basketball_classes": {
                0: "ball",
                1: "player", 
                2: "court_lines",
                3: "hoop"
            }
        }
        
        report_path = self.output_dir / "extraction_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📊 Extraction report saved to {report_path}")
        
        # Print summary
        print("\n🏀 Area-Specific Basketball Frame Extraction Summary")
        print("=" * 60)
        print(f"📹 Source Video: {Path(video_path).name}")
        print(f"📊 Total Frames Extracted: {report['total_frames']}")
        print(f"📐 Frame Size: {report['frame_dimensions']}")
        print(f"📁 Output Directory: {self.output_dir}")
        
        print("\n🎯 Area Breakdown:")
        for area, count in report['area_breakdown'].items():
            print(f"   {area.replace('_', ' ').title()}: {count} frames")
        
        print("\n🏷️ Basketball Classes:")
        for class_id, class_name in report['basketball_classes'].items():
            print(f"   {class_id}: {class_name}")
        
        print("\n🚀 Next Steps:")
        print("1. Review extracted frames for each area")
        print("2. Annotate frames using LabelImg or similar tool")
        print("3. Combine all areas into unified dataset")
        print("4. Start YOLOv8 training")

def main():
    parser = argparse.ArgumentParser(description="Area-specific basketball frame extraction for YOLOv8 training")
    parser.add_argument("--input", "-i", required=True, help="Input video file path")
    parser.add_argument("--output", "-o", default="training/datasets/basketball/area_frames", help="Output directory")
    parser.add_argument("--areas", "-a", default="ball,player,court_lines,hoop", help="Comma-separated list of areas to extract")
    parser.add_argument("--max-frames", "-m", type=int, default=100, help="Maximum frames per area")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        logger.error(f"❌ Input video not found: {args.input}")
        return
    
    # Parse areas
    areas = [area.strip() for area in args.areas.split(',')]
    
    # Initialize extractor
    extractor = AreaSpecificBasketballExtractor(args.output)
    
    try:
        # Extract frames for all specified areas
        results = extractor.extract_all_areas(args.input, areas, args.max_frames)
        
        # Create annotation templates
        extractor.create_annotation_templates(results)
        
        # Generate extraction report
        extractor.generate_extraction_report(results, args.input)
        
        logger.info(f"🎉 Area-specific extraction completed!")
        logger.info(f"📊 Extracted frames for: {list(results.keys())}")
        
    except Exception as e:
        logger.error(f"❌ Area-specific extraction failed: {e}")
        raise

if __name__ == "__main__":
    main()
