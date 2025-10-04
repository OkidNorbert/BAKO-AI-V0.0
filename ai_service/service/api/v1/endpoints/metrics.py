"""
Prometheus metrics endpoint for AI service monitoring.
"""

from fastapi import APIRouter, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

router = APIRouter()

# Define metrics
AI_REQUEST_COUNT = Counter(
    'ai_requests_total',
    'Total AI service requests',
    ['model', 'status']
)

AI_REQUEST_DURATION = Histogram(
    'ai_request_duration_seconds',
    'AI request duration in seconds',
    ['model']
)

AI_MODEL_ACCURACY = Gauge(
    'ai_model_accuracy',
    'AI model accuracy',
    ['model']
)

AI_MODEL_INFERENCE_TIME = Histogram(
    'ai_model_inference_seconds',
    'AI model inference time',
    ['model']
)

AI_GPU_USAGE = Gauge(
    'ai_gpu_usage_percent',
    'GPU usage percentage'
)

AI_MEMORY_USAGE = Gauge(
    'ai_memory_usage_bytes',
    'AI service memory usage'
)

@router.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

def record_ai_request(model: str, status: str, duration: float):
    """Record AI request metrics."""
    AI_REQUEST_COUNT.labels(model=model, status=status).inc()
    AI_REQUEST_DURATION.labels(model=model).observe(duration)

def update_model_accuracy(model: str, accuracy: float):
    """Update model accuracy."""
    AI_MODEL_ACCURACY.labels(model=model).set(accuracy)

def record_inference_time(model: str, duration: float):
    """Record model inference time."""
    AI_MODEL_INFERENCE_TIME.labels(model=model).observe(duration)

def update_gpu_usage(usage_percent: float):
    """Update GPU usage."""
    AI_GPU_USAGE.set(usage_percent)

def update_memory_usage(usage_bytes: int):
    """Update memory usage."""
    AI_MEMORY_USAGE.set(usage_bytes)
