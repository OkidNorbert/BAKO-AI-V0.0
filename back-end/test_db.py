import asyncio
from app.services.supabase_client import SupabaseService

async def main():
    supabase = SupabaseService()
    try:
        analyses = await supabase.select("personal_analyses", limit=1)
        if analyses:
            print(analyses[0].get("results_json", {}))
        else:
            print("No analyses found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
