#!/usr/bin/env python3
"""
Basketball Pose Extraction - MediaPipe Implementation
Extracts 33 keypoints from basketball action videos
Computes motion features: angles, velocity, trajectory
"""

import cv2
import numpy as np
import mediapipe as mp
import os
import argparse
from pathlib import Path
from tqdm import tqdm
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BasketballPoseExtractor:
    """Extract pose keypoints from basketball videos using MediaPipe"""
    
    def __init__(self, confidence_threshold=0.5):
        """
        Initialize MediaPipe Pose
        
        Args:
            confidence_threshold: Minimum detection confidence
        """
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,  # Best accuracy
            enable_segmentation=False,
            min_detection_confidence=confidence_threshold,
            min_tracking_confidence=confidence_threshold
        )
        
        logger.info("✅ MediaPipe Pose initialized")
    
    def extract_video(self, video_path, output_path, visualize=False):
        """
        Extract keypoints from a single video
        
        Args:
            video_path: Path to input video
            output_path: Path to save keypoints (.npz)
            visualize: If True, save visualization video
            
        Returns:
            keypoints_array: (T, 33, 4) array of keypoints
        """
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            logger.error(f"❌ Cannot open video: {video_path}")
            return None
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        keypoints_list = []
        frames_list = []
        
        # Setup video writer if visualizing
        if visualize:
            viz_path = output_path.replace('.npz', '_viz.mp4')
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(viz_path, fourcc, fps, (width, height))
        
        frame_idx = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                # Extract keypoints
                keypoints = np.zeros((33, 4))
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    keypoints[idx] = [
                        landmark.x,
                        landmark.y,
                        landmark.z,
                        landmark.visibility
                    ]
                keypoints_list.append(keypoints)
                
                # Visualize if requested
                if visualize:
                    self.mp_drawing.draw_landmarks(
                        frame,
                        results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS
                    )
                    out.write(frame)
            
            frame_idx += 1
        
        cap.release()
        if visualize:
            out.release()
        
        if len(keypoints_list) == 0:
            logger.warning(f"⚠️  No pose detected in {video_path}")
            return None
        
        # Convert to numpy array
        keypoints_array = np.array(keypoints_list)
        
        # Save to .npz file
        np.savez_compressed(
            output_path,
            keypoints=keypoints_array,
            fps=fps,
            video_path=str(video_path)
        )
        
        logger.info(f"✅ Extracted {len(keypoints_array)} frames → {output_path}")
        
        return keypoints_array
    
    def process_directory(self, input_dir, output_dir, visualize=False):
        """
        Process all videos in directory
        
        Args:
            input_dir: Directory containing videos
            output_dir: Directory to save keypoints
            visualize: If True, save visualization videos
        """
        input_dir = Path(input_dir)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Find all video files
        video_extensions = ['.mp4', '.mov', '.avi', '.MP4', '.MOV', '.AVI']
        video_files = []
        
        for ext in video_extensions:
            video_files.extend(input_dir.rglob(f'*{ext}'))
        
        logger.info(f"📂 Found {len(video_files)} videos in {input_dir}")
        
        successful = 0
        failed = 0
        
        for video_path in tqdm(video_files, desc="Extracting poses"):
            # Determine output path maintaining directory structure
            relative_path = video_path.relative_to(input_dir)
            output_path = output_dir / relative_path.parent / f"{video_path.stem}.npz"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Skip if already processed
            if output_path.exists():
                logger.info(f"⏭️  Skipping (already processed): {video_path.name}")
                continue
            
            # Extract keypoints
            result = self.extract_video(
                str(video_path),
                str(output_path),
                visualize=visualize
            )
            
            if result is not None:
                successful += 1
            else:
                failed += 1
        
        logger.info(f"\n🎉 Processing complete!")
        logger.info(f"   Successful: {successful}")
        logger.info(f"   Failed: {failed}")
        logger.info(f"   Total: {len(video_files)}")

def main():
    parser = argparse.ArgumentParser(
        description="Extract pose keypoints from basketball videos"
    )
    parser.add_argument(
        '--input-dir',
        type=str,
        required=True,
        help='Directory containing videos'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        required=True,
        help='Directory to save keypoints'
    )
    parser.add_argument(
        '--confidence',
        type=float,
        default=0.5,
        help='Minimum detection confidence (0-1)'
    )
    parser.add_argument(
        '--visualize',
        action='store_true',
        help='Save visualization videos'
    )
    
    args = parser.parse_args()
    
    logger.info("🏀 Basketball Pose Extraction Pipeline")
    logger.info(f"   Input: {args.input_dir}")
    logger.info(f"   Output: {args.output_dir}")
    logger.info(f"   Confidence: {args.confidence}")
    logger.info(f"   Visualize: {args.visualize}")
    
    # Create extractor
    extractor = BasketballPoseExtractor(confidence_threshold=args.confidence)
    
    # Process all videos
    extractor.process_directory(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        visualize=args.visualize
    )

if __name__ == "__main__":
    main()

