import asyncio
from app.services.supabase_client import get_supabase_service
from app.core.security import get_password_hash

async def reset_password():
    service = get_supabase_service()
    email = "h4006554@gmail.com"
    new_password = "password123"
    hashed = get_password_hash(new_password)
    
    users = await service.select("users", filters={"email": email})
    if users:
        user_id = users[0]["id"]
        print(f"Updating user {email} (ID: {user_id})")
        await service.update("users", user_id, {"hashed_password": hashed})
        print("Password updated to 'password123'")
    else:
        print(f"User {email} not found.")

if __name__ == "__main__":
    asyncio.run(reset_password())
