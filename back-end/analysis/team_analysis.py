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
    progress_state = {"step": "Initializing", "percent": 0}
    progress_lock = threading.Lock()
    
    def sync_progress_callback(step: str, percent: int):
        """
        Synchronous callback for progress updates - stores in shared state.
        The async updater will periodically read and push to database.
        """
        with progress_lock:
            progress_state["step"] = step
            progress_state["percent"] = percent
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
            
            # Update database if progress changed (with rate limiting)
            if current_percent > last_update or current_percent == 100:
                try:
                    await supabase.update("videos", video_id, {
                        "current_step": current_step,
                        "progress_percent": current_percent
                    })
                    last_update = current_percent
                except Exception as e:
                    print(f"⚠️  Error updating progress: {e}")
            
            # Exit when analysis completes
            if current_percent >= 100:
                break
    
    try:
        # Parse options with defaults
        options = options or {}
        our_team_jersey = str(options.get("our_team_jersey") or "white jersey")
        opponent_jersey = str(options.get("opponent_jersey") or "dark blue jersey")
        
        try:
            our_team_id = int(options.get("our_team_id") or 1)
        except Exception:
            our_team_id = 1
        our_team_id = 1 if our_team_id not in (1, 2) else our_team_id
        
        read_from_stub = bool(options.get("read_from_stub", False))
        clear_stubs_after = bool(options.get("clear_stubs_after", True))
        
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
                    save_annotated_video=True,
                    progress_callback=sync_progress_callback,
                )
            
            # Wait for analysis to complete
            result = await anyio.to_thread.run_sync(run_sync)
        
        # Final progress update
        if video_id and supabase:
            await supabase.update("videos", video_id, {
                "current_step": "Analysis complete",
                "progress_percent": 100,
                "status": result.get("status", "completed")
            })
        
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

