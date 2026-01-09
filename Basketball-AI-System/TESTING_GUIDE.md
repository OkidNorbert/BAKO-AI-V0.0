# 🧪 Testing Guide - Basketball Shooting Analysis System

**Date:** January 9, 2026  
**Status:** Ready for testing  
**Modules:** 5 core modules (1933 lines)

---

## 🎯 Quick Start Testing

### Prerequisites

```bash
cd /home/okidi6/Documents/Final-Year-Project/Basketball-AI-System

# Verify modules exist
ls -lh shooting*.py baseline*.py

# Expected output:
# baseline_capture.py (18K)
# shooting_analyzer.py (23K)
# shooting_feature_extractor.py (19K)
# shooting_features.py (9.1K)
# shot_outcome_detector.py (18K)
```

---

## 📋 Test Checklist

### Phase 1: Module Import Tests ✅

**Test 1.1: Import All Modules**
```bash
python3 << 'EOF'
print("Testing module imports...")

try:
    from shooting_features import ShootingFeatures, PlayerBaseline
    print("✅ shooting_features imported")
except Exception as e:
    print(f"❌ shooting_features failed: {e}")

try:
    from shooting_feature_extractor import ShootingFeatureExtractor
    print("✅ shooting_feature_extractor imported")
except Exception as e:
    print(f"❌ shooting_feature_extractor failed: {e}")

try:
    from baseline_capture import BaselineCapture
    print("✅ baseline_capture imported")
except Exception as e:
    print(f"❌ baseline_capture failed: {e}")

try:
    from shot_outcome_detector import ShotOutcomeDetector, HoopDetector
    print("✅ shot_outcome_detector imported")
except Exception as e:
    print(f"❌ shot_outcome_detector failed: {e}")

try:
    from shooting_analyzer import ShootingFormAnalyzer, ConsistencyTracker
    print("✅ shooting_analyzer imported")
except Exception as e:
    print(f"❌ shooting_analyzer failed: {e}")

print("\n✅ All modules imported successfully!")
EOF
```

**Expected Output:**
```
Testing module imports...
✅ shooting_features imported
✅ shooting_feature_extractor imported
✅ baseline_capture imported
✅ shot_outcome_detector imported
✅ shooting_analyzer imported

✅ All modules imported successfully!
```

---

### Phase 2: Feature Extraction Tests 🎬

**Test 2.1: Create Feature Extractor**
```bash
python3 << 'EOF'
from shooting_feature_extractor import ShootingFeatureExtractor

print("Creating feature extractor...")
extractor = ShootingFeatureExtractor()
print("✅ Feature extractor created successfully")
print(f"MediaPipe Pose initialized: {extractor.pose is not None}")
EOF
```

**Test 2.2: Test with Sample Video** (requires video file)
```bash
# First, record a test video or use existing one
# Place it in: test_videos/sample_shot.mp4

python3 << 'EOF'
from shooting_feature_extractor import ShootingFeatureExtractor
import os

video_path = "test_videos/sample_shot.mp4"

if not os.path.exists(video_path):
    print(f"❌ Video not found: {video_path}")
    print("Please record a test video first")
else:
    print(f"Testing feature extraction on: {video_path}")
    
    extractor = ShootingFeatureExtractor()
    
    try:
        features = extractor.extract_shot_features(video_path)
        
        print("\n✅ Feature extraction successful!")
        print(f"\nExtracted Features:")
        print(f"  Release elbow angle: {features.release.elbow_angle:.1f}°")
        print(f"  Release height: {features.release.release_height:.3f}")
        print(f"  Knee flexion: {features.loading.knee_flexion:.1f}°")
        print(f"  Loading depth: {features.loading.loading_depth:.3f}")
        print(f"  Shot duration: {features.timing.total_shot_duration:.2f}s")
        print(f"  Balance score: {features.release.balance_score:.2f}")
        
    except Exception as e:
        print(f"❌ Feature extraction failed: {e}")
        import traceback
        traceback.print_exc()
EOF
```

---

### Phase 3: Outcome Detection Tests 🎯

