#!/usr/bin/env python3
"""
Test script for Advanced Analytics API endpoints.

Tests all 4 endpoints:
1. GET /api/analytics/advanced/team-summary/{video_id}
2. GET /api/analytics/advanced/player/{video_id}/{player_track_id}
3. GET /api/analytics/advanced/lineups/{video_id}
4. GET /api/analytics/advanced/clips/{video_id}
"""
import requests
import json
import sys
from typing import Dict, Any


BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def print_result(endpoint: str, status_code: int, response: Dict[Any, Any], success: bool):
    """Print test result."""
    status_icon = "✅" if success else "❌"
    print(f"{status_icon} {endpoint}")
    print(f"   Status: {status_code}")
    
    if success:
        print(f"   Response keys: {list(response.keys())}")
        if "modules_executed" in response:
            print(f"   Modules executed: {response['modules_executed']}")
        if "modules_failed" in response:
            print(f"   Modules failed: {response['modules_failed']}")
    else:
        print(f"   Error: {response.get('detail', response.get('error', 'Unknown error'))}")
    print()


def test_health():
    """Test health endpoint."""
    print_section("Testing Health Endpoint")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Version: {data.get('version')}")
            print(f"   GPU Enabled: {data.get('gpu_enabled')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False


def test_team_summary(video_id: str, token: str = None):
    """Test team summary endpoint."""
    print_section("Test 1: Team Summary Endpoint")
    
    endpoint = f"{API_BASE}/analytics/advanced/team-summary/{video_id}"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        data = response.json()
        
        success = response.status_code == 200
        print_result(endpoint, response.status_code, data, success)
        
        if success:
            # Validate response structure
            assert "video_id" in data, "Missing video_id"
            assert "modules_executed" in data, "Missing modules_executed"
            print("   ✓ Response structure valid")
        
        return success
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_player_analysis(video_id: str, player_track_id: int, token: str = None):
    """Test player analysis endpoint."""
    print_section("Test 2: Player Analysis Endpoint")
    
    endpoint = f"{API_BASE}/analytics/advanced/player/{video_id}/{player_track_id}"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        data = response.json()
        
        success = response.status_code == 200
        print_result(endpoint, response.status_code, data, success)
        
        if success:
            # Validate response structure
            assert "player_track_id" in data, "Missing player_track_id"
            assert "video_id" in data, "Missing video_id"
            assert "defensive_reactions" in data, "Missing defensive_reactions"
            print("   ✓ Response structure valid")
            print(f"   Defensive reactions: {len(data.get('defensive_reactions', []))}")
            print(f"   Transition efforts: {len(data.get('transition_efforts', []))}")
            print(f"   Decision analyses: {len(data.get('decision_analyses', []))}")
        
        return success
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_lineup_comparison(video_id: str, token: str = None):
    """Test lineup comparison endpoint."""
    print_section("Test 3: Lineup Comparison Endpoint")
    
    endpoint = f"{API_BASE}/analytics/advanced/lineups/{video_id}"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        data = response.json()
        
        success = response.status_code == 200
        print_result(endpoint, response.status_code, data, success)
        
        if success:
            # Validate response structure
            assert "video_id" in data, "Missing video_id"
            assert "team_1_lineups" in data, "Missing team_1_lineups"
            assert "team_2_lineups" in data, "Missing team_2_lineups"
            print("   ✓ Response structure valid")
            print(f"   Team 1 lineups: {len(data.get('team_1_lineups', []))}")
            print(f"   Team 2 lineups: {len(data.get('team_2_lineups', []))}")
            
            if "best_overall_lineup" in data:
                best = data["best_overall_lineup"]
                print(f"   Best lineup net rating: {best.get('net_rating', 0):.1f}")
        
        return success
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_coaching_clips(video_id: str, token: str = None):
    """Test coaching clips endpoint."""
    print_section("Test 4: Coaching Clips Endpoint")
    
    endpoint = f"{API_BASE}/analytics/advanced/clips/{video_id}"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        data = response.json()
        
        success = response.status_code == 200
        print_result(endpoint, response.status_code, data, success)
        
        if success:
            # Validate response structure
            assert "video_id" in data, "Missing video_id"
            assert "clips" in data, "Missing clips"
            assert "summary" in data, "Missing summary"
            print("   ✓ Response structure valid")
            print(f"   Total clips: {len(data.get('clips', []))}")
            
            summary = data.get("summary", {})
            if "clips_by_type" in summary:
                print(f"   Clips by type: {summary['clips_by_type']}")
        
        return success
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_clips_with_filter(video_id: str, clip_type: str, token: str = None):
    """Test coaching clips endpoint with filter."""
    print_section(f"Test 5: Coaching Clips with Filter (type={clip_type})")
    
    endpoint = f"{API_BASE}/analytics/advanced/clips/{video_id}?clip_type={clip_type}"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        data = response.json()
        
        success = response.status_code == 200
        print_result(endpoint, response.status_code, data, success)
        
        if success:
            clips = data.get("clips", [])
            print(f"   Filtered clips: {len(clips)}")
            
            # Verify all clips match the filter
            if clips:
                all_match = all(c.get("clip_type") == clip_type for c in clips)
                if all_match:
                    print(f"   ✓ All clips match filter type '{clip_type}'")
                else:
                    print(f"   ⚠️  Some clips don't match filter")
        
        return success
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print_section("Advanced Analytics API Endpoint Tests")
    
    # Check if server is running
    if not test_health():
        print("\n❌ Server is not running or not responding")
        print("   Start the server with: uvicorn app.main:app --reload")
        sys.exit(1)
    
    # Get test parameters
    video_id = input("\nEnter video_id to test (or press Enter to skip): ").strip()
    if not video_id:
        print("\n⚠️  No video_id provided. Skipping endpoint tests.")
        print("   To test endpoints, you need a video_id with advanced analytics.")
        sys.exit(0)
    
    token = input("Enter auth token (or press Enter to skip auth): ").strip()
    if not token:
        print("⚠️  No auth token provided. Tests may fail if authentication is required.\n")
        token = None
    
    # Run tests
    results = []
    
    results.append(("Team Summary", test_team_summary(video_id, token)))
    
    # Ask for player track ID
    player_track_id = input("\nEnter player_track_id to test (or press Enter to skip): ").strip()
    if player_track_id:
        try:
            player_track_id = int(player_track_id)
            results.append(("Player Analysis", test_player_analysis(video_id, player_track_id, token)))
        except ValueError:
            print("⚠️  Invalid player_track_id, skipping player analysis test")
    
    results.append(("Lineup Comparison", test_lineup_comparison(video_id, token)))
    results.append(("Coaching Clips", test_coaching_clips(video_id, token)))
    results.append(("Clips with Filter", test_clips_with_filter(video_id, "late_rotation", token)))
    
    # Print summary
    print_section("Test Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
