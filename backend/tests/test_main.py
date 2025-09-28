"""
Test main application endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models import *

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Basketball Performance System API" in response.json()["message"]


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_api_health_endpoint():
    """Test API health endpoint."""
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_auth_signup():
    """Test user signup."""
    response = client.post("/api/v1/auth/signup", json={
        "email": "test@example.com",
        "password": "testpassword123",
        "role": "player"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == "player"


def test_auth_login():
    """Test user login."""
    # First signup
    client.post("/api/v1/auth/signup", json={
        "email": "login@example.com",
        "password": "testpassword123",
        "role": "player"
    })
    
    # Then login
    response = client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_auth_login_invalid():
    """Test login with invalid credentials."""
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_protected_endpoint_without_token():
    """Test accessing protected endpoint without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403


def test_protected_endpoint_with_token():
    """Test accessing protected endpoint with valid token."""
    # Signup and get token
    signup_response = client.post("/api/v1/auth/signup", json={
        "email": "protected@example.com",
        "password": "testpassword123",
        "role": "player"
    })
    token = signup_response.json()["access_token"]
    
    # Access protected endpoint
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "protected@example.com"
