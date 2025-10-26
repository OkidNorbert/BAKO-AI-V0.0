#!/usr/bin/env python3
"""
Performance benchmark tests for AI service.
"""

import sys
import os
import time
import requests
import json
import logging
from typing import Dict, Any, List
import statistics

# Add the service directory to the path
sys.path.append('/app')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceBenchmark:
    """Performance benchmarking for AI service."""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.results = {}
    
    def benchmark_endpoint(self, endpoint: str, method: str = "GET", 
                          data: Dict = None, iterations: int = 10) -> Dict[str, Any]:
        """Benchmark a specific endpoint."""
        logger.info(f"Benchmarking {method} {endpoint} with {iterations} iterations...")
        
        response_times = []
        success_count = 0
        error_count = 0
        
        for i in range(iterations):
            try:
                start_time = time.time()
                
                if method == "GET":
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=30)
                elif method == "POST":
                    response = requests.post(f"{self.base_url}{endpoint}", 
                                           json=data, timeout=30)
                
                end_time = time.time()
                response_time = end_time - start_time
                response_times.append(response_time)
                
                if response.status_code == 200:
                    success_count += 1
                else:
                    error_count += 1
                    logger.warning(f"Iteration {i+1}: HTTP {response.status_code}")
                
            except Exception as e:
                error_count += 1
                logger.error(f"Iteration {i+1} failed: {e}")
        
        if response_times:
            return {
                "endpoint": endpoint,
                "method": method,
                "iterations": iterations,
                "success_count": success_count,
                "error_count": error_count,
                "success_rate": (success_count / iterations) * 100,
                "avg_response_time": statistics.mean(response_times),
                "min_response_time": min(response_times),
                "max_response_time": max(response_times),
                "median_response_time": statistics.median(response_times),
                "std_deviation": statistics.stdev(response_times) if len(response_times) > 1 else 0
            }
        else:
            return {
                "endpoint": endpoint,
                "method": method,
                "iterations": iterations,
                "success_count": 0,
                "error_count": error_count,
                "success_rate": 0,
                "error": "All requests failed"
            }
    
    def run_all_benchmarks(self) -> Dict[str, Any]:
        """Run all performance benchmarks."""
        logger.info("🚀 Starting performance benchmarks...")
        
        benchmarks = [
            {
                "name": "health_check",
                "endpoint": "/health",
                "method": "GET",
                "iterations": 20
            },
            {
                "name": "service_info",
                "endpoint": "/",
                "method": "GET",
                "iterations": 20
            },
            {
                "name": "training_status",
                "endpoint": "/api/v1/training/status",
                "method": "GET",
                "iterations": 15
            },
            {
                "name": "model_status",
                "endpoint": "/api/v1/training/models/status",
                "method": "GET",
                "iterations": 15
            },
            {
                "name": "insights_generation",
                "endpoint": "/api/v1/insights/session/1",
                "method": "GET",
                "iterations": 10
            },
            {
                "name": "video_analysis_light",
                "endpoint": "/api/v1/analyze",
                "method": "POST",
                "data": {
                    "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                    "session_id": 1,
                    "video_id": 1,
                    "fps": 2  # Low FPS for faster processing
                },
                "iterations": 3  # Fewer iterations due to processing time
            }
        ]
        
        for benchmark in benchmarks:
            logger.info(f"Running benchmark: {benchmark['name']}")
            result = self.benchmark_endpoint(
                endpoint=benchmark["endpoint"],
                method=benchmark["method"],
                data=benchmark.get("data"),
                iterations=benchmark["iterations"]
            )
            self.results[benchmark["name"]] = result
        
        return self.results
    
    def generate_performance_report(self) -> str:
        """Generate performance benchmark report."""
        report = f"""
⚡ AI Service Performance Benchmark Report
==========================================

📊 Summary:
"""
        
        total_endpoints = len(self.results)
        avg_success_rate = sum(r.get("success_rate", 0) for r in self.results.values()) / total_endpoints
        avg_response_time = sum(r.get("avg_response_time", 0) for r in self.results.values()) / total_endpoints
        
        report += f"- Total Endpoints Tested: {total_endpoints}\n"
        report += f"- Average Success Rate: {avg_success_rate:.1f}%\n"
        report += f"- Average Response Time: {avg_response_time:.3f}s\n\n"
        
        report += "📋 Detailed Results:\n"
        report += "-" * 80 + "\n"
        
        for name, result in self.results.items():
            report += f"\n🔍 {name.upper()}\n"
            report += f"   Endpoint: {result['method']} {result['endpoint']}\n"
            report += f"   Iterations: {result['iterations']}\n"
            report += f"   Success Rate: {result.get('success_rate', 0):.1f}%\n"
            
            if 'avg_response_time' in result:
                report += f"   Avg Response Time: {result['avg_response_time']:.3f}s\n"
                report += f"   Min Response Time: {result['min_response_time']:.3f}s\n"
                report += f"   Max Response Time: {result['max_response_time']:.3f}s\n"
                report += f"   Median Response Time: {result['median_response_time']:.3f}s\n"
                report += f"   Std Deviation: {result['std_deviation']:.3f}s\n"
            
            if result.get('error_count', 0) > 0:
                report += f"   ⚠️  Errors: {result['error_count']}\n"
        
        # Performance recommendations
        report += "\n🎯 Performance Recommendations:\n"
        report += "-" * 40 + "\n"
        
        for name, result in self.results.items():
            if result.get('avg_response_time', 0) > 5.0:
                report += f"- {name}: Consider optimizing (response time > 5s)\n"
            elif result.get('success_rate', 100) < 95:
                report += f"- {name}: Improve reliability (success rate < 95%)\n"
        
        return report
    
    def test_concurrent_requests(self, endpoint: str, concurrent_users: int = 5, 
                                requests_per_user: int = 10) -> Dict[str, Any]:
        """Test concurrent request handling."""
        import threading
        import queue
        
        logger.info(f"Testing concurrent requests: {concurrent_users} users, {requests_per_user} requests each")
        
        results_queue = queue.Queue()
        
        def make_requests(user_id: int):
            """Make requests for a single user."""
            user_results = []
            for i in range(requests_per_user):
                try:
                    start_time = time.time()
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                    end_time = time.time()
                    
                    user_results.append({
                        "user_id": user_id,
                        "request_id": i,
                        "response_time": end_time - start_time,
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                except Exception as e:
                    user_results.append({
                        "user_id": user_id,
                        "request_id": i,
                        "error": str(e),
                        "success": False
                    })
            
            results_queue.put(user_results)
        
        # Start concurrent threads
        threads = []
        start_time = time.time()
        
        for user_id in range(concurrent_users):
            thread = threading.Thread(target=make_requests, args=(user_id,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Collect results
        all_results = []
        while not results_queue.empty():
            all_results.extend(results_queue.get())
        
        # Calculate metrics
        successful_requests = sum(1 for r in all_results if r.get("success", False))
        total_requests = len(all_results)
        response_times = [r["response_time"] for r in all_results if "response_time" in r]
        
        return {
            "concurrent_users": concurrent_users,
            "requests_per_user": requests_per_user,
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "success_rate": (successful_requests / total_requests) * 100 if total_requests > 0 else 0,
            "total_time": total_time,
            "requests_per_second": total_requests / total_time if total_time > 0 else 0,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
            "min_response_time": min(response_times) if response_times else 0
        }


def main():
    """Main benchmark execution function."""
    print("⚡ AI Service Performance Benchmark")
    print("=" * 40)
    
    # Initialize benchmark
    benchmark = PerformanceBenchmark()
    
    # Run benchmarks
    results = benchmark.run_all_benchmarks()
    
    # Test concurrent requests
    print("\n🔄 Testing concurrent request handling...")
    concurrent_results = benchmark.test_concurrent_requests("/health", concurrent_users=5, requests_per_user=5)
    
    # Generate and display report
    report = benchmark.generate_performance_report()
    print(report)
    
    # Add concurrent test results
    print(f"\n🔄 Concurrent Request Test Results:")
    print(f"   Concurrent Users: {concurrent_results['concurrent_users']}")
    print(f"   Total Requests: {concurrent_results['total_requests']}")
    print(f"   Success Rate: {concurrent_results['success_rate']:.1f}%")
    print(f"   Requests/Second: {concurrent_results['requests_per_second']:.2f}")
    print(f"   Avg Response Time: {concurrent_results['avg_response_time']:.3f}s")
    
    # Save report to file
    with open("/tmp/ai_service_performance_report.txt", "w") as f:
        f.write(report)
        f.write(f"\n\nConcurrent Test Results:\n{json.dumps(concurrent_results, indent=2)}")
    
    print(f"\n📄 Performance report saved to: /tmp/ai_service_performance_report.txt")


if __name__ == "__main__":
    main()