**Test 3.1: Test Outcome Detector**
```bash
python3 << 'EOF'
from shot_outcome_detector import ShotOutcomeDetector

print("Testing shot outcome detector...")

detector = ShotOutcomeDetector()

# Test with simulated made shot
made_trajectory = [
    (320, 400),  # Start (low)
    (325, 350),  # Rising
    (330, 300),  # Rising
    (335, 250),  # Peak
    (340, 200),  # Descending
    (342, 180),  # Near hoop
    (344, 160),  # Through hoop
    (346, 140),  # After hoop
]

hoop_position = (342, 180)

outcome = detector.detect_outcome(
    ball_trajectory=made_trajectory,
    hoop_position=hoop_position
)

print(f"\n✅ Made Shot Test:")
print(f"  Outcome: {outcome.outcome}")
print(f"  Confidence: {outcome.confidence:.2f}")
print(f"  Method: {outcome.method}")

# Test with simulated missed shot
missed_trajectory = [
    (320, 400),
    (325, 350),
    (330, 300),
    (335, 250),
    (380, 220),  # Off to the side
    (400, 200),
    (420, 180),
]

outcome2 = detector.detect_outcome(
    ball_trajectory=missed_trajectory,
    hoop_position=hoop_position
)

print(f"\n✅ Missed Shot Test:")
print(f"  Outcome: {outcome2.outcome}")
print(f"  Confidence: {outcome2.confidence:.2f}")
print(f"  Method: {outcome2.method}")
EOF
```

**Expected Output:**
```
Testing shot outcome detector...

✅ Made Shot Test:
  Outcome: made
  Confidence: 0.75-0.95
  Method: trajectory_crossing

✅ Missed Shot Test:
  Outcome: missed
  Confidence: 0.80-0.90
  Method: trajectory_miss
```

---

### Phase 4: Baseline Capture Tests 📊

**Test 4.1: Create Baseline Directory**
```bash
mkdir -p baselines
echo "✅ Baselines directory created"
```

**Test 4.2: Test Baseline Capture** (requires multiple videos)
```bash
python3 << 'EOF'
from baseline_capture import BaselineCapture
import os

print("Testing baseline capture...")

capture = BaselineCapture()

# Check if test videos exist
test_videos = [
    "test_videos/shot_001.mp4",
    "test_videos/shot_002.mp4",
    "test_videos/shot_003.mp4",
]

existing_videos = [v for v in test_videos if os.path.exists(v)]

if len(existing_videos) < 3:
    print(f"❌ Need at least 3 test videos")
    print(f"Found: {len(existing_videos)}")
    print("Please record test videos first")
else:
    print(f"Found {len(existing_videos)} test videos")
    
    # Simulate outcomes (in real use, detect automatically)
    outcomes = ["made", "made", "missed"]
    
    try:
        baseline = capture.capture_baseline(
            player_id="test_player_001",
            shot_videos=existing_videos,
            shot_outcomes=outcomes
        )
        
        print("\n✅ Baseline capture successful!")
        print(f"  Player: {baseline.player_id}")
        print(f"  Total shots: {baseline.num_shots_captured}")
        print(f"  Made shots: {baseline.num_made_shots}")
        print(f"  Release elbow: {baseline.release_elbow_angle_mean:.1f}° ± {baseline.release_elbow_angle_std:.1f}°")
        print(f"  Saved to: baselines/{baseline.player_id}.json")
        
    except Exception as e:
        print(f"❌ Baseline capture failed: {e}")
        import traceback
        traceback.print_exc()
EOF
```

---

### Phase 5: Form Analysis Tests 🔍

**Test 5.1: Test Form Analyzer**
```bash
python3 << 'EOF'
from shooting_analyzer import ShootingFormAnalyzer
from shooting_feature_extractor import ShootingFeatureExtractor
import os

print("Testing form analyzer...")

analyzer = ShootingFormAnalyzer()

# Try to load existing baseline
if analyzer.load_baseline("test_player_001"):
    print("✅ Baseline loaded successfully")
    
    # Test with a new shot
    video_path = "test_videos/new_shot.mp4"
    
    if os.path.exists(video_path):
        print(f"Analyzing: {video_path}")
        
        # Extract features
        extractor = ShootingFeatureExtractor()
        features = extractor.extract_shot_features(video_path)
        
        # Analyze
        analysis = analyzer.analyze_shot(
            shot_id="test_shot_001",
            player_id="test_player_001",
            features=features,
            outcome="made",
            outcome_confidence=0.9
        )
        
        print("\n✅ Analysis complete!")
        print(f"  Consistency score: {analysis.consistency_score:.2f}")
        print(f"  Deviations detected: {len(analysis.deviations)}")
        
        if len(analysis.deviations) > 0:
            print("\n  Top deviations:")
            for dev in analysis.deviations[:3]:
                print(f"    • {dev.feature}: {dev.severity}")
                print(f"      {dev.description}")
        
        print("\n  Recommendations:")
        for rec in analysis.recommendations:
            print(f"    • {rec}")
    else:
        print(f"❌ Test video not found: {video_path}")
else:
    print("❌ No baseline found for test_player_001")
    print("Please run baseline capture test first")
EOF
```

---

## 🎬 Recording Test Videos

### Quick Recording Guide

