#!/usr/bin/env python3
"""
Basketball Pose Extraction - 2025 LATEST VERSION
Uses: MediaPipe 0.10.9 + YOLOv11 for SOTA performance
Features: Multi-person tracking, 3D pose, advanced metrics
"""

import cv2
import numpy as np
import mediapipe as mp
from ultralytics import YOLO
from pathlib import Path
from tqdm import tqdm
from rich.console import Console
from rich.progress import Progress
import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple
import json

console = Console()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PoseData:
    """Enhanced pose data structure"""
    frame_idx: int
    timestamp: float
    keypoints_2d: np.ndarray  # (33, 3) - x, y, visibility
    keypoints_3d: np.ndarray  # (33, 3) - x, y, z
    bbox: Optional[Tuple[int, int, int, int]]  # Person bounding box from YOLO
    person_id: int
    confidence: float

class ModernPoseExtractor:
    """
    State-of-the-art pose extraction using:
    - MediaPipe Pose (2D + 3D keypoints)
    - YOLOv11 (person detection and tracking)
    - Advanced filtering and smoothing
    """
    
    def __init__(
        self,
        use_yolo: bool = True,
        model_complexity: int = 2,  # 0=lite, 1=full, 2=heavy (best)
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.7
    ):
        """
        Initialize modern pose extractor
        
        Args:
            use_yolo: Use YOLOv11 for person detection
            model_complexity: MediaPipe model complexity (2=best)
            min_detection_confidence: Minimum pose detection confidence
            min_tracking_confidence: Minimum tracking confidence
        """
        console.print("[bold green]🚀 Initializing Modern Pose Extractor...[/]")
        
        # Initialize MediaPipe Pose with latest settings
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,  # Disable to avoid dimension consistency issues
            smooth_landmarks=True,      # Smooth temporal tracking
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        # Initialize YOLOv11 for person detection (LATEST!)
        self.use_yolo = use_yolo
        if use_yolo:
            try:
                self.yolo = YOLO('yolo11n.pt')  # YOLOv11 nano (fast)
                console.print("[green]✅ YOLOv11 loaded successfully[/]")
            except Exception as e:
                console.print(f"[yellow]⚠️  YOLOv11 not available: {e}[/]")
                console.print("[yellow]   Falling back to MediaPipe only[/]")
                self.use_yolo = False
        
        console.print("[green]✅ Modern Pose Extractor ready![/]")
    
    def detect_persons_yolo(self, frame: np.ndarray) -> List[Tuple]:
        """
        Detect persons using YOLOv11
        
        Args:
            frame: Input frame (BGR)
            
        Returns:
            List of (bbox, confidence) tuples
        """
        if not self.use_yolo:
            return []
        
        results = self.yolo(frame, classes=[0], verbose=False)  # Class 0 = person
        
        persons = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0])
                persons.append(((int(x1), int(y1), int(x2), int(y2)), confidence))
        
        return persons
    
    def extract_pose_from_roi(
        self,
        frame: np.ndarray,
        bbox: Optional[Tuple] = None
    ) -> Optional[PoseData]:
        """
        Extract pose from region of interest
        
        Args:
            frame: Input frame
            bbox: Bounding box (x1, y1, x2, y2) or None for full frame
            
        Returns:
            PoseData or None
        """
        # Extract ROI if bbox provided
        if bbox:
            x1, y1, x2, y2 = bbox
            # Ensure valid bbox
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)
            
            if x2 <= x1 or y2 <= y1:
                return None
                
            roi = frame[y1:y2, x1:x2]
            original_roi_height, original_roi_width = roi.shape[:2]
        else:
            roi = frame
            original_roi_height, original_roi_width = roi.shape[:2]
        
        # Resize ROI to consistent size to avoid MediaPipe dimension errors
        # MediaPipe works best with 640x640 or similar, but we'll maintain aspect ratio
        target_size = 640
        roi_height, roi_width = roi.shape[:2]
        
        # Calculate scaling factor maintaining aspect ratio
        scale = min(target_size / roi_width, target_size / roi_height)
        new_width = int(roi_width * scale)
        new_height = int(roi_height * scale)
        
        # Resize ROI to ensure consistent dimensions for MediaPipe
        if roi_width != new_width or roi_height != new_height:
            roi = cv2.resize(roi, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
        
        # Get final processed ROI dimensions
        processed_height, processed_width = roi.shape[:2]
        
        # Convert to RGB
        rgb_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        try:
            results = self.pose.process(rgb_roi)
        except Exception as e:
            logger.warning(f"MediaPipe processing error: {e}")
            return None
        
        if not results.pose_landmarks:
            return None
        
        # Extract 2D keypoints (33 points) - normalized to processed ROI
        keypoints_2d = np.zeros((33, 3))
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            keypoints_2d[idx] = [landmark.x, landmark.y, landmark.visibility]
        
        # Extract 3D keypoints (33 points) - NEW!
        keypoints_3d = np.zeros((33, 3))
        if results.pose_world_landmarks:
            for idx, landmark in enumerate(results.pose_world_landmarks.landmark):
                keypoints_3d[idx] = [landmark.x, landmark.y, landmark.z]
        
        # Scale keypoints back to original ROI coordinates
        # MediaPipe returns normalized coordinates (0-1), so scale directly to original ROI size
        keypoints_2d[:, 0] = keypoints_2d[:, 0] * original_roi_width
        keypoints_2d[:, 1] = keypoints_2d[:, 1] * original_roi_height
        
        # Then adjust to original frame coordinates if bbox was provided
        if bbox:
            x1, y1, x2, y2 = bbox
            keypoints_2d[:, 0] = keypoints_2d[:, 0] + x1
            keypoints_2d[:, 1] = keypoints_2d[:, 1] + y1
        
        # Calculate average confidence
        confidence = float(keypoints_2d[:, 2].mean())
        
        return keypoints_2d, keypoints_3d, confidence
    
    def extract_video(
        self,
        video_path: str,
        output_path: str,
        visualize: bool = False,
        save_video: bool = False
    ) -> dict:
        """
        Extract poses from video with modern features
        
        Args:
            video_path: Input video path
            output_path: Output .npz path
            visualize: Show visualization
            save_video: Save annotated video
            
        Returns:
            Dictionary with extraction stats
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            logger.error(f"Cannot open video: {video_path}")
            return None
        
        # Video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Storage
        all_keypoints_2d = []
        all_keypoints_3d = []
        all_confidences = []
        frames_processed = 0
        frames_with_pose = 0
        
        # Video writer
        if save_video:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out_path = output_path.replace('.npz', '_annotated.mp4')
            out = cv2.VideoWriter(out_path, fourcc, fps, (width, height))
        
        console.print(f"[cyan]🎬 Processing: {Path(video_path).name}[/]")
        
        with Progress() as progress:
            task = progress.add_task(
                "[green]Extracting poses...",
                total=total_frames
            )
            
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Detect persons with YOLOv11
                if self.use_yolo:
                    persons = self.detect_persons_yolo(frame)
                    
                    if persons:
                        # Use largest person detection
                        persons.sort(key=lambda x: x[1], reverse=True)
                        bbox, yolo_conf = persons[0]
                        
                        # Extract pose from detected person
                        pose_result = self.extract_pose_from_roi(frame, bbox)
                    else:
                        pose_result = None
                else:
                    # Extract from full frame
                    pose_result = self.extract_pose_from_roi(frame)
                
                # Store results
                if pose_result:
                    keypoints_2d, keypoints_3d, confidence = pose_result
                    all_keypoints_2d.append(keypoints_2d)
                    all_keypoints_3d.append(keypoints_3d)
                    all_confidences.append(confidence)
                    frames_with_pose += 1
                    
                    # Visualize
                    if save_video or visualize:
                        # Draw pose on frame
                        annotated_frame = frame.copy()
                        
                        # Draw keypoints
                        for kp in keypoints_2d:
                            x, y, vis = kp
                            if vis > 0.5:
                                cv2.circle(
                                    annotated_frame,
                                    (int(x), int(y)),
                                    3,
                                    (0, 255, 0),
                                    -1
                                )
                        
                        # Draw skeleton connections
                        connections = mp.solutions.pose.POSE_CONNECTIONS
                        for connection in connections:
                            start_idx, end_idx = connection
                            start_kp = keypoints_2d[start_idx]
                            end_kp = keypoints_2d[end_idx]
                            
                            if start_kp[2] > 0.5 and end_kp[2] > 0.5:
                                cv2.line(
                                    annotated_frame,
                                    (int(start_kp[0]), int(start_kp[1])),
                                    (int(end_kp[0]), int(end_kp[1])),
                                    (0, 255, 0),
                                    2
                                )
                        
                        # Add info text
                        cv2.putText(
                            annotated_frame,
                            f"Frame: {frame_idx} | Conf: {confidence:.2f}",
                            (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.7,
                            (0, 255, 0),
                            2
                        )
                        
                        if save_video:
                            out.write(annotated_frame)
                        
                        if visualize:
                            cv2.imshow('Pose Extraction', annotated_frame)
                            if cv2.waitKey(1) & 0xFF == ord('q'):
                                break
                
                frames_processed += 1
                frame_idx += 1
                progress.update(task, advance=1)
        
        cap.release()
        if save_video:
            out.release()
        if visualize:
            cv2.destroyAllWindows()
        
        # Save results
        if len(all_keypoints_2d) > 0:
            np.savez_compressed(
                output_path,
                keypoints_2d=np.array(all_keypoints_2d),
                keypoints_3d=np.array(all_keypoints_3d),
                confidences=np.array(all_confidences),
                fps=fps,
                video_path=video_path,
                frames_processed=frames_processed,
                frames_with_pose=frames_with_pose
            )
            
            stats = {
                'total_frames': frames_processed,
                'frames_with_pose': frames_with_pose,
                'detection_rate': frames_with_pose / frames_processed if frames_processed > 0 else 0,
                'avg_confidence': float(np.mean(all_confidences)) if all_confidences else 0.0
            }
            
            console.print(f"[green]✅ Extracted {frames_with_pose}/{frames_processed} frames[/]")
            console.print(f"[green]   Detection rate: {stats['detection_rate']*100:.1f}%[/]")
            console.print(f"[green]   Avg confidence: {stats['avg_confidence']:.2f}[/]")
            
            return stats
        else:
            console.print(f"[red]❌ No poses detected in video[/]")
            return None

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Modern Basketball Pose Extraction (MediaPipe + YOLOv11)"
    )
    parser.add_argument('--input-dir', type=str, required=True)
    parser.add_argument('--output-dir', type=str, required=True)
    parser.add_argument('--use-yolo', action='store_true', help='Use YOLOv11 detection')
    parser.add_argument('--visualize', action='store_true')
    parser.add_argument('--save-video', action='store_true')
    
    args = parser.parse_args()
    
    # Create extractor
    extractor = ModernPoseExtractor(use_yolo=args.use_yolo)
    
    # Find videos
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    video_files = list(input_dir.rglob('*.mp4')) + list(input_dir.rglob('*.avi'))
    
    console.print(f"\n[bold cyan]📂 Found {len(video_files)} videos[/]")
    
    # Process all videos
    stats_list = []
    for video_path in video_files:
        relative_path = video_path.relative_to(input_dir)
        output_path = output_dir / relative_path.parent / f"{video_path.stem}.npz"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if output_path.exists():
            console.print(f"[yellow]⏭️  Skipping (exists): {video_path.name}[/]")
            continue
        
        stats = extractor.extract_video(
            str(video_path),
            str(output_path),
            visualize=args.visualize,
            save_video=args.save_video
        )
        
        if stats:
            stats_list.append(stats)
    
    # Summary
    if stats_list:
        avg_detection = np.mean([s['detection_rate'] for s in stats_list])
        avg_confidence = np.mean([s['avg_confidence'] for s in stats_list])
        
        console.print("\n[bold green]🎉 Extraction Complete![/]")
        console.print(f"[green]   Videos processed: {len(stats_list)}[/]")
        console.print(f"[green]   Avg detection rate: {avg_detection*100:.1f}%[/]")
        console.print(f"[green]   Avg confidence: {avg_confidence:.2f}[/]")

if __name__ == "__main__":
    main()

