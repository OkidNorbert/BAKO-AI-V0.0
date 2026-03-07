import asyncio
from app.services.supabase_client import SupabaseService

async def main():
    supabase = SupabaseService()
    try:
        # Get one where shot_reports exists
        analyses = await supabase.select("personal_analyses", limit=10)
        found = False
        for a in analyses:
            results = a.get("results_json", {})
            if isinstance(results, str):
                import json
                results = json.loads(results)
            if results.get("shot_reports"):
                print(results["shot_reports"][0])
                found = True
                break
        if not found:
            print("No analyses with shot_reports found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
