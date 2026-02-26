
import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client

def _annotated_video_path(video_id):
    return os.path.join("output_videos", "annotated", f"{video_id}.mp4")

async def sync():
    load_dotenv()
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_KEY')
    client = create_client(url, key)
    
    # Get all videos
    res = client.table('videos').select('id, status').execute()
    videos = res.data
    
    print(f"Checking {len(videos)} videos...")
    
    for v in videos:
        video_id = v['id']
        path = _annotated_video_path(video_id)
        exists = os.path.exists(path)
        
        # Only update if there's a mismatch OR to initialize
        # Actually, let's just update them all for consistency
        try:
            client.table('videos').update({'has_annotated': exists}).eq('id', video_id).execute()
            print(f"Video {video_id}: has_annotated = {exists}")
        except Exception as e:
            print(f"Error updating video {video_id}: {e}")

if __name__ == "__main__":
    asyncio.run(sync())
