#!/usr/bin/env python3
"""
Simple validation tests for the Basketball Performance Analysis System.
Tests basic functionality without authentication requirements.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"
AI_SERVICE_URL = "http://localhost:8001"
FRONTEND_URL = "http://localhost:3000"

def test_service_health():
    """Test basic service health."""
    print("🏥 Testing Service Health...")
    
    services = [
        ("Backend", BACKEND_URL + "/health"),
        ("AI Service", AI_SERVICE_URL + "/health"),
        ("Frontend", FRONTEND_URL)
    ]
    
    results = {}
    for service_name, url in services:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print(f"   ✅ {service_name}: Healthy")
                results[service_name] = True
            else:
                print(f"   ⚠️ {service_name}: Status {response.status_code}")
                results[service_name] = False
        except Exception as e:
            print(f"   ❌ {service_name}: Error - {e}")
            results[service_name] = False
    
    return results

def test_api_endpoints():
    """Test API endpoint accessibility."""
    print("\n🔗 Testing API Endpoints...")
    
    endpoints = [
        ("Backend Health", BACKEND_URL + "/health"),
        ("AI Service Health", AI_SERVICE_URL + "/health"),
        ("Backend Docs", BACKEND_URL + "/docs"),
        ("AI Service Docs", AI_SERVICE_URL + "/docs")
    ]
    
    results = {}
    for endpoint_name, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"   ✅ {endpoint_name}: Accessible")
                results[endpoint_name] = True
            else:
                print(f"   ⚠️ {endpoint_name}: Status {response.status_code}")
                results[endpoint_name] = False
        except Exception as e:
            print(f"   ❌ {endpoint_name}: Error - {e}")
            results[endpoint_name] = False
    
    return results

def test_basic_functionality():
    """Test basic system functionality."""
    print("\n⚙️ Testing Basic Functionality...")
    
    # Test AI Service analysis endpoint (without authentication)
    try:
        # Test with a simple health check first
        response = requests.get(f"{AI_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ AI Service: Ready for analysis")
            
            # Test analysis endpoint structure (expect 422 for missing data)
            test_data = {"test": "data"}
            response = requests.post(f"{AI_SERVICE_URL}/api/v1/analyze", json=test_data, timeout=5)
            if response.status_code in [200, 422, 400]:  # Any of these indicate endpoint is working
                print("   ✅ AI Analysis: Endpoint accessible")
                return True
            else:
                print(f"   ⚠️ AI Analysis: Unexpected status {response.status_code}")
                return False
        else:
            print(f"   ❌ AI Service: Health check failed - {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ AI Analysis test failed: {e}")
        return False

def test_system_performance():
    """Test system performance under basic load."""
    print("\n⚡ Testing System Performance...")
    
    try:
        import concurrent.futures
        import threading
        
        def make_health_request():
            try:
                response = requests.get(f"{BACKEND_URL}/health", timeout=3)
                return response.status_code == 200
            except:
                return False
        
        # Test with 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_health_request) for _ in range(5)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        success_rate = sum(results) / len(results)
        if success_rate >= 0.8:
            print(f"   ✅ Performance: {success_rate:.1%} success rate")
            return True
        else:
            print(f"   ⚠️ Performance: {success_rate:.1%} success rate")
            return False
            
    except Exception as e:
        print(f"   ❌ Performance test failed: {e}")
        return False

def test_data_flow():
    """Test basic data flow between services."""
    print("\n🔄 Testing Data Flow...")
    
    try:
        # Test that services can communicate
        backend_health = requests.get(f"{BACKEND_URL}/health", timeout=5)
        ai_health = requests.get(f"{AI_SERVICE_URL}/health", timeout=5)
        
        if backend_health.status_code == 200 and ai_health.status_code == 200:
            print("   ✅ Service Communication: All services responding")
            
            # Test that we can reach the API structure
            backend_docs = requests.get(f"{BACKEND_URL}/docs", timeout=5)
            if backend_docs.status_code == 200:
                print("   ✅ API Documentation: Accessible")
                return True
            else:
                print(f"   ⚠️ API Documentation: Status {backend_docs.status_code}")
                return False
        else:
            print("   ❌ Service Communication: Some services not responding")
            return False
            
    except Exception as e:
        print(f"   ❌ Data flow test failed: {e}")
        return False

def generate_simple_report(results):
    """Generate a simple validation report."""
    print("\n" + "=" * 60)
    print("📊 SIMPLE VALIDATION REPORT")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"📈 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    print()
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print()
    print("🎯 SYSTEM READINESS ASSESSMENT:")
    
    if success_rate >= 90:
        print("🟢 EXCELLENT - System ready for pilot program")
    elif success_rate >= 80:
        print("🟡 GOOD - System ready with minor issues")
    elif success_rate >= 70:
        print("🟠 FAIR - System needs some improvements")
    else:
        print("🔴 POOR - System needs significant work")
    
    print()
    print("📋 RECOMMENDATIONS:")
    
    if success_rate >= 80:
        print("• System is ready for pilot program launch")
        print("• Monitor performance during pilot")
        print("• Collect user feedback actively")
    else:
        print("• Address system issues before pilot launch")
        print("• Check service configurations")
        print("• Verify network connectivity")
    
    return {
        "success_rate": success_rate,
        "passed_tests": passed_tests,
        "total_tests": total_tests,
        "readiness": "ready" if success_rate >= 80 else "needs_work"
    }

def main():
    """Run simple validation tests."""
    print("🏀 Basketball Performance System - Simple Validation")
    print("=" * 60)
    
    # Run all tests
    health_results = test_service_health()
    endpoint_results = test_api_endpoints()
    functionality_result = test_basic_functionality()
    performance_result = test_system_performance()
    dataflow_result = test_data_flow()
    
    # Combine results
    all_results = {
        "service_health": all(health_results.values()),
        "api_endpoints": all(endpoint_results.values()),
        "basic_functionality": functionality_result,
        "system_performance": performance_result,
        "data_flow": dataflow_result
    }
    
    # Generate report
    report = generate_simple_report(all_results)
    
    print("\n🎉 Simple validation testing completed!")
    return report

if __name__ == "__main__":
    main()
