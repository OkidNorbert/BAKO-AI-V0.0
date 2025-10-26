#!/usr/bin/env python3
"""
Comprehensive test suite for AI service functionality.
"""

import sys
import os
import requests
import json
import time
import logging
from typing import Dict, Any

# Add the service directory to the path
sys.path.append('/app')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIServiceTester:
    """Comprehensive AI service testing class."""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.test_results = {}
        
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all AI service tests."""
        logger.info("🚀 Starting comprehensive AI service tests...")
        
        tests = [
            ("health_check", self.test_health_check),
            ("service_info", self.test_service_info),
            ("video_analysis", self.test_video_analysis),
            ("training_status", self.test_training_status),
            ("model_status", self.test_model_status),
            ("insights_generation", self.test_insights_generation),
            ("performance_metrics", self.test_performance_metrics),
            ("error_handling", self.test_error_handling)
        ]
        
        for test_name, test_func in tests:
            try:
                logger.info(f"Running test: {test_name}")
                result = test_func()
                self.test_results[test_name] = {
                    "status": "passed" if result else "failed",
                    "details": result if isinstance(result, dict) else {"success": result}
                }
                logger.info(f"✅ {test_name}: {'PASSED' if result else 'FAILED'}")
            except Exception as e:
                logger.error(f"❌ {test_name}: FAILED - {str(e)}")
                self.test_results[test_name] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return self.test_results
    
    def test_health_check(self) -> bool:
        """Test health check endpoint."""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get("status") == "healthy"
            return False
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    def test_service_info(self) -> bool:
        """Test service information endpoint."""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return "Basketball Performance System AI Service" in data.get("message", "")
            return False
        except Exception as e:
            logger.error(f"Service info test failed: {e}")
            return False
    
    def test_video_analysis(self) -> Dict[str, Any]:
        """Test video analysis endpoint."""
        try:
            # Use a small test video URL
            analysis_request = {
                "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                "session_id": 1,
                "video_id": 1,
                "fps": 5
            }
            
            logger.info("Sending video analysis request...")
            response = requests.post(
                f"{self.base_url}/api/v1/analyze",
                json=analysis_request,
                timeout=60  # Longer timeout for video processing
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "video_id": result.get("video_id"),
                    "status": result.get("status"),
                    "keypoints_count": len(result.get("keypoints", [])),
                    "detections_count": len(result.get("detections", [])),
                    "events_count": len(result.get("events", [])),
                    "has_performance_metrics": "performance_metrics" in result,
                    "has_metadata": "metadata" in result
                }
            else:
                logger.error(f"Video analysis failed: {response.status_code} - {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            logger.error(f"Video analysis test failed: {e}")
            return {"success": False, "error": str(e)}
    
    def test_training_status(self) -> bool:
        """Test training status endpoint."""
        try:
            response = requests.get(f"{self.base_url}/api/v1/training/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return "is_running" in data and "training_status" in data
            return False
        except Exception as e:
            logger.error(f"Training status test failed: {e}")
            return False
    
    def test_model_status(self) -> bool:
        """Test model status endpoint."""
        try:
            response = requests.get(f"{self.base_url}/api/v1/training/models/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return isinstance(data, list) and len(data) > 0
            return False
        except Exception as e:
            logger.error(f"Model status test failed: {e}")
            return False
    
    def test_insights_generation(self) -> bool:
        """Test insights generation endpoint."""
        try:
            response = requests.get(f"{self.base_url}/api/v1/insights/session/1", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return ("insights" in data and 
                       "performance_summary" in data and 
                       "recommendations" in data)
            return False
        except Exception as e:
            logger.error(f"Insights generation test failed: {e}")
            return False
    
    def test_performance_metrics(self) -> bool:
        """Test performance metrics calculation."""
        try:
            # Test with a mock session
            response = requests.get(f"{self.base_url}/api/v1/insights/player/player_1/trends", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return isinstance(data, list) and len(data) > 0
            return False
        except Exception as e:
            logger.error(f"Performance metrics test failed: {e}")
            return False
    
    def test_error_handling(self) -> bool:
        """Test error handling with invalid requests."""
        try:
            # Test with invalid video URL
            invalid_request = {
                "video_url": "invalid_url",
                "session_id": 1,
                "video_id": 1,
                "fps": 5
            }
            
            response = requests.post(
                f"{self.base_url}/api/v1/analyze",
                json=invalid_request,
                timeout=30
            )
            
            # Should return an error status code
            return response.status_code >= 400
            
        except Exception as e:
            logger.error(f"Error handling test failed: {e}")
            return False
    
    def test_component_initialization(self) -> bool:
        """Test AI component initialization."""
        try:
            from service.core.video_analyzer import BasketballVideoAnalyzer
            from service.core.training_pipeline import ModelTrainingPipeline
            
            # Test video analyzer initialization
            analyzer = BasketballVideoAnalyzer()
            
            # Test training pipeline initialization
            pipeline = ModelTrainingPipeline({
                'models_dir': '/tmp/test_models',
                'data_dir': '/tmp/test_data'
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Component initialization test failed: {e}")
            return False
    
    def generate_test_report(self) -> str:
        """Generate a comprehensive test report."""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() 
                          if result["status"] == "passed")
        failed_tests = sum(1 for result in self.test_results.values() 
                          if result["status"] == "failed")
        error_tests = sum(1 for result in self.test_results.values() 
                         if result["status"] == "error")
        
        report = f"""
🧪 AI Service Test Report
========================

📊 Summary:
- Total Tests: {total_tests}
- Passed: {passed_tests} ✅
- Failed: {failed_tests} ❌
- Errors: {error_tests} ⚠️
- Success Rate: {(passed_tests/total_tests)*100:.1f}%

📋 Detailed Results:
"""
        
        for test_name, result in self.test_results.items():
            status_emoji = "✅" if result["status"] == "passed" else "❌" if result["status"] == "failed" else "⚠️"
            report += f"- {test_name}: {status_emoji} {result['status'].upper()}\n"
            
            if result["status"] == "error":
                report += f"  Error: {result.get('error', 'Unknown error')}\n"
            elif isinstance(result.get("details"), dict):
                for key, value in result["details"].items():
                    report += f"  {key}: {value}\n"
        
        return report


def main():
    """Main test execution function."""
    print("🤖 AI Service Comprehensive Test Suite")
    print("=" * 50)
    
    # Initialize tester
    tester = AIServiceTester()
    
    # Run all tests
    results = tester.run_all_tests()
    
    # Generate and display report
    report = tester.generate_test_report()
    print(report)
    
    # Save report to file
    with open("/tmp/ai_service_test_report.txt", "w") as f:
        f.write(report)
    
    print(f"\n📄 Test report saved to: /tmp/ai_service_test_report.txt")
    
    # Return exit code based on results
    failed_tests = sum(1 for result in results.values() if result["status"] in ["failed", "error"])
    return 1 if failed_tests > 0 else 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
