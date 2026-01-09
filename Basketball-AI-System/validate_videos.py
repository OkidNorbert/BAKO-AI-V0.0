#!/usr/bin/env python3
"""
Video Validation Script
Validates recorded videos meet quality requirements
"""

import cv2
import os
import sys
from pathlib import Path


class VideoValidator:
    """Validates basketball shooting videos"""
    
    def __init__(self):
        self.min_width = 1280  # 720p minimum
        self.min_height = 720
        self.min_fps = 25
        self.min_duration = 3.0  # seconds
        self.max_duration = 15.0  # seconds
        
    def validate_video(self, video_path: str) -> dict:
        """
        Validate a single video file
        
        Returns:
            dict with validation results
        """
        result = {
            'path': video_path,
            'valid': True,
            'issues': [],
            'info': {}
        }
        
        # Check file exists
        if not os.path.exists(video_path):
            result['valid'] = False
            result['issues'].append('File not found')
            return result
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            result['valid'] = False
            result['issues'].append('Cannot open video file')
            return result
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        
        result['info'] = {
            'width': width,
            'height': height,
            'fps': fps,
            'frames': frame_count,
            'duration': duration
        }
        
        # Validate resolution
        if width < self.min_width or height < self.min_height:
            result['valid'] = False
            result['issues'].append(
                f'Resolution too low: {width}x{height} '
                f'(minimum: {self.min_width}x{self.min_height})'
            )
        
        # Validate FPS
        if fps < self.min_fps:
            result['valid'] = False
            result['issues'].append(
                f'FPS too low: {fps:.1f} (minimum: {self.min_fps})'
            )
        
        # Validate duration
        if duration < self.min_duration:
            result['valid'] = False
            result['issues'].append(
                f'Video too short: {duration:.1f}s (minimum: {self.min_duration}s)'
            )
        elif duration > self.max_duration:
            result['valid'] = False
            result['issues'].append(
                f'Video too long: {duration:.1f}s (maximum: {self.max_duration}s)'
            )
        
        # Check if video is horizontal
        if height > width:
            result['valid'] = False
            result['issues'].append('Video is vertical (should be horizontal)')
        
        cap.release()
        
        return result
    
    def validate_directory(self, directory: str) -> dict:
        """
        Validate all videos in a directory
        
        Returns:
            dict with summary results
        """
        video_extensions = ['.mp4', '.avi', '.mov', '.MP4', '.AVI', '.MOV']
        
        videos = []
        for ext in video_extensions:
            videos.extend(Path(directory).rglob(f'*{ext}'))
        
        results = {
            'total': len(videos),
            'valid': 0,
            'invalid': 0,
            'details': []
        }
        
        for video_path in videos:
            result = self.validate_video(str(video_path))
            results['details'].append(result)
            
            if result['valid']:
                results['valid'] += 1
            else:
                results['invalid'] += 1
        
        return results


def main():
    """Main validation function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Validate basketball shooting videos')
    parser.add_argument('path', help='Video file or directory to validate')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    validator = VideoValidator()
    
    if os.path.isfile(args.path):
        # Validate single file
        result = validator.validate_video(args.path)
        
        print(f"\n{'='*60}")
        print(f"Video: {result['path']}")
        print(f"{'='*60}")
        
        if result['valid']:
            print("✅ VALID")
        else:
            print("❌ INVALID")
        
        if 'info' in result:
            info = result['info']
            print(f"\nVideo Info:")
            print(f"  Resolution: {info['width']}x{info['height']}")
            print(f"  FPS: {info['fps']:.1f}")
            print(f"  Duration: {info['duration']:.1f}s")
            print(f"  Frames: {info['frames']}")
        
        if result['issues']:
            print(f"\nIssues:")
            for issue in result['issues']:
                print(f"  • {issue}")
        
        sys.exit(0 if result['valid'] else 1)
        
    elif os.path.isdir(args.path):
        # Validate directory
        results = validator.validate_directory(args.path)
        
        print(f"\n{'='*60}")
        print(f"Directory: {args.path}")
        print(f"{'='*60}")
        print(f"\nSummary:")
        print(f"  Total videos: {results['total']}")
        print(f"  ✅ Valid: {results['valid']}")
        print(f"  ❌ Invalid: {results['invalid']}")
        
        if args.verbose or results['invalid'] > 0:
            print(f"\nDetails:")
            for result in results['details']:
                status = "✅" if result['valid'] else "❌"
                print(f"\n{status} {os.path.basename(result['path'])}")
                
                if result['issues']:
                    for issue in result['issues']:
                        print(f"    • {issue}")
        
        sys.exit(0 if results['invalid'] == 0 else 1)
        
    else:
        print(f"❌ Error: {args.path} is not a file or directory")
        sys.exit(1)


if __name__ == "__main__":
    main()
