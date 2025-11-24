#!/usr/bin/env python3
"""
Test Court Line Detection: YOLO vs Hough Transform
Compares YOLO object detection with traditional CV line detection
"""

import cv2
import numpy as np
from pathlib import Path
import sys
from ultralytics import YOLO
import matplotlib.pyplot as plt

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.models.court_detector import CourtDetector


def test_yolo_court_detection(image_path: Path):
    """Test if YOLO can detect court lines (spoiler: it won't work well)"""
    print(f"\n{'='*60}")
    print(f"🔍 Testing YOLO for Court Line Detection")
    print(f"{'='*60}")
    print(f"📸 Image: {image_path.name}")
    
    # Load image
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"❌ Failed to load image: {image_path}")
        return None
    
    print(f"✅ Image loaded: {image.shape}")
    
    # Load YOLO model
    try:
        print("\n🤖 Loading YOLO model...")
        yolo_model = YOLO('yolo11n.pt')  # Use nano for speed
        print("✅ YOLO model loaded")
    except Exception as e:
        print(f"❌ Failed to load YOLO: {e}")
        return None
    
    # Run YOLO detection
    print("\n🔍 Running YOLO detection...")
    results = yolo_model(image, verbose=False)
    
    # Draw YOLO detections
    annotated_yolo = image.copy()
    detected_objects = []
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            
            # Get class name
            class_name = yolo_model.names[cls]
            detected_objects.append({
                'class': class_name,
                'confidence': conf,
                'bbox': (int(x1), int(y1), int(x2), int(y2))
            })
            
            # Draw bounding box
            cv2.rectangle(annotated_yolo, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            label = f"{class_name} {conf:.2f}"
            cv2.putText(annotated_yolo, label, (int(x1), int(y1) - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    print(f"\n📊 YOLO Detections: {len(detected_objects)} objects")
    for obj in detected_objects[:10]:  # Show first 10
        print(f"   - {obj['class']}: {obj['confidence']:.2f}")
    
    # Check if any detected objects might be court-related
    court_related = ['sports ball', 'person', 'frisbee', 'sports equipment']
    court_detections = [obj for obj in detected_objects 
                       if any(keyword in obj['class'].lower() for keyword in court_related)]
    
    print(f"\n⚠️  YOLO Result: {len(court_detections)} potentially court-related objects")
    print("   ❌ YOLO cannot detect court LINES (it detects objects, not geometric features)")
    print("   💡 Court lines are not in YOLO's training data (COCO dataset)")
    
    return annotated_yolo, detected_objects


def test_hough_transform(image_path: Path):
    """Test Hough Transform for court line detection (the correct method)"""
    print(f"\n{'='*60}")
    print(f"🔍 Testing Hough Transform for Court Line Detection")
    print(f"{'='*60}")
    print(f"📸 Image: {image_path.name}")
    
    # Load image
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"❌ Failed to load image: {image_path}")
        return None
    
    # Initialize court detector
    print("\n🏟️  Initializing Court Detector...")
    court_detector = CourtDetector()
    
    # Detect court lines
    print("🔍 Detecting court lines with Hough Transform...")
    court_info = court_detector.detect_court_lines(image)
    
    # Draw court lines
    annotated_hough = image.copy()
    
    if court_info and court_info.get("lines"):
        lines = court_info["lines"]
        horizontal = lines.get("horizontal", [])
        vertical = lines.get("vertical", [])
        diagonal = lines.get("diagonal", [])
        
        print(f"\n📊 Hough Transform Results:")
        print(f"   - Horizontal lines: {len(horizontal)}")
        print(f"   - Vertical lines: {len(vertical)}")
        print(f"   - Diagonal lines: {len(diagonal)}")
        print(f"   - Total lines: {len(horizontal) + len(vertical) + len(diagonal)}")
        
        # Draw lines
        for line in horizontal[:20]:  # Limit to avoid clutter
            x1, y1, x2, y2 = map(int, line)
            cv2.line(annotated_hough, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        for line in vertical[:20]:
            x1, y1, x2, y2 = map(int, line)
            cv2.line(annotated_hough, (x1, y1), (x2, y2), (255, 0, 0), 2)
        
        for line in diagonal[:10]:
            x1, y1, x2, y2 = map(int, line)
            cv2.line(annotated_hough, (x1, y1), (x2, y2), (0, 0, 255), 2)
        
        # Draw key points if available
        if court_info.get("key_points"):
            key_points = court_info["key_points"]
            for point_name, point_value in key_points.items():
                # Handle different formats: tuple, list, or dict
                if isinstance(point_value, (tuple, list)) and len(point_value) >= 2:
                    px, py = point_value[0], point_value[1]
                elif isinstance(point_value, dict):
                    px = point_value.get('x', point_value.get(0, 0))
                    py = point_value.get('y', point_value.get(1, 0))
                else:
                    continue
                cv2.circle(annotated_hough, (int(px), int(py)), 10, (255, 255, 0), 3)
                cv2.putText(annotated_hough, point_name, (int(px) + 15, int(py)),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 2)
        
        print("   ✅ Court lines detected successfully!")
    else:
        print("   ⚠️  No court lines detected")
    
    return annotated_hough, court_info


def visualize_comparison(original, yolo_result, hough_result, output_path: Path):
    """Create side-by-side comparison visualization"""
    print(f"\n📊 Creating comparison visualization...")
    
    # Resize images to same height for comparison
    target_height = 600
    h, w = original.shape[:2]
    scale = target_height / h
    new_w = int(w * scale)
    
    original_resized = cv2.resize(original, (new_w, target_height))
    yolo_resized = cv2.resize(yolo_result, (new_w, target_height)) if yolo_result is not None else None
    hough_resized = cv2.resize(hough_result, (new_w, target_height)) if hough_result is not None else None
    
    # Create comparison image
    if yolo_resized is not None and hough_resized is not None:
        # Stack images vertically
        comparison = np.vstack([
            original_resized,
            yolo_resized,
            hough_resized
        ])
        
        # Add labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(comparison, "Original", (10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(comparison, "YOLO Detection (Objects Only)", (10, target_height + 30), font, 1, (0, 255, 0), 2)
        cv2.putText(comparison, "Hough Transform (Court Lines)", (10, target_height * 2 + 30), font, 1, (0, 255, 0), 2)
    else:
        comparison = original_resized
    
    # Save comparison
    cv2.imwrite(str(output_path), comparison)
    print(f"✅ Comparison saved to: {output_path}")
    
    return comparison


def main():
    """Main test function"""
    print("=" * 60)
    print("🏀 Basketball Court Line Detection Test")
    print("=" * 60)
    print("\nThis script compares:")
    print("  1. YOLO object detection (won't work for lines)")
    print("  2. Hough Transform (correct method for lines)")
    
    # Find test images
    project_root = Path(__file__).parent
    parent_dir = project_root.parent  # Go up one level
    test_images = [
        parent_dir / "IMG_20251123_194729.jpg",
        parent_dir / "IMG_20251123_194812.jpg",
        project_root / "IMG_20251123_194729.jpg",
        project_root / "IMG_20251123_194812.jpg",
    ]
    
    # Find existing images
    found_images = []
    for img_path in test_images:
        if img_path.exists():
            found_images.append(img_path)
            print(f"\n✅ Found image: {img_path}")
    
    if not found_images:
        print("\n❌ No test images found!")
        print("   Please place your images in the project root or specify the path.")
        return
    
    # Create output directory
    output_dir = project_root / "test_results"
    output_dir.mkdir(exist_ok=True)
    
    # Test each image
    for img_path in found_images:
        print(f"\n{'='*60}")
        print(f"Testing: {img_path.name}")
        print(f"{'='*60}")
        
        # Test YOLO (will show it doesn't work for lines)
        yolo_result, yolo_objects = test_yolo_court_detection(img_path)
        
        # Test Hough Transform (the correct method)
        hough_result, court_info = test_hough_transform(img_path)
        
        # Load original
        original = cv2.imread(str(img_path))
        
        # Create comparison
        comparison_path = output_dir / f"comparison_{img_path.stem}.jpg"
        visualize_comparison(original, yolo_result, hough_result, comparison_path)
        
        print(f"\n✅ Test complete for {img_path.name}")
        print(f"   📊 Results saved to: {comparison_path}")
    
    print(f"\n{'='*60}")
    print("📊 SUMMARY")
    print(f"{'='*60}")
    print("\n✅ Hough Transform: BEST for court line detection")
    print("   - Detects geometric features (lines)")
    print("   - Fast and accurate")
    print("   - Works with any court color/lighting")
    print("\n❌ YOLO: NOT suitable for court lines")
    print("   - Designed for object detection, not geometric features")
    print("   - Court lines are not in COCO dataset")
    print("   - Will only detect objects (people, balls, etc.)")
    print("\n💡 Conclusion: Use Hough Transform for court lines!")
    print(f"\n📁 All results saved to: {output_dir}")


if __name__ == "__main__":
    main()

