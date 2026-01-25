"""
Analysis Dispatcher - Routes analysis requests to appropriate pipelines.

This module dispatches video analysis jobs to either TEAM or PERSONAL
analysis pipelines based on the analysis_mode configuration.
"""
import os
import sys
import time
from typing import Dict, Any, Optional
from datetime import datetime

# Add parent dir to path for template imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.video import AnalysisMode


async def dispatch_analysis(video_path: str, mode: AnalysisMode, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Dispatch video analysis to the appropriate pipeline.
    
    Args:
        video_path: Path to the video file
        mode: Analysis mode (TEAM or PERSONAL)
        
    Returns:
        Dictionary containing analysis results
    """
    start_time = time.time()
    
    if mode == AnalysisMode.TEAM:
        from analysis.team_analysis import run_team_analysis
        result = await run_team_analysis(video_path, options=options)
    else:
        from analysis.personal_analysis import run_personal_analysis
        result = await run_personal_analysis(video_path, options=options)
    
    processing_time = time.time() - start_time
    
    return {
        **result,
        "processing_time_seconds": processing_time,
    }


def get_video_metrics(video_path: str) -> Dict[str, Any]:
    """
    Extract basic video metrics using OpenCV.
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Dictionary with fps, frame_count, duration, width, height
    """
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return {}
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0
        
        cap.release()
        
        return {
            "fps": fps,
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "duration_seconds": duration,
        }
    except Exception as e:
        print(f"Error extracting video metrics: {e}")
        return {}
