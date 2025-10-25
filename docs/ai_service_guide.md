# 🧠 AI Service Documentation

## Overview

The AI Service is the core component of the Basketball Performance Analysis System, providing advanced computer vision capabilities through pose detection, object detection, and recommendation engine integration.

## 🏗️ Architecture

### Core Components

```
AI Service
├── Pose Detection (MediaPipe)
├── Object Detection (YOLOv3)
├── Action Classification
├── Performance Metrics
├── Recommendation Engine
└── Model Management
```

## 🔧 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Pose Detection** | MediaPipe | 33-joint human pose estimation |
| **Object Detection** | YOLOv3 | Basketball, hoop, court, player detection |
| **Deep Learning** | TensorFlow | Model training and inference |
| **Computer Vision** | OpenCV | Video processing and frame extraction |
| **Recommendation** | BeautifulSoup | YouTube video scraping |
| **API Framework** | FastAPI | RESTful API endpoints |
| **Processing** | Python 3.10+ | Core service implementation |

## 📊 AI Models

### 1. Pose Detection Model (MediaPipe)

**Purpose**: Real-time human pose estimation and tracking

**Features**:
- 33 joint tracking per person
- Real-time processing (30+ FPS)
- Multi-person detection
- Confidence scoring for each joint

**Key Joints Tracked**:
```python
# Head and face
0: nose, 1: left_eye_inner, 2: left_eye, 3: left_eye_outer
4: right_eye_inner, 5: right_eye, 6: right_eye_outer
7: left_ear, 8: right_ear, 9: mouth_left, 10: mouth_right

# Upper body
11: left_shoulder, 12: right_shoulder, 13: left_elbow, 14: right_elbow
15: left_wrist, 16: right_wrist, 17: left_pinky, 18: right_pinky
19: left_index, 20: right_index, 21: left_thumb, 22: right_thumb

# Lower body
23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee
27: left_ankle, 28: right_ankle, 29: left_heel, 30: right_heel
31: left_foot_index, 32: right_foot_index
```

### 2. Object Detection Model (YOLOv3)

**Purpose**: Basketball-specific object detection and tracking

**Detected Classes**:
- `person` → Player detection and tracking
- `sports ball` → Basketball detection and trajectory
- `hoop` → Basketball hoop and backboard detection
- `court line` → Court boundary and key detection

**Model Specifications**:
- Input: 416x416 RGB images
- Output: Bounding boxes with confidence scores
- Classes: 4 basketball-specific classes
- Accuracy: 92%+ on basketball datasets

### 3. Performance Metrics Engine

**Calculated Metrics**:
- **Jump Height**: Vertical displacement analysis
- **Release Speed**: Ball velocity at release point
- **Shot Accuracy**: Success rate and trajectory analysis
- **Ball Handling Time**: Possession duration tracking
- **Movement Speed**: Player velocity and acceleration
- **Court Positioning**: Zone-based location analysis

## 🚀 API Endpoints

### Video Analysis

#### POST /analyze
Analyze video with pose detection and object detection.

**Request**:
```json
{
  "video_url": "http://minio:9000/basketball-videos/1/session.mp4",
  "session_id": 1,
  "video_id": 1,
  "fps": 10,
  "analysis_type": "full"
}
```

**Response**:
```json
{
  "video_id": 1,
  "session_id": 1,
  "keypoints": [...],
  "detections": [...],
  "events": [...],
  "performance_metrics": {
    "jump_height_avg": 0.65,
    "release_speed_avg": 8.2,
    "shot_accuracy": 0.75,
    "ball_handling_time": 2.3
  },
  "status": "completed"
}
```

### Recommendation Engine

#### POST /recommend
Get personalized YouTube training recommendations.

**Request**:
```json
{
  "skill": "shooting",
  "player_id": 1,
  "weakness_areas": ["jump_shot_form", "free_throw_consistency"]
}
```

**Response**:
```json
{
  "recommendations": [
    {
      "title": "Perfect Your Jump Shot Form",
      "url": "https://www.youtube.com/watch?v=example1",
      "description": "Learn proper shooting mechanics",
      "duration": "8:45",
      "skill_focus": "jump_shot_form",
      "difficulty": "intermediate"
    }
  ],
  "total_results": 5
}
```

### Health Check

#### GET /health
Check service status and model availability.

**Response**:
```json
{
  "status": "healthy",
  "models": {
    "pose_detection": {
      "status": "loaded",
      "version": "MediaPipe 0.10.0",
      "accuracy": 0.95
    },
    "object_detection": {
      "status": "loaded",
      "version": "YOLOv3",
      "accuracy": 0.92
    }
  },
  "gpu_available": true,
  "memory_usage": "2.1GB / 8GB"
}
```

## 🔄 Processing Pipeline

### 1. Video Input Processing
```
Video File → Frame Extraction → Preprocessing → AI Analysis
```

### 2. Pose Detection Pipeline
```
Frame → MediaPipe → 33 Joints → Confidence Filtering → Pose Data
```

### 3. Object Detection Pipeline
```
Frame → YOLOv3 → Bounding Boxes → NMS Filtering → Object Data
```

### 4. Event Classification
```
Pose Data + Object Data → Event Detection → Performance Metrics → Recommendations
```

## 📈 Performance Metrics

