import asyncio
import os
import sys
from dotenv import load_dotenv

# Add current directory to path so apps can be imported
sys.path.append(os.getcwd())

from app.api.analysis import run_analysis_background
from app.services.supabase_client import get_supabase_service

# Change CWD to back-end folder so relative paths work
os.chdir(os.path.join(os.path.dirname(__file__), '..'))

load_dotenv('.env')

async def trigger_test():
    # Use the most recent video ID
    video_id = "fdf27d64-e61c-4fa5-85d2-e93308d6b6af"
    service = get_supabase_service()
    
    video = await service.select_one("videos", video_id)
    print(f"Video storage path from DB: {video['storage_path']}")
    print(f"Current CWD: {os.getcwd()}")
    print(f"Absolute video path: {os.path.abspath(video['storage_path'])}")
    
    # Update status to processing to avoid double triggers if system is watching
    # but run_analysis_background will handle the bulk of it.
    print(f"Starting analysis for video: {video_id}")
    
    # Options matches AnalysisRequest model
    options = {
        "save_annotated_video": True,
        "render_tactical_view": True,
        "our_team_jersey": "white",
        "opponent_jersey": "red"
    }
    
    try:
        # app.api.analysis.run_analysis_background(video_id, mode, supabase, options=None)
        await run_analysis_background(video_id, "team", service, options=options)
        
        # Since run_analysis_background doesn't return the result (it's a task wrapper),
        # we check the DB for the final status.
        video = await service.select_one("videos", video_id)
        if video.get('status') == 'completed':
            # Get latest analysis result
            results = await service.select("analysis_results", filters={"video_id": video_id}, order_by="created_at", ascending=False, limit=1)
            if results:
                res = results[0]
                print(f"\nSUCCESS: Analysis complete. Result status: {video.get('status')}, frames: {res.get('total_frames')}")
                print(f"Stats: Passes (H:{res.get('team_1_passes')}, A:{res.get('team_2_passes')}), Int (H:{res.get('team_1_interceptions')}, A:{res.get('team_2_interceptions')})")
            else:
                print(f"\nWARNING: Video marked completed but no analysis_results found.")
        else:
            print(f"\nERROR: Analysis failed. Video status: {video.get('status')}, Error: {video.get('error_message')}")
    except Exception as e:
        print(f"\nERROR during analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(trigger_test())
