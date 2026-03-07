"""
Retrieve and display all users from the database.
Run with: source .venv/bin/activate && python3 list_all_users.py
"""
import asyncio
from app.services.supabase_client import get_supabase_service


async def list_users():
    service = get_supabase_service()

    if not service.is_connected:
        print("❌ Not connected to Supabase. Check your .env credentials.")
        return

    users = await service.select(
        "users",
        columns="id, email, full_name, account_type, created_at, organization_id",
        order_by="created_at",
        ascending=True,
    )

    if not users:
        print("No users found in the database.")
        return

    print(f"\n{'='*70}")
    print(f"  Total users: {len(users)}")
    print(f"{'='*70}")
    print(f"{'#':<4} {'Email':<35} {'Name':<20} {'Type':<10} {'Created':<12}")
    print(f"{'-'*4} {'-'*35} {'-'*20} {'-'*10} {'-'*12}")

    for i, user in enumerate(users, 1):
        email = user.get("email", "N/A")
        name = user.get("full_name") or "—"
        acc_type = user.get("account_type", "N/A")
        created = str(user.get("created_at", ""))[:10]
        print(f"{i:<4} {email:<35} {name:<20} {acc_type:<10} {created:<12}")

    print(f"{'='*70}\n")


if __name__ == "__main__":
    asyncio.run(list_users())
