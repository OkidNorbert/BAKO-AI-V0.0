import asyncio
from app.services.supabase_client import get_supabase_service

async def check_orgs():
    service = get_supabase_service()
    orgs = await service.select("organizations")
    print(f"Total organizations: {len(orgs)}")
    for org in orgs:
        print(f"Org: {org['name']} (ID: {org['id']}), Owner: {org.get('owner_id')}")

if __name__ == "__main__":
    asyncio.run(check_orgs())
