#!/usr/bin/env python3
"""
Test YOLOv8 installation and basic functionality
"""

import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_yolo_import():
    """Test if YOLOv8 can be imported."""
    try:
        from ultralytics import YOLO
        logger.info("✅ YOLOv8 import successful")
        return True
    except ImportError as e:
        logger.error(f"❌ YOLOv8 import failed: {e}")
        return False

def test_yolo_model_loading():
    """Test loading a YOLOv8 model."""
    try:
        from ultralytics import YOLO
        
        logger.info("📥 Testing YOLOv8 model loading...")
        model = YOLO('yolov8n.pt')  # Load nano model (smallest)
        logger.info("✅ YOLOv8 model loaded successfully")
        
        # Test model info
        logger.info(f"📊 Model info:")
        logger.info(f"   - Model type: {type(model.model)}")
        logger.info(f"   - Classes: {len(model.names)} classes")
        logger.info(f"   - Class names: {list(model.names.values())[:5]}...")  # Show first 5
        
        return True
    except Exception as e:
        logger.error(f"❌ YOLOv8 model loading failed: {e}")
        return False

def test_yolo_inference():
    """Test YOLOv8 inference on a sample image."""
    try:
        from ultralytics import YOLO
        import numpy as np
        
        logger.info("🔍 Testing YOLOv8 inference...")
        
        # Load model
        model = YOLO('yolov8n.pt')
        
        # Create a dummy image (640x640 RGB)
        dummy_image = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        
        # Run inference
        results = model(dummy_image)
        
        logger.info("✅ YOLOv8 inference successful")
        logger.info(f"📊 Results: {len(results)} detection(s)")
        
        # Show detection info
        for i, result in enumerate(results):
            if result.boxes is not None:
                logger.info(f"   Detection {i+1}: {len(result.boxes)} objects detected")
            else:
                logger.info(f"   Detection {i+1}: No objects detected")
        
        return True
    except Exception as e:
        logger.error(f"❌ YOLOv8 inference failed: {e}")
        return False

def test_torch_availability():
    """Test PyTorch availability and device info."""
    try:
        import torch
        
        logger.info("🔥 PyTorch info:")
        logger.info(f"   - Version: {torch.__version__}")
        logger.info(f"   - CUDA available: {torch.cuda.is_available()}")
        
        if torch.cuda.is_available():
            logger.info(f"   - CUDA version: {torch.version.cuda}")
            logger.info(f"   - GPU count: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                logger.info(f"   - GPU {i}: {torch.cuda.get_device_name(i)}")
        else:
            logger.info("   - Using CPU")
        
        return True
    except ImportError as e:
        logger.error(f"❌ PyTorch import failed: {e}")
        return False

def main():
    """Run all YOLOv8 tests."""
    print("🧪 YOLOv8 Installation Test")
    print("=" * 30)
    
    tests = [
        ("YOLOv8 Import", test_yolo_import),
        ("PyTorch Availability", test_torch_availability),
        ("YOLOv8 Model Loading", test_yolo_model_loading),
        ("YOLOv8 Inference", test_yolo_inference)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        try:
            success = test_func()
            results[test_name] = success
        except Exception as e:
            logger.error(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n📊 Test Results Summary")
    print("=" * 30)
    
    passed = sum(1 for success in results.values() if success)
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! YOLOv8 is ready for basketball training!")
        print("\n🚀 Next steps:")
        print("1. Run: python prepare_dataset.py")
        print("2. Add your basketball images and annotations")
        print("3. Run: python train_basketball_yolo.py")
    else:
        print("\n⚠️ Some tests failed. Please check the errors above.")
        print("💡 Make sure all dependencies are properly installed.")

if __name__ == "__main__":
    main()
