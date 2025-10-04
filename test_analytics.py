#!/usr/bin/env python3
"""
Test script for analytics and recommendation endpoints.
"""

import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"
API_TOKEN = ""  # Add your JWT token here

def test_analytics_endpoints():
    """Test analytics and recommendation endpoints."""
    
    print("📊 Testing Analytics Endpoints...")
    
    # Test health endpoint first
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        print(f"✅ Backend health: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        return False
    
    headers = {"Authorization": f"Bearer {API_TOKEN}"} if API_TOKEN else {}
    
    # Test performance metrics
    print("\n📈 Testing performance metrics...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/v1/analytics/performance/1?days=30",
            headers=headers
        )
        
        print(f"Performance metrics: {response.status_code}")
        if response.status_code == 200:
            metrics = response.json()
            print(f"✅ Retrieved metrics for player {metrics['player_id']}")
            print(f"   Shot accuracy: {metrics['shot_accuracy']:.1f}%")
            print(f"   Avg heart rate: {metrics['avg_heart_rate']:.1f} bpm")
            print(f"   Jump height: {metrics['avg_jump_height']:.1f} inches")
            print(f"   Weaknesses: {metrics['weaknesses']}")
        else:
            print(f"❌ Performance metrics failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Performance metrics error: {e}")
    
    # Test training recommendations
    print("\n💡 Testing training recommendations...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/v1/analytics/recommendations/1?days=30",
            headers=headers
        )
        
        print(f"Recommendations: {response.status_code}")
        if response.status_code == 200:
            recommendations = response.json()
            print(f"✅ Generated {len(recommendations)} recommendations")
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"   {i}. {rec['title']} ({rec['category']}) - Priority: {rec['priority']}")
        else:
            print(f"❌ Recommendations failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Recommendations error: {e}")
    
    # Test weakness analysis
    print("\n🔍 Testing weakness analysis...")
    try:
        analysis_request = {
            "player_id": 1,
            "days": 30
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/analytics/analyze",
            json=analysis_request,
            headers=headers
        )
        
        print(f"Weakness analysis: {response.status_code}")
        if response.status_code == 200:
            analysis = response.json()
            print(f"✅ Analysis completed for player {analysis['player_id']}")
            print(f"   Overall score: {analysis['overall_score']}")
            print(f"   Weaknesses: {analysis['weaknesses']}")
            print(f"   Priority weakness: {analysis['priority_weakness']}")
        else:
            print(f"❌ Weakness analysis failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Weakness analysis error: {e}")
    
    # Test benchmark comparison
    print("\n📊 Testing benchmark comparison...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/v1/analytics/comparison/1",
            headers=headers
        )
        
        print(f"Benchmark comparison: {response.status_code}")
        if response.status_code == 200:
            comparison = response.json()
            print(f"✅ Comparison completed for player {comparison['player_id']}")
            print(f"   Overall rating: {comparison['overall_rating']}")
            print(f"   Benchmarks: {list(comparison['benchmarks'].keys())}")
        else:
            print(f"❌ Benchmark comparison failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Benchmark comparison error: {e}")
    
    print("\n✅ Analytics endpoints test completed!")
    return True

if __name__ == "__main__":
    test_analytics_endpoints()
