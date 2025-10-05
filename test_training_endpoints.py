#!/usr/bin/env python3
"""
Test script for training endpoints.
"""

import requests
import json

# Test configuration
BACKEND_URL = "http://localhost:8000"
TEST_USER_ID = 1

def test_training_endpoints():
    """Test all training endpoints."""
    print("🧪 Testing Training Endpoints...")
    
    # Test endpoints
    endpoints = [
        f"/api/v1/training/recommendations/{TEST_USER_ID}?days=30",
        f"/api/v1/training/progress/{TEST_USER_ID}",
        "/api/v1/training/status",
        "/api/v1/training/models/status",
        "/api/v1/training/metrics"
    ]
    
    for endpoint in endpoints:
        try:
            url = f"{BACKEND_URL}{endpoint}"
            print(f"\n📡 Testing: {endpoint}")
            
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success: {response.status_code}")
                print(f"📊 Response: {json.dumps(data, indent=2)[:200]}...")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"📝 Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection Error: Backend not running at {BACKEND_URL}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_training_endpoints()
