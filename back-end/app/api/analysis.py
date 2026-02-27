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


def _run_dispatch_in_thread(video_path: str, mode: AnalysisMode, video_id: str, options: dict | None):
    """Run async dispatch in a dedicated thread event loop."""
    try:
        from analysis.dispatcher import dispatch_analysis
        return asyncio.run(dispatch_analysis(video_path, mode, options=options, video_id=video_id))
    except ImportError:
        print("⚠️ Analysis dispatcher not available (heavy dependencies missing)")
        return {"status": "skipped", "reason": "heavy dependencies missing"}


async def run_analysis_background(video_id: str, mode: str, supabase: SupabaseService, options: Optional[dict] = None):
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
            video_id,
            options or {},
        )

        # Pull out large/extra payloads that should not be inserted into analysis_results
        detections = result.pop("detections", None) or []
        # This field is useful for UI but isn't part of the DB schema
        result.pop("primary_player_frames", None)

        # For PERSONAL mode, attach the user's player_id if available
        player_id_for_analytics = None
        if mode == AnalysisMode.PERSONAL.value:
            players = await supabase.select("players", filters={"user_id": video["uploader_id"]})
            if players:
                player_id_for_analytics = players[0].get("id")
        
        # Store results (only columns that exist in analysis_results table)
        allowed_fields = {
            "total_frames",
            "duration_seconds",
            "players_detected",
            "team_1_possession_percent",
            "team_2_possession_percent",
            "total_passes",
            "team_1_passes",
            "team_2_passes",
            "total_interceptions",
            "team_1_interceptions",
            "team_2_interceptions",
            "shot_attempts",
            "shots_made",
            "shots_missed",
            "shooting_percentage",
            "team_1_shot_attempts",
            "team_1_shots_made",
            "team_2_shot_attempts",
            "team_2_shots_made",
            "overall_shooting_percentage",
            "defensive_actions",
            "shot_form_consistency",
            "dribble_count",
            "dribble_frequency_per_minute",
            "total_distance_meters",
            "avg_speed_kmh",
            "max_speed_kmh",
            "acceleration_events",
            "avg_knee_bend_angle",
            "avg_elbow_angle_shooting",
            "training_load_score",
            "events",
            "processing_time_seconds",
        }

        def convert_numpy(obj):
            import numpy as np
            if isinstance(obj, (np.int64, np.int32, np.int16, np.int8)):
                return int(obj)
            if isinstance(obj, (np.float64, np.float32, np.float16)):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            if isinstance(obj, dict):
                return {k: convert_numpy(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [convert_numpy(v) for v in obj]
            return obj

        result = convert_numpy(result)
        detections = convert_numpy(detections)
        
        analysis_id = str(uuid4())
        analysis_payload = {k: v for k, v in result.items() if k in allowed_fields}
        
        # Ensure required fields have values (not null)
        required_fields = {
            "total_frames": 0,
            "duration_seconds": 0.0,
            "players_detected": 0,
            "team_1_possession_percent": 50.0,
            "team_2_possession_percent": 50.0,
            "total_passes": 0,
            "total_interceptions": 0,
            "shot_attempts": 0,
            "processing_time_seconds": 0.0,
        }
        
        for field, default_val in required_fields.items():
            if field not in analysis_payload or analysis_payload[field] is None:
                analysis_payload[field] = default_val
        
        # Capture extra metrics that might be missing from schema in the events JSONB
        # This keeps the backend functional even if the DB hasn't been migrated yet.
        extra_metrics = {
            "defensive_actions": result.get("defensive_actions", 0),
            "overall_shooting_percentage": result.get("overall_shooting_percentage", 0.0),
            "total_distance_meters": result.get("total_distance_meters", 0.0),
            "avg_speed_kmh": result.get("avg_speed_kmh", 0.0),
            "max_speed_kmh": result.get("max_speed_kmh", 0.0),
            "advanced_analytics": result.get("advanced_analytics"),
        }
        
        current_events = result.get("events", [])
        if isinstance(current_events, list):
            current_events.append({
                "event_type": "summary_stats",
                "frame": 0,
                "timestamp_seconds": 0.0,
                "details": extra_metrics
            })
            analysis_payload["events"] = current_events

        analysis_record = {
            "id": analysis_id,
            "video_id": video_id,
            **analysis_payload,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        try:
            await supabase.insert("analysis_results", analysis_record)
        except Exception as e:
            raise e

        # Persist detections for overlay playback (always every frame for smoothness)
        store_detections = True
        detections_stride = 1
        max_detections = 200_000
        if options:
            store_detections = bool(options.get("store_detections", True))
            try:
                detections_stride = int(options.get("detections_stride", detections_stride))
            except Exception:
                pass
            try:
                max_detections = int(options.get("max_detections", max_detections))
            except Exception:
                pass

        if store_detections and detections:
            await supabase.update("videos", video_id, {
                "current_step": f"Saving {len(detections)} detection highlights",
                "progress_percent": 99,
            })

            max_detections = max(1_000, max_detections)

            rows = []
            for d in detections:
                bbox = d.get("bbox")
                if not bbox or len(bbox) != 4:
                    continue
                obj_type = d.get("object_type")
                # Map non-DB types to player/ball but keep real type in keypoints JSON
                db_obj_type = "player"
                if obj_type in ("ball", "basketball"):
                    db_obj_type = "ball"
                
                # Store the original type and tactical coordinates in keypoints for the frontend
                keypoints = d.get("keypoints") or {}
                if not isinstance(keypoints, dict):
                    keypoints = {"data": keypoints}
                keypoints["real_type"] = obj_type
                
                # Store tactical coordinates if available
                if "tactical_x" in d:
                    keypoints["tactical_x"] = d["tactical_x"]
                    keypoints["tactical_y"] = d["tactical_y"]

                rows.append({
                    "video_id": video_id,
                    "frame": int(d.get("frame", 0)),
                    "object_type": db_obj_type,
                    "track_id": int(d.get("track_id", 0)) if isinstance(d.get("track_id"), (int, float)) else int(str(d.get("track_id", 0)).split('-')[0] if '-' in str(d.get("track_id", "")) else 0),
                    "bbox": bbox,
                    "confidence": float(d.get("confidence", 1.0)),
                    "keypoints": keypoints,
                    "team_id": d.get("team_id"),
                    "has_ball": bool(d.get("has_ball", False)),
                })
                if len(rows) >= max_detections:
                    break

            # Replace old detections for this video (best-effort)
            try:
                await supabase.delete_where("detections", {"video_id": video_id})
            except Exception:
                pass

            await supabase.insert_many("detections", rows, chunk_size=500)

        # Persist PERSONAL analytics time-series (best-effort)
        if mode == AnalysisMode.PERSONAL.value and player_id_for_analytics:
            player_id = player_id_for_analytics
            analytics_rows = []
            if analysis_payload.get("total_distance_meters") is not None:
                analytics_rows.append({
                    "player_id": player_id,
                    "video_id": video_id,
                    "metric_type": "distance_km",
                    "value": float(analysis_payload["total_distance_meters"]) / 1000.0,
                })
            if analysis_payload.get("avg_speed_kmh") is not None:
                analytics_rows.append({
                    "player_id": player_id,
                    "video_id": video_id,
                    "metric_type": "avg_speed_kmh",
                    "value": float(analysis_payload["avg_speed_kmh"]),
                })
            if analysis_payload.get("max_speed_kmh") is not None:
                analytics_rows.append({
                    "player_id": player_id,
                    "video_id": video_id,
                    "metric_type": "max_speed_kmh",
                    "value": float(analysis_payload["max_speed_kmh"]),
                })
            if analysis_payload.get("dribble_count") is not None:
                analytics_rows.append({
                    "player_id": player_id,
                    "video_id": video_id,
                    "metric_type": "dribble_count",
                    "value": float(analysis_payload["dribble_count"]),
                })
            if analysis_payload.get("shot_attempts") is not None:
                analytics_rows.append({
                    "player_id": player_id,
                    "video_id": video_id,
                    "metric_type": "shot_attempt",
                    "value": float(analysis_payload["shot_attempts"]),
                })
            if analysis_payload.get("shot_form_consistency") is not None:
                analytics_rows.append({
                    "player_id": player_id,
                    "video_id": video_id,
                    "metric_type": "form_consistency",
                    "value": float(analysis_payload["shot_form_consistency"]),
                })

            if analytics_rows:
                try:
                    await supabase.insert_many("analytics", analytics_rows, chunk_size=500)
                except Exception:
                    pass
        
        # Update video status
        await supabase.update("videos", video_id, {
            "status": VideoStatus.COMPLETED.value,
            "progress_percent": 100,
            "current_step": "Complete",
            "completed_at": datetime.utcnow().isoformat(),
            "has_annotated": True,
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
    
    # Build comprehensive options dict from request
    options = request.options or {}
    
    # Add all detection and display parameters to options
    if request.our_team_jersey:
        options["our_team_jersey"] = request.our_team_jersey
    if request.opponent_jersey:
        options["opponent_jersey"] = request.opponent_jersey
    if request.our_team_id:
        options["our_team_id"] = request.our_team_id
    
    # Detection parameters
    options["player_confidence"] = request.player_confidence or 0.5
    options["ball_confidence"] = request.ball_confidence or 0.15
    options["detection_batch_size"] = request.detection_batch_size or 10
    options["image_size"] = request.image_size or 1080
    options["max_players_on_court"] = request.max_players_on_court or 5
    
    # Analysis options
    options["use_cached_detections"] = request.use_cached_detections or False
    options["clear_cache_after"] = request.clear_cache_after if request.clear_cache_after is not None else True
    options["save_annotated_video"] = request.save_annotated_video if request.save_annotated_video is not None else True
    
    # Display options
    options["render_speed_text"] = request.render_speed_text if request.render_speed_text is not None else True
    options["render_distance_text"] = request.render_distance_text if request.render_distance_text is not None else True
    options["render_tactical_view"] = request.render_tactical_view if request.render_tactical_view is not None else True
    options["render_court_keypoints"] = request.render_court_keypoints if request.render_court_keypoints is not None else True
    
    # Queue analysis
    background_tasks.add_task(
        run_analysis_background,
        str(request.video_id),
        AnalysisMode.TEAM.value,
        supabase,
        options,
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
        request.options or {},
    )
    
    return {
        "message": "Analysis queued",
        "video_id": str(request.video_id),
        "mode": "personal",
    }


def _hydrate_analysis_result(result: dict) -> dict:
    """Extract summary stats from events JSONB if they exist and merge into top-level."""
    if not result or "events" not in result:
        return result
        
    events = result.get("events", [])
    if not isinstance(events, list):
        return result
        
    for event in events:
        if isinstance(event, dict) and event.get("event_type") == "summary_stats":
            details = event.get("details", {})
            if isinstance(details, dict):
                # Only fill if the main result field is missing or None
                for key, value in details.items():
                    # Only fill if the main result field is missing or None
                    if key not in result or result[key] is None or key == "advanced_analytics":
                        result[key] = value
            break
    return result


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

    # Hydrate with extra metrics if stored in events
    result = _hydrate_analysis_result(result)

    # Return model based on video's analysis_mode
    if video.get("analysis_mode") == AnalysisMode.PERSONAL.value:
        return PersonalAnalysisResult(**result)

    return AnalysisResult(**result)


@router.get("/by-video/{video_id}", response_model=Union[AnalysisResult, PersonalAnalysisResult])
async def get_latest_analysis_for_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get the latest analysis result for a given video_id.
    Useful for frontend: poll video status, then fetch latest analysis.
    """
    video = await supabase.select_one("videos", video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    if video.get("uploader_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this video")

    results = await supabase.select(
        "analysis_results",
        filters={"video_id": video_id},
        order_by="created_at",
        ascending=False,
        limit=1,
    )
    if not results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No analysis found for this video")

    result = results[0]
    result = _hydrate_analysis_result(result)
    
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
