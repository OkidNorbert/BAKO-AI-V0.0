"""
Team management API endpoints (TEAM accounts only).
"""
from uuid import uuid4
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import require_team_account, get_supabase
from app.models.team import (
    OrganizationCreate,
    OrganizationUpdate,
    Organization,
    OrganizationWithStats,
    OrganizationListResponse,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()


@router.post("", response_model=Organization, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Create a new organization (team).
    
    **Requires TEAM account.**
    """
    org_id = str(uuid4())
    
    org_record = {
        "id": org_id,
        "name": org_data.name,
        "description": org_data.description,
        "logo_url": org_data.logo_url,
        "owner_id": current_user["id"],
    }
    
    await supabase.insert("organizations", org_record)
    
    return Organization(**org_record, created_at=datetime.utcnow())


@router.get("", response_model=OrganizationListResponse)
async def list_organizations(
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    List organizations owned by the current user.
    
    **Requires TEAM account.**
    """
    orgs = await supabase.select(
        "organizations",
        filters={"owner_id": current_user["id"]},
        order_by="created_at",
        ascending=False,
    )
    
    return OrganizationListResponse(
        organizations=[Organization(**o) for o in orgs],
        total=len(orgs),
    )


@router.get("/{org_id}", response_model=OrganizationWithStats)
async def get_organization(
    org_id: str,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get organization details with statistics.
    
    **Requires TEAM account.**
    """
    org = await supabase.select_one("organizations", org_id)
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if org["owner_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization"
        )
    
    # Get stats
    players = await supabase.select("players", filters={"organization_id": org_id})
    videos = await supabase.select("videos", filters={"organization_id": org_id})
    
    return OrganizationWithStats(
        **org,
        player_count=len(players),
        video_count=len(videos),
        total_analysis_count=len([v for v in videos if v.get("status") == "completed"]),
    )


@router.put("/{org_id}", response_model=Organization)
async def update_organization(
    org_id: str,
    update_data: OrganizationUpdate,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Update organization details.
    
    **Requires TEAM account.**
    """
    org = await supabase.select_one("organizations", org_id)
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if org["owner_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this organization"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated = await supabase.update("organizations", org_id, update_dict)
    
    return Organization(**updated)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: str,
    current_user: dict = Depends(require_team_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Delete an organization and all associated data.
    
    **Requires TEAM account.**
    """
    org = await supabase.select_one("organizations", org_id)
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if org["owner_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this organization"
        )
    
    # Best-effort cascade delete associated data
    videos = await supabase.select("videos", filters={"organization_id": org_id})
    video_ids = [v.get("id") for v in videos if v.get("id")]

    # Delete analysis/detections/analytics linked to videos
    for vid in video_ids:
        try:
            await supabase.delete_where("analysis_results", {"video_id": vid})
        except Exception:
            pass
        try:
            await supabase.delete_where("detections", {"video_id": vid})
        except Exception:
            pass
        try:
            await supabase.delete_where("analytics", {"video_id": vid})
        except Exception:
            pass
        try:
            await supabase.delete("videos", vid)
        except Exception:
            pass

    # Delete players for the org
    players = await supabase.select("players", filters={"organization_id": org_id})
    player_ids = [p.get("id") for p in players if p.get("id")]
    for pid in player_ids:
        try:
            await supabase.delete_where("analytics", {"player_id": pid})
        except Exception:
            pass
        try:
            await supabase.delete("players", pid)
        except Exception:
            pass

    await supabase.delete("organizations", org_id)
    
    return None
