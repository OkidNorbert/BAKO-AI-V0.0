import asyncio
import os
import sys

# Ensure app is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.services.supabase_client import get_supabase_service

async def reset_processing():
    supabase = get_supabase_service()
    try:
        videos = await supabase.select("videos", filters={"status": "processing"})
        if videos:
            print(f"Found {len(videos)} processing videos:")
            for v in videos:
                vid_id = v.get("id")
                print(f"Resetting video {vid_id} to pending...")
                await supabase.update("videos", vid_id, {"status": "pending"})
            print("Reset complete.")
        else:
            print("No processing videos found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(reset_processing())
