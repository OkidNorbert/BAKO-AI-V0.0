"""
Video management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.video import Video
from app.models.user import User
from app.schemas.video import VideoUploadRequest, VideoUploadResponse

router = APIRouter()


@router.post("/upload-metadata", response_model=VideoUploadResponse)
async def upload_video_metadata(
    request: VideoUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create video record and return presigned upload URL."""
    # Create video record
    video = Video(
        session_id=request.session_id,
        filename=request.filename,
        file_size=request.size,
        status="uploading"
    )
    
    db.add(video)
    db.commit()
    db.refresh(video)
    
    # TODO: Generate presigned URL for MinIO
    presigned_url = f"http://minio:9000/basketball-videos/{video.id}/{request.filename}"
    
    return VideoUploadResponse(
        video_id=video.id,
        upload_url=presigned_url,
        expires_in=3600
    )


@router.post("/{video_id}/confirm-upload")
async def confirm_video_upload(
    video_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm video upload and trigger processing."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Update video status
    video.status = "uploaded"
    db.commit()
    
    # TODO: Enqueue processing job with Celery
    # process_video.delay(video.id, video.storage_url)
    
    return {"message": "Video upload confirmed, processing started"}
