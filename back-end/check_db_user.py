import asyncio
from app.services.supabase_client import get_supabase_service
from app.config import get_settings

async def check_user():
    service = get_supabase_service()
    settings = get_settings()
    print(f"Checking Supabase URL: {settings.supabase_url}")
    
    users = await service.select("users", filters={"email": "h4006554@gmail.com"})
    if users:
        print(f"User found: {users[0]['email']}")
        print(f"Hashed password: {users[0].get('hashed_password')}")
    else:
        print("User not found.")

if __name__ == "__main__":
    asyncio.run(check_user())
