"""
Player Portal API endpoints (for Personal/Individual Player Users).
"""
import os
from uuid import uuid4
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File

from app.dependencies import require_personal_account, get_supabase, get_current_user
from app.services.supabase_client import SupabaseService
from app.models.player import Player, PlayerCreate, PlayerUpdate
from app.models.schedule import Schedule
from app.models.notification import Notification

router = APIRouter()

@router.get("/debug-portal")
async def debug_portal():
    return {"status": "portal-registered"}

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
    Always prefers the player record that has an organization_id.
    """
    players = await supabase.select("players", filters={"user_id": current_user["id"]})
    if not players:
        return []

    # If multiple player records exist, prefer the one with an organization_id
    linked = [p for p in players if p.get("organization_id")]
    player = linked[0] if linked else players[0]

    org_id = player.get("organization_id")

    if org_id:
        schedule = await supabase.select("schedules", filters={"organization_id": org_id})
    else:
        schedule = []

    return schedule or []

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


@router.get("/training-videos")
async def get_training_videos(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Alias for /training to satisfy frontend PlayerDashboard.
    """
    try:
        videos = await supabase.select("videos", filters={"uploader_id": current_user["id"]})
        return videos or []
    except Exception as e:
        print(f"Error fetching training videos: {e}")
        return []