**Option 1: Phone Camera**
```bash
# Record on phone:
# - Duration: 5-10 seconds
# - Orientation: Horizontal
# - Quality: 1080p, 30 FPS
# - Framing: Full body visible

# Transfer to computer:
# - USB cable
# - Cloud (Google Drive, Dropbox)
# - AirDrop (Mac/iPhone)

# Place in:
mkdir -p test_videos
# Move videos to test_videos/
```

**Option 2: Webcam** (if available)
```bash
# Use ffmpeg or similar tool
ffmpeg -f v4l2 -i /dev/video0 -t 10 test_videos/shot_001.mp4
```

**Minimum Test Dataset:**
- 3 shots for baseline capture test
- 1 shot for analysis test
- Total: 4 videos (5-10 seconds each)

---

## 📊 Expected Test Results

### Success Criteria

| Test | Expected Result | Status |
|------|-----------------|--------|
| Module imports | All 5 modules import without errors | ⏳ |
| Feature extraction | Extracts 20+ features from video | ⏳ |
| Outcome detection | Correctly identifies made/missed | ⏳ |
| Baseline capture | Creates baseline from 3+ shots | ⏳ |
| Form analysis | Detects deviations, gives recommendations | ⏳ |

### Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Feature extraction time | <10s per shot | ⏳ |
| Baseline capture time | <5 min for 30 shots | ⏳ |
| Analysis time | <5s per shot | ⏳ |
| Memory usage | <2GB | ⏳ |

---

## 🐛 Troubleshooting

### Common Issues

**Issue 1: MediaPipe Import Error**
```bash
# Solution: Install MediaPipe
pip install mediapipe==0.10.9
```

**Issue 2: OpenCV Import Error**
```bash
# Solution: Install OpenCV
pip install opencv-python==4.10.0.84
```

**Issue 3: NumPy Version Conflict**
```bash
# Solution: Update NumPy
pip install numpy>=1.24.0
```

**Issue 4: Video File Not Found**
```bash
# Solution: Check path and create directory
mkdir -p test_videos
ls -la test_videos/
```

**Issue 5: Baseline Not Found**
```bash
# Solution: Run baseline capture first
# Or check baselines directory
ls -la baselines/
```

---

## 📝 Test Report Template

```markdown
# Test Report - Shooting Analysis System

**Date:** [Date]
**Tester:** [Name]
**Environment:** [OS, Python version]

## Test Results

### Module Imports
- [ ] shooting_features: PASS / FAIL
- [ ] shooting_feature_extractor: PASS / FAIL
- [ ] baseline_capture: PASS / FAIL
- [ ] shot_outcome_detector: PASS / FAIL
- [ ] shooting_analyzer: PASS / FAIL

### Feature Extraction
- [ ] Extracts features successfully: PASS / FAIL
- [ ] Processing time: [X] seconds
- [ ] Features extracted: [X] features

### Outcome Detection
- [ ] Made shot detection: PASS / FAIL
- [ ] Missed shot detection: PASS / FAIL
- [ ] Confidence scores: [X]

### Baseline Capture
- [ ] Creates baseline: PASS / FAIL
- [ ] Saves to JSON: PASS / FAIL
- [ ] Loads from JSON: PASS / FAIL

### Form Analysis
- [ ] Analyzes shot: PASS / FAIL
- [ ] Detects deviations: PASS / FAIL
- [ ] Generates recommendations: PASS / FAIL

## Issues Found
1. [Issue description]
2. [Issue description]

## Notes
[Additional observations]
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅

1. **Start Dataset Recording**
   - Record 300 videos (jump shots, layups, free throws)
   - Label outcomes (made/missed)
   - Organize by category

2. **Create API Endpoints**
   - Implement 5 new routes
   - Test with Postman/curl
   - Document API

3. **Update Frontend**
   - Update for 4 categories
   - Create baseline setup page
   - Create analysis dashboard

### If Tests Fail ❌

1. **Debug Issues**
   - Check error messages
   - Verify dependencies
   - Review module code

2. **Report Issues**
   - Document errors
   - Provide stack traces
   - Note environment details

3. **Fix and Retest**
   - Apply fixes
   - Run tests again
   - Verify resolution

---

## 📞 Support

**Documentation:**
- [Complete System Summary](complete_system_summary.md)
- [Implementation Walkthrough](implementation_walkthrough.md)
- [Quick Start Dev Guide](quick_start_dev.md)

**Code Files:**
- `shooting_features.py` - Data structures
- `shooting_feature_extractor.py` - Feature extraction
- `baseline_capture.py` - Baseline creation
- `shot_outcome_detector.py` - Outcome detection
- `shooting_analyzer.py` - Form analysis

---

**Ready to test! Start with Phase 1 (Module Imports) and work through each phase. 🧪🏀**

---

**Last Updated:** January 9, 2026  
**Status:** Ready for testing
