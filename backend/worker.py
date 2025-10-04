"""
Celery worker startup script.
"""

import os
import sys
from app.core.celery_app import celery_app

if __name__ == "__main__":
    # Start Celery worker
    celery_app.worker_main([
        "worker",
        "--loglevel=info",
        "--concurrency=2",
        "--queues=video_processing,ai_analysis,celery"
    ])

