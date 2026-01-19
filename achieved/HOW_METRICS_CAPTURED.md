# 📊 How Performance Metrics & Biomechanics Are Captured from Video

## Overview

The system extracts comprehensive performance metrics and biomechanics data from video using a multi-stage pipeline that combines computer vision, pose estimation, and biomechanical analysis.

---

## 🔄 Complete Processing Pipeline

### Step 1: Video Frame Extraction
```
Video File (MP4/MOV/AVI)
    ↓
OpenCV VideoCapture
    ↓
Extract frames at 30 FPS (or video's native FPS)
    ↓
Each frame: RGB image (width × height pixels)
```

### Step 2: Player Detection (YOLO)
```
Frame
    ↓
YOLOv11 Model (pre-trained on COCO dataset)
    ↓
Detects "person" class (class ID: 0)
    ↓
Bounding box: [x1, y1, x2, y2, confidence]
    ↓
Extract Region of Interest (ROI) = Player bounding box
```

**What we get:**
- Player location in frame
- Bounding box coordinates
- Detection confidence

---

### Step 3: Pose Keypoint Extraction (MediaPipe)
```
Player ROI (cropped image)
    ↓
MediaPipe Pose Model
    ↓
33 Body Keypoints (x, y, z coordinates)
```

**Keypoints Detected:**
- **Face**: Nose, eyes, ears (5 points)
- **Upper Body**: Shoulders, elbows, wrists (6 points)
- **Torso**: Chest, hips (4 points)
- **Lower Body**: Knees, ankles, feet (18 points)

**Example Output:**
```python
keypoints = [
    [0.5, 0.2, 0.1],  # Nose (x, y, z in normalized coordinates)
    [0.45, 0.3, 0.12], # Left eye
    [0.55, 0.3, 0.12], # Right eye
    ...
    [0.4, 0.6, 0.2],  # Left shoulder
    [0.6, 0.6, 0.2],  # Right shoulder
    [0.35, 0.7, 0.25], # Left elbow
    [0.65, 0.7, 0.25], # Right elbow
    [0.3, 0.8, 0.3],  # Left wrist
    [0.7, 0.8, 0.3],  # Right wrist
    ...
    [0.45, 0.9, 0.4], # Left hip
    [0.55, 0.9, 0.4], # Right hip
    ...
]
```

---

### Step 4: Pose Normalization (NEW!)
```
Raw Keypoints (normalized to image: 0-1)
    ↓
PoseNormalizer
    ↓
Player-Centric Coordinates
```

**Process:**
1. **Center on mid-hip**: Translate all keypoints so hip center = (0, 0)
2. **Scale by torso length**: Divide all coordinates by torso length
3. **Result**: Metrics are now invariant to camera distance and player position

**Why this matters:**
- Same player at different distances → same metrics
- Different camera angles → comparable results
- Metrics in "body units" (e.g., jump height = 0.3 torso lengths)

---

### Step 5: Temporal Smoothing (NEW!)
```
Normalized Keypoints Sequence
    ↓
OneEuroFilter (temporal smoothing)
    ↓
Smoothed Keypoints (reduced jitter)
```

**Process:**
- Applies exponential filter to reduce noise
- Maintains responsiveness to actual movements
- Reduces false positives from detection jitter

---

### Step 6: Biomechanics Feature Extraction

#### A. Joint Angles
```
Keypoints (shoulder, elbow, wrist)
    ↓
Vector Math
    ↓
Angle Calculation
```

**Formula:**
```python
# Elbow angle (shoulder-elbow-wrist)
shoulder = keypoints[12]  # Right shoulder
elbow = keypoints[14]     # Right elbow
wrist = keypoints[16]     # Right wrist

# Vectors
v1 = shoulder - elbow  # Upper arm
v2 = wrist - elbow     # Forearm

# Angle
cos_angle = dot(v1, v2) / (|v1| × |v2|)
angle = arccos(cos_angle)  # in degrees
```

**What we get:**
- Elbow angle: 78° (should be 85-95° for shooting)
- Knee angle: 125° (should be 110-130° for jump)
- Shoulder angle: 45° (for arm position)

---

#### B. Jump Height
```
Hip Positions Over Time
    ↓
Find Peak (highest point)
    ↓
Calculate Displacement
    ↓
Convert to Meters
```

**Process:**
1. Track hip Y-coordinate across frames
2. Find minimum Y (highest point = jump peak)
3. Calculate: `jump_height = (baseline_y - peak_y) × scale_factor`
4. Scale factor converts pixels → meters (using torso length or known player height)

**Example:**
```
Frame 0: hip_y = 0.6 (standing)
Frame 15: hip_y = 0.4 (jump peak)
Displacement = 0.2 (normalized)
Jump height = 0.2 × 2.0m (scale) = 0.4m
```

---

#### C. Release Detection
```
Wrist Positions Over Time
    ↓
Calculate Wrist Velocities
    ↓
Find Peak Velocity
    ↓
Release Frame = Peak Velocity Frame
```

