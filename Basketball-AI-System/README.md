# 🏀 Basketball Shooting Analysis System

**Focus:** Jump shooting mechanics, form consistency, and shot outcome detection  
**Approach:** Player-specific baseline (not global ideal comparison)  
**Status:** Core modules implemented, ready for testing

---

## 🎯 System Overview

This system analyzes basketball jump shooting mechanics to help players improve their shooting consistency. Unlike traditional systems that compare players to a "perfect" form, this system:

1. **Captures your baseline** - Records your most effective shooting form from 20-30 successful shots
2. **Analyzes deviations** - Compares each shot to YOUR baseline, not a generic ideal
3. **Detects outcomes** - Automatically identifies made vs missed shots
4. **Tracks consistency** - Monitors form repeatability over time

---

## 📊 Supported Actions

### Primary Focus: Shooting

| Action | Description | Dataset Requirement |
|--------|-------------|---------------------|
| **Jump Shots** | Mid-range and three-point shots | 150 videos |
| **Layups** | Close-range layups (left/right hand) | 100 videos |
| **Free Throws** | Free throw line shots | 50 videos |

**Total Dataset:** 300 videos (reduced from 700!)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Baseline    │  │   Shooting   │  │  Consistency │  │
│  │  Setup       │  │   Analysis   │  │   Dashboard  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────┐
│                BACKEND (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Baseline   │  │   Feature    │  │    Shot      │  │
│  │   Capture    │  │  Extractor   │  │   Outcome    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              COMPUTER VISION PIPELINE                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   YOLOv11    │  │  MediaPipe   │  │   Tracking   │  │
│  │   Detection  │→ │     Pose     │→ │   System     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd Basketball-AI-System

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Start Backend

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

### 4. Access System

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📁 Core Modules

### 1. shooting_features.py
**Purpose:** Data structures for shooting analysis

**Key Classes:**
- `ShootingFeatures` - Complete feature set (setup, loading, release, follow-through, timing)
- `PlayerBaseline` - Player-specific statistical baseline
- `ShootingAnalysis` - Single shot analysis result

### 2. shooting_feature_extractor.py
**Purpose:** Extract biomechanical features from videos

**Capabilities:**
- Automatic phase detection (setup → loading → release → follow-through)
- Joint angle calculations (knee, elbow, shoulder, wrist)
- Balance and stability scoring
- Temporal feature extraction

### 3. baseline_capture.py
**Purpose:** Capture player-specific baseline

**Workflow:**
1. Record 20-30 stationary jump shots
2. Extract features from each shot
3. Filter for made shots (need ≥10)
4. Calculate mean ± std for all features
5. Select 5 reference shots
6. Save baseline as JSON

### 4. shot_outcome_detector.py
**Purpose:** Detect made vs missed shots

**Method:**
- Rule-based trajectory analysis
- Hoop position detection
- Downward crossing detection
- Confidence scoring

---

## 🎯 Dataset Requirements

### Recording Guidelines

**Equipment:**
- Phone camera (1080p, 30 FPS minimum)
- Tripod (recommended)
- Good lighting

**Camera Setup:**
- Position: Side view, 45° angle
- Distance: 10-15 feet from player
- Height: Chest to head level
- Framing: Full body visible

**Video Specs:**
- Duration: 5-10 seconds per clip
- Orientation: Horizontal (landscape)
- Format: MP4, MOV, or AVI
- Quality: 1080p minimum

### Dataset Structure

```
dataset/raw_videos/
├── jump_shots/
│   ├── mid_range/      (50 videos)
│   ├── three_point/    (50 videos)
│   └── pull_up/        (50 videos)
├── layups/
│   ├── right_hand/     (50 videos)
│   └── left_hand/      (50 videos)
└── free_throws/        (50 videos)
```

---

## 🧪 Testing

### Test Feature Extraction

```python
from shooting_feature_extractor import ShootingFeatureExtractor

extractor = ShootingFeatureExtractor()
features = extractor.extract_shot_features("test_shot.mp4")

print(f"Release elbow angle: {features.release.elbow_angle:.1f}°")
print(f"Knee flexion: {features.loading.knee_flexion:.1f}°")
print(f"Shot duration: {features.timing.total_shot_duration:.2f}s")
```

### Test Baseline Capture

```python
from baseline_capture import BaselineCapture

capture = BaselineCapture()

baseline = capture.capture_baseline(
    player_id="player_001",
    shot_videos=["shot_001.mp4", "shot_002.mp4", ...],
    shot_outcomes=["made", "made", "missed", ...]
)

print(f"Baseline created: {baseline.num_made_shots} made shots")
```

### Test Outcome Detection

```python
from shot_outcome_detector import ShotOutcomeDetector

detector = ShotOutcomeDetector()

outcome = detector.detect_outcome(
    ball_trajectory=[(x1, y1), (x2, y2), ...],
    hoop_position=(hoop_x, hoop_y)
)

print(f"Outcome: {outcome.outcome}")
print(f"Confidence: {outcome.confidence:.2f}")
```

---

## 📊 Features Analyzed

### Setup Phase
- Stance width
- Shoulder alignment
- Ball position
- Head alignment

### Loading Phase
- Knee flexion angle
- Hip flexion
- Elbow angle
- Loading depth
- Loading duration

### Release Phase
- Elbow angle at release
- Wrist flexion
- Release height
- Shoulder angle
- Release angle
- Balance score

### Follow-Through Phase
- Wrist snap angle
- Arm extension
- Follow-through duration
- Balance recovery

### Timing
- Total shot duration
- Loading to release time
- Rhythm consistency

---

## 🗓️ Development Timeline

### Month 1: Core Development (Current)
- ✅ Week 1: Core modules complete
- ⏳ Week 2: Integration & testing
- ⏳ Week 3: API endpoints
- ⏳ Week 4: Frontend pages

### Month 2: Dataset & Validation
- Week 5-6: Record 300 videos
- Week 7: Capture baselines
- Week 8: Testing & refinement

### Month 3: Finalization
- Week 9-10: Frontend polish
- Week 11: User testing
- Week 12: Demo & delivery

---

## 📚 Documentation

- [Implementation Plan](/.gemini/antigravity/brain/*/shooting_analysis_implementation_plan.md)
- [Dataset Requirements](/.gemini/antigravity/brain/*/simplified_dataset_requirements.md)
- [Implementation Walkthrough](/.gemini/antigravity/brain/*/implementation_walkthrough.md)

---

## 🎓 Academic Contributions

### Novel Aspects

1. **Player-Specific Baseline Approach**
   - Personalized to each player's effective form
   - Not comparing to generic "ideal"
   - More actionable feedback

2. **Explainable Shot Outcome Detection**
   - Rule-based (not black-box ML)
   - Geometric trajectory analysis
   - Transparent decision-making

3. **Phase-Based Biomechanical Analysis**
   - Automatic phase detection
   - Phase-specific feature extraction
   - Comprehensive shooting motion analysis

---

## 🤝 Contributing

This is a final year computer science project focused on AI-based basketball skill improvement.

**Student:** Okidi Norbert  
**Institution:** Uganda Christian University (UCU)  
**Timeline:** 3 months (January - March 2026)

---

## 📞 Support

For questions or issues:
1. Check documentation in `/.gemini/antigravity/brain/*/`
2. Review implementation walkthrough
3. Test with sample videos first

---

**Last Updated:** January 9, 2026  
**Status:** Core modules complete, ready for integration and testing
