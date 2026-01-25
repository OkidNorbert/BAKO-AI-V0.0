"""
Analysis API endpoints for triggering and retrieving video analysis.
"""
import asyncio
from uuid import uuid4
from datetime import datetime
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
import anyio

from app.dependencies import (
    get_current_user,
    require_team_account,
    require_personal_account,
    get_supabase,
)
from app.models.video import VideoStatus, AnalysisMode
from app.models.analysis import (
    AnalysisRequest,
    AnalysisResult,
    PersonalAnalysisResult,
    Detection,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()


def _run_dispatch_in_thread(video_path: str, mode: AnalysisMode):
    """Run async dispatch in a dedicated thread event loop."""
    from analysis.dispatcher import dispatch_analysis
    return asyncio.run(dispatch_analysis(video_path, mode))


async def run_analysis_background(video_id: str, mode: str, supabase: SupabaseService):
    """
    Background task for running video analysis.
    Wraps the template analysis pipeline for API use.
    """
    try:
        # Update status to processing
        await supabase.update("videos", video_id, {
            "status": VideoStatus.PROCESSING.value,
            "current_step": "Initializing analysis",
            "progress_percent": 0,
        })
        
        # Get video info
        video = await supabase.select_one("videos", video_id)
        if not video:
            return

        # Run analysis based on mode (offload CPU/GPU-heavy work to a thread)
        result = await anyio.to_thread.run_sync(
            _run_dispatch_in_thread,
            video["storage_path"],
            AnalysisMode(mode),
        )

        # For PERSONAL mode, attach the user's player_id if available
        if mode == AnalysisMode.PERSONAL.value:
            players = await supabase.select("players", filters={"user_id": video["uploader_id"]})
            if players:
                result["player_id"] = players[0].get("id")
        
        # Store results
        analysis_id = str(uuid4())
        analysis_record = {
            "id": analysis_id,
            "video_id": video_id,
            **result,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        await supabase.insert("analysis_results", analysis_record)
        
        # Update video status
        await supabase.update("videos", video_id, {
            "status": VideoStatus.COMPLETED.value,
            "progress_percent": 100,
            "current_step": "Complete",
            "completed_at": datetime.utcnow().isoformat(),
        })
        
    except Exception as e:
        # Update status on failure
        await supabase.update("videos", video_id, {
            "status": VideoStatus.FAILED.value,
            "error_message": str(e),
        })


@router.post("/team", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def trigger_team_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Trigger team analysis on an uploaded video.
    
    **Requires TEAM account.**
    
    This is an async operation. Use GET /api/videos/{id}/status to check progress.
    """
    # Verify video exists and belongs to user
    video = await supabase.select_one("videos", str(request.video_id))
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this video"
        )
    
    if video["status"] == VideoStatus.PROCESSING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Video is already being processed"
        )
    
    # Queue analysis
    background_tasks.add_task(
        run_analysis_background,
        str(request.video_id),
        AnalysisMode.TEAM.value,
        supabase,
    )
    
    return {
        "message": "Analysis queued",
        "video_id": str(request.video_id),
        "mode": "team",
    }


@router.post("/personal", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def trigger_personal_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Trigger personal analysis on an uploaded video.
    
    **Requires PERSONAL account.**
    
    This is an async operation. Use GET /api/videos/{id}/status to check progress.
    """
    video = await supabase.select_one("videos", str(request.video_id))
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this video"
        )
    
    if video["status"] == VideoStatus.PROCESSING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Video is already being processed"
        )
    
    background_tasks.add_task(
        run_analysis_background,
        str(request.video_id),
        AnalysisMode.PERSONAL.value,
        supabase,
    )
    
    return {
        "message": "Analysis queued",
        "video_id": str(request.video_id),
        "mode": "personal",
    }


@router.get("/{analysis_id}", response_model=Union[AnalysisResult, PersonalAnalysisResult])
async def get_analysis_result(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get analysis results by ID.
    """
    result = await supabase.select_one("analysis_results", analysis_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result not found"
        )
    
    # Verify ownership via video
    video = await supabase.select_one("videos", result["video_id"])
    if not video or video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this analysis"
        )

    # Return model based on video's analysis_mode
    if video.get("analysis_mode") == AnalysisMode.PERSONAL.value:
        return PersonalAnalysisResult(**result)

    return AnalysisResult(**result)


@router.get("/{analysis_id}/detections")
async def get_analysis_detections(
    analysis_id: str,
    frame_start: Optional[int] = None,
    frame_end: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get frame-by-frame detections for an analysis.
    
    Optionally filter by frame range.
    """
    # Verify access
    result = await supabase.select_one("analysis_results", analysis_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result not found"
        )
    
    video = await supabase.select_one("videos", result["video_id"])
    if not video or video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this analysis"
        )
    
    # Get detections
    filters = {"video_id": result["video_id"]}
    detections = await supabase.select("detections", filters=filters)
    
    # Filter by frame range if specified
    if frame_start is not None:
        detections = [d for d in detections if d.get("frame", 0) >= frame_start]
    if frame_end is not None:
        detections = [d for d in detections if d.get("frame", 0) <= frame_end]
    
    return {
        "analysis_id": analysis_id,
        "total_detections": len(detections),
        "detections": detections,
    }
