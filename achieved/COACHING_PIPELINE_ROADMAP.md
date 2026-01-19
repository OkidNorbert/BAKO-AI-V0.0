# 🎯 Evidence-Based Coaching Pipeline - Implementation Roadmap

## Executive Summary

Transform clip-level action detection into a **continuous action-segmentation → biomechanics → scoring → evidence-based coaching pipeline** using:
- Rule-based biomechanics + data-driven models
- Real-time-friendly inference
- Strong dataset/annotation practices

---

## 🚀 PRIORITY OVERVIEW

### Critical (Do First)
1. ✅ **Action segmentation** (sliding windows / framewise) - **IN PROGRESS**
2. ⏳ **Robust biomechanics features** per action segment
3. ⏳ **Rule-based quality checks** (elbow alignment, release angle, arc)
4. ⏳ **Supervised ML scoring models** (fine-tune on labeled examples)
5. ⏳ **Human-readable diagnostics + prioritized drills**

### High Priority
6. ⏳ **Continuous timeline UI + overlays** and session reports
7. ⏳ **Real-time mode**: lightweight model + sliding-window inference + batching
8. ⏳ **Monitoring, calibration, long-term dataset growth & privacy**

---

## 📋 DETAILED IMPLEMENTATION PLAN

### 1. Action Segmentation (CRITICAL) ✅ IN PROGRESS

**Current State**: Basic sliding windows implemented  
**Needs**: Temporal smoothing, confidence-weighted timestamps, merge adjacent identical labels

**Implementation**:
```python
# Enhanced segmentation with smoothing
window = 16  # frames (0.5s @ 30fps)
stride = 8   # overlap
labels = []

for start in range(0, total_frames-window+1, stride):
    clip = frames[start:start+window]
    label, confidence = model.predict(clip)
    labels.append((start, start+window, label, confidence))

# Apply temporal smoothing (median filter or CRF)
smoothed_labels = temporal_smooth(labels, method='median', window=3)

# Merge adjacent identical labels
merged_segments = merge_adjacent_segments(smoothed_labels)
```

**Files to Modify**:
- `backend/app/services/video_processor.py` - Add smoothing logic
- `backend/app/models/action_segmenter.py` - NEW: Segmentation utilities

---

### 2. Robust Pose Processing & Normalization (CRITICAL)

**Implementation**:
- Player-centric coordinate system (center on mid-hip, scale by torso length)
- Temporal smoothing (OneEuroFilter)
- Missing data handling (linear interpolation)
- Calibration (pixel → meters conversion)

**Files to Create**:
- `backend/app/models/pose_normalizer.py` - NEW
- `backend/app/models/pose_smoother.py` - NEW

**Key Functions**:
```python
def normalize_pose(keypoints, reference_frame=None):
    """Convert to player-centric coordinates"""
    center = (left_hip + right_hip) / 2
    torso_length = compute_torso_length(keypoints)
    norm_keypoints = (keypoints - center) / torso_length
    return norm_keypoints

def smooth_pose_sequence(keypoints_sequence, beta=0.1, min_cutoff=1.0):
    """Apply OneEuroFilter for temporal smoothing"""
    # Implementation
```

---

### 3. Biomechanics Features & Formulas (CRITICAL)

**Core Features**:
- Joint angles (elbow, knee, shoulder)
- Hip vertical displacement → jump height
- Release point coordinates and timing
- Release angle (shoulder-elbow-wrist in vertical plane)
- Wrist snap / follow-through (angular velocity)
- Ball handling metrics (dribble height, frequency, consistency)
- Balance / stability (COM variance)
- Foot placement (ankle positions at keyframes)
- Movement speed (hip velocity → m/s)
- Smoothness / jerk (third derivative)

**Files to Create/Modify**:
- `backend/app/models/biomechanics_engine.py` - NEW: Comprehensive biomechanics
- `backend/app/models/metrics_engine.py` - Enhance existing

