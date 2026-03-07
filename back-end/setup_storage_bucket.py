"""
One-time setup: create the 'personal-analysis-videos' Supabase Storage bucket
and migrate the existing stuck video (the _tmp.mp4 → re-encoded _output.mp4).

Run with: source .venv/bin/activate && python3 setup_storage_bucket.py
"""
import asyncio
import os
import sys

BUCKET = "personal-analysis-videos"
PERSONAL_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "personal_output")


async def main():
    from app.services.supabase_client import get_supabase_service

    service = get_supabase_service()

    if not service.is_connected:
        print("❌ Not connected to Supabase — check .env credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY).")
        return

    # ── 1. Create bucket (idempotent) ─────────────────────────────────────────
    print(f"Creating bucket '{BUCKET}' …")
    try:
        import anyio

        def _create():
            try:
                service.client.storage.create_bucket(
                    BUCKET,
                    options={"public": False},
                )
                return "created"
            except Exception as e:
                if "already exists" in str(e).lower() or "Duplicate" in str(e):
                    return "exists"
                raise

        result = await anyio.to_thread.run_sync(_create)
        print(f"  Bucket '{BUCKET}': {result}")
    except Exception as e:
        print(f"  ⚠️  Bucket creation error (may already exist): {e}")

    # ── 2. Upload existing completed videos ───────────────────────────────────
    mp4_files = [f for f in os.listdir(PERSONAL_OUTPUT_DIR) if f.endswith("_output.mp4")]
    tmp_files = [f for f in os.listdir(PERSONAL_OUTPUT_DIR) if f.endswith("_output_tmp.mp4")]

    print(f"\nFound {len(mp4_files)} output video(s) and {len(tmp_files)} tmp file(s) in {PERSONAL_OUTPUT_DIR}")

    # Check if the existing tmp file has already been re-encoded to _output.mp4 
    for mp4_file in mp4_files:
        job_id = mp4_file.replace("_output.mp4", "")
        local_path = os.path.join(PERSONAL_OUTPUT_DIR, mp4_file)
        size_mb = os.path.getsize(local_path) / (1024 * 1024)
        print(f"\nUploading {mp4_file} ({size_mb:.1f} MB) …")

        # We don't know the user_id here, so use job_id only as the path
        storage_path = f"migrated/{job_id}_output.mp4"
        try:
            await service.upload_file_from_path(
                bucket=BUCKET,
                storage_path=storage_path,
                local_path=local_path,
                content_type="video/mp4",
            )
            signed_url = await service.get_long_lived_url(
                bucket=BUCKET,
                storage_path=storage_path,
                expires_in=60 * 60 * 24 * 7,
            )
            print(f"  ✅ Uploaded → {storage_path}")
            print(f"  🔗 Signed URL (7 days): {signed_url[:80]}…")

            # Update the job's annotated_video_url in the DB
            try:
                rows = await service.select("personal_analyses", filters={"job_id": job_id})
                if rows:
                    record = rows[0]
                    results_json = record.get("results_json") or {}
                    if isinstance(results_json, str):
                        import json
                        results_json = json.loads(results_json)
                    results_json["annotated_video_url"] = signed_url
                    await service.update("personal_analyses", record["id"], {"results_json": results_json})
                    print(f"  ✅ DB record updated with new signed URL")
                else:
                    print(f"  ⚠️  No DB record found for job_id={job_id}")
            except Exception as db_err:
                print(f"  ⚠️  Could not update DB: {db_err}")

        except Exception as err:
            print(f"  ❌ Upload failed: {err}")

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
