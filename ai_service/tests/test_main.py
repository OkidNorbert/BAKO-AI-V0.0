"""
Test AI service main endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from service.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Basketball Performance System AI Service" in response.json()["message"]


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_models_health_endpoint():
    """Test models health endpoint."""
    response = client.get("/api/v1/health/models")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
