import asyncio
from app.services.supabase_client import get_supabase_service

async def main():
    supabase = get_supabase_service()
    res = await supabase.select("organizations", limit=1)
    if res:
        print("Columns found:")
        print(list(res[0].keys()))
    else:
        print("No orgs found")

if __name__ == "__main__":
    asyncio.run(main())
