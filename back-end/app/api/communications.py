from uuid import uuid4
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import (
    get_supabase, 
    get_current_user,
    require_team_account,
    require_staff_member,
    require_linked_account
)
from app.services.supabase_client import SupabaseService
from app.models.communication import Announcement, AnnouncementCreate, AnnouncementListResponse

router = APIRouter()

@router.get("/announcements", response_model=AnnouncementListResponse)
async def get_announcements(
    current_user: dict = Depends(require_linked_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get all announcements for the user's organization.
    Accessible by Team Owners, Coaches, and Linked Players.
    """
    org_id = current_user.get("organization_id")
    if not org_id:
        # Fallback for Owners if not in token
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
            return AnnouncementListResponse(announcements=[], total=0)
        org_id = orgs[0]["id"]

    announcements_data = await supabase.select(
        "announcements", 
        filters={"organization_id": org_id},
        order_by="created_at",
        ascending=False
    )
    
    # Enrich with author name if needed (optional)
    announcements = []
    for item in announcements_data:
        announcement = Announcement(**item)
        # Fetch author name for UI
        author = await supabase.select_one("users", str(item["author_id"]))
        if author:
            announcement.author_name = author.get("full_name") or author.get("email")
        announcements.append(announcement)

    return AnnouncementListResponse(announcements=announcements, total=len(announcements))

@router.post("/announcements", response_model=Announcement, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreate,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Create a new announcement for the organization.
    Restricted to Coaching Staff (per user request).
    """
    org_id = current_user.get("organization_id")
    if not org_id:
         raise HTTPException(status_code=403, detail="You must be linked to an organization")
    
    announcement_id = str(uuid4())
    record = {
        "id": announcement_id,
        "organization_id": org_id,
        "author_id": current_user["id"],
        "title": data.title,
        "content": data.content,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    saved = await supabase.insert("announcements", record)
    
    # Create notifications for all players in the roster
    try:
        players = await supabase.select("players", filters={"organization_id": org_id})
        for player in players:
            if player.get("user_id"):
                await supabase.insert("notifications", {
                    "id": str(uuid4()),
                    "recipient_id": player["user_id"],
                    "title": f"New Announcement: {data.title}",
                    "message": f"Coach {current_user.get('email')} posted a new announcement.",
                    "type": "announcement",
                    "read": False,
                    "created_at": datetime.now().isoformat()
                })
    except Exception as e:
        print(f"Warning: Failed to send announcement notifications: {e}")

    return Announcement(**saved)

@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Delete an announcement.
    Restricted to Coaches.
    """
    org_id = current_user.get("organization_id")
    announcement = await supabase.select_one("announcements", announcement_id)
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    if str(announcement["organization_id"]) != str(org_id):
        raise HTTPException(status_code=403, detail="Access denied")
        
    await supabase.delete("announcements", announcement_id)
    return None