**Key Functions**:
```python
def compute_joint_angle(point_a, point_b, point_c):
    """Calculate angle at point_b"""
    ba = point_a - point_b
    bc = point_c - point_b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(np.clip(cos_angle, -1, 1)))

def compute_jump_height(hip_positions, baseline_height):
    """Calculate jump height from hip vertical displacement"""
    peak_height = np.max(hip_positions[:, 1])
    jump_height = (baseline_height - peak_height) * scale_factor
    return jump_height

def detect_release_frame(wrist_positions, ball_positions):
    """Detect frame where ball leaves hand"""
    # Find frame with max wrist forward velocity + ball separation
```

---

### 4. Rule-Based Checks (HIGH PRIORITY)

**Expanded Rules**:
- Elbow alignment (lateral deviation < 12°)
- Shooting arc (parabola apex threshold)
- Knee bend (110-130° optimal)
- Release timing (wrist peak velocity within 0.05s of release)
- Balance (horizontal COM sway threshold)
- Dribble height (hand-to-floor distance)
- Ball control consistency (variance threshold)

**Files to Create/Modify**:
- `backend/app/models/form_quality_analyzer.py` - Expand existing
- `backend/app/models/rule_based_evaluator.py` - NEW

**Structure**:
```python
class RuleBasedEvaluator:
    def check_elbow_alignment(self, keypoints):
        """Check elbow flaring"""
        deviation = compute_lateral_deviation(keypoints)
        if deviation > 12:
            return {
                'pass': False,
                'value': deviation,
                'message': f"Elbow flaring by {deviation}°",
                'drill': "Wall elbow drill, 3×50 reps"
            }
    
    def check_shooting_arc(self, ball_trajectory):
        """Check ball arc height"""
        apex = compute_parabola_apex(ball_trajectory)
        if apex < threshold:
            return {
                'pass': False,
                'value': apex,
                'message': "Low shooting arc",
                'drill': "Wrist snap drills, chair target arc exercises"
            }
```

---

### 5. Reference "Ideal Form" & Scoring (HIGH PRIORITY)

**Three-Pronged Approach**:

**A. Rule-Based Target Ranges** (Fast)
- Set ideal ranges per metric
- Score = proportion of metrics within ideal range

**B. Template Similarity** (No External Data)
- Select expert clips per action
- Compute DTW or sequence cosine similarity
- Similarity score ∈ [0,1]

**C. Supervised ML Scoring** (Long-term)
- Collect labeled examples (good vs bad)
- Train lightweight transformer / 1D CNN / XGBoost
- Output: continuous skill score & error types

**Files to Create**:
- `backend/app/models/form_scorer.py` - NEW
- `backend/app/models/template_matcher.py` - NEW
- `training/train_form_scorer.py` - NEW

**Hybrid Scoring**:
```python
def compute_form_score(metrics, rule_scores, template_similarity, ml_score):
    """Combine all scoring methods"""
    rule_weight = 0.4
    template_weight = 0.3
    ml_weight = 0.3
    
    final_score = (
        rule_weight * rule_scores +
        template_weight * template_similarity +
        ml_weight * ml_score
    )
    return final_score
```

---

### 6. Error Diagnosis & Prioritized Recommendations (HIGH PRIORITY)

**Enhanced Recommendation System**:
- Map failures to 1-3 drills
- Include expected measurable goals
- Show video example links
- Prioritize by impact and ease

**Files to Modify**:
- `backend/app/models/ai_coach.py` - Enhance existing
- `backend/app/models/drill_recommender.py` - NEW

**Structure**:
```python
class DrillRecommender:
    DRILL_DATABASE = {
        'elbow_flaring': {
            'drills': [
                {
                    'name': 'Wall elbow drill',
                    'reps': '3×50',
                    'focus': 'Keep elbow under ball',
                    'goal': 'Reduce deviation by 5° in 4 weeks',
                    'video_url': '...'
                }
            ],
            'impact': 'high',
            'ease': 'medium'
        }
    }
    
    def recommend_drills(self, errors, prioritize_by='impact'):
        """Generate prioritized drill recommendations"""
```

