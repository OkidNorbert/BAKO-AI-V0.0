"""
Job status tracking endpoints.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.core.dependencies import get_current_user
from app.models.user import User
from app.core.celery_app import celery_app

router = APIRouter()

@router.get("/{job_id}")
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a background job.
    
    Args:
        job_id: Celery task ID
        current_user: Current authenticated user
    
    Returns:
        Job status and result information
    """
    try:
        # Get task result from Celery
        task_result = celery_app.AsyncResult(job_id)
        
        if task_result.state == "PENDING":
            response = {
                "job_id": job_id,
                "status": "pending",
                "message": "Job is waiting to be processed"
            }
        elif task_result.state == "PROGRESS":
            response = {
                "job_id": job_id,
                "status": "processing",
                "progress": task_result.info.get("current", 0),
                "total": task_result.info.get("total", 100),
                "message": task_result.info.get("status", "Processing...")
            }
        elif task_result.state == "SUCCESS":
            response = {
                "job_id": job_id,
                "status": "completed",
                "result": task_result.result,
                "message": "Job completed successfully"
            }
        elif task_result.state == "FAILURE":
            response = {
                "job_id": job_id,
                "status": "failed",
                "error": str(task_result.info),
                "message": "Job failed"
            }
        else:
            response = {
                "job_id": job_id,
                "status": task_result.state.lower(),
                "message": f"Job status: {task_result.state}"
            }
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting job status: {str(e)}"
        )

@router.delete("/{job_id}")
async def cancel_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a background job.
    
    Args:
        job_id: Celery task ID
        current_user: Current authenticated user
    
    Returns:
        Cancellation status
    """
    try:
        # Revoke the task
        celery_app.control.revoke(job_id, terminate=True)
        
        return {
            "job_id": job_id,
            "status": "cancelled",
            "message": "Job cancellation requested"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling job: {str(e)}"
        )

