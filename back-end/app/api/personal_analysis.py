"""
Personal Analysis API endpoints.

Handles video upload + triggering the swiss basketball shot analysis pipeline
for individual (personal account) players.

Does NOT touch or interfere with the team analysis pipeline.
"""
import os
import uuid
import logging
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse

from app.dependencies import require_personal_account, get_supabase
from app.services.supabase_client import SupabaseService
from app.models.video import VideoStatus, AnalysisMode

logger = logging.getLogger("personal_analysis_api")

router = APIRouter()

# Where processed output videos are stored and served
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PERSONAL_OUTPUT_DIR = os.path.join(_BASE_DIR, "uploads", "personal_output")
os.makedirs(PERSONAL_OUTPUT_DIR, exist_ok=True)

# In-memory job status store (simple; survives server restart via DB)
_job_cache: dict = {}


async def _save_job_to_db(supabase: SupabaseService, job: dict):
    """Persist the job record to Supabase. Best-effort only."""
    try:
        existing = await supabase.select("personal_analyses", filters={"job_id": job["job_id"]})
        if existing:
            await supabase.update("personal_analyses", existing[0]["id"], job)
        else:
            await supabase.insert("personal_analyses", {**job, "id": str(uuid.uuid4())})
    except Exception as e:
        logger.warning(f"Could not save job to DB: {e}")


async def _run_and_update(job_id: str, video_path: str, user_id: str, supabase: SupabaseService, shooting_arm: str = "right"):
    """Background task that runs the pipeline and updates the DB."""
    from personal_analysis.pipeline import run_personal_analysis

    _job_cache[job_id] = {"job_id": job_id, "status": "processing", "user_id": user_id}

    result = await run_personal_analysis(
        video_path=video_path,
        output_dir=PERSONAL_OUTPUT_DIR,
        job_id=job_id,
        shooting_arm=shooting_arm,
    )

    _job_cache[job_id] = {**result, "user_id": user_id}

    # Persist to DB (personal_analyses table)
    await _save_job_to_db(supabase, {
        "job_id": job_id,
        "user_id": user_id,
        "status": result.get("status", "completed"),
        "results_json": result,
        "created_at": datetime.utcnow().isoformat(),
    })

    # Update global videos table status
    try:
        final_video_status = VideoStatus.COMPLETED.value if result.get("status") == "completed" else VideoStatus.FAILED.value
        await supabase.update("videos", job_id, {
            "status": final_video_status,
            "progress_percent": 100 if final_video_status == VideoStatus.COMPLETED.value else 0
        })
    except Exception as e:
        logger.warning(f"Could not update videos table status: {e}")

    # Clean up the raw upload to save disk space
    try:
        if os.path.exists(video_path):
            os.remove(video_path)
    except Exception:
        pass


@router.post("/analysis/trigger")
async def trigger_analysis(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    shooting_arm: str = "right",
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Upload a personal training video and start shot analysis.
    Returns a job_id immediately — poll /analysis/{job_id} for results.
    """
    # Validate file type
    allowed_ext = {".mp4", ".avi", ".mov", ".mkv"}
    _, ext = os.path.splitext(video.filename or "video.mp4")
    if ext.lower() not in allowed_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Allowed: {', '.join(allowed_ext)}"
        )

    # Save to temporary upload path
    job_id = str(uuid.uuid4())
    upload_path = os.path.join(PERSONAL_OUTPUT_DIR, f"{job_id}_input{ext}")

    content = await video.read()
    if len(content) > 500 * 1024 * 1024:  # 500 MB limit
        raise HTTPException(status_code=413, detail="Video file too large (max 500 MB)")

    with open(upload_path, "wb") as f:
        f.write(content)

    # 1. Register in the global videos table so it shows up in general lists
    try:
        # Get basic video info for the record
        # In a real app we'd use cv2 here, but for personal portal we can use defaults
        video_record = {
            "id": job_id,
            "uploader_id": current_user["id"],
            "title": video.filename or f"Analysis {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            "description": f"Personal shot analysis (hand: {shooting_arm})",
            "analysis_mode": AnalysisMode.PERSONAL.value,
            "status": VideoStatus.PROCESSING.value,
            "storage_path": upload_path,
            "file_size_bytes": len(content),
            "created_at": datetime.utcnow().isoformat(),
        }
        await supabase.insert("videos", video_record)
    except Exception as e:
        logger.warning(f"Could not insert into videos table: {e}")

    user_id = current_user["id"]
    _job_cache[job_id] = {"job_id": job_id, "status": "processing", "user_id": user_id}

    # Fire and forget — analysis runs in background
    background_tasks.add_task(
        _run_and_update, job_id, upload_path, user_id, supabase, shooting_arm
    )

    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Analysis started. Poll /player/analysis/${job_id} for results.",
    }


@router.get("/analysis/{job_id}")
async def get_analysis_result(
    job_id: str,
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Poll the status / results of a personal analysis job.
    Returns 'processing' until done, then the full results.
    """
    # Check in-memory cache first
    if job_id in _job_cache:
        job = _job_cache[job_id]
        if job.get("user_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        return job

    # Fall back to DB
    try:
        rows = await supabase.select("personal_analyses", filters={"job_id": job_id})
        if rows:
            record = rows[0]
            if record.get("user_id") != current_user["id"]:
                raise HTTPException(status_code=403, detail="Access denied")

            # results_json holds the full pipeline output dict.
            # Merge it with the top-level DB record so callers always see
            # shots_total, made_percentage, annotated_video_url etc. at the
            # root level (not buried inside a nested "results_json" key).
            results_json = record.get("results_json") or {}
            if isinstance(results_json, str):
                import json as _json
                try:
                    results_json = _json.loads(results_json)
                except Exception:
                    results_json = {}

            merged = {**record, **results_json}
            return merged
    except HTTPException:
        raise
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Analysis job not found")


@router.get("/analysis")
async def list_my_analyses(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    List all past personal analysis jobs for the current player.
    """
    try:
        rows = await supabase.select(
            "personal_analyses",
            filters={"user_id": current_user["id"]},
            order_by="created_at",
            ascending=False
        )
        return rows or []
    except Exception as e:
        logger.warning(f"Could not fetch analyses: {e}")
        return []
