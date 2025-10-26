#!/usr/bin/env python3
"""
Batch Area-Specific Basketball Frame Extraction for YOLOv8 Training
=====================================================================

This script processes MULTIPLE videos and extracts frames specifically for each basketball area:
- Ball detection frames
- Player detection frames  
- Court line detection frames
- Hoop detection frames

Processes multiple videos in parallel for faster extraction!

Usage:
    python batch_area_extraction.py --input-dir videos/ --areas ball,player --parallel
    python batch_area_extraction.py --videos video1.mp4 video2.mp4 --areas all --parallel
"""

import os
import cv2
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing
from area_specific_extraction import AreaSpecificBasketballExtractor
import numpy as np

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BatchAreaSpecificExtractor:
    """
    Processes MULTIPLE videos simultaneously to extract area-specific frames.
    """
    
    def __init__(self, output_dir: str = "training/datasets/basketball/batch_area_frames"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.basketball_areas = {
            "ball": {"description": "Basketball object"},
            "player": {"description": "Basketball player"},
            "court_lines": {"description": "Court boundary lines"},
            "hoop": {"description": "Basketball hoop/rim"}
        }
        
        logger.info(f"🎬 Batch Area-Specific Extractor initialized")
        logger.info(f"Output directory: {self.output_dir}")
    
    def extract_single_video_areas(self, video_path: str, areas: List[str], max_frames: int = 100) -> Dict[str, Any]:
        """
        Extract area-specific frames from a single video.
        
        Args:
            video_path: Path to video file
            areas: List of areas to extract (ball, player, court_lines, hoop)
            max_frames: Maximum frames per area
            
        Returns:
            Dictionary with extraction results
        """
        video_name = Path(video_path).stem
        logger.info(f"🎬 Processing video: {video_name}")
        
        try:
            # Create extractor for this video
            video_output_dir = self.output_dir / video_name
            extractor = AreaSpecificBasketballExtractor(str(video_output_dir))
            
            # Extract frames for all specified areas
            results = extractor.extract_all_areas(video_path, areas)
            
            # Create annotation templates
            extractor.create_annotation_templates(results)
            
            # Generate extraction report for this video
            report_path = extractor.output_dir / f"extraction_report_{video_name}.json"
            self._save_video_report(video_name, video_path, results, str(report_path))
            
            result = {
                "video": video_name,
                "path": video_path,
                "status": "success",
                "areas_extracted": list(results.keys()),
                "total_frames": sum(len(frames) for frames in results.values()),
                "area_breakdown": {area: len(frames) for area, frames in results.items()},
                "output_dir": str(video_output_dir)
            }
            
            logger.info(f"✅ Completed: {video_name} ({result['total_frames']} frames)")
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to process {video_name}: {e}")
            return {
                "video": video_name,
                "path": video_path,
                "status": "error",
                "error": str(e)
            }
    
    def _save_video_report(self, video_name: str, video_path: str, results: Dict[str, List[str]], report_path: str):
        """Save extraction report for a single video."""
        report = {
            "video_name": video_name,
            "source_video": str(video_path),
            "extraction_date": datetime.now().isoformat(),
            "extraction_type": "area_specific",
            "areas_extracted": list(results.keys()),
            "total_frames": sum(len(frames) for frames in results.values()),
            "area_breakdown": {area: len(frames) for area, frames in results.items()},
            "frame_dimensions": "640x640",
            "basketball_classes": {0: "ball", 1: "player", 2: "court_lines", 3: "hoop"}
        }
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
    
    def process_videos_sequential(self, video_paths: List[str], areas: List[str], max_frames: int = 100) -> List[Dict[str, Any]]:
        """
        Process videos sequentially (one after another).
        
        Args:
            video_paths: List of video file paths
            areas: List of areas to extract
            max_frames: Maximum frames per area per video
            
        Returns:
            List of processing results
        """
        logger.info(f"📹 Processing {len(video_paths)} videos sequentially for areas: {areas}")
        
        results = []
        for i, video_path in enumerate(video_paths, 1):
            logger.info(f"Processing video {i}/{len(video_paths)}: {Path(video_path).name}")
            result = self.extract_single_video_areas(video_path, areas, max_frames)
            results.append(result)
        
        return results
    
    def process_videos_parallel(self, video_paths: List[str], areas: List[str], 
                                max_frames: int = 100, max_workers: int = None) -> List[Dict[str, Any]]:
        """
        Process videos in parallel (simultaneously) for area-specific extraction.
        
        Args:
            video_paths: List of video file paths
            areas: List of areas to extract
            max_frames: Maximum frames per area per video
            max_workers: Maximum number of worker processes
            
        Returns:
            List of processing results
        """
        if max_workers is None:
            max_workers = min(multiprocessing.cpu_count(), len(video_paths))
        
        logger.info(f"📹 Processing {len(video_paths)} videos in parallel for areas: {areas}")
        logger.info(f"Using {max_workers} workers")
        
        results = []
        
        # Use ThreadPoolExecutor for I/O-bound operations
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all video processing tasks
            future_to_video = {
                executor.submit(self.extract_single_video_areas, video_path, areas, max_frames): video_path
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
        
        # Sort results by video name
        results.sort(key=lambda x: x["video"])
        
        return results
    
    def generate_batch_report(self, results: List[Dict[str, Any]], areas: List[str]) -> Dict[str, Any]:
        """
        Generate comprehensive batch processing report for area-specific extraction.
        """
        successful = [r for r in results if r["status"] == "success"]
        failed = [r for r in results if r["status"] == "error"]
        
        # Aggregate statistics
        total_frames = sum(r.get("total_frames", 0) for r in successful)
        
        # Aggregate by area
        area_totals = {}
        for area in areas:
            area_totals[area] = sum(
                r.get("area_breakdown", {}).get(area, 0) for r in successful
            )
        
        report = {
            "batch_date": datetime.now().isoformat(),
            "total_videos": len(results),
            "successful": len(successful),
            "failed": len(failed),
            "areas_requested": areas,
            "total_frames_extracted": total_frames,
            "area_totals": area_totals,
            "success_rate": len(successful) / len(results) if results else 0,
            "video_results": results,
            "basketball_classes": {0: "ball", 1: "player", 2: "court_lines", 3: "hoop"},
            "output_directory": str(self.output_dir)
        }
        
        report_path = self.output_dir / "batch_area_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📊 Batch area report saved to {report_path}")
        
        return report
    
    def print_batch_summary(self, report: Dict[str, Any]) -> None:
        """
        Print batch processing summary for area-specific extraction.
        """
        print("\n🎯 Batch Area-Specific Extraction Summary")
        print("=" * 60)
        print(f"📹 Total Videos: {report['total_videos']}")
        print(f"✅ Successful: {report['successful']}")
        print(f"❌ Failed: {report['failed']}")
        print(f"📊 Total Frames Extracted: {report['total_frames_extracted']}")
        print(f"📈 Success Rate: {report['success_rate']:.1%}")
        
        print("\n🎯 Areas Requested:")
        for area in report['areas_requested']:
            print(f"   - {area.replace('_', ' ').title()}")
        
        print("\n📊 Frames Per Area:")
        for area, count in report['area_totals'].items():
            print(f"   {area.replace('_', ' ').title()}: {count} frames")
        
        print("\n🎯 Per-Video Results:")
        for result in report['video_results']:
            status_icon = "✅" if result['status'] == 'success' else "❌"
            print(f"   {status_icon} {result['video']}: ", end="")
            if result['status'] == 'success':
                print(f"{result.get('total_frames', 0)} frames ({', '.join(result.get('areas_extracted', []))})")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
        
        print(f"\n📁 Output Directory: {report['output_directory']}")
        print(f"🏷️  Basketball Classes: {report['basketball_classes']}")
        
        print("\n🚀 Next Steps:")
        print("1. Review extracted frames in the output directory")
        print("2. Annotate frames using LabelImg or similar tool")
        print("3. Run the training script: python train_basketball_yolo.py")

def main():
    parser = argparse.ArgumentParser(
        description="Batch process multiple basketball videos for area-specific frame extraction"
    )
    
    # Input options
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--videos", "-v", nargs='+', help="Video file paths")
    input_group.add_argument("--input-dir", "-d", help="Directory containing videos")
    
    # Processing options
    parser.add_argument("--areas", "-a", default="ball,player,court_lines,hoop",
                       help="Comma-separated list of areas to extract")
    parser.add_argument("--parallel", "-p", action="store_true",
                       help="Process videos in parallel (simultaneously)")
    parser.add_argument("--max-workers", "-w", type=int,
                       help="Maximum number of parallel workers")
    parser.add_argument("--max-frames", "-m", type=int, default=100,
                       help="Maximum frames per area per video")
    
    # Output options
    parser.add_argument("--output", "-o",
                       default="training/datasets/basketball/batch_area_frames",
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
    
    # Validate video files
    valid_videos = []
    for video_path in video_paths:
        if os.path.exists(video_path):
            valid_videos.append(video_path)
        else:
            logger.warning(f"⚠️ Video not found: {video_path}")
    
    if not valid_videos:
        logger.error("❌ No valid video files found!")
        return
    
    # Parse areas
    areas = [area.strip() for area in args.areas.split(',')]
    
    # Validate areas
    valid_areas = []
    for area in areas:
        if area in ['ball', 'player', 'court_lines', 'hoop', 'all']:
            if area == 'all':
                valid_areas = ['ball', 'player', 'court_lines', 'hoop']
                break
            valid_areas.append(area)
        else:
            logger.warning(f"⚠️ Unknown area: {area}")
    
    if not valid_areas:
        logger.error("❌ No valid areas specified!")
        return
    
    logger.info(f"🎯 Extracting frames for areas: {valid_areas}")
    
    # Initialize processor
    processor = BatchAreaSpecificExtractor(args.output)
    
    try:
        # Process videos
        if args.parallel:
            results = processor.process_videos_parallel(
                valid_videos,
                valid_areas,
                max_frames=args.max_frames,
                max_workers=args.max_workers
            )
        else:
            results = processor.process_videos_sequential(
                valid_videos,
                valid_areas,
                max_frames=args.max_frames
            )
        
        # Generate report
        report = processor.generate_batch_report(results, valid_areas)
        
        # Print summary
        processor.print_batch_summary(report)
        
        logger.info(f"🎉 Batch area-specific extraction completed!")
        
    except Exception as e:
        logger.error(f"❌ Batch area-specific extraction failed: {e}")
        raise

if __name__ == "__main__":
    main()