---

### 7. Timeline UI & Overlays (MEDIUM PRIORITY)

**Features**:
- Timeline view with color-coded segments
- Frame-by-frame overlay (skeleton + bounding box + label + metrics)
- Per-action card (metrics, faults, drills, history)
- Session summary PDF export

**Files to Create/Modify**:
- `frontend/src/components/TimelineView.tsx` - NEW
- `frontend/src/components/ActionCard.tsx` - NEW
- `frontend/src/components/SessionSummary.tsx` - NEW
- `backend/app/services/report_generator.py` - NEW

---

### 8. Database Schema (MEDIUM PRIORITY)

**Tables**:
```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR,
    height_m FLOAT,
    weight_kg FLOAT,
    created_at TIMESTAMP
);

-- Videos
CREATE TABLE videos (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    filename VARCHAR,
    duration FLOAT,
    fps INT,
    uploaded_at TIMESTAMP
);

-- Segments (action segments)
CREATE TABLE segments (
    id UUID PRIMARY KEY,
    video_id UUID REFERENCES videos(id),
    start_s FLOAT,
    end_s FLOAT,
    action VARCHAR,
    confidence FLOAT,
    created_at TIMESTAMP
);

-- Metrics (per segment)
CREATE TABLE metrics (
    id UUID PRIMARY KEY,
    segment_id UUID REFERENCES segments(id),
    metric_name VARCHAR,
    metric_value FLOAT,
    unit VARCHAR,
    created_at TIMESTAMP
);

-- Recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY,
    segment_id UUID REFERENCES segments(id),
    rec_text TEXT,
    rec_type VARCHAR,
    priority VARCHAR,
    drill_name VARCHAR,
    created_at TIMESTAMP
);

-- Annotations (for training)
CREATE TABLE annotations (
    id UUID PRIMARY KEY,
    segment_id UUID REFERENCES segments(id),
    labeler_id UUID REFERENCES users(id),
    quality_label VARCHAR, -- 'good', 'ok', 'bad'
    faults JSONB, -- ['elbow_flare', 'low_arc']
    created_at TIMESTAMP
);
```

**Files to Create**:
- `backend/app/database/schema.sql` - NEW
- `backend/app/database/migrations/` - NEW

---

### 9. Real-Time Deployment (MEDIUM PRIORITY)

**Two-Tier Inference**:
1. **Lightweight model** for immediate UI (~<200ms)
   - Pose-only classifier (LSTM on joint angles)
   - TSM/TSN for fast action classification
2. **Heavy model** in background
   - VideoMAE for detailed scoring
   - Updates refined results asynchronously

**Files to Create**:
- `backend/app/models/lightweight_classifier.py` - NEW
- `backend/app/services/realtime_processor.py` - NEW

---

### 10. Explainability & Trust (MEDIUM PRIORITY)

**Features**:
- Show raw numbers that spurred recommendations
- Provide confidence levels
- Allow users to "challenge" AI (coach review)
- Collect corrections to improve model

**Files to Modify**:
- `frontend/src/components/RecommendationCard.tsx` - Add explainability
- `backend/app/api/feedback.py` - NEW: Challenge mechanism

---

## 📅 SUGGESTED SHORT-TERM ROADMAP (10 Working Days)

### Day 1-2: Action Segmentation + Timeline UI
- ✅ Implement sliding-window segmentation with smoothing
- ✅ Create timeline UI component
- ✅ Merge adjacent identical labels

### Day 3-4: Pose Normalization + Biomechanics
- ✅ Implement pose normalization (player-centric coordinates)
- ✅ Add temporal smoothing (OneEuroFilter)
- ✅ Enhance biomechanics features (angles, jump height, release timing)

### Day 5-6: Rule-Based Checks + Recommendations
- ✅ Expand rule-based checks (elbow, arc, release, balance)
- ✅ Generate textual recommendations with drills
- ✅ Prioritize by impact and ease

