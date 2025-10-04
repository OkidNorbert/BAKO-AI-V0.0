"""
Video upload and management endpoints.
"""

import os
import uuid
from datetime import timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.storage import storage_manager
from app.core.config import settings
from app.models.user import User
from app.models.video import Video, VideoStatus
from app.models.session import TrainingSession
from app.schemas.video import VideoUploadRequest, VideoUploadResponse, VideoConfirmRequest
from app.tasks import process_video

router = APIRouter()

@router.post("/upload-metadata", response_model=VideoUploadResponse)
async def get_upload_metadata(
    request: VideoUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get presigned URL for video upload.
    
    Creates a video record in the database and returns a presigned URL
    for uploading the video file to MinIO storage.
    """
    try:
        # Validate session exists
        session = db.query(TrainingSession).filter(
            TrainingSession.id == request.session_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Training session not found"
            )
        
        # Generate unique object name
        file_extension = os.path.splitext(request.filename)[1]
        object_name = f"videos/{request.session_id}/{uuid.uuid4()}{file_extension}"
        
        # Create video record in database
        video = Video(
            session_id=request.session_id,
            filename=request.filename,
            file_size=request.size,
            storage_url=object_name,
            status=VideoStatus.UPLOADING
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
        # Generate presigned upload URL
        upload_url = storage_manager.generate_presigned_upload_url(
            object_name,
            expires=timedelta(hours=1)
        )
        
        return VideoUploadResponse(
            video_id=video.id,
            upload_url=upload_url,
            object_name=object_name,
            expires_in=3600  # 1 hour in seconds
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating upload metadata: {str(e)}"
        )

@router.post("/{video_id}/confirm-upload")
async def confirm_upload(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm video upload and start processing.
    
    Updates the video status to 'uploaded' and enqueues a background
    task to process the video.
    """
    try:
        # Get video record
        video = db.query(Video).filter(Video.id == video_id).first()
        
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        if video.status != VideoStatus.UPLOADING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Video is not in uploading status"
            )
        
        # Verify file exists in storage
        if not storage_manager.object_exists(video.storage_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Video file not found in storage"
            )
        
        # Update video status
        video.status = VideoStatus.UPLOADED
        db.commit()
        
        # Generate download URL for processing
        video_url = storage_manager.generate_presigned_download_url(
            video.storage_url,
            expires=timedelta(hours=24)
        )
        
        # Enqueue processing task
        task = process_video.delay(video_id, video_url)
        
        return {
            "video_id": video_id,
            "status": "uploaded",
            "task_id": task.id,
            "message": "Video upload confirmed and processing started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error confirming upload: {str(e)}"
        )

@router.get("/{video_id}/status")
async def get_video_status(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get video processing status."""
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        return {
            "video_id": video_id,
            "status": video.status.value,
            "filename": video.filename,
            "file_size": video.file_size,
            "created_at": video.created_at,
            "analysis_result": video.analysis_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting video status: {str(e)}"
        )

@router.get("/{video_id}/download-url")
async def get_download_url(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get presigned download URL for a video."""
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        if not video.storage_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Video file not available"
            )
        
        download_url = storage_manager.generate_presigned_download_url(
            video.storage_url,
            expires=timedelta(hours=1)
        )
        
        return {
            "video_id": video_id,
            "download_url": download_url,
            "expires_in": 3600
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating download URL: {str(e)}"
        )