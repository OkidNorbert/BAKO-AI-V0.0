"""
Prometheus metrics endpoint for monitoring.
"""

import time
from fastapi import APIRouter
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

router = APIRouter()

# Define metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections'
)

DATABASE_CONNECTIONS = Gauge(
    'database_connections_active',
    'Number of active database connections'
)

@router.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

def record_request(method: str, endpoint: str, status_code: int, duration: float):
    """Record request metrics."""
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status_code).inc()
    REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)

def update_active_connections(count: int):
    """Update active connections gauge."""
    ACTIVE_CONNECTIONS.set(count)

def update_database_connections(count: int):
    """Update database connections gauge."""
    DATABASE_CONNECTIONS.set(count)
