#!/usr/bin/env python3
"""
Test runner for AI service - runs all test suites.
"""

import sys
import os
import subprocess
import time
import argparse
from typing import List, Dict, Any

def run_test_script(script_path: str, description: str) -> Dict[str, Any]:
    """Run a test script and return results."""
    print(f"\n🧪 Running {description}...")
    print("=" * 50)
    
    start_time = time.time()
    
    try:
        # Run the test script
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        return {
            "script": script_path,
            "description": description,
            "success": result.returncode == 0,
            "return_code": result.returncode,
            "duration": duration,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
        
    except subprocess.TimeoutExpired:
        return {
            "script": script_path,
            "description": description,
            "success": False,
            "return_code": -1,
            "duration": 300,
            "error": "Test timed out after 5 minutes"
        }
    except Exception as e:
        return {
            "script": script_path,
            "description": description,
            "success": False,
            "return_code": -1,
            "duration": 0,
            "error": str(e)
        }

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="AI Service Test Runner")
    parser.add_argument("--test", choices=["all", "unit", "integration", "performance", "comprehensive"], 
                       default="all", help="Type of tests to run")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    print("🤖 AI Service Test Runner")
    print("=" * 30)
    
    # Define test suites
    test_suites = {
        "unit": {
            "script": "test_video_analyzer.py",
            "description": "Unit Tests - Video Analyzer Components"
        },
        "integration": {
            "script": "test_integration.py", 
            "description": "Integration Tests - Service Communication"
        },
        "performance": {
            "script": "test_performance.py",
            "description": "Performance Tests - Benchmarking"
        },
        "comprehensive": {
            "script": "test_comprehensive.py",
            "description": "Comprehensive Tests - Full Service Testing"
        }
    }
    
    # Determine which tests to run
    if args.test == "all":
        tests_to_run = list(test_suites.keys())
    else:
        tests_to_run = [args.test]
    
    # Run tests
    results = []
    total_start_time = time.time()
    
    for test_type in tests_to_run:
        if test_type in test_suites:
            test_info = test_suites[test_type]
            result = run_test_script(test_info["script"], test_info["description"])
            results.append(result)
            
            # Print results
            if result["success"]:
                print(f"✅ {test_info['description']} - PASSED ({result['duration']:.2f}s)")
            else:
                print(f"❌ {test_info['description']} - FAILED ({result['duration']:.2f}s)")
                if args.verbose and result.get("stderr"):
                    print(f"Error: {result['stderr']}")
        else:
            print(f"⚠️  Unknown test type: {test_type}")
    
    total_duration = time.time() - total_start_time
    
    # Generate summary report
    print(f"\n📊 Test Summary")
    print("=" * 20)
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r["success"])
    failed_tests = total_tests - passed_tests
    
    print(f"Total Test Suites: {total_tests}")
    print(f"Passed: {passed_tests} ✅")
    print(f"Failed: {failed_tests} ❌")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    print(f"Total Duration: {total_duration:.2f}s")
    
    # Detailed results
    if args.verbose:
        print(f"\n📋 Detailed Results:")
        for result in results:
            print(f"\n{result['description']}:")
            print(f"  Status: {'PASSED' if result['success'] else 'FAILED'}")
            print(f"  Duration: {result['duration']:.2f}s")
            print(f"  Return Code: {result['return_code']}")
            
            if result.get("error"):
                print(f"  Error: {result['error']}")
    
    # Save summary to file
    summary_file = "/tmp/ai_service_test_summary.txt"
    with open(summary_file, "w") as f:
        f.write(f"AI Service Test Summary\n")
        f.write(f"======================\n\n")
        f.write(f"Total Test Suites: {total_tests}\n")
        f.write(f"Passed: {passed_tests}\n")
        f.write(f"Failed: {failed_tests}\n")
        f.write(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%\n")
        f.write(f"Total Duration: {total_duration:.2f}s\n\n")
        
        f.write("Detailed Results:\n")
        for result in results:
            f.write(f"\n{result['description']}:\n")
            f.write(f"  Status: {'PASSED' if result['success'] else 'FAILED'}\n")
            f.write(f"  Duration: {result['duration']:.2f}s\n")
            f.write(f"  Return Code: {result['return_code']}\n")
            
            if result.get("error"):
                f.write(f"  Error: {result['error']}\n")
    
    print(f"\n📄 Test summary saved to: {summary_file}")
    
    # Return appropriate exit code
    return 0 if failed_tests == 0 else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
