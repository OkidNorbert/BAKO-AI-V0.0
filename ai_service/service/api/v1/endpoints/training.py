"""
Model training and improvement API endpoints.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from service.core.training_pipeline import ModelTrainingPipeline, TRAINING_CONFIG
from service.core.training_scheduler import training_scheduler

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for request/response
class TrainingRequest(BaseModel):
    training_type: str = Field(..., description="Type of training: incremental, full, or custom")
    data_days_back: int = Field(default=30, description="Number of days of data to use for training")
    force_retrain: bool = Field(default=False, description="Force retraining even if models are recent")

class TrainingResponse(BaseModel):
    status: str
    message: str
    training_id: str = None
    timestamp: datetime
    results: Dict[str, Any] = None

class ModelStatusResponse(BaseModel):
    model_name: str
    version: str
    accuracy: float
    last_trained: Optional[datetime] = None
    status: str
    metrics: Dict[str, Any]

class TrainingStatusResponse(BaseModel):
    is_running: bool
    training_status: str
    last_training: Optional[datetime] = None
    next_scheduled_training: Optional[str] = None
    scheduled_jobs: List[Dict[str, Any]]

@router.post("/train", response_model=TrainingResponse)
async def start_training(
    request: TrainingRequest,
    background_tasks: BackgroundTasks
):
    """Start model training."""
    try:
        logger.info(f"Starting {request.training_type} training...")
        
        # Create training pipeline
        pipeline = ModelTrainingPipeline(TRAINING_CONFIG)
        
        # Generate training ID
        training_id = f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Start training in background
        background_tasks.add_task(
            run_training_task,
            pipeline,
            request.training_type,
            request.data_days_back,
            training_id
        )
        
        return TrainingResponse(
            status="started",
            message=f"{request.training_type} training started",
            training_id=training_id,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Failed to start training: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start training: {str(e)}"
        )

async def run_training_task(
    pipeline: ModelTrainingPipeline,
    training_type: str,
    data_days_back: int,
    training_id: str
):
    """Background task for running training."""
    try:
        logger.info(f"Running training task {training_id}")
        
        # Collect training data
        training_data = pipeline.collect_training_data(days_back=data_days_back)
        
        # Run training pipeline
        results = pipeline.run_training_pipeline()
        
        logger.info(f"Training task {training_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Training task {training_id} failed: {str(e)}")

@router.post("/train/manual", response_model=TrainingResponse)
async def trigger_manual_training(
    training_type: str = "incremental"
):
    """Manually trigger training."""
    try:
        logger.info(f"Manually triggering {training_type} training...")
        
        # Trigger manual training
        result = await training_scheduler.trigger_manual_training(training_type)
        
        if result['status'] == 'error':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['message']
            )
        
        return TrainingResponse(
            status=result['status'],
            message=result['message'],
            timestamp=datetime.now(),
            results=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Manual training failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manual training failed: {str(e)}"
        )

@router.get("/status", response_model=TrainingStatusResponse)
async def get_training_status():
    """Get current training status."""
    try:
        status_info = training_scheduler.get_training_status()
        
        return TrainingStatusResponse(
            is_running=status_info['is_running'],
            training_status=status_info['training_status'],
            last_training=datetime.fromisoformat(status_info['last_training']) if status_info['last_training'] else None,
            next_scheduled_training=status_info['next_scheduled_training'],
            scheduled_jobs=status_info['scheduled_jobs']
        )
        
    except Exception as e:
        logger.error(f"Failed to get training status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get training status: {str(e)}"
        )

@router.get("/models/status", response_model=List[ModelStatusResponse])
async def get_models_status():
    """Get status of all trained models."""
    try:
        models_status = []
        
        # Check each model
        model_files = [
            ('pose_model', 'pose_model.joblib'),
            ('object_detection', 'object_detection_model.pt'),
            ('performance_predictor', 'performance_predictor.joblib'),
            ('event_classifier', 'event_classifier.joblib')
        ]
        
        for model_name, filename in model_files:
            model_path = f"/app/models/{filename}"
            
            # Check if model exists
            import os
            if os.path.exists(model_path):
                # Get model info
                stat = os.stat(model_path)
                last_modified = datetime.fromtimestamp(stat.st_mtime)
                
                models_status.append(ModelStatusResponse(
                    model_name=model_name,
                    version="1.0.0",  # This would be dynamic in production
                    accuracy=0.85,  # This would be loaded from model metadata
                    last_trained=last_modified,
                    status="ready",
                    metrics={
                        'file_size': stat.st_size,
                        'last_modified': last_modified.isoformat()
                    }
                ))
            else:
                models_status.append(ModelStatusResponse(
                    model_name=model_name,
                    version="0.0.0",
                    accuracy=0.0,
                    last_trained=None,
                    status="not_found",
                    metrics={}
                ))
        
        return models_status
        
    except Exception as e:
        logger.error(f"Failed to get models status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get models status: {str(e)}"
        )

@router.post("/scheduler/start")
async def start_scheduler():
    """Start the training scheduler."""
    try:
        await training_scheduler.start_scheduler()
        
        return {
            "status": "success",
            "message": "Training scheduler started",
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scheduler: {str(e)}"
        )

@router.post("/scheduler/stop")
async def stop_scheduler():
    """Stop the training scheduler."""
    try:
        await training_scheduler.stop_scheduler()
        
        return {
            "status": "success",
            "message": "Training scheduler stopped",
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to stop scheduler: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop scheduler: {str(e)}"
        )

@router.get("/metrics")
async def get_training_metrics():
    """Get training metrics and history."""
    try:
        # This would typically load from a database
        metrics = {
            "training_history": {
                "pose_accuracy": [0.85, 0.87, 0.89, 0.91],
                "object_detection_map": [0.75, 0.77, 0.79, 0.81],
                "performance_r2": [0.82, 0.84, 0.86, 0.88],
                "event_precision": [0.78, 0.80, 0.82, 0.84]
            },
            "data_quality": {
                "freshness_score": 0.95,
                "completeness_score": 0.92,
                "consistency_score": 0.88,
                "accuracy_score": 0.90
            },
            "training_frequency": {
                "daily_training": True,
                "weekly_retraining": True,
                "evaluation_interval": "6 hours"
            }
        }
        
        return metrics
        
    except Exception as e:
        logger.error(f"Failed to get training metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get training metrics: {str(e)}"
        )

@router.post("/evaluate")
async def run_model_evaluation():
    """Run model evaluation."""
    try:
        logger.info("Running model evaluation...")
        
        # Create training pipeline
        pipeline = ModelTrainingPipeline(TRAINING_CONFIG)
        
        # Collect test data
        test_data = pipeline.collect_training_data(days_back=7)
        
        # Run evaluation
        evaluation_results = pipeline.evaluate_models(test_data)
        
        return {
            "status": "success",
            "message": "Model evaluation completed",
            "results": evaluation_results,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Model evaluation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model evaluation failed: {str(e)}"
        )
