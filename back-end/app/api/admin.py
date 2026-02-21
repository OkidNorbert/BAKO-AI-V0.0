"""
Admin API endpoints (Team/Organization Management).
"""
from uuid import uuid4
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import (
    get_supabase, 
    get_current_user,
    require_team_account, 
    require_organization_admin,
    require_staff_member,
    require_linked_account
)
from app.services.supabase_client import SupabaseService
from app.models.user import User
from app.models.player import Player, PlayerCreate, PlayerUpdate
from app.models.schedule import Schedule, ScheduleCreate, ScheduleUpdate
from app.models.match import Match, MatchCreate, MatchUpdate
from app.models.notification import Notification, NotificationCreate, NotificationListResponse
from app.models.team import Organization, OrganizationUpdate

router = APIRouter()

@router.put("/organization", response_model=Organization)
async def update_organization(
    org_data: OrganizationUpdate,
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Update details of the current user's organization.
    """
    # Find organization owned by current user
    orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
    if not orgs:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org_id = orgs[0]["id"]
    update_dict = org_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    updated = await supabase.update("organizations", org_id, update_dict)
    return updated

# ============================================
# USERS & PLAYERS MANAGEMENT
# ============================================

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_data: dict,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Update a user's role (e.g. within the team context, or maybe account_type).
    """
    # Verify ownership/permission
    # Assuming this updates metadata or account_type?
    # User roles in this system seem to be 'account_type'.
    # If frontend means 'player role' (Forward, Guard), that's usually on player profile.
    # adminAPI.js calls `updateUserRole`.
    
    # If it's account_type (team/personal), that's critical.
    # If it's a team role (Captain, Starter), that's not in Users table.
    
    # Assuming it updates 'role' metadata for now.
    user_update = {"role": role_data.get("role")}
    updated = await supabase.update("users", user_id, user_update)
    return updated


@router.get("/users")
async def get_users(
    role: Optional[str] = None,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get users (players) managed by the admin/team owner.
    """
    # Determine organization_id
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
            return []
        org_id = orgs[0]["id"]
    
    # Get players in the org
    players = await supabase.select("players", filters={"organization_id": org_id})
    return players

@router.post("/players")
async def create_player(
    player_data: PlayerCreate,
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Add a new player to the team roster.
    """
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
            raise HTTPException(status_code=400, detail="No organization found for this account")
        org_id = orgs[0]["id"]
    player_dict = player_data.model_dump()
    player_dict["organization_id"] = str(org_id)
    player_dict["id"] = str(uuid4())
    player_dict["created_at"] = datetime.now().isoformat()
    
    # Handle date_of_birth if present
    if player_dict.get("date_of_birth"):
        player_dict["date_of_birth"] = player_dict["date_of_birth"].isoformat()
        
    saved = await supabase.insert("players", player_dict)
    return saved

@router.put("/players/{player_id}")
async def update_player(
    player_id: str,
    player_data: PlayerUpdate,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Update a player's profile.
    """
    # Verify ownership
    player = await supabase.select_one("players", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
    if not orgs or player.get("organization_id") != orgs[0]["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    update_dict = player_data.model_dump(exclude_unset=True)
    if "date_of_birth" in update_dict and update_dict["date_of_birth"]:
        update_dict["date_of_birth"] = update_dict["date_of_birth"].isoformat()
        
    updated = await supabase.update("players", player_id, update_dict)
    return updated

@router.get("/players")
async def get_roster(
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get team roster (alias for players).
    """
    return await get_users(role="player", current_user=current_user, supabase=supabase)

@router.patch("/players/{player_id}/status")
async def update_player_status(
    player_id: str,
    status_data: dict,
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Update player status (active/injured/etc).
    Note: status field might need to be added to players table or handled via metadata.
    """
    # Check if player belongs to owner's org
    player = await supabase.select_one("players", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
    if not orgs or player.get("organization_id") != orgs[0]["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        updated = await supabase.update("players", player_id, {"status": status_data.get("status")})
        return updated
    except Exception:
        return player


@router.delete("/players/{player_id}")
async def delete_player(
    player_id: str,
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Remove a player from the organization's roster.
    This deletes the roster entry and unlinks the user account if linked.
    """
    # 1. Get player
    player = await supabase.select_one("players", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    # 2. Get organization id
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
             raise HTTPException(status_code=404, detail="Organization not found")
        org_id = orgs[0]["id"]
        
    # 3. Verify ownership
    if player.get("organization_id") != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 4. Unlink user if associated
    linked_user_id = player.get("user_id")
    if linked_user_id:
        try:
            await supabase.update("users", str(linked_user_id), {"organization_id": None})
        except Exception as e:
            print(f"Warning: Failed to unlink user {linked_user_id}: {e}")

    # 5. Delete roster entry
    await supabase.delete("players", player_id)
    
    return {"message": "Player removed from roster and unlinked successfully"}

@router.post("/players/{player_id}/link")
async def link_player_account(
    player_id: str,
    link_data: dict,
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Link a roster player to an actual user account by email.
    If player_id is "new", it will search for the user and create a roster entry.
    """
    email = link_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # 1. Get organization
    orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
    if not orgs:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org_id = orgs[0]["id"]

    # 2. Search for user by email
    users = await supabase.select("users", filters={"email": email})
    if not users:
        raise HTTPException(status_code=404, detail=f"No account found with email {email}. The player must sign up first.")
    
    target_user = users[0]
    
    if target_user.get("organization_id") and target_user.get("organization_id") != org_id:
        raise HTTPException(status_code=400, detail="This user is already linked to another organization")

    # 3. Handle player roster entry
    if player_id == "new":
        # Check if already in roster
        existing_roster = await supabase.select("players", filters={
            "organization_id": org_id,
            "user_id": target_user["id"]
        })
        if existing_roster:
            raise HTTPException(status_code=400, detail="This player is already in your roster")
        
        # Create new roster entry
        new_player_id = str(uuid4())
        await supabase.insert("players", {
            "id": new_player_id,
            "organization_id": org_id,
            "user_id": target_user["id"],
            "name": target_user.get("full_name", "New Player"),
            "status": "active"
        })
        player_id = new_player_id
    else:
        # Verify existing player belongs to owner's org
        player = await supabase.select_one("players", player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        if player.get("organization_id") != org_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update player profile with user_id
        await supabase.update("players", player_id, {"user_id": target_user["id"]})
    
    # 4. Update user profile with organization_id
    await supabase.update("users", target_user["id"], {"organization_id": org_id})
    
    # 5. Create a notification
    try:
        await supabase.insert("notifications", {
            "id": str(uuid4()),
            "recipient_id": target_user["id"],
            "title": "Team Link",
            "message": f"You have been added to the team roster of {orgs[0].get('name', 'a team')}.",
            "type": "team_invite",
            "read": False,
            "created_at": datetime.now().isoformat()
        })
    except Exception:
        pass

    return {"message": "Account linked successfully", "user": {"id": target_user["id"], "name": target_user.get("full_name")}}

@router.get("/staff")
async def get_staff(
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get coaching staff linked to the organization.
    """
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
             return []
        org_id = orgs[0]["id"]
        
    staff = await supabase.select("users", filters={
        "organization_id": org_id,
        "account_type": "coach"
    })
    return staff



@router.post("/staff/link")
async def link_staff_member(
    link_data: dict, # email, role
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Link a coach account to the organization and assign a role.
    """
    email = link_data.get("email")
    role = link_data.get("role", "Coach")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # 1. Get organization
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
             raise HTTPException(status_code=404, detail="Organization not found")
        org_id = orgs[0]["id"]
    
    # 2. Search for user by email
    users = await supabase.select("users", filters={"email": email})
    if not users:
        raise HTTPException(status_code=404, detail=f"No account found with email {email}. The coach must sign up first.")
    
    target_user = users[0]
    
    if target_user["account_type"] != "coach":
         raise HTTPException(status_code=400, detail="This account is not a Coach account.")

    if target_user.get("organization_id") and target_user.get("organization_id") != org_id:
        raise HTTPException(status_code=400, detail="This coach is already linked to another organization")

    # 3. Update user profile
    await supabase.update("users", target_user["id"], {
        "organization_id": org_id,
        "staff_role": role
    })
    
    # 4. Create notification
    try:
        await supabase.insert("notifications", {
            "id": str(uuid4()),
            "recipient_id": target_user["id"],
            "title": "Staff Invitation",
            "message": f"You have been added as a {role} to the organization.",
            "type": "team_invite",
            "read": False,
            "created_at": datetime.now().isoformat()
        })
    except Exception:
        pass

    return {"message": "Staff member linked successfully", "user": {"id": target_user["id"], "role": role}}

@router.delete("/staff/{user_id}")
async def remove_staff_member(
    user_id: str,
    current_user: dict = Depends(require_organization_admin),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Remove a staff member from the organization.
    """
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
             raise HTTPException(status_code=404, detail="Organization not found")
        org_id = orgs[0]["id"]

    # Verify user belongs to org
    target_user = await supabase.select_one("users", user_id)
    if not target_user or target_user.get("organization_id") != org_id:
        raise HTTPException(status_code=403, detail="Access denied or user not found")

    # Unlink
    await supabase.update("users", user_id, {
        "organization_id": None,
        "staff_role": None
    })
    
    return {"message": "Staff member removed successfully"}

# ============================================
# SCHEDULE MANAGEMENT
# ============================================

@router.get("/schedule")
async def get_schedule(
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Get team schedule."""
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
            return []
        org_id = orgs[0]["id"]
        
    schedules = await supabase.select("schedules", filters={"organization_id": org_id})
    return schedules

@router.post("/schedule")
async def create_schedule_event(
    event_data: ScheduleCreate,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Create a schedule event (Coach only)."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="You must be linked to an organization")
        
    event_dict = event_data.model_dump()
    event_dict["organization_id"] = str(org_id)
    event_dict["created_by"] = current_user["id"]
    event_dict["id"] = str(uuid4())
    
    event_dict["start_time"] = event_dict["start_time"].isoformat()
    event_dict["end_time"] = event_dict["end_time"].isoformat()
    
    saved = await supabase.insert("schedules", event_dict)
    return saved

@router.put("/schedule/{event_id}")
async def update_schedule_event(
    event_id: str,
    event_data: ScheduleUpdate,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Update a schedule event (Coach only)."""
    # Verify owner's org match
    event = await supabase.select_one("schedules", event_id)
    if not event or event.get("organization_id") != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    update_dict = event_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    if "start_time" in update_dict:
        update_dict["start_time"] = update_dict["start_time"].isoformat()
    if "end_time" in update_dict:
        update_dict["end_time"] = update_dict["end_time"].isoformat()
        
    updated = await supabase.update("schedules", event_id, update_dict)
    return updated

@router.delete("/schedule/{event_id}")
async def delete_schedule_event(
    event_id: str,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Delete a schedule event (Coach only)."""
    event = await supabase.select_one("schedules", event_id)
    if not event or event.get("organization_id") != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    await supabase.delete("schedules", event_id)
    return {"message": "Event deleted"}
# ============================================
# MATCH MANAGEMENT
# ============================================

@router.get("/matches")
async def get_matches(
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Get matches for the current user's organization (Owner or Staff)."""
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
            return []
        org_id = orgs[0]["id"]
        
    matches = await supabase.select("matches", filters={"organization_id": org_id})
    return matches

@router.post("/matches")
async def create_match(
    match_data: MatchCreate,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Create a match (Coach only)."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="You must be linked to an organization")
        
    match_dict = match_data.model_dump()
    match_dict["id"] = str(uuid4())
    match_dict["organization_id"] = str(org_id)
    match_dict["date"] = match_dict["date"].isoformat()
    
    saved = await supabase.insert("matches", match_dict)
    return saved

@router.put("/matches/{match_id}")
async def update_match(
    match_id: str,
    match_data: MatchUpdate,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Update a match (Coach only)."""
    match = await supabase.select_one("matches", match_id)
    if not match or match.get("organization_id") != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    update_dict = match_data.model_dump(exclude_unset=True)
    if "date" in update_dict:
        update_dict["date"] = update_dict["date"].isoformat()
        
    updated = await supabase.update("matches", match_id, update_dict)
    return updated

@router.delete("/matches/{match_id}")
async def delete_match(
    match_id: str,
    current_user: dict = Depends(require_staff_member),
    supabase: SupabaseService = Depends(get_supabase),
):
    """Delete a match (Coach only)."""
    match = await supabase.select_one("matches", match_id)
    if not match or match.get("organization_id") != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    await supabase.delete("matches", match_id)
    return {"message": "Match deleted"}
# ============================================
# NOTIFICATIONS & STATS
# ============================================

@router.get("/notifications")
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    try:
        user_id = current_user["id"]
        # Basic validation for UUID if using Postgres
        import uuid
        try:
            uuid.UUID(str(user_id))
        except ValueError:
            # If not a UUID (like dev-id-...), return empty list instead of crashing Postgres
            return []

        notifs = await supabase.select("notifications", filters={"recipient_id": str(user_id)}, order_by="created_at")
        return notifs
    except Exception as e:
        print(f"Error in get_notifications: {e}")
        return [] # Return empty list on error to keep UI stable

@router.post("/notifications")
async def create_notification(
    notif_data: NotificationCreate,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    notif_dict = notif_data.model_dump()
    notif_dict["id"] = str(uuid4())
    saved = await supabase.insert("notifications", notif_dict)
    return saved

@router.put("/notifications/{notification_id}/mark-as-read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    updated = await supabase.update("notifications", notification_id, {"read": True})
    return updated

@router.put("/notifications/{notification_id}")
async def update_notification(
    notification_id: str,
    notification_data: NotificationCreate,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    update_dict = notification_data.model_dump(exclude_unset=True)
    updated = await supabase.update("notifications", notification_id, update_dict)
    return updated

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    await supabase.delete("notifications", notification_id)
    return {"message": "Notification deleted"}


@router.get("/stats")
async def get_stats(
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    # Mock aggregation or real counts
    org_id = current_user.get("organization_id")
    if not org_id:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if not orgs:
            return {"players": 0, "matches": 0, "wins": 0}
        org_id = orgs[0]["id"]
    players = await supabase.select("players", filters={"organization_id": org_id})
    matches = await supabase.select("matches", filters={"organization_id": org_id})
    videos = await supabase.select("videos", filters={"organization_id": org_id})
    
    return {
        "total_players": len(players),
        "total_matches": len(matches),
        "videos_analyzed": len(videos),
        "upcoming_matches": len([m for m in matches if datetime.fromisoformat(m["date"].replace("Z", "+00:00")) > datetime.utcnow().replace(tzinfo=None)]), # Simplify comparison
    }

# ============================================
# SECURITY & PROFILE 
# ============================================

@router.get("/profile")
async def get_profile(
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    # Just return user info plus org info
    user_info = current_user
    orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
    return {"user": user_info, "organization": orgs[0] if orgs else None}

@router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    # Update user or org
    if "user" in profile_data:
        await supabase.update("users", current_user["id"], profile_data["user"])
    if "organization" in profile_data:
        orgs = await supabase.select("organizations", filters={"owner_id": current_user["id"]})
        if orgs:
            await supabase.update("organizations", orgs[0]["id"], profile_data["organization"])
            
    return {"message": "Profile updated"}

@router.get("/security/settings")
async def get_security_settings(current_user: dict = Depends(get_current_user)):
    # Mock settings
    return {"two_factor_enabled": False, "login_alerts": True}

@router.put("/security/settings")
async def update_security_settings(settings: dict, current_user: dict = Depends(get_current_user)):
    # Mock update
    return settings

@router.get("/security/logs")
async def get_security_logs(current_user: dict = Depends(get_current_user)):
    # Mock logs
    return [
        {"id": 1, "action": "Login", "ip": "127.0.0.1", "timestamp": datetime.now().isoformat()},
    ]
