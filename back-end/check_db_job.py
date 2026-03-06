import asyncio
import json
from app.services.supabase_client import get_supabase_service

async def check():
    supabase = get_supabase_service()
    job_id = "6ead7790-728c-47a7-b5da-4ddecac19b4f"
    rows = await supabase.select("personal_analyses", filters={"job_id": job_id})
    if rows:
        print(f"Row {job_id} info:")
        print(json.dumps(rows[0], indent=2))
        res_json = rows[0].get("results_json", {})
        if "error" in res_json:
             print(f"Error in JSON: {res_json['error']}")
    else:
        print(f"Job {job_id} not found in DB.")

if __name__ == "__main__":
    asyncio.run(check())
