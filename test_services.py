#!/usr/bin/env python3
"""
Simple service connectivity test.
"""

import requests
import time

def test_service(url, name, timeout=5):
    """Test a single service."""
    try:
        response = requests.get(url, timeout=timeout)
        print(f"✅ {name}: {response.status_code} - {url}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection failed - {url}")
        return False
    except requests.exceptions.Timeout:
        print(f"⏰ {name}: Timeout - {url}")
        return False
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
        return False

def main():
    """Test all services."""
    print("🏀 Basketball Performance System - Service Test")
    print("=" * 50)
    
    services = [
        ("http://localhost:3000", "Frontend"),
        ("http://localhost:8000/health", "Backend"),
        ("http://localhost:8001/health", "AI Service"),
        ("http://localhost:9001", "MinIO"),
    ]
    
    results = []
    for url, name in services:
        result = test_service(url, name)
        results.append(result)
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"📊 Results: {passed}/{total} services running")
    
    if passed == total:
        print("🎉 All services are running!")
    else:
        print("⚠️ Some services need attention")

if __name__ == "__main__":
    main()
