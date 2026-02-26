"""
Web API Wrapper for Team Analysis - Uses main.py as the core engine

This module provides the async/web interface to the core team analysis logic
defined in main.py. It handles:
- Progress updates via database
- Jersey color customization
- Stub management options
"""
import os
import sys
import time
import threading
from typing import Dict, Any, Optional

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import run_team_analysis as core_run_team_analysis


async def run_team_analysis(
    video_path: str,
    options: Optional[Dict[str, Any]] = None,
    video_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Async wrapper for team analysis (Web API interface).
    
    Uses the core analysis from main.py with web-specific features:
    - Progress updates to database
    - Jersey color customization
    - Stub management options
    
    Args:
        video_path: Path to input video
        options: Analysis options dict with keys:
            - our_team_jersey: Team jersey description
            - opponent_jersey: Opponent jersey description
            - our_team_id: Team ID (1 or 2)
            - read_from_stub: Use cached detections
            - clear_stubs_after: Clear stubs after analysis
        video_id: Video UUID for progress tracking in database
        
    Returns:
        Dictionary with analysis results
    """
    import anyio
    from app.services.supabase_client import get_supabase_service
    
    supabase = get_supabase_service()
    
    # Shared state for progress updates between threads
    progress_state = {"step": "Initializing", "percent": 0, "finished": False}
    progress_lock = threading.Lock()
    
    def sync_progress_callback(step: str, percent: int):
        """
        Synchronous callback for progress updates - stores in shared state.
        The async updater will periodically read and push to database.
        """
        # Cap at 99% until the very end to avoid updater exiting early
        db_percent = min(percent, 99)
        with progress_lock:
            progress_state["step"] = step
            progress_state["percent"] = db_percent
        print(f"[{percent}%] {step}")
    
    async def background_progress_updater():
        """
        Periodically reads progress state and updates the database.
        Runs in parallel with the analysis thread.
        """
        if not (video_id and supabase):
            return
        
        last_update = 0
        while True:
            await anyio.sleep(0.5)  # Check every 500ms
            
            with progress_lock:
                current_step = progress_state["step"]
                current_percent = progress_state["percent"]
                is_finished = progress_state["finished"]
            
            # Update database if progress changed
            if current_percent > last_update:
                try:
                    await supabase.update("videos", video_id, {
                        "current_step": current_step,
                        "progress_percent": current_percent
                    })
                    last_update = current_percent
                except Exception as e:
                    print(f"⚠️  Error updating progress: {e}")
            
            # Exit when signaled
            if is_finished:
                break
    
    try:
        # Parse options with defaults - MUST come from user input (web form)
        options = options or {}
        
        # Jersey colors MUST be provided by user
        our_team_jersey = str(options.get("our_team_jersey") or "").strip()
        opponent_jersey = str(options.get("opponent_jersey") or "").strip()
        
        if not our_team_jersey or not opponent_jersey:
            raise ValueError("Jersey colors are required - user must select team colors in the web form")
        
        try:
            our_team_id = int(options.get("our_team_id") or 1)
        except Exception:
            our_team_id = 1
        our_team_id = 1 if our_team_id not in (1, 2) else our_team_id
        
        read_from_stub = bool(options.get("read_from_stub", False))
        clear_stubs_after = bool(options.get("clear_stubs_after", True))
        save_annotated_video = bool(options.get("save_annotated_video", True))
        
        # Detection parameters (from user selections)
        player_confidence = float(options.get("player_confidence", 0.5))
        ball_confidence = float(options.get("ball_confidence", 0.15))
        detection_batch_size = int(options.get("detection_batch_size", 10))
        image_size = int(options.get("image_size", 1080))
        max_players_on_court = int(options.get("max_players_on_court", 10))
        
        # Display parameters (from user preferences)
        render_speed_text = bool(options.get("render_speed_text", True))
        render_distance_text = bool(options.get("render_distance_text", True))
        render_tactical_view = bool(options.get("render_tactical_view", True))
        render_court_keypoints = bool(options.get("render_court_keypoints", True))
        
        # Output paths (use absolute paths to avoid working directory issues)
        from configs import STUBS_DEFAULT_PATH
        stub_root = os.path.join(STUBS_DEFAULT_PATH, "api", str(video_id or "no-id"))
        
        # Create absolute path for output video
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        annotated_dir = os.path.join(backend_dir, "output_videos", "annotated")
        os.makedirs(annotated_dir, exist_ok=True)
        output_path = os.path.join(annotated_dir, f"{video_id or 'latest'}.mp4")
        
        # Start progress updater task and analysis in parallel
        async with anyio.create_task_group() as tg:
            # Start the background progress updater
            tg.start_soon(background_progress_updater)
            
            # Run the analysis in a thread
            def run_sync():
                """Synchronous wrapper for core analysis."""
                return core_run_team_analysis(
                    video_path=video_path,
                    output_path=output_path,
                    stub_path=stub_root,
                    our_team_jersey=our_team_jersey,
                    opponent_jersey=opponent_jersey,
                    our_team_id=our_team_id,
                    read_from_stub=read_from_stub,
                    clear_stubs_after=clear_stubs_after,
                    save_annotated_video=save_annotated_video,
                    progress_callback=sync_progress_callback,
                    player_confidence=player_confidence,
                    ball_confidence=ball_confidence,
                    detection_batch_size=detection_batch_size,
                    image_size=image_size,
                    max_players_on_court=max_players_on_court,
                    render_speed_text=render_speed_text,
                    render_distance_text=render_distance_text,
                    render_tactical_view=render_tactical_view,
                    render_court_keypoints=render_court_keypoints,
                )
            
            # Wait for analysis to complete
            result = await anyio.to_thread.run_sync(run_sync)
        
            # Run advanced analytics if requested
            if result.get("status") == "completed" and options.get("enable_advanced_analytics", False):
                try:
                    sync_progress_callback("Running advanced analytics", 95)
                    from analytics_engine import AnalyticsCoordinator
                    from utils import read_video
                    
                    # Re-read frames for advanced analytics
                    video_frames = await anyio.to_thread.run_sync(read_video, video_path)
                    
                    coordinator = AnalyticsCoordinator()
                    advanced_results = await anyio.to_thread.run_sync(
                        coordinator.process_all,
                        video_frames,
                        [], # player_tracks
                        [], # ball_tracks
                        [], # tactical_positions
                        [], # player_assignment
                        [], # ball_possession
                        result.get("events", []),
                        [], # shots
                        [], # court_keypoints
                        [], # speeds
                        video_path,
                        result.get("fps", 30.0)
                    )
                    
                    result["advanced_analytics"] = advanced_results
                    sync_progress_callback("Advanced analytics complete", 98)
                except Exception as e:
                    print(f"⚠️  Advanced analytics failed: {e}")
            
            # Signal background updater to finish
            with progress_lock:
                progress_state["finished"] = True
        
        
        # Final progress update
        if video_id and supabase:
            await supabase.update("videos", video_id, {
                "current_step": "Analysis complete",
                "progress_percent": 100,
                "status": result.get("status", "completed"),
                "has_annotated": True if result.get("status") == "completed" else False,
            })
        
        # Ensure all required fields are present (never null)
        if result.get("status") == "completed":
            required_fields = {
                "total_frames": lambda r: r.get("total_frames") or 0,
                "duration_seconds": lambda r: r.get("duration_seconds") or 0.0,
                "players_detected": lambda r: r.get("players_detected") or 0,
                "team_1_possession_percent": lambda r: r.get("team_1_possession_percent") or 50.0,
                "team_2_possession_percent": lambda r: r.get("team_2_possession_percent") or 50.0,
                "total_passes": lambda r: r.get("total_passes") or 0,
                "total_interceptions": lambda r: r.get("total_interceptions") or 0,
                "defensive_actions": lambda r: r.get("defensive_actions") or 0,
                "overall_shooting_percentage": lambda r: r.get("overall_shooting_percentage") or 0.0,
                "total_distance_meters": lambda r: r.get("total_distance_meters") or 0.0,
                "avg_speed_kmh": lambda r: r.get("avg_speed_kmh") or 0.0,
                "max_speed_kmh": lambda r: r.get("max_speed_kmh") or 0.0,
                "processing_time_seconds": lambda r: r.get("processing_time_seconds") or 0.0,
                "annotated_video_path": lambda r: r.get("annotated_video_path") or "",
            }
            for field, getter in required_fields.items():
                if field not in result or result[field] is None:
                    result[field] = getter(result)
        
        return result
        
    except Exception as e:
        print(f"❌ Team analysis failed: {e}")
        import traceback
        traceback.print_exc()
        
        # Update status to failed
        if video_id and supabase:
            try:
                await supabase.update("videos", video_id, {
                    "status": "failed",
                    "error": str(e)
                })
            except:
                pass
        
        return {
            "status": "failed",
            "error": str(e)
        }

