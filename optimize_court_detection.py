#!/usr/bin/env python3
"""
Optimize Hough Transform Parameters for Basketball Court Detection
Tests different parameters to find the best settings for your court images
"""

import cv2
import numpy as np
from pathlib import Path
import sys

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.models.court_detector import CourtDetector


def detect_lines_optimized(frame, canny_low=50, canny_high=150, hough_threshold=50, min_line_length=50, max_line_gap=10):
    """Detect lines with custom parameters"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, canny_low, canny_high, apertureSize=3)
    
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=hough_threshold,
        minLineLength=min_line_length,
        maxLineGap=max_line_gap
    )
    
    return lines, edges


def categorize_lines(lines, height, width):
    """Categorize lines into horizontal, vertical, and diagonal"""
    if lines is None:
        return [], [], []
    
    horizontal = []
    vertical = []
    diagonal = []
    
    for line in lines:
        x1, y1, x2, y2 = line[0]
        
        # Calculate angle
        if x2 == x1:
            angle = 90
        else:
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            if angle < 0:
                angle += 180
        
        # Categorize
        if angle < 15 or angle > 165:  # Horizontal
            horizontal.append((x1, y1, x2, y2))
        elif 75 < angle < 105:  # Vertical
            vertical.append((x1, y1, x2, y2))
        else:  # Diagonal
            diagonal.append((x1, y1, x2, y2))
    
    return horizontal, vertical, diagonal


def filter_lines_by_length(lines, min_length=100):
    """Filter out short lines (likely noise)"""
    if lines is None:
        return []
    
    filtered = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        if length >= min_length:
            filtered.append((x1, y1, x2, y2))
    
    return filtered


def test_parameters(image_path, param_sets):
    """Test different parameter combinations"""
    print(f"\n{'='*60}")
    print(f"🔧 Testing Parameter Combinations")
    print(f"{'='*60}")
    print(f"📸 Image: {image_path.name}\n")
    
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"❌ Failed to load image")
        return None
    
    h, w = image.shape[:2]
    print(f"Image size: {w}x{h}")
    
    results = []
    
    for i, params in enumerate(param_sets, 1):
        print(f"\n📊 Test {i}/{len(param_sets)}: {params['name']}")
        print(f"   Canny: {params['canny_low']}-{params['canny_high']}")
        print(f"   Hough threshold: {params['hough_threshold']}")
        print(f"   Min line length: {params['min_line_length']}")
        print(f"   Max line gap: {params['max_line_gap']}")
        
        lines, edges = detect_lines_optimized(
            image,
            canny_low=params['canny_low'],
            canny_high=params['canny_high'],
            hough_threshold=params['hough_threshold'],
            min_line_length=params['min_line_length'],
            max_line_gap=params['max_line_gap']
        )
        
        if lines is not None:
            # Filter by length
            filtered_lines = filter_lines_by_length(lines, params.get('min_length', 100))
            
            # Categorize
            horizontal, vertical, diagonal = categorize_lines(
                np.array(filtered_lines).reshape(-1, 1, 4) if filtered_lines else None,
                h, w
            )
            
            total = len(horizontal) + len(vertical) + len(diagonal)
            
            print(f"   ✅ Detected: {total} lines")
            print(f"      - Horizontal: {len(horizontal)}")
            print(f"      - Vertical: {len(vertical)}")
            print(f"      - Diagonal: {len(diagonal)}")
            
            results.append({
                'params': params,
                'total_lines': total,
                'horizontal': len(horizontal),
                'vertical': len(vertical),
                'diagonal': len(diagonal),
                'lines': (horizontal, vertical, diagonal),
                'edges': edges
            })
        else:
            print(f"   ⚠️  No lines detected")
            results.append({
                'params': params,
                'total_lines': 0,
                'horizontal': 0,
                'vertical': 0,
                'diagonal': 0,
                'lines': ([], [], []),
                'edges': edges
            })
    
    return results, image


def visualize_best_result(image, best_result, output_path):
    """Visualize the best parameter set"""
    print(f"\n📊 Creating visualization with best parameters...")
    
    annotated = image.copy()
    horizontal, vertical, diagonal = best_result['lines']
    
    # Draw lines with different colors
    for line in horizontal[:50]:  # Limit to avoid clutter
        x1, y1, x2, y2 = line
        cv2.line(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)  # Green for horizontal
    
    for line in vertical[:30]:
        x1, y1, x2, y2 = line
        cv2.line(annotated, (x1, y1), (x2, y2), (255, 0, 0), 2)  # Blue for vertical
    
    for line in diagonal[:20]:
        x1, y1, x2, y2 = line
        cv2.line(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)  # Red for diagonal
    
    # Add info text
    params = best_result['params']
    info_text = [
        f"Best Parameters: {params['name']}",
        f"Total Lines: {best_result['total_lines']}",
        f"H: {best_result['horizontal']} | V: {best_result['vertical']} | D: {best_result['diagonal']}",
        f"Canny: {params['canny_low']}-{params['canny_high']}",
        f"Hough Threshold: {params['hough_threshold']}",
        f"Min Length: {params['min_line_length']}px"
    ]
    
    y_offset = 30
    for text in info_text:
        cv2.putText(annotated, text, (10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        y_offset += 30
    
    cv2.imwrite(str(output_path), annotated)
    print(f"✅ Saved to: {output_path}")


def main():
    """Main optimization function"""
    print("=" * 60)
    print("🔧 Basketball Court Line Detection - Parameter Optimization")
    print("=" * 60)
    
    # Find test images
    project_root = Path(__file__).parent
    parent_dir = project_root.parent
    test_images = [
        parent_dir / "IMG_20251123_194729.jpg",
        parent_dir / "IMG_20251123_194812.jpg",
    ]
    
    found_images = [img for img in test_images if img.exists()]
    
    if not found_images:
        print("❌ No test images found!")
        return
    
    print(f"\n✅ Found {len(found_images)} test image(s)")
    
    # Define parameter sets to test
    param_sets = [
        {
            'name': 'Current (Default)',
            'canny_low': 50,
            'canny_high': 150,
            'hough_threshold': 50,
            'min_line_length': 50,
            'max_line_gap': 10,
            'min_length': 100
        },
        {
            'name': 'More Sensitive',
            'canny_low': 30,
            'canny_high': 100,
            'hough_threshold': 30,
            'min_line_length': 30,
            'max_line_gap': 15,
            'min_length': 80
        },
        {
            'name': 'Less Sensitive (Fewer Lines)',
            'canny_low': 70,
            'canny_high': 200,
            'hough_threshold': 80,
            'min_line_length': 100,
            'max_line_gap': 5,
            'min_length': 150
        },
        {
            'name': 'Balanced (Recommended)',
            'canny_low': 50,
            'canny_high': 150,
            'hough_threshold': 60,
            'min_line_length': 80,
            'max_line_gap': 10,
            'min_length': 120
        },
        {
            'name': 'High Quality (Long Lines Only)',
            'canny_low': 60,
            'canny_high': 180,
            'hough_threshold': 100,
            'min_line_length': 150,
            'max_line_gap': 5,
            'min_length': 200
        }
    ]
    
    # Test on first image
    test_image = found_images[0]
    results, image = test_parameters(test_image, param_sets)
    
    if not results:
        print("❌ No results to analyze")
        return
    
    # Find best result (balance between detection and noise)
    # Score: prefer moderate number of lines (not too many, not too few)
    # and good distribution of horizontal/vertical/diagonal
    best_result = None
    best_score = -1
    
    for result in results:
        if result['total_lines'] == 0:
            continue
        
        # Score based on:
        # 1. Reasonable number of lines (200-800 is good)
        # 2. Good distribution (should have horizontal, vertical, and diagonal)
        # 3. Not too many (avoid noise)
        
        line_count = result['total_lines']
        h_count = result['horizontal']
        v_count = result['vertical']
        d_count = result['diagonal']
        
        # Penalize too many or too few lines
        if 200 <= line_count <= 800:
            count_score = 100
        elif 100 <= line_count < 200 or 800 < line_count <= 1200:
            count_score = 70
        else:
            count_score = 30
        
        # Reward good distribution
        distribution_score = 0
        if h_count > 0:
            distribution_score += 30
        if v_count > 0:
            distribution_score += 30
        if d_count > 0:
            distribution_score += 30
        
        # Penalize extreme imbalance
        if h_count > 0 and v_count > 0:
            balance = min(h_count, v_count) / max(h_count, v_count)
            balance_score = balance * 40
        else:
            balance_score = 0
        
        total_score = count_score + distribution_score + balance_score
        
        if total_score > best_score:
            best_score = total_score
            best_result = result
    
    if best_result:
        print(f"\n{'='*60}")
        print(f"🏆 BEST PARAMETERS FOUND")
        print(f"{'='*60}")
        print(f"Name: {best_result['params']['name']}")
        print(f"Total Lines: {best_result['total_lines']}")
        print(f"  - Horizontal: {best_result['horizontal']}")
        print(f"  - Vertical: {best_result['vertical']}")
        print(f"  - Diagonal: {best_result['diagonal']}")
        print(f"\nParameters:")
        print(f"  Canny Low: {best_result['params']['canny_low']}")
        print(f"  Canny High: {best_result['params']['canny_high']}")
        print(f"  Hough Threshold: {best_result['params']['hough_threshold']}")
        print(f"  Min Line Length: {best_result['params']['min_line_length']}")
        print(f"  Max Line Gap: {best_result['params']['max_line_gap']}")
        print(f"  Min Filter Length: {best_result['params'].get('min_length', 100)}")
        
        # Save visualization
        output_dir = project_root / "test_results"
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / f"optimized_{test_image.stem}.jpg"
        visualize_best_result(image, best_result, output_path)
        
        print(f"\n💡 RECOMMENDATION:")
        print(f"   Update court_detector.py with these optimized parameters!")
    else:
        print("\n⚠️  Could not determine best parameters")


if __name__ == "__main__":
    main()

