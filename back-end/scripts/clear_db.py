import asyncio
import os
import sys

# Add the parent directory to sys.path to allow importing app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.supabase_client import get_supabase_service

async def clear_database():
    """
    Clears all data from the database tables while preserving the schema.
    """
    supabase = get_supabase_service()
    
    # Order matters due to foreign key constraints if not using cascade
    # However, supabase.delete often requires a filter, or we can use SQL truncate
    # Since we use the service wrapper, let's try to delete with a broad filter 
    # or expose a raw SQL execution method if available.
    
    tables = [
        "activities",
        "notifications",
        "matches",
        "schedules",
        "analytics",
        "analysis_results",
        "detections",
        "videos",
        "players",
        "organizations",
        "users"
    ]
    
    print("Starting database clear...")
    
    for table in tables:
        try:
            print(f"Clearing table: {table}...")
            # Use the internal _run_sync because .execute() is synchronous in this version of supabase-py
            await supabase._run_sync(lambda: supabase.client.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute())
            print(f"Successfully cleared {table}")
        except Exception as e:
            print(f"Error clearing table {table}: {e}")

    print("Database clear complete.")

if __name__ == "__main__":
    asyncio.run(clear_database())
