"""
Video analysis endpoints.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from service.schemas.analysis import AnalysisRequest, AnalysisResponse, PerformanceMetrics, AnalysisMetadata
from service.core.video_analyzer import BasketballVideoAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize video analyzer (singleton)
video_analyzer = None

def get_video_analyzer():
    """Get or create video analyzer instance."""
    global video_analyzer
    if video_analyzer is None:
        video_analyzer = BasketballVideoAnalyzer()
    return video_analyzer


@router.post("/", response_model=AnalysisResponse)
async def analyze_video(request: AnalysisRequest):
    """Analyze basketball video for performance metrics."""
    try:
        logger.info(f"🎬 Starting video analysis for video_id: {request.video_id}")
        
        # Get video analyzer instance
        analyzer = get_video_analyzer()
        
        # Perform video analysis
        results = analyzer.analyze_video(
            video_url=request.video_url,
            session_id=request.session_id,
            video_id=request.video_id,
            fps=request.fps
        )
        
        logger.info(f"✅ Video analysis completed for video_id: {request.video_id}")
        
        return AnalysisResponse(
            video_id=results["video_id"],
            session_id=results["session_id"],
            keypoints=results["keypoints"],
            detections=results["detections"],
            events=results["events"],
            performance_metrics=PerformanceMetrics(**results.get("performance_metrics", {})),
            metadata=AnalysisMetadata(**results.get("metadata", {})) if results.get("metadata") else None,
            status=results["status"]
        )
        
    except Exception as e:
        logger.error(f"❌ Video analysis failed for video_id {request.video_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {str(e)}"
        )