### Day 7-8: Database + Session Reports
- ✅ Create database schema
- ✅ Build segment-level storage
- ✅ Session summary report export (PDF)

### Day 9-10: Real-Time Inference + Labeling Prep
- ✅ Integrate lightweight real-time inference
- ✅ Set up labeling infrastructure (Label Studio integration)
- ✅ Gather 50 labeled clips for supervised scoring

---

## 🛠️ TOOLS & LIBRARIES

### Pose Processing
- **MediaPipe** / **MoveNet** - Pose estimation
- **OneEuroFilter** - Temporal smoothing

### Video Models
- **PyTorch** - Framework
- **VideoMAE** - Offline high-accuracy
- **TSM/TSN** - Fast online inference

### Inference
- **TorchScript** / **ONNX** - Model optimization
- **Triton** - Production serving (if needed)

### Backend
- **FastAPI** - API framework
- **Celery/Redis** - Worker queues (for heavy processing)

### Frontend
- **React** - UI framework
- **react-timeline** - Timeline visualization
- **video.js** - Video overlay

### Database
- **Supabase/Postgres** - Database
- **Supabase Storage** - Video storage

### Labeling
- **Label Studio** / **CVAT** - Annotation tools

---

## 📊 EXAMPLE: Full Pipeline for Shooting

### Step-by-Step Process

1. **Segment Video**
   - Sliding window (16 frames, stride 8)
   - Detect shot windows (ball release events)
   - Temporal smoothing

2. **For Each Shot Segment**
   - Extract frames around shot (-0.3s to +0.5s)
   - Pose smoothing and normalization
   - Compute angles: elbow, shoulder, knee
   - Compute jump height and release height
   - Compute wrist angular velocity and follow-through
   - Compare to rule ranges & templates

3. **Produce Score**
   - Aggregate into `shooting_form_score` (0-100)
   - Map failures to 1-3 drills
   - Show video timestamps for practice

4. **Save & Display**
   - Save segment metrics to DB
   - Show in session summary
   - Export PDF report

---

## 💬 EXAMPLE MESSAGES (What the App Should Say)

### Shooting
```
"Your elbow flares out by 12° during release. 
Try 3×50 elbow-wall form shots, focusing on keeping elbow under the ball."
```

### Jump Height
```
"Jump height is 10% below your weekly average — 
take 48 hours rest or perform plyometric routine twice/week."
```

### Dribbling
```
"Dribble height is 20 cm above knee — 
practice low-cone zigzag drill for 10 mins per session."
```

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- Action segmentation accuracy: >90%
- Biomechanics feature accuracy: ±2° for angles, ±5cm for jump height
- Scoring correlation with human experts: >0.8 Spearman correlation
- Real-time inference latency: <200ms for lightweight model

### User Experience Metrics
- Recommendation relevance: >80% user satisfaction
- Drill completion rate: Track user engagement
- Skill improvement: Measure metrics over time

---

## 🔄 CONTINUOUS IMPROVEMENT

### Dataset Growth
- Collect labeled examples continuously
- Target: 500-1000 per action (balanced good/bad)
- Expert annotations: 2-3 coaches per clip

### Model Updates
- Periodically retrain scoring models
- A/B test model thresholds
- Calibrate outputs to meaningful ranges

### Monitoring
- Log predictions, metrics, user feedback
- Store model versions
- Track performance over time

---

## 📝 NEXT STEPS

1. **Start with Critical Items** (Days 1-6)
   - Action segmentation enhancement
   - Pose normalization
   - Biomechanics features
   - Rule-based checks

2. **Build Infrastructure** (Days 7-8)
   - Database schema
   - Session reports

3. **Optimize for Real-Time** (Days 9-10)
   - Lightweight models
   - Labeling setup

4. **Long-term** (Weeks 2-4)
   - Supervised ML scoring
   - Template matching
   - Advanced UI features

---

**This roadmap transforms the system from action detection to evidence-based coaching!** 🏀

