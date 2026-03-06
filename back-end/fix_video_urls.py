import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.supabase_client import get_supabase_service

async def fix_avi_urls():
    supabase = get_supabase_service()
    try:
        # Update all personal analyses that still have .avi URL
        analyses = await supabase.select("personal_analyses", filters={})
        updated = 0
        for a in (analyses or []):
            results = a.get("results_json") or {}
            url = results.get("annotated_video_url", "")
            if url.endswith(".avi"):
                new_url = url.replace(".avi", ".mp4")
                results["annotated_video_url"] = new_url
                await supabase.update("personal_analyses", a["id"], {"results_json": results})
                print(f"Updated {a['id']}: {url} -> {new_url}")
                updated += 1
        print(f"Done. {updated} records updated.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_avi_urls())