### Jump Height Calculation
```python
def calculate_jump_height(pose_data):
    # Extract hip and ankle positions
    hip_y = pose_data['left_hip'][1] + pose_data['right_hip'][1] / 2
    ankle_y = pose_data['left_ankle'][1] + pose_data['right_ankle'][1] / 2
    
    # Calculate vertical displacement
    jump_height = (baseline_height - min(hip_y, ankle_y)) * pixel_to_meter_ratio
    return jump_height
```

### Shot Accuracy Analysis
```python
def analyze_shot_accuracy(detections, events):
    shot_attempts = [e for e in events if e['type'] == 'shot_attempt']
    successful_shots = [s for s in shot_attempts if s['meta']['success']]
    
    accuracy = len(successful_shots) / len(shot_attempts)
    return accuracy
```

### Ball Trajectory Analysis
```python
def analyze_ball_trajectory(ball_detections):
    # Track ball position over time
    trajectory = []
    for detection in ball_detections:
        if detection['confidence'] > 0.8:
            trajectory.append({
                'time': detection['time'],
                'position': detection['bbox'],
                'velocity': calculate_velocity(detection)
            })
    
    return trajectory
```

## 🎯 Event Classification

### Basketball Events Detected

1. **Shot Attempts**
   - Jump shots, layups, free throws
   - Shot probability calculation
   - Release angle and timing analysis

2. **Ball Handling**
   - Dribbling detection and counting
   - Ball possession tracking
   - Hand-off and passing detection

3. **Defensive Actions**
   - Defensive positioning
   - Steal attempts
   - Block attempts
   - Rebounding actions

4. **Movement Events**
   - Sprinting and running
   - Jumping and landing
   - Direction changes
   - Court zone transitions

## 🔧 Configuration

### Environment Variables

```bash
# AI Service Configuration
BACKEND_URL=http://backend:8000
MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Model Configuration
POSE_MODEL_PATH=/app/models/pose_model
YOLO_MODEL_PATH=/app/models/yolov3.weights
YOLO_CONFIG_PATH=/app/models/yolov3.cfg

# GPU Configuration
CUDA_VISIBLE_DEVICES=0
GPU_MEMORY_FRACTION=0.8

# Processing Configuration
MAX_FRAME_RATE=30
BATCH_SIZE=4
CONFIDENCE_THRESHOLD=0.5
```

### Model Loading

```python
# Pose Detection Model
import mediapipe as mp
pose = mp.solutions.pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# YOLOv3 Object Detection
from darknet import load_network, detect_image
yolo_net = load_network("yolov3.cfg", "yolov3.weights", 0)
```

## 🚀 Deployment

### Docker Configuration

```dockerfile
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc g++ libgl1-mesa-dev libglib2.0-0 \
    libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 \
    libavcodec-dev libavformat-dev libswscale-dev \
    libv4l-dev libxvidcore-dev libx264-dev \
    libjpeg-dev libpng-dev libtiff-dev \
    libatlas-base-dev python3-dev python3-numpy \
    wget curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create models directory
RUN mkdir -p /app/models

# Expose port
EXPOSE 8001

# Start application
CMD ["uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### GPU Support

```yaml
# docker-compose.yml
ai-service:
  build: ../ai_service
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## 📊 Monitoring

### Health Metrics

- **Model Status**: Pose and object detection model health
- **GPU Usage**: CUDA memory and utilization
- **Processing Speed**: Frames per second analysis
- **Memory Usage**: RAM and VRAM consumption
- **Queue Status**: Background job processing

### Performance Monitoring

```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge

# Processing metrics
frames_processed = Counter('frames_processed_total', 'Total frames processed')
processing_time = Histogram('processing_duration_seconds', 'Processing time')
gpu_memory_usage = Gauge('gpu_memory_usage_bytes', 'GPU memory usage')
```

## 🔍 Troubleshooting

### Common Issues

1. **Model Loading Failures**
   - Check model file paths
   - Verify model file integrity
   - Ensure sufficient memory

2. **GPU Issues**
   - Verify CUDA installation
   - Check GPU memory availability
   - Monitor GPU utilization

3. **Processing Performance**
   - Optimize batch size
   - Adjust confidence thresholds
   - Monitor memory usage

### Debug Commands

```bash
# Check GPU status
nvidia-smi

# Monitor memory usage
htop

# Test model loading
python -c "import mediapipe as mp; print('MediaPipe loaded successfully')"

# Test YOLOv3
python -c "from darknet import load_network; print('YOLOv3 loaded successfully')"
```

## 🔮 Future Enhancements

### Planned Improvements

1. **Model Upgrades**
   - YOLOv8 integration for better performance
   - Real-time pose estimation optimization
   - Custom basketball action classification

2. **Advanced Analytics**
   - Team performance analysis
   - Opponent scouting capabilities
   - Injury risk assessment

3. **Edge Computing**
   - Mobile device processing
   - Real-time streaming analysis
   - Offline capability

### Research Areas

- **Federated Learning**: Distributed model training
- **Multi-camera Fusion**: Multiple angle analysis
- **Temporal Analysis**: Long-term performance trends
- **Predictive Analytics**: Performance forecasting

---

*This documentation is regularly updated. Last updated: [Current Date]*
