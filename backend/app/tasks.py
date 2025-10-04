"""
Background tasks for video processing and analysis.
"""

import logging
import requests
from typing import Dict, Any
from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.video import Video, VideoStatus

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def process_video(self, video_id: int, video_url: str) -> Dict[str, Any]:
    """
    Process a video file using AI service for analysis.
    
    Args:
        video_id: ID of the video record in database
        video_url: URL of the video file in storage
    
    Returns:
        Dict with processing results
    """
    db = SessionLocal()
    video = None
    
    try:
        # Update video status to processing
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise ValueError(f"Video with ID {video_id} not found")
        
        video.status = VideoStatus.PROCESSING
        db.commit()
        
        logger.info(f"🎬 Starting video processing for video_id: {video_id}")
        
        # Call AI service for video analysis
        self.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Calling AI service..."}
        )
        
        try:
            # Call AI service
            ai_service_url = f"{settings.AI_SERVICE_URL}/api/v1/analyze"
            analysis_request = {
                "video_url": video_url,
                "session_id": video.session_id,
                "video_id": video_id,
                "fps": 10
            }
            
            logger.info(f"🤖 Calling AI service: {ai_service_url}")
            response = requests.post(ai_service_url, json=analysis_request, timeout=300)
            response.raise_for_status()
            
            analysis_results = response.json()
            
            # Store results in database
            video.analysis_results = analysis_results
            video.status = VideoStatus.COMPLETED
            db.commit()
            
            logger.info(f"✅ Video processing completed for video_id: {video_id}")
            
            return {
                "video_id": video_id,
                "status": "completed",
                "analysis_results": analysis_results
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ AI service call failed: {e}")
            video.status = VideoStatus.FAILED
            db.commit()
            raise Exception(f"AI service call failed: {e}")
        
        except Exception as e:
            logger.error(f"❌ Video processing failed: {e}")
            video.status = VideoStatus.FAILED
            db.commit()
            raise
            
    except Exception as e:
        logger.error(f"❌ Error processing video {video_id}: {str(e)}")
        
        # Update video status to failed
        if video:
            video.status = VideoStatus.FAILED
            db.commit()
        
        raise self.retry(exc=e, countdown=60, max_retries=3)
    
    finally:
        db.close()


@celery_app.task
def cleanup_old_videos():
    """Clean up old video files and database records."""
    # TODO: Implement cleanup logic
    logger.info("🧹 Video cleanup task executed")
    return {"status": "completed", "message": "Cleanup completed"}