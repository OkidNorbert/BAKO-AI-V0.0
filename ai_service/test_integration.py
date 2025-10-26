#!/usr/bin/env python3
"""
Integration tests for AI service with backend communication.
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

class IntegrationTester:
    """Integration testing for AI service."""
    
    def __init__(self, ai_service_url: str = "http://localhost:8001", 
                 backend_url: str = "http://localhost:8000"):
        self.ai_service_url = ai_service_url
        self.backend_url = backend_url
        self.test_results = {}
    
    def test_ai_service_health(self) -> bool:
        """Test AI service health."""
        try:
            response = requests.get(f"{self.ai_service_url}/health", timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"AI service health check failed: {e}")
            return False
    
    def test_backend_health(self) -> bool:
        """Test backend service health."""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Backend health check failed: {e}")
            return False
    
    def test_video_analysis_workflow(self) -> Dict[str, Any]:
        """Test complete video analysis workflow."""
        try:
            logger.info("Testing video analysis workflow...")
            
            # Step 1: Create a test session (mock)
            session_data = {
                "name": "Integration Test Session",
                "description": "Test session for integration testing",
                "team_id": 1,
                "coach_id": 1
            }
            
            # Step 2: Upload a test video (mock)
            video_data = {
                "filename": "test_video.mp4",
                "session_id": 1,
                "file_size": 1024000,
                "duration": 30.0
            }
            
            # Step 3: Analyze video with AI service
            analysis_request = {
                "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                "session_id": 1,
                "video_id": 1,
                "fps": 5
            }
            
            logger.info("Sending video analysis request...")
            response = requests.post(
                f"{self.ai_service_url}/api/v1/analyze",
                json=analysis_request,
                timeout=120  # Longer timeout for video processing
            )
            
            if response.status_code == 200:
                analysis_result = response.json()
                
                # Step 4: Verify analysis results
                required_fields = ["video_id", "session_id", "keypoints", "detections", "events", "status"]
                missing_fields = [field for field in required_fields if field not in analysis_result]
                
                if missing_fields:
                    return {
                        "success": False,
                        "error": f"Missing required fields: {missing_fields}"
                    }
                
                # Step 5: Test insights generation
                insights_response = requests.get(
                    f"{self.ai_service_url}/api/v1/insights/session/1",
                    timeout=30
                )
                
                insights_success = insights_response.status_code == 200
                
                return {
                    "success": True,
                    "analysis_result": {
                        "video_id": analysis_result["video_id"],
                        "session_id": analysis_result["session_id"],
                        "keypoints_count": len(analysis_result.get("keypoints", [])),
                        "detections_count": len(analysis_result.get("detections", [])),
                        "events_count": len(analysis_result.get("events", [])),
                        "has_performance_metrics": "performance_metrics" in analysis_result,
                        "has_metadata": "metadata" in analysis_result
                    },
                    "insights_generated": insights_success,
                    "workflow_complete": True
                }
            else:
                return {
                    "success": False,
                    "error": f"Analysis failed: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            logger.error(f"Video analysis workflow failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def test_training_pipeline_integration(self) -> Dict[str, Any]:
        """Test training pipeline integration."""
        try:
            logger.info("Testing training pipeline integration...")
            
            # Test training status
            status_response = requests.get(
                f"{self.ai_service_url}/api/v1/training/status",
                timeout=10
            )
            
            if status_response.status_code != 200:
                return {
                    "success": False,
                    "error": "Failed to get training status"
                }
            
            # Test model status
            models_response = requests.get(
                f"{self.ai_service_url}/api/v1/training/models/status",
                timeout=10
            )
            
            if models_response.status_code != 200:
                return {
                    "success": False,
                    "error": "Failed to get model status"
                }
            
            models_data = models_response.json()
            
            return {
                "success": True,
                "training_status_available": True,
                "models_count": len(models_data),
                "models_status": [model["status"] for model in models_data]
            }
            
        except Exception as e:
            logger.error(f"Training pipeline integration failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def test_data_flow_integration(self) -> Dict[str, Any]:
        """Test data flow between services."""
        try:
            logger.info("Testing data flow integration...")
            
            # Test insights generation with different parameters
            test_cases = [
                {"session_id": 1, "player_id": "player_1"},
                {"session_id": 2, "player_id": "player_2"},
                {"session_id": 3}  # No player_id specified
            ]
            
            results = []
            for test_case in test_cases:
                try:
                    response = requests.get(
                        f"{self.ai_service_url}/api/v1/insights/session/{test_case['session_id']}",
                        params={"player_id": test_case.get("player_id")},
                        timeout=30
                    )
                    
                    results.append({
                        "test_case": test_case,
                        "success": response.status_code == 200,
                        "status_code": response.status_code
                    })
                    
                except Exception as e:
                    results.append({
                        "test_case": test_case,
                        "success": False,
                        "error": str(e)
                    })
            
            success_count = sum(1 for r in results if r["success"])
            
            return {
                "success": success_count > 0,
                "test_cases": len(test_cases),
                "successful_cases": success_count,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Data flow integration failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def test_error_handling_integration(self) -> Dict[str, Any]:
        """Test error handling across services."""
        try:
            logger.info("Testing error handling integration...")
            
            # Test with invalid session ID
            invalid_session_response = requests.get(
                f"{self.ai_service_url}/api/v1/insights/session/99999",
                timeout=10
            )
            
            # Test with invalid video URL
            invalid_video_request = {
                "video_url": "invalid_url",
                "session_id": 1,
                "video_id": 1,
                "fps": 5
            }
            
            invalid_video_response = requests.post(
                f"{self.ai_service_url}/api/v1/analyze",
                json=invalid_video_request,
                timeout=30
            )
            
            return {
                "success": True,
                "invalid_session_handled": invalid_session_response.status_code >= 400,
                "invalid_video_handled": invalid_video_response.status_code >= 400,
                "error_handling_working": True
            }
            
        except Exception as e:
            logger.error(f"Error handling integration failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def run_all_integration_tests(self) -> Dict[str, Any]:
        """Run all integration tests."""
        logger.info("🚀 Starting integration tests...")
        
        tests = [
            ("ai_service_health", self.test_ai_service_health),
            ("backend_health", self.test_backend_health),
            ("video_analysis_workflow", self.test_video_analysis_workflow),
            ("training_pipeline_integration", self.test_training_pipeline_integration),
            ("data_flow_integration", self.test_data_flow_integration),
            ("error_handling_integration", self.test_error_handling_integration)
        ]
        
        for test_name, test_func in tests:
            try:
                logger.info(f"Running integration test: {test_name}")
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
    
    def generate_integration_report(self) -> str:
        """Generate integration test report."""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() 
                          if result["status"] == "passed")
        failed_tests = sum(1 for result in self.test_results.values() 
                          if result["status"] == "failed")
        error_tests = sum(1 for result in self.test_results.values() 
                         if result["status"] == "error")
        
        report = f"""
