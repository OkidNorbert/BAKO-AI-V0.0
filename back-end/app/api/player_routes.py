"""
Player Portal API endpoints (for Personal/Individual Player Users).
"""
from uuid import uuid4
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import require_personal_account, get_supabase, get_current_user
from app.services.supabase_client import SupabaseService
from app.models.player import Player, PlayerCreate, PlayerUpdate
from app.models.schedule import Schedule
from app.models.notification import Notification

router = APIRouter()

@router.get("/players")
async def get_my_player(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get the current user's player profile.
    """
    players = await supabase.select("players", filters={"user_id": current_user["id"]})
    if not players:
        return [] # Or raise 404? Frontend expects list?
    return players

@router.get("/players/{player_id}")
async def get_player_by_id(
    player_id: str,
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get generic player information.
    Currently used in personal dashboard too.
    """
    player = await supabase.select_one("players", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    # Security check: must be the user's player
    if player.get("user_id") != current_user["id"]:
         raise HTTPException(status_code=403, detail="Access denied")
         
    return player

@router.post("/players/{player_id}/activities")
async def add_player_activity(
    player_id: str,
    activity_data: dict, # Using dict for flexibility or could use Pydantic model
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    player = await supabase.select_one("players", player_id)
    if not player or player.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    activity_record = activity_data.copy()
    activity_record["player_id"] = player_id
    activity_record["id"] = str(uuid4())
    if "date" not in activity_record:
        activity_record["date"] = datetime.utcnow().isoformat()
        
    saved = await supabase.insert("activities", activity_record)
    return saved

@router.get("/players/{player_id}/activities")
async def get_player_activities(
    player_id: str,
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    player = await supabase.select_one("players", player_id)
    if not player or player.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    activities = await supabase.select("activities", filters={"player_id": player_id}, order_by="date", ascending=False)
    return activities

@router.get("/schedule")
async def get_schedule(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get schedule for the player.
    Includes personal events + team events if they belong to a team.
    """
    players = await supabase.select("players", filters={"user_id": current_user["id"]})
    if not players:
        return []
    
    player = players[0]
    org_id = player.get("organization_id")
    
    start_time_column = "start_time" # Assuming column exists
    
    # Simple query: if org_id, fetch org schedule.
    if org_id:
        schedule = await supabase.select("schedules", filters={"organization_id": org_id})
    else:
        schedule = []
        
    return schedule

@router.get("/training")
async def get_training_sessions(
    date: Optional[str] = None,
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get training sessions (videos) for a specific date or all.
    """
    filters = {"uploader_id": current_user["id"]}
    # If date provided, filter by created_at range
    
    videos = await supabase.select("videos", filters=filters)
    
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            videos = [v for v in videos if datetime.fromisoformat(v["created_at"].replace("Z", "+00:00")).date() == target_date]
        except ValueError:
            pass # Ignore invalid date
            
    return videos

@router.post("/training")
async def log_training(
    training_data: dict, 
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Log a manual training session.
    (Currently just a placeholder or could store in a separate table or events)
    """
    # For now, maybe just return success mock
    return {"message": "Training logged", "id": str(uuid4())}

@router.get("/notifications")
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    notifs = await supabase.select("notifications", filters={"recipient_id": current_user["id"]})
    return notifs

@router.put("/notifications/{notification_id}/read")
async def mark_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    await supabase.update("notifications", notification_id, {"read": True})
    return {"message": "Marked as read"}

@router.put("/notifications/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    # This might need a custom query or loop
    notifs = await supabase.select("notifications", filters={"recipient_id": current_user["id"], "read": False})
    for n in notifs:
         await supabase.update("notifications", n["id"], {"read": True})
    return {"message": "All marked as read"}

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    await supabase.delete("notifications", notification_id)
    return {"message": "Deleted"}

@router.get("/profile")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    user = await supabase.select_one("users", current_user["id"])
    players = await supabase.select("players", filters={"user_id": current_user["id"]})
    player = players[0] if players else None
    
    return {"user": user, "player": player}

@router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    if "user" in profile_data:
         await supabase.update("users", current_user["id"], profile_data["user"])
    
    if "player" in profile_data:
        players = await supabase.select("players", filters={"user_id": current_user["id"]})
        if players:
             await supabase.update("players", players[0]["id"], profile_data["player"])
             
    return {"message": "Updated"}
