#!/usr/bin/env python3
"""
Batch Video Processing for YOLOv8 Training
===========================================

This script processes multiple basketball videos simultaneously to extract frames
for YOLOv8 training dataset creation.

Usage:
    python batch_video_processing.py --videos video1.mp4 video2.mp4 video3.mp4 --strategy uniform --interval 30
    python batch_video_processing.py --input-dir videos/ --strategy all --parallel
"""

import os
import cv2
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
import multiprocessing
from extract_frames import BasketballFrameExtractor

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BatchVideoProcessor:
    """
    Processes multiple videos simultaneously for YOLOv8 training dataset creation.
    """
    
    def __init__(self, output_dir: str = "training/datasets/basketball/batch_frames"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.basketball_classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
        logger.info(f"🎬 Batch Video Processor initialized")
        logger.info(f"Output directory: {self.output_dir}")
    
    def process_single_video(self, video_path: str, strategy: str = "uniform", 
                            interval: int = 30, num_frames: int = 100, 
                            motion_threshold: float = 0.1) -> Dict[str, Any]:
        """
        Process a single video and extract frames.
        
        Args:
            video_path: Path to video file
            strategy: Extraction strategy
            interval: Frame interval for uniform extraction
            num_frames: Number of frames for temporal extraction
            motion_threshold: Motion threshold for motion extraction
            
        Returns:
            Dictionary with processing results
        """
        video_name = Path(video_path).stem
        video_output_dir = self.output_dir / video_name
        video_output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"🎬 Processing: {video_name}")
        
        try:
            # Create extractor for this video
            extractor = BasketballFrameExtractor(str(video_output_dir))
            
            all_extracted_frames = []
            
            # Extract frames based on strategy
            if strategy in ["uniform", "all"]:
                frames = extractor.extract_frames_uniform(video_path, interval)
                all_extracted_frames.extend(frames)
                
            if strategy in ["temporal", "all"]:
                frames = extractor.extract_frames_temporal(video_path, num_frames)
                all_extracted_frames.extend(frames)
                
            if strategy in ["motion", "all"]:
                frames = extractor.extract_frames_motion(video_path, motion_threshold)
                all_extracted_frames.extend(frames)
                
            if strategy in ["key_moments", "all"]:
                frames = extractor.extract_frames_key_moments(video_path)
                all_extracted_frames.extend(frames)
            
            # Remove duplicates
            unique_frames = list(set(all_extracted_frames))
            
            # Create annotation templates
            extractor.create_annotation_template(unique_frames)
            
            result = {
                "video": video_name,
                "path": video_path,
                "status": "success",
                "frames_extracted": len(unique_frames),
                "output_dir": str(video_output_dir),
                "frames": [str(Path(f).name) for f in unique_frames]
            }
            
            logger.info(f"✅ Completed: {video_name} ({len(unique_frames)} frames)")
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to process {video_name}: {e}")
            return {
                "video": video_name,
                "path": video_path,
                "status": "error",
                "error": str(e)
            }
    
    def process_videos_sequential(self, video_paths: List[str], **kwargs) -> List[Dict[str, Any]]:
        """
        Process videos sequentially (one after another).
        
        Args:
            video_paths: List of video file paths
            **kwargs: Frame extraction parameters
            
        Returns:
            List of processing results
        """
        logger.info(f"📹 Processing {len(video_paths)} videos sequentially...")
        
        results = []
        for i, video_path in enumerate(video_paths, 1):
            logger.info(f"Processing video {i}/{len(video_paths)}: {Path(video_path).name}")
            result = self.process_single_video(video_path, **kwargs)
            results.append(result)
        
        return results
    
    def process_videos_parallel(self, video_paths: List[str], max_workers: int = None, **kwargs) -> List[Dict[str, Any]]:
        """
        Process videos in parallel (simultaneously).
        
        Args:
            video_paths: List of video file paths
            max_workers: Maximum number of worker processes (default: CPU count)
            **kwargs: Frame extraction parameters
            
        Returns:
            List of processing results
        """
        if max_workers is None:
            max_workers = min(multiprocessing.cpu_count(), len(video_paths))
        
        logger.info(f"📹 Processing {len(video_paths)} videos in parallel using {max_workers} workers...")
        
        results = []
        
        # Use ThreadPoolExecutor for I/O-bound operations
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all video processing tasks
            future_to_video = {
                executor.submit(self.process_single_video, video_path, **kwargs): video_path
                for video_path in video_paths
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_video):
                video_path = future_to_video[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"❌ Error processing {video_path}: {e}")
                    results.append({
                        "video": Path(video_path).name,
                        "path": video_path,
                        "status": "error",
                        "error": str(e)
                    })
        
        # Sort results by video name for consistent output
        results.sort(key=lambda x: x["video"])
        
        return results
    
    def generate_batch_report(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate comprehensive batch processing report.
        
        Args:
            results: List of processing results
            
        Returns:
            Batch processing report
        """
        successful = [r for r in results if r["status"] == "success"]
        failed = [r for r in results if r["status"] == "error"]
        
        total_frames = sum(r.get("frames_extracted", 0) for r in successful)
        
        report = {
            "batch_date": datetime.now().isoformat(),
            "total_videos": len(results),
            "successful": len(successful),
            "failed": len(failed),
            "total_frames_extracted": total_frames,
            "success_rate": len(successful) / len(results) if results else 0,
            "video_results": results,
            "basketball_classes": self.basketball_classes,
            "output_directory": str(self.output_dir)
        }
        
        report_path = self.output_dir / "batch_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📊 Batch report saved to {report_path}")
        
        return report
    
    def print_batch_summary(self, report: Dict[str, Any]) -> None:
        """
        Print batch processing summary.
        
        Args:
            report: Batch processing report
        """
        print("\n🎬 Batch Video Processing Summary")
        print("=" * 60)
        print(f"📹 Total Videos: {report['total_videos']}")
        print(f"✅ Successful: {report['successful']}")
        print(f"❌ Failed: {report['failed']}")
        print(f"📊 Total Frames Extracted: {report['total_frames_extracted']}")
        print(f"📈 Success Rate: {report['success_rate']:.1%}")
        
        print("\n🎯 Per-Video Results:")
        for result in report['video_results']:
            status_icon = "✅" if result['status'] == 'success' else "❌"
            print(f"   {status_icon} {result['video']}: ", end="")
            if result['status'] == 'success':
                print(f"{result.get('frames_extracted', 0)} frames")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
        
        print(f"\n📁 Output Directory: {report['output_directory']}")
        print(f"🏷️  Basketball Classes: {list(self.basketball_classes.values())}")
        
        print("\n🚀 Next Steps:")
        print("1. Review extracted frames in the output directory")
        print("2. Annotate frames using LabelImg or similar tool")
        print("3. Run the training script: python train_basketball_yolo.py")
        print("\n💡 Tip: Use the generated annotations as templates for your labeling")

def main():
    parser = argparse.ArgumentParser(
        description="Batch process multiple basketball videos for YOLOv8 training"
    )
    
    # Input options
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--videos", "-v", nargs='+', help="Video file paths")
    input_group.add_argument("--input-dir", "-d", help="Directory containing videos")
    
    # Processing options
    parser.add_argument("--strategy", "-s", 
                       choices=["uniform", "temporal", "motion", "key_moments", "all"], 
                       default="uniform",
                       help="Frame extraction strategy")
    parser.add_argument("--parallel", "-p", action="store_true",
                       help="Process videos in parallel (simultaneously)")
    parser.add_argument("--max-workers", "-w", type=int,
                       help="Maximum number of parallel workers")
    
    # Frame extraction parameters
    parser.add_argument("--interval", type=int, default=30,
                       help="Frame interval for uniform extraction")
    parser.add_argument("--num-frames", type=int, default=100,
                       help="Number of frames for temporal extraction")
    parser.add_argument("--motion-threshold", type=float, default=0.1,
                       help="Motion threshold for motion extraction")
    
    # Output options
    parser.add_argument("--output", "-o", 
                       default="training/datasets/basketball/batch_frames",
                       help="Output directory")
    
    args = parser.parse_args()
    
    # Get list of video files
    video_paths = []
    
    if args.videos:
        video_paths = args.videos
    elif args.input_dir:
        input_dir = Path(args.input_dir)
        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv'}
        for ext in video_extensions:
            video_paths.extend(list(input_dir.glob(f"*{ext}")))
            video_paths.extend(list(input_dir.glob(f"*{ext.upper()}")))
    
    if not video_paths:
        logger.error("❌ No video files found!")
        return
    
    logger.info(f"📹 Found {len(video_paths)} video files to process")
    
    # Validate video files exist
    valid_videos = []
    for video_path in video_paths:
        if os.path.exists(video_path):
            valid_videos.append(video_path)
        else:
            logger.warning(f"⚠️ Video not found: {video_path}")
    
    if not valid_videos:
        logger.error("❌ No valid video files found!")
        return
    
    # Initialize processor
    processor = BatchVideoProcessor(args.output)
    
    try:
        # Process videos
        if args.parallel:
            results = processor.process_videos_parallel(
                valid_videos,
                max_workers=args.max_workers,
                strategy=args.strategy,
                interval=args.interval,
                num_frames=args.num_frames,
                motion_threshold=args.motion_threshold
            )
        else:
            results = processor.process_videos_sequential(
                valid_videos,
                strategy=args.strategy,
                interval=args.interval,
                num_frames=args.num_frames,
                motion_threshold=args.motion_threshold
            )
        
        # Generate report
        report = processor.generate_batch_report(results)
        
        # Print summary
        processor.print_batch_summary(report)
        
        logger.info(f"🎉 Batch processing completed!")
        
    except Exception as e:
        logger.error(f"❌ Batch processing failed: {e}")
        raise

if __name__ == "__main__":
    main()