**Process:**
1. Track wrist position (x, y) across frames
2. Calculate velocity: `v = (position[t] - position[t-1]) / dt`
3. Find frame with maximum forward velocity
4. This is the release frame (ball leaves hand)

**What we get:**
- Release frame index: Frame 12
- Release timing: 0.4 seconds into action
- Release angle: 48° (shoulder-elbow-wrist angle)

---

#### D. Movement Speed
```
Hip Positions Over Time
    ↓
Calculate Horizontal Displacement
    ↓
Divide by Time
    ↓
Speed (m/s)
```

**Formula:**
```python
# Hip center positions
hip_positions = [(x1, y1), (x2, y2), ..., (xn, yn)]

# Calculate velocities
velocities = []
for i in range(1, len(hip_positions)):
    dx = hip_positions[i][0] - hip_positions[i-1][0]
    dy = hip_positions[i][1] - hip_positions[i-1][1]
    speed = sqrt(dx² + dy²) / dt
    velocities.append(speed)

# Average speed
avg_speed = mean(velocities)
```

---

#### E. Movement Smoothness (Jerk)
```
Joint Trajectory (hip positions)
    ↓
First Derivative (velocity)
    ↓
Second Derivative (acceleration)
    ↓
Third Derivative (jerk)
    ↓
Smoothness Score
```

**Formula:**
```python
# Position → Velocity
velocity = diff(positions) / dt

# Velocity → Acceleration
acceleration = diff(velocity) / dt

# Acceleration → Jerk
jerk = diff(acceleration) / dt

# Smoothness (inverse of jerk)
smoothness = 1.0 / (1.0 + mean(jerk_magnitude) × 100)
```

**What it means:**
- Low jerk = smooth, fluid movement = high efficiency
- High jerk = jerky, abrupt movements = low efficiency

---

#### F. Balance/Stability
```
Center of Mass (mid-hip) Positions
    ↓
Calculate Variance
    ↓
Stability Score
```

**Process:**
1. Calculate center of mass (mid-hip) for each frame
2. Compute variance of COM positions
3. Lower variance = more stable = higher score

**Formula:**
```python
com_positions = [(x1, y1), (x2, y2), ..., (xn, yn)]
variance = var(com_positions)
stability = 1.0 / (1.0 + variance × 10)
```

---

### Step 7: Rule-Based Form Evaluation

#### Elbow Alignment Check
```
Shoulder, Elbow, Wrist Keypoints
    ↓
Project onto Vertical Plane
    ↓
Calculate Lateral Deviation
    ↓
Compare to Threshold (< 12°)
```

**Process:**
1. Get shoulder-elbow-wrist positions
2. Calculate angle from vertical
3. Measure lateral deviation (how much elbow flares out)
4. If deviation > 12° → "Elbow flaring" issue

---

#### Shooting Arc Check
```
Ball Trajectory (x, y positions)
    ↓
Fit Parabola
    ↓
Find Apex (highest point)
    ↓
Compare to Threshold (3-5m)
```

**Process:**
1. Track ball position across frames
2. Find highest point (apex)
3. Calculate apex height in meters
4. If apex < 3m → "Low arc" issue

---

#### Release Timing Check
```
Wrist Velocities
    ↓
Find Peak Velocity
    ↓
Compare to Release Frame
    ↓
Time Difference < 0.05s?
```

**Process:**
1. Calculate wrist velocities
2. Find peak velocity frame
3. Compare to detected release frame
4. If difference > 0.05s → "Release timing" issue

---

## 📊 Complete Metrics Output

### Core Metrics (Always Calculated)
```python
{
    'jump_height': 0.65,        # meters (from hip displacement)
    'movement_speed': 6.2,       # m/s (from hip velocity)
    'form_score': 0.78,         # 0-1 (from joint angles)
    'reaction_time': 0.18,      # seconds (time to first movement)
    'pose_stability': 0.82,     # 0-1 (from COM variance)
    'energy_efficiency': 0.75   # 0-1 (from jerk/smoothness)
}
```

### Enhanced Biomechanics (When Available)
```python
{
    'elbow_angle': 88.5,        # degrees
    'release_angle': 47.2,      # degrees
    'knee_angle': 118.0,        # degrees
    'shoulder_angle': 42.0,     # degrees
    'release_frame': 12,        # frame index
    'follow_through_score': 0.85, # 0-1
    'stability_score': 0.82,    # 0-1
    'smoothness_score': 0.75,   # 0-1
    'dribble_height': 0.52,     # normalized
    'dribble_frequency': 2.3,   # Hz
    'consistency': 0.78         # 0-1
}
```

---

## 🎯 How Form Quality Issues Are Identified

### Example: Elbow Flaring Detection

