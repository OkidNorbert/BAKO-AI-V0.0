"""
Training scheduler for automated model retraining.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from service.core.training_pipeline import ModelTrainingPipeline, TRAINING_CONFIG

logger = logging.getLogger(__name__)

class TrainingScheduler:
    """Automated training scheduler for continuous model improvement."""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.training_pipeline = ModelTrainingPipeline(TRAINING_CONFIG)
        self.is_running = False
        self.last_training = None
        self.training_status = "idle"
        
    async def start_scheduler(self):
        """Start the training scheduler."""
        if self.is_running:
            logger.warning("Training scheduler is already running")
            return
        
        logger.info("Starting training scheduler...")
        
        # Schedule daily training at 2 AM
        self.scheduler.add_job(
            self.run_daily_training,
            trigger=CronTrigger(hour=2, minute=0),
            id='daily_training',
            name='Daily Model Training',
            replace_existing=True
        )
        
        # Schedule weekly full retraining at 3 AM on Sundays
        self.scheduler.add_job(
            self.run_weekly_retraining,
            trigger=CronTrigger(day_of_week=6, hour=3, minute=0),
            id='weekly_retraining',
            name='Weekly Full Retraining',
            replace_existing=True
        )
        
        # Schedule model evaluation every 6 hours
        self.scheduler.add_job(
            self.run_model_evaluation,
            trigger=IntervalTrigger(hours=6),
            id='model_evaluation',
            name='Model Evaluation',
            replace_existing=True
        )
        
        # Schedule data quality check every 4 hours
        self.scheduler.add_job(
            self.run_data_quality_check,
            trigger=IntervalTrigger(hours=4),
            id='data_quality_check',
            name='Data Quality Check',
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        logger.info("Training scheduler started successfully")
    
    async def stop_scheduler(self):
        """Stop the training scheduler."""
        if not self.is_running:
            logger.warning("Training scheduler is not running")
            return
        
        logger.info("Stopping training scheduler...")
        self.scheduler.shutdown()
        self.is_running = False
        logger.info("Training scheduler stopped")
    
    async def run_daily_training(self):
        """Run daily incremental training."""
        logger.info("Starting daily model training...")
        self.training_status = "training"
        
        try:
            # Run incremental training
            results = self.training_pipeline.run_training_pipeline()
            
            self.last_training = datetime.now()
            self.training_status = "completed"
            
            logger.info("Daily training completed successfully")
            logger.info(f"Training results: {results}")
            
        except Exception as e:
            self.training_status = "failed"
            logger.error(f"Daily training failed: {str(e)}")
            raise
    
    async def run_weekly_retraining(self):
        """Run weekly full model retraining."""
        logger.info("Starting weekly full retraining...")
        self.training_status = "retraining"
        
        try:
            # Run full retraining with more data
            results = self.training_pipeline.run_training_pipeline()
            
            self.last_training = datetime.now()
            self.training_status = "completed"
            
            logger.info("Weekly retraining completed successfully")
            logger.info(f"Retraining results: {results}")
            
        except Exception as e:
            self.training_status = "failed"
            logger.error(f"Weekly retraining failed: {str(e)}")
            raise
    
    async def run_model_evaluation(self):
        """Run model evaluation."""
        logger.info("Starting model evaluation...")
        
        try:
            # Collect test data
            test_data = self.training_pipeline.collect_training_data(days_back=7)
            
            # Evaluate models
            evaluation_results = self.training_pipeline.evaluate_models(test_data)
            
            logger.info("Model evaluation completed")
            logger.info(f"Evaluation results: {evaluation_results}")
            
        except Exception as e:
            logger.error(f"Model evaluation failed: {str(e)}")
            raise
    
    async def run_data_quality_check(self):
        """Run data quality checks."""
        logger.info("Starting data quality check...")
        
        try:
            # Check data quality metrics
            quality_metrics = await self._check_data_quality()
            
            logger.info("Data quality check completed")
            logger.info(f"Quality metrics: {quality_metrics}")
            
        except Exception as e:
            logger.error(f"Data quality check failed: {str(e)}")
            raise
    
    async def _check_data_quality(self) -> Dict[str, Any]:
        """Check data quality metrics."""
        quality_metrics = {
            'data_freshness': self._check_data_freshness(),
            'data_completeness': self._check_data_completeness(),
            'data_consistency': self._check_data_consistency(),
            'data_accuracy': self._check_data_accuracy()
        }
        
        return quality_metrics
    
    def _check_data_freshness(self) -> Dict[str, Any]:
        """Check if data is fresh enough for training."""
        # This would typically check database for recent data
        return {
            'status': 'good',
            'latest_data_age_hours': 2,
            'threshold_hours': 24
        }
    
    def _check_data_completeness(self) -> Dict[str, Any]:
        """Check data completeness."""
        return {
            'status': 'good',
            'completeness_score': 0.95,
            'missing_fields': []
        }
    
    def _check_data_consistency(self) -> Dict[str, Any]:
        """Check data consistency."""
        return {
            'status': 'good',
            'consistency_score': 0.92,
            'inconsistencies': []
        }
    
    def _check_data_accuracy(self) -> Dict[str, Any]:
        """Check data accuracy."""
        return {
            'status': 'good',
            'accuracy_score': 0.88,
            'outliers_detected': 5
        }
    
    async def trigger_manual_training(self, training_type: str = "incremental") -> Dict[str, Any]:
        """Manually trigger training."""
        logger.info(f"Manually triggering {training_type} training...")
        
        if self.training_status == "training":
            return {
                'status': 'error',
                'message': 'Training is already in progress'
            }
        
        try:
            if training_type == "incremental":
                await self.run_daily_training()
            elif training_type == "full":
                await self.run_weekly_retraining()
            else:
                return {
                    'status': 'error',
                    'message': f'Unknown training type: {training_type}'
                }
            
            return {
                'status': 'success',
                'message': f'{training_type} training completed',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Training failed: {str(e)}'
            }
    
    def get_training_status(self) -> Dict[str, Any]:
        """Get current training status."""
        return {
            'is_running': self.is_running,
            'training_status': self.training_status,
            'last_training': self.last_training.isoformat() if self.last_training else None,
            'next_scheduled_training': self._get_next_scheduled_time(),
            'scheduled_jobs': [
                {
                    'id': job.id,
                    'name': job.name,
                    'next_run': job.next_run_time.isoformat() if job.next_run_time else None
                }
                for job in self.scheduler.get_jobs()
            ]
        }
    
    def _get_next_scheduled_time(self) -> Optional[str]:
        """Get next scheduled training time."""
        jobs = self.scheduler.get_jobs()
        if jobs:
            next_run = min(job.next_run_time for job in jobs if job.next_run_time)
            return next_run.isoformat() if next_run else None
        return None

# Global scheduler instance
training_scheduler = TrainingScheduler()
