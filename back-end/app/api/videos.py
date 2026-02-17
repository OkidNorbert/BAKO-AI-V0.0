"""
Video management API endpoints.
"""
import os
import shutil
from uuid import uuid4
from datetime import datetime
from typing import Optional
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    UploadFile,
    File,
    Form,
    Query,
    status,
)
from fastapi.responses import FileResponse

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings
from app.dependencies import get_current_user, get_supabase
from app.models.user import AccountType
from app.models.video import (
    VideoUpload,
    Video,
    VideoStatus,
    AnalysisMode,
    VideoStatusResponse,
    VideoListResponse,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()


def _get_limiter(request: Request) -> Limiter:
    return request.app.state.limiter


def get_video_info(file_path: str) -> dict:
    """Extract video metadata using OpenCV."""
    try:
        import cv2
        cap = cv2.VideoCapture(file_path)
    except ImportError:
        print("⚠️ OpenCV not installed, skipping video metadata extraction")
        return {
            "fps": 30.0,
            "frame_count": 0,
            "width": 1920,
            "height": 1080,
            "duration_seconds": 0,
        }
    
    try:
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
    except Exception:
        return {}
    finally:
        try:
            cap.release()
        except Exception:
            pass


@router.post("/upload", response_model=Video, status_code=status.HTTP_201_CREATED)
async def upload_video(
    request: Request,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None, max_length=200),
    description: Optional[str] = Form(None, max_length=1000),
    analysis_mode: AnalysisMode = Form(...),
    organization_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Upload a video for analysis.
    
    - **file**: Video file (mp4, avi, mov, mkv)
    - **analysis_mode**: 'team' or 'personal'
    - **organization_id**: Required for TEAM analysis
    """
    settings = get_settings()

    # Apply a modest rate limit to uploads to avoid resource exhaustion.
    limiter = _get_limiter(request)
    limiter.limit("10/hour")(lambda *_args, **_kwargs: None)(request)
    
    # Validate file extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing filename"
        )

    _, ext = os.path.splitext(file.filename)
    ext = ext.lstrip(".").lower()
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.allowed_video_extensions}"
        )
    
    # Basic content-type validation (defence-in-depth – still rely on OpenCV check later)
    allowed_mime_types = {
        "video/mp4",
        "video/x-msvideo",
        "video/quicktime",
        "video/x-matroska",
    }
    if file.content_type and file.content_type.lower() not in allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type for video upload",
        )

    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset
    
    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum: {settings.max_upload_size_mb}MB"
        )
    
    # Validate team analysis requirements
    if analysis_mode == AnalysisMode.TEAM:
        if current_user.get("account_type") != "team":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Team analysis requires a TEAM account"
            )
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="organization_id is required for TEAM analysis"
            )
        # Verify org ownership
        org = await supabase.select_one("organizations", str(organization_id))
        if not org or org.get("owner_id") != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this organization"
            )
    
    # Generate unique filename and save. We never trust the original name for paths.
    video_id = str(uuid4())
    filename = f"{video_id}.{ext}"
    # Ensure uploader id does not introduce path traversal
    safe_uploader_id = str(current_user["id"]).replace("/", "_").replace("\\", "_")
    storage_path = os.path.join(settings.upload_dir, safe_uploader_id, filename)
    
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    
    with open(storage_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get video metadata
    video_info = get_video_info(storage_path)
    if not video_info or not video_info.get("frame_count"):
        # Reject unreadable / non-video uploads
        try:
            os.remove(storage_path)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a readable video"
        )
    
    # Create database record
    video_record = {
        "id": video_id,
        "uploader_id": current_user["id"],
        "title": title or file.filename,
        "description": description,
        "analysis_mode": analysis_mode.value,
        "status": VideoStatus.PENDING.value,
        "storage_path": storage_path,
        "file_size_bytes": file_size,
        "organization_id": organization_id,
        **video_info,
    }
    
    await supabase.insert("videos", video_record)
    
    return Video(
        **video_record,
        created_at=datetime.utcnow(),
        download_url=f"/api/videos/{video_id}/download",
    )


@router.get("", response_model=VideoListResponse)
async def list_videos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[VideoStatus] = Query(None),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    List videos uploaded by the current user.
    """
    # If TEAM account, filter by organization_id by default if possible
    filters = {}
    if current_user.get("account_type") == AccountType.TEAM.value:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if orgs:
            filters["organization_id"] = orgs[0]["id"]
        else:
            filters["uploader_id"] = current_user["id"]
    else:
        filters["uploader_id"] = current_user["id"]
        
    if status_filter:
        filters["status"] = status_filter.value
    
    videos = await supabase.select(
        "videos",
        filters=filters,
        order_by="created_at",
        ascending=False,
    )
    
    # Paginate
    total = len(videos)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = videos[start:end]
    
    return VideoListResponse(
        videos=[
            Video(**v, download_url=f"/api/videos/{v.get('id')}/download")
            for v in paginated
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{video_id}", response_model=Video)
async def get_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get video details by ID.
    """
    video = await supabase.select_one("videos", video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check ownership
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this video"
        )
    
    return Video(**video, download_url=f"/api/videos/{video_id}/download")


@router.get("/{video_id}/download")
async def download_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Download a previously uploaded video.
    Authenticated and ownership-checked.
    """
    video = await supabase.select_one("videos", video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    if video.get("uploader_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this video")

    storage_path = video.get("storage_path")
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video file not found on server")

    # Prefer the original filename for download if available
    original_title = (video.get("title") or f"{video_id}").strip()
    safe_name = quote(original_title.replace("/", "_").replace("\\", "_"))
    _, ext = os.path.splitext(storage_path)
    ext = ext if ext else ".mp4"
    return FileResponse(
        path=storage_path,
        filename=f"{safe_name}{ext}",
        media_type="application/octet-stream",
    )


@router.get("/{video_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get video processing status.
    """
    video = await supabase.select_one("videos", video_id)
    
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
    
    return VideoStatusResponse(
        id=video["id"],
        status=VideoStatus(video["status"]),
        progress_percent=video.get("progress_percent"),
        current_step=video.get("current_step"),
        error_message=video.get("error_message"),
    )


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Delete a video and associated data.
    """
    video = await supabase.select_one("videos", video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this video"
        )
    
    # Delete file
    if os.path.exists(video["storage_path"]):
        os.remove(video["storage_path"])

    # Best-effort cascade delete related rows
    try:
        await supabase.delete_where("analysis_results", {"video_id": video_id})
    except Exception:
        pass
    try:
        await supabase.delete_where("detections", {"video_id": video_id})
    except Exception:
        pass
    try:
        await supabase.delete_where("analytics", {"video_id": video_id})
    except Exception:
        pass
    
    # Delete database record
    await supabase.delete("videos", video_id)
    
    return None
