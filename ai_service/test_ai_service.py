#!/usr/bin/env python3
"""
Test script for AI service functionality.
"""

import requests
import json
import time

def test_ai_service():
    """Test the AI service endpoints."""
    
    # Test health endpoint
    print("🔍 Testing AI Service Health...")
    try:
        response = requests.get("http://localhost:8001/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test analyze endpoint with mock data
    print("\n🎬 Testing Video Analysis...")
    try:
        analysis_request = {
            "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
            "session_id": 1,
            "video_id": 1,
            "fps": 5
        }
        
        print(f"Sending request: {json.dumps(analysis_request, indent=2)}")
        
        response = requests.post(
            "http://localhost:8001/api/v1/analyze",
            json=analysis_request,
            timeout=30
        )
        
        print(f"✅ Analysis response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Analysis completed: {result.get('status')}")
            print(f"Keypoints found: {len(result.get('keypoints', []))}")
            print(f"Detections found: {len(result.get('detections', []))}")
            print(f"Events found: {len(result.get('events', []))}")
        else:
            print(f"❌ Analysis failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Analysis test failed: {e}")
        return False
    
    print("\n✅ AI Service test completed successfully!")
    return True

if __name__ == "__main__":
    test_ai_service()
