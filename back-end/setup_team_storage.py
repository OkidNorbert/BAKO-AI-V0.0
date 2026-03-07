"""
One-time setup: create the 'team-analysis-videos' Supabase Storage bucket
and add annotated_url column to the videos table if it doesn't exist.

Run with: source .venv/bin/activate && python3 setup_team_storage.py
"""
import asyncio
import os

BUCKET = "team-analysis-videos"


async def main():
    from app.services.supabase_client import get_supabase_service
    import anyio

    service = get_supabase_service()

    if not service.is_connected:
        print("❌ Not connected to Supabase — check .env credentials.")
        return

    # ── 1. Create bucket (idempotent) ─────────────────────────────────────────
    print(f"Creating bucket '{BUCKET}' …")
    try:
        def _create():
            try:
                service.client.storage.create_bucket(BUCKET, options={"public": False})
                return "created"
            except Exception as e:
                if "already exists" in str(e).lower() or "Duplicate" in str(e):
                    return "already exists"
                raise

        result = await anyio.to_thread.run_sync(_create)
        print(f"  Bucket '{BUCKET}': {result}")
    except Exception as e:
        print(f"  ⚠️  Bucket error (may already exist): {e}")

    # ── 2. Add annotated_url column to videos table ───────────────────────────
    # Supabase doesn't expose DDL via the REST API, so we try inserting a test
    # update with annotated_url=None to see if the column exists.
    print("\nChecking if 'annotated_url' column exists in videos table …")
    try:
        # Pick any video record to test
        rows = await service.select("videos", limit=1)
        if rows:
            existing = rows[0]
            if "annotated_url" in existing:
                print("  ✅ Column 'annotated_url' already exists")
            else:
                print("  ⚠️  Column 'annotated_url' NOT found in videos table.")
                print("  👉  Please run this SQL in your Supabase dashboard (SQL Editor):")
                print()
                print("      ALTER TABLE videos ADD COLUMN IF NOT EXISTS annotated_url TEXT;")
                print()
        else:
            print("  ℹ️  No videos found to check column existence.")
    except Exception as e:
        print(f"  ⚠️  Could not check videos table: {e}")

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