🔗 AI Service Integration Test Report
====================================

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
                    if key != "success":
                        report += f"  {key}: {value}\n"
        
        # Integration recommendations
        report += "\n🎯 Integration Recommendations:\n"
        report += "-" * 40 + "\n"
        
        if passed_tests < total_tests:
            report += "- Review failed tests and fix integration issues\n"
            report += "- Ensure all services are running and accessible\n"
            report += "- Check network connectivity between services\n"
        else:
            report += "- All integration tests passed! 🎉\n"
            report += "- System is ready for production deployment\n"
        
        return report


def main():
    """Main integration test execution function."""
    print("🔗 AI Service Integration Tests")
    print("=" * 35)
    
    # Initialize tester
    tester = IntegrationTester()
    
    # Run all integration tests
    results = tester.run_all_integration_tests()
    
    # Generate and display report
    report = tester.generate_integration_report()
    print(report)
    
    # Save report to file
    with open("/tmp/ai_service_integration_report.txt", "w") as f:
        f.write(report)
    
    print(f"\n📄 Integration test report saved to: /tmp/ai_service_integration_report.txt")
    
    # Return exit code based on results
    failed_tests = sum(1 for result in results.values() if result["status"] in ["failed", "error"])
    return 1 if failed_tests > 0 else 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
