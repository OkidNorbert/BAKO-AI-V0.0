import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.dependencies import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

class TrainingPlanResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    difficulty: str
    duration: int
    frequency: str
    created_at: str
    assigned_players: int
    completion_rate: float
    status: str

class CreateTrainingPlanRequest(BaseModel):
    name: str
    description: str
    category: str
    difficulty: str
    duration: int
    frequency: str

@router.get("/team/plans", response_model=List[TrainingPlanResponse])
async def get_team_training_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all training plans for the coach's team
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can access team training plans"
            )
        
        # Get training plans with assignment and completion data
        try:
            plans_query = """
            SELECT 
                tp.id,
                tp.name,
                tp.description,
                tp.category,
                tp.difficulty,
                tp.duration,
                tp.frequency,
                tp.created_at,
                tp.status,
                COUNT(DISTINCT ta.player_id) as assigned_players,
                AVG(ta.completion_rate) as avg_completion_rate
            FROM training_plans tp
            LEFT JOIN training_assignments ta ON tp.id = ta.training_plan_id
            WHERE tp.coach_id = :coach_id OR tp.coach_id IS NULL
            GROUP BY tp.id, tp.name, tp.description, tp.category, tp.difficulty, 
                     tp.duration, tp.frequency, tp.created_at, tp.status
            ORDER BY tp.created_at DESC
            """
            
            plans = db.execute(plans_query, {"coach_id": current_user.id}).fetchall()
        except Exception as e:
            logger.error(f"Database query failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Training plans service is currently unavailable. Please try again later."
            )
        
        training_plans = []
        for plan in plans:
            training_plans.append(TrainingPlanResponse(
                id=plan.id,
                name=plan.name,
                description=plan.description,
                category=plan.category,
                difficulty=plan.difficulty,
                duration=plan.duration,
                frequency=plan.frequency,
                created_at=plan.created_at.isoformat() if plan.created_at else None,
                assigned_players=plan.assigned_players or 0,
                completion_rate=round(plan.avg_completion_rate or 0, 1),
                status=plan.status or 'draft'
            ))
        
        return training_plans
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 503 from database errors)
        raise
    except Exception as e:
        logger.error(f"Error fetching team training plans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team training plans: {str(e)}"
        )

@router.post("/team/plans", response_model=TrainingPlanResponse)
async def create_training_plan(
    plan_data: CreateTrainingPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new training plan
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can create training plans"
            )
        
        # Create new training plan
        create_query = """
        INSERT INTO training_plans (name, description, category, difficulty, duration, frequency, coach_id, status, created_at)
        VALUES (:name, :description, :category, :difficulty, :duration, :frequency, :coach_id, 'draft', :created_at)
        RETURNING id, created_at
        """
        
        result = db.execute(create_query, {
            "name": plan_data.name,
            "description": plan_data.description,
            "category": plan_data.category,
            "difficulty": plan_data.difficulty,
            "duration": plan_data.duration,
            "frequency": plan_data.frequency,
            "coach_id": current_user.id,
            "created_at": datetime.now()
        }).fetchone()
        
        db.commit()
        
        return TrainingPlanResponse(
            id=result.id,
            name=plan_data.name,
            description=plan_data.description,
            category=plan_data.category,
            difficulty=plan_data.difficulty,
            duration=plan_data.duration,
            frequency=plan_data.frequency,
            created_at=result.created_at.isoformat(),
            assigned_players=0,
            completion_rate=0.0,
            status='draft'
        )
        
    except Exception as e:
        logger.error(f"Error creating training plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create training plan: {str(e)}"
        )

@router.put("/team/plans/{plan_id}")
async def update_training_plan(
    plan_id: int,
    plan_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a training plan
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can update training plans"
            )
        
        # Update training plan
        update_query = """
        UPDATE training_plans 
        SET name = :name,
            description = :description,
            category = :category,
            difficulty = :difficulty,
            duration = :duration,
            frequency = :frequency,
            status = :status
        WHERE id = :plan_id AND coach_id = :coach_id
        """
        
        db.execute(update_query, {
            "plan_id": plan_id,
            "coach_id": current_user.id,
            "name": plan_data.get("name"),
            "description": plan_data.get("description"),
            "category": plan_data.get("category"),
            "difficulty": plan_data.get("difficulty"),
            "duration": plan_data.get("duration"),
            "frequency": plan_data.get("frequency"),
            "status": plan_data.get("status", "draft")
        })
        db.commit()
        
        return {"message": "Training plan updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating training plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update training plan: {str(e)}"
        )

@router.delete("/team/plans/{plan_id}")
async def delete_training_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a training plan
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can delete training plans"
            )
        
        # Delete training plan
        delete_query = """
        DELETE FROM training_plans 
        WHERE id = :plan_id AND coach_id = :coach_id
        """
        
        result = db.execute(delete_query, {
            "plan_id": plan_id,
            "coach_id": current_user.id
        })
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Training plan not found"
            )
        
        db.commit()
        
        return {"message": "Training plan deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting training plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete training plan: {str(e)}"
        )

@router.post("/team/plans/{plan_id}/assign")
async def assign_training_plan(
    plan_id: int,
    player_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a training plan to players
    """
    try:
        # Check if user is a coach
        if current_user.role != 'coach':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can assign training plans"
            )
        
        # Assign training plan to players
        for player_id in player_ids:
            assign_query = """
            INSERT INTO training_assignments (training_plan_id, player_id, assigned_at, completion_rate)
            VALUES (:plan_id, :player_id, :assigned_at, 0.0)
            ON CONFLICT (training_plan_id, player_id) DO NOTHING
            """
            
            db.execute(assign_query, {
                "plan_id": plan_id,
                "player_id": player_id,
                "assigned_at": datetime.now()
            })
        
        db.commit()
        
        return {"message": f"Training plan assigned to {len(player_ids)} players"}
        
    except Exception as e:
        logger.error(f"Error assigning training plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign training plan: {str(e)}"
        )