@router.get("/training-history")
async def get_training_history(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get training history for the player including activities and personal analyses.
    """
    try:
        players = await supabase.select("players", filters={"user_id": current_user["id"]})
        player_id = players[0]["id"] if players else None
        
        history = []
        
        # 1. Fetch manual activities
        if player_id:
            activities = await supabase.select("activities", filters={"player_id": player_id})
            for act in activities:
                history.append({
                    "id": act.get("id"),
                    "type": act.get("type", "training"),
                    "title": act.get("title", "Practice Session"),
                    "date": act.get("date"),
                    "duration": act.get("duration"),
                    "category": "Manual"
                })
        
        # 2. Fetch personal analyses
        analyses = await supabase.select("personal_analyses", filters={"user_id": current_user["id"]})
        for row in analyses:
            results = row.get("results_json") or {}
            if isinstance(results, str):
                try: import json; results = json.loads(results);
                except: results = {}
            
            history.append({
                "id": row.get("id"),
                "type": "shooting",
                "title": f"Shot Analysis: {results.get('shots_made', 0)}/{results.get('shots_total', 0)}",
                "date": row.get("created_at"),
                "duration": "15 min", # Estimated
                "category": "AI Analysis",
                "outcome": results.get("made_percentage")
            })
            
        # Sort by date descending
        history.sort(key=lambda x: x["date"] or "", reverse=True)
        return history
    except Exception as e:
        print(f"Error fetching training history: {e}")
        return []

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


@router.get("/performance-metrics")
async def get_performance_metrics(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get real performance metrics aggregated from personal analyses and activities.
    """
    try:
        analyses = await supabase.select("personal_analyses", filters={"user_id": current_user["id"]})
        activities = await supabase.select("activities", filters={"player_id": current_user["id"]}) # Assuming player_id is user_id in some contexts, adjust if needed
        
        # Pull basic player info to get session count if activities are stored elsewhere
        players = await supabase.select("players", filters={"user_id": current_user["id"]})
        player_id = players[0]["id"] if players else None
        
        if player_id:
            activities = await supabase.select("activities", filters={"player_id": player_id})
        
        total_shots = 0
        total_made = 0
        total_form_score = 0
        completed_analyses = 0
        
        for row in analyses:
            results = row.get("results_json") or {}
            # Handle if nested string
            if isinstance(results, str):
                try: import json; results = json.loads(results)
                except: results = {}
            
            if results.get("status") == "completed":
                total_shots += results.get("shots_total", 0)
                total_made += results.get("shots_made", 0)
                
                # Simple form score: 100 for GOOD FORM, 60 for NEEDS WORK
                reports = results.get("shot_reports", [])
                if reports:
                    score = sum(100 if r.get("verdict") == "GOOD FORM" else 60 for r in reports) / len(reports)
                    total_form_score += score
                    completed_analyses += 1

        accuracy = (total_made / total_shots * 100) if total_shots > 0 else 0
        overall_rating = (total_form_score / completed_analyses) if completed_analyses > 0 else 0
        
        return {
            "shootingAccuracy": round(accuracy, 1),
            "overallRating": round(overall_rating, 1),
            "weeklyStats": {
                "sessionsCompleted": len(activities) + len(analyses),
                "training_sessions": len(activities) + len(analyses),
                "minutesTrained": (len(activities) + len(analyses)) * 30,
                "training_minutes": (len(activities) + len(analyses)) * 30,
                "distance": 0.45 * (len(activities) + len(analyses)), # Est km
                "shotsAttempted": total_shots,
                "shotsMade": total_made
            }
        }
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR aggregating performance metrics: {e}")
        print(traceback.format_exc())
        return {
            "shootingAccuracy": 0, "overallRating": 0,
            "weeklyStats": {"sessionsCompleted": 0, "minutesTrained": 0, "shotsAttempted": 0, "shotsMade": 0}
        }


@router.get("/skill-trends")
async def get_skill_trends(
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get actual skill improvement trends from historical analysis data.
    """
    try:
        analyses = await supabase.select("personal_analyses", filters={"user_id": current_user["id"]})
        
        shooting_points = []
        for row in sorted(analyses, key=lambda x: x["created_at"]):
            results = row.get("results_json") or {}
            if isinstance(results, str):
                try: import json; results = json.loads(results);
                except: results = {}
            
            if results.get("status") == "completed":
                shooting_points.append(results.get("made_percentage", 0))
                
        # If we have too many points, sample or slice
        shooting_points = shooting_points[-12:] # Last 12 sessions
        
        # If we have no data, return empty or mock if requested (usually empty is better for "Real Data")
        return {
            "shooting": shooting_points,
            "dribbling": [],
            "defense": [],
            "fitness": []
        }
    except Exception as e:
        print(f"Error fetching trends: {e}")
        return {"shooting": [], "dribbling": [], "defense": [], "fitness": []}


@router.get("/skills")
async def get_skills_analytics(
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    current_user: dict = Depends(require_personal_account),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get detailed skill analytics based on real personal analysis reports.
    """
    try:
        analyses = await supabase.select("personal_analyses", filters={"user_id": current_user["id"]})
        
        skills_data = []
        shooting_scores = []
        
        # Use latest analyses to build the report
        for row in analyses[-10:]: # Look at last 10
            results = row.get("results_json") or {}
            if isinstance(results, str):
                try: import json; results = json.loads(results)
                except: results = {}
            
            if results.get("status") == "completed":
                accuracy = results.get("made_percentage", 0)
                shooting_scores.append(accuracy)
                
                reports = results.get("shot_reports", [])
                for r in reports:
                    skills_data.append({
                        "id": f"shot-{row['id']}-{r['shot_number']}",
                        "name": f"Shot {r['shot_number']}",
                        "category": "Shooting",
                        "score": 100 if r.get("verdict") == "GOOD FORM" else 60,
                        "feedback": r.get("issues", ["Form looking solid"]),
                        "date": row.get("created_at"),
                        "videoUrl": results.get("annotated_video_url"),
                        "analysisData": results # Pass full results for AICoachFeedback
                    })

        avg_shooting = sum(shooting_scores) / len(shooting_scores) if shooting_scores else 0
        
        return {
            "skills": skills_data,
            "summary": {
                "overall": round(avg_shooting * 0.8, 1),
                "shooting": round(avg_shooting, 1),
                "defense": 0,
                "training_sessions": len(analyses),
                "training_minutes": len(analyses) * 30,
                "distance": 0.45 * len(analyses)
            }
        }
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR fetching real skills: {e}")
        print(traceback.format_exc())
        return {"skills": [], "summary": {"overall": 0, "shooting": 0, "defense": 0}}

@router.post("/profile/image")
async def upload_profile_image(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Upload a profile picture for the current user/player.
    Saves the file locally and returns the public URL.
    """
    # Validate file type
    valid_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in valid_types:
        raise HTTPException(status_code=400, detail="Only image files (JPG, PNG, GIF, WEBP) are allowed")
    
    # Read file content
    content = await image.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="Image size must be less than 5MB")
    
    # Build a safe filename and storage path
    ext = os.path.splitext(image.filename or "avatar.jpg")[1] or ".jpg"
    safe_filename = f"{current_user['id']}_avatar{ext}"
    avatars_dir = os.path.join("./uploads", "avatars")
    os.makedirs(avatars_dir, exist_ok=True)
    file_path = os.path.join(avatars_dir, safe_filename)
    
    # Write the file to disk
    with open(file_path, "wb") as f:
        f.write(content)
    
    # The public URL served by the backend static file server
    image_url = f"/uploads/avatars/{safe_filename}"
    
    # Update user avatar_url
    try:
        await supabase.update("users", current_user["id"], {"avatar_url": image_url})
    except Exception as e:
        print(f"Warning: Failed to update user avatar_url: {e}")
    
    # If the user has a player profile, update that too
    try:
        players = await supabase.select("players", filters={"user_id": current_user["id"]})
        for player in players:
            await supabase.update("players", player["id"], {"avatar_url": image_url})
    except Exception as e:
        print(f"Warning: Failed to update player avatar_url: {e}")
    
    return {"imageUrl": image_url}


@router.get("/profile")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get the current user's profile, merging user and player table data.
    Auto-creates player record if missing.
    """
    try:
        user = await supabase.select_one("users", current_user["id"])
        if not user:
            # Fallback to current_user info if no record in users table yet
            user = {
                "id": current_user["id"],
                "email": current_user["email"],
                "full_name": current_user.get("full_name", "Athlete")
            }
        
        # Ensure full_name is present (might be fullName in some DB views)
        if "fullName" in user and "full_name" not in user:
            user["full_name"] = user["fullName"]

        players = await supabase.select("players", filters={"user_id": current_user["id"]})
        player = players[0] if players else None
        
        if not player:
            # Auto-create basic player record if missing
            new_player = {
                "user_id": current_user["id"],
                "name": user.get("full_name") or user.get("fullName") or "New Athlete",
                "email": user.get("email"),
                "status": "active",
                "created_at": datetime.utcnow().isoformat()
            }
            try:
                player = await supabase.insert("players", new_player)
            except Exception as pe:
                print(f"Failed to auto-create player record: {pe}")
        
        return {"user": user, "player": player}
    except Exception as e:
        import traceback
        print(f"Error in get_profile: {e}")
        print(traceback.format_exc())
        return {"user": None, "player": None}

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
