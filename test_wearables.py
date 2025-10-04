#!/usr/bin/env python3
"""
Test script for wearable data endpoints.
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Configuration
BACKEND_URL = "http://localhost:8000"
API_TOKEN = ""  # Add your JWT token here

def test_wearable_endpoints():
    """Test wearable data endpoints."""
    
    print("🔍 Testing Wearable Data Endpoints...")
    
    # Test health endpoint first
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        print(f"✅ Backend health: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        return False
    
    # Test device creation
    print("\n📱 Testing device creation...")
    try:
        device_data = {
            "device_type": "apple_watch",
            "device_name": "Apple Watch Series 9",
            "device_identifier": "test_apple_watch_001"
        }
        
        headers = {"Authorization": f"Bearer {API_TOKEN}"} if API_TOKEN else {}
        response = requests.post(
            f"{BACKEND_URL}/api/v1/wearables/devices",
            json=device_data,
            headers=headers
        )
        
        print(f"Device creation: {response.status_code}")
        if response.status_code == 200:
            device = response.json()
            print(f"✅ Created device: {device['device_name']}")
            device_id = device['id']
        else:
            print(f"❌ Device creation failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Device creation error: {e}")
        return False
    
    # Test HealthKit sync
    print("\n🍎 Testing HealthKit sync...")
    try:
        healthkit_data = {
            "player_id": 1,
            "samples": [
                {
                    "type": "HKQuantityTypeIdentifierHeartRate",
                    "value": 75.0,
                    "unit": "count/min",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "type": "HKQuantityTypeIdentifierStepCount",
                    "value": 1000.0,
                    "unit": "count",
                    "timestamp": datetime.now().isoformat()
                }
            ]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/wearables/healthkit/sync",
            json=healthkit_data,
            headers=headers
        )
        
        print(f"HealthKit sync: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Synced {result['samples_synced']} HealthKit samples")
        else:
            print(f"❌ HealthKit sync failed: {response.text}")
            
    except Exception as e:
        print(f"❌ HealthKit sync error: {e}")
    
    # Test BLE sync
    print("\n📡 Testing BLE sync...")
    try:
        ble_data = {
            "player_id": 1,
            "device_identifier": "test_ble_hrm_001",
            "heart_rate": 85.0,
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "device_name": "Polar H10",
                "battery_level": 85
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/wearables/ble/sync",
            json=ble_data,
            headers=headers
        )
        
        print(f"BLE sync: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Synced BLE heart rate: {result['heart_rate']} bpm")
        else:
            print(f"❌ BLE sync failed: {response.text}")
            
    except Exception as e:
        print(f"❌ BLE sync error: {e}")
    
    # Test batch data upload
    print("\n📊 Testing batch data upload...")
    try:
        batch_data = {
            "device_id": device_id,
            "data_points": [
                {
                    "data_type": "heart_rate",
                    "value": 72.0,
                    "unit": "bpm",
                    "timestamp": datetime.now().isoformat(),
                    "metadata": {"source": "test"}
                },
                {
                    "data_type": "steps",
                    "value": 500.0,
                    "unit": "count",
                    "timestamp": datetime.now().isoformat(),
                    "metadata": {"source": "test"}
                }
            ]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/wearables/data/batch",
            json=batch_data,
            headers=headers
        )
        
        print(f"Batch upload: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Uploaded {result['data_points_uploaded']} data points")
        else:
            print(f"❌ Batch upload failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Batch upload error: {e}")
    
    # Test metrics endpoint
    print("\n📈 Testing metrics endpoint...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/v1/wearables/metrics/1",
            headers=headers
        )
        
        print(f"Metrics: {response.status_code}")
        if response.status_code == 200:
            metrics = response.json()
            print(f"✅ Retrieved metrics for player {metrics['player_id']}")
            print(f"   Total steps: {metrics['total_steps']}")
            print(f"   Avg heart rate: {metrics['avg_heart_rate']:.1f} bpm")
        else:
            print(f"❌ Metrics failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Metrics error: {e}")
    
    print("\n✅ Wearable endpoints test completed!")
    return True

if __name__ == "__main__":
    test_wearable_endpoints()