1. **Extract Keypoints**: Get shoulder, elbow, wrist positions
2. **Calculate Angle**: Compute elbow angle = 78°
3. **Compare to Optimal**: Optimal = 85-95°
4. **Calculate Deviation**: 78° - 90° = -12° (too low)
5. **Check Lateral Deviation**: Elbow flares 15° to the side
6. **Generate Issue**:
   ```python
   {
       'issue_type': 'elbow_alignment',
       'severity': 'moderate',
       'description': 'Elbow flaring by 15.3° (target: < 12°)',
       'current_value': 15.3,
       'optimal_value': '< 12°',
       'recommendation': 'Wall elbow drill: Stand 1 foot from wall...'
   }
   ```

---

## 🔧 Technical Details

### Coordinate Systems

1. **Image Coordinates**: (0-1 normalized, origin at top-left)
   - X: 0 = left, 1 = right
   - Y: 0 = top, 1 = bottom

2. **Player-Centric Coordinates**: (normalized by torso length)
   - Origin: Mid-hip
   - Units: Torso lengths
   - Invariant to camera distance

3. **Real-World Coordinates**: (meters)
   - Converted using scale factor
   - Based on torso length or known player height

### Frame Rate Considerations

- **30 FPS**: Standard video frame rate
- **Processing**: Every frame or every Nth frame (for efficiency)
- **Temporal Smoothing**: Reduces jitter from frame-to-frame variations

### Validation & Error Handling

- **NaN Detection**: All calculations check for NaN/Inf values
- **Default Values**: Safe defaults when calculation fails
- **Minimum Frames**: Require minimum frames for valid calculations
- **Edge Cases**: Handle missing keypoints, empty arrays, etc.

---

## 📈 Example: Complete Analysis Flow

### Input Video
- Duration: 7 seconds
- FPS: 30
- Total frames: 210

### Processing Steps

1. **Frame 0-15** (0.0-0.5s):
   - Action: Dribbling
   - Keypoints extracted
   - Normalized and smoothed
   - Metrics: Speed = 5.8 m/s, Stability = 0.75
   - Form Quality: Good (0.78)

2. **Frame 16-30** (0.5-1.0s):
   - Action: Dribbling → Shooting transition
   - Keypoints extracted
   - Release detected at frame 25
   - Metrics: Jump height = 0.62m, Release angle = 46°
   - Form Quality: Needs Improvement (0.65)
   - Issues: Elbow flaring (15.3°), Low arc (2.1m)

3. **Frame 31-45** (1.0-1.5s):
   - Action: Shooting (follow-through)
   - Keypoints extracted
   - Metrics: Follow-through score = 0.82
   - Form Quality: Good (0.80)

### Output Timeline
```json
[
  {
    "start_time": 0.0,
    "end_time": 0.5,
    "action": {"label": "dribbling", "confidence": 0.92},
    "metrics": {...},
    "form_quality": {"overall_score": 0.78, "quality_rating": "good"}
  },
  {
    "start_time": 0.5,
    "end_time": 1.0,
    "action": {"label": "two_point_shot", "confidence": 0.88},
    "metrics": {...},
    "form_quality": {
      "overall_score": 0.65,
      "quality_rating": "needs_improvement",
      "issues": [
        {
          "issue_type": "elbow_alignment",
          "severity": "moderate",
          "description": "Elbow flaring by 15.3°",
          "current_value": 15.3,
          "optimal_value": "< 12°",
          "recommendation": "Wall elbow drill..."
        }
      ]
    }
  }
]
```

---

## 🎓 Key Concepts

### 1. **Pose Estimation**
- MediaPipe extracts 33 body keypoints from each frame
- Keypoints are 3D coordinates (x, y, z) normalized to 0-1

### 2. **Normalization**
- Converts image coordinates to player-centric coordinates
- Makes metrics comparable across different videos/cameras

### 3. **Temporal Analysis**
- Analyzes keypoints across multiple frames
- Detects patterns (jump, release, movement)

### 4. **Biomechanics**
- Calculates joint angles, velocities, accelerations
- Compares to optimal ranges from sports science

### 5. **Rule-Based Evaluation**
- Checks specific form criteria (elbow angle, arc, timing)
- Provides actionable feedback with drills

---

## 🔬 Mathematical Foundations

### Angle Calculation (3 Points)
```
Given: Points A, B, C
Angle at B = arccos( (BA · BC) / (|BA| × |BC|) )
```

### Velocity Calculation
```
v = Δposition / Δtime
v = (position[t] - position[t-1]) / dt
```

### Acceleration Calculation
```
a = Δvelocity / Δtime
a = (velocity[t] - velocity[t-1]) / dt
```

### Jerk Calculation
```
jerk = Δacceleration / Δtime
jerk = (acceleration[t] - acceleration[t-1]) / dt
```

---

## ✅ Validation & Quality Checks

### Data Quality Checks
- Minimum frames required (e.g., 3 frames for acceleration)
- Keypoint visibility (confidence scores)
- Missing data interpolation
- NaN/Inf value filtering

### Metric Validation
- Range checks (e.g., angles 0-180°, scores 0-1)
- Clipping to valid ranges
- Default values for failed calculations

---

**This is how the system transforms raw video into actionable performance insights!** 🏀

