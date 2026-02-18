import asyncio
from app.api.analysis import run_analysis_background
from app.services.supabase_client import get_supabase_service

async def retrigger():
    video_id = "6faca277-99bc-4a28-9a3d-15ca6b871730"
    service = get_supabase_service()
    
    # Reset status first
    await service.update("videos", video_id, {"status": "pending", "error_message": None})
    
    print(f"Retriggering analysis for video {video_id}...")
    await run_analysis_background(video_id, "team", service)
    print("Analysis background task finished.")

if __name__ == "__main__":
    asyncio.run(retrigger())
