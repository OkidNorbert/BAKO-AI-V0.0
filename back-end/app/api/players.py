"""
Player management API endpoints.
"""
from uuid import uuid4
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import get_current_user, get_supabase
from app.models.user import AccountType
from app.models.player import (
    PlayerCreate,
    PlayerUpdate,
    Player,
    PlayerWithStats,
    PlayerListResponse,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()


@router.post("", response_model=Player, status_code=status.HTTP_201_CREATED)
async def create_player(
    player_data: PlayerCreate,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Create a new player profile.
    
    - **TEAM accounts**: Must provide organization_id
    - **PERSONAL accounts**: Player is linked to user account
    """
    player_id = str(uuid4())
    
    player_record = {
        "id": player_id,
        "name": player_data.name,
        "jersey_number": player_data.jersey_number,
        "position": player_data.position,
        "height_cm": player_data.height_cm,
        "weight_kg": player_data.weight_kg,
        "date_of_birth": str(player_data.date_of_birth) if player_data.date_of_birth else None,
    }
    
    # Handle based on account type
    if current_user.get("account_type") == AccountType.TEAM.value:
        if not player_data.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="organization_id is required for TEAM accounts"
            )
        
        # Verify org ownership
        org = await supabase.select_one("organizations", str(player_data.organization_id))
        if not org or org["owner_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this organization"
            )
        
        player_record["organization_id"] = str(player_data.organization_id)
    else:
        # PERSONAL account - link to user
        player_record["user_id"] = current_user["id"]
    
    await supabase.insert("players", player_record)
    
    return Player(**player_record, created_at=datetime.utcnow())


@router.get("", response_model=PlayerListResponse)
async def list_players(
    organization_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    List players.
    
    - **TEAM accounts**: Filter by organization_id
    - **PERSONAL accounts**: Returns the user's player profile
    """
    if current_user.get("account_type") == AccountType.TEAM.value:
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="organization_id query parameter is required for TEAM accounts"
            )
        
        # Verify org ownership
        org = await supabase.select_one("organizations", organization_id)
        if not org or org["owner_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this organization"
            )
        
        players = await supabase.select(
            "players",
            filters={"organization_id": organization_id},
            order_by="name",
        )
    else:
        # PERSONAL account
        players = await supabase.select(
            "players",
            filters={"user_id": current_user["id"]},
        )
    
    return PlayerListResponse(
        players=[Player(**p) for p in players],
        total=len(players),
    )


@router.get("/{player_id}", response_model=PlayerWithStats)
async def get_player(
    player_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get player details with statistics.
    """
    player = await supabase.select_one("players", player_id)
    
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    # Verify access
    has_access = False
    if current_user.get("account_type") == AccountType.TEAM.value:
        if player.get("organization_id"):
            org = await supabase.select_one("organizations", str(player["organization_id"]))
            has_access = org and str(org.get("owner_id")) == str(current_user["id"])
    elif current_user.get("account_type") == AccountType.COACH.value:
        player_org = player.get("organization_id")
        coach_org = current_user.get("organization_id")
        has_access = player_org and coach_org and str(player_org) == str(coach_org)
    else:
        has_access = player.get("user_id") == current_user["id"]
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this player"
        )
    
    # Data Fallback: If this is an organization-linked record, try to fill missing fields from personal profile
    if player.get("organization_id") and player.get("user_id"):
        try:
            # Get all profiles for this user
            all_user_profiles = await supabase.select("players", filters={"user_id": str(player["user_id"])})
            # Find the personal one (no organization_id)
            personal = next((p for p in all_user_profiles if not p.get("organization_id")), None)
            
            if personal:
                # Fields to potentially fallback to
                fallback_fields = [
                    "jersey_number", "position", "height_cm", "weight_kg", 
                    "date_of_birth", "avatar_url", "phone", "address", 
                    "experience_years", "bio", "status"
                ]
                for field in fallback_fields:
                    # Use personal data if team-specific data is missing or empty
                    val = player.get(field)
                    pers_val = personal.get(field)
                    if (val is None or val == "") and (pers_val is not None and pers_val != ""):
                        player[field] = pers_val
        except Exception as e:
            print(f"Warning: Failed to fetch personal profile fallback for player {player_id}: {e}")
            
    # Ensure ppg exists and is a float
    p_ppg = player.get("ppg")
    player["ppg"] = float(p_ppg) if p_ppg is not None and p_ppg != "" else 0.0
    
    # Coerce string fields that might have been stored as numbers in the DB
    if player.get("experience_years") is not None:
        player["experience_years"] = str(player["experience_years"])
    
    # Fetch email if linked to a user
    email = None
    if player.get("user_id"):
        user = await supabase.select_one("users", str(player["user_id"]))
        if user:
            email = user.get("email")
    
    # Get stats from analytics
    analytics = await supabase.select("analytics", filters={"player_id": player_id})
    
    total_distance = sum(a.get("value", 0) for a in analytics if a.get("metric_type") == "distance_km")
    speed_values = [a.get("value", 0) for a in analytics if a.get("metric_type") == "avg_speed_kmh"]
    avg_speed = sum(speed_values) / len(speed_values) if speed_values else None
    
    # Calculate unique videos
    video_ids = set(a.get("video_id") for a in analytics if a.get("video_id"))
    
    # Build the final response dict — set all stats fields directly on player dict
    # to avoid duplicate keyword argument errors when unpacking **player into the model.
    player["email"] = email
    player["total_videos"] = len(video_ids)
    player["total_training_minutes"] = 0.0
    player["total_distance_km"] = total_distance if total_distance > 0 else None
    player["avg_speed_kmh"] = avg_speed
    
    return PlayerWithStats(**player)


@router.put("/{player_id}", response_model=Player)
async def update_player(
    player_id: str,
    update_data: PlayerUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Update player profile.
    """
    player = await supabase.select_one("players", player_id)
    
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    # Verify access
    has_access = False
    if current_user.get("account_type") == AccountType.TEAM.value:
        if player.get("organization_id"):
            org = await supabase.select_one("organizations", player["organization_id"])
            has_access = org and org["owner_id"] == current_user["id"]
    elif current_user.get("account_type") == AccountType.COACH.value:
        player_org = player.get("organization_id")
        coach_org = current_user.get("organization_id")
        has_access = player_org and coach_org and str(player_org) == str(coach_org)
    else:
        has_access = player.get("user_id") == current_user["id"]
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this player"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if "date_of_birth" in update_dict and update_dict["date_of_birth"]:
        update_dict["date_of_birth"] = str(update_dict["date_of_birth"])
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated = await supabase.update("players", player_id, update_dict)
    
    return Player(**updated)
