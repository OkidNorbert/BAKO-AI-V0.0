import asyncio
from app.services.supabase_client import get_supabase_service

async def list_v():
    s = get_supabase_service()
    videos = await s.select('videos', limit=20)
    for v in videos:
        print(f"{v['id']} | {v['analysis_mode']} | {v['uploader_id']} | {v['title']}")

if __name__ == "__main__":
    asyncio.run(list_v())
