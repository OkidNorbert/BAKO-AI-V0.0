#!/usr/bin/env python3
"""
Basic API test for AI service without computer vision dependencies.
"""

import sys
import os
import requests
import json
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_basic_api():
    """Test basic API functionality."""
    base_url = "http://localhost:8001"
    
    print("🧪 Testing Basic AI Service API")
    print("=" * 40)
    
    # Test 1: Health check
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data.get('status')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Service info
    print("\n2. Testing service info endpoint...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Service info: {data.get('message')}")
        else:
            print(f"❌ Service info failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Service info error: {e}")
        return False
    
    # Test 3: API documentation
    print("\n3. Testing API documentation...")
    try:
        response = requests.get(f"{base_url}/docs", timeout=10)
        if response.status_code == 200:
            print("✅ API documentation accessible")
        else:
            print(f"❌ API documentation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ API documentation error: {e}")
    
    # Test 4: Training status
    print("\n4. Testing training status endpoint...")
    try:
        response = requests.get(f"{base_url}/api/v1/training/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Training status: {data.get('training_status')}")
        else:
            print(f"❌ Training status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Training status error: {e}")
    
    # Test 5: Model status
    print("\n5. Testing model status endpoint...")
    try:
        response = requests.get(f"{base_url}/api/v1/training/models/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model status: {len(data)} models found")
        else:
            print(f"❌ Model status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Model status error: {e}")
    
    # Test 6: Insights endpoint
    print("\n6. Testing insights endpoint...")
    try:
        response = requests.get(f"{base_url}/api/v1/insights/session/1", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Insights generated: {len(data.get('insights', []))} insights")
        else:
            print(f"❌ Insights failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Insights error: {e}")
    
    print("\n🎉 Basic API tests completed!")
    return True

if __name__ == "__main__":
    test_basic_api()
