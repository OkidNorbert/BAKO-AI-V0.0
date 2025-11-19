# 🚀 Getting Started - Basketball AI System

**Your complete roadmap to build the project from scratch**

---

## 📋 Prerequisites Checklist

Before you start, make sure you have:

- [ ] Ubuntu Linux (20.04+) or similar
- [ ] Python 3.8 or higher
- [ ] 20GB+ free disk space
- [ ] Webcam or phone camera for recording videos
- [ ] NVIDIA GPU (optional but recommended for training)
- [ ] Basic Python knowledge
- [ ] Basketball court access (for recording)

---

## 🎯 Phase 1: Environment Setup (Day 1)

### Step 1.1: Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install video codecs
sudo apt install ffmpeg libsm6 libxext6 -y

# Install Git (if not already installed)
sudo apt install git -y
```

### Step 1.2: Create Project Environment

```bash
# Navigate to project directory
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt
```

### Step 1.3: Verify Installation

```bash
# Test imports
python3 << EOF
import torch
import mediapipe
import cv2
import streamlit
import pandas

print("✅ All imports successful!")
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
EOF
```

**Expected Output:**
```
✅ All imports successful!
PyTorch version: 2.0.0+
CUDA available: True  # or False if no GPU
```

---

## 🎥 Phase 2: Dataset Collection (Days 2-7)

### Step 2.1: Understand What You Need

**Total Videos Needed:** 700-1000 clips

| Action | Minimum Clips | Ideal Clips |
|--------|--------------|-------------|
| Shooting | 150 | 200+ |
| Dribbling | 150 | 200+ |
| Passing | 150 | 200+ |
| Defense | 150 | 200+ |
| Idle | 100 | 150+ |

### Step 2.2: Recording Guidelines

**Equipment:**
- Phone camera (1080p minimum)
- Tripod or stable surface
- Good lighting (daylight or court lights)

**Recording Tips:**
1. **Duration:** 5-10 seconds per clip
2. **Angle:** Front or side view (full body visible)
3. **Distance:** 3-5 meters from player
4. **Background:** Minimal distractions
5. **Players:** Variety of players (different heights, styles)

**Frame Rate:** 30 FPS minimum

### Step 2.3: Organize Your Videos

```bash
# Create directory structure
mkdir -p 1_dataset/raw_videos/{shooting,dribbling,passing,defense,idle}

# Transfer videos from phone/camera
# Example:
# cp /media/phone/DCIM/shooting/* 1_dataset/raw_videos/shooting/
```

### Step 2.4: Create Metadata File

Create `1_dataset/metadata.csv`:

```bash
# Create CSV header
echo "filename,action,player_id,date,location,quality" > 1_dataset/metadata.csv

# Add entries (example)
echo "shooting_001.mp4,shooting,player1,2025-01-20,court_a,good" >> 1_dataset/metadata.csv
```

**Or use this Python script:**

```python
import os
import pandas as pd
from pathlib import Path

# Auto-generate metadata from folder structure
data = []
for action in ['shooting', 'dribbling', 'passing', 'defense', 'idle']:
    video_dir = Path(f'1_dataset/raw_videos/{action}')
    for video_file in video_dir.glob('*.mp4'):
        data.append({
            'filename': video_file.name,
            'action': action,
            'player_id': 'player1',  # Update as needed
            'date': '2025-01-20',
            'location': 'court_a',
            'quality': 'good'
        })

df = pd.DataFrame(data)
df.to_csv('1_dataset/metadata.csv', index=False)
print(f"✅ Created metadata for {len(df)} videos")
```

**Quality Check:**
```bash
# Count videos per category
for action in shooting dribbling passing defense idle; do
    count=$(ls -1 1_dataset/raw_videos/$action/*.mp4 2>/dev/null | wc -l)
    echo "$action: $count videos"
done
```

---

## 🤸 Phase 3: Pose Extraction (Day 8)

### Step 3.1: Test on Single Video

```bash
# Activate environment
source venv/bin/activate

# Test extraction on one video
python 2_pose_extraction/extract_keypoints.py \
    --input-dir 1_dataset/raw_videos/shooting \
    --output-dir 1_dataset/keypoints_test \
    --visualize

# Check output
ls -lh 1_dataset/keypoints_test/
# Should see .npz files and _viz.mp4 visualization videos
```

### Step 3.2: Extract All Videos

```bash
# Extract keypoints from all videos (this will take time!)
python 2_pose_extraction/extract_keypoints.py \
    --input-dir 1_dataset/raw_videos \
    --output-dir 1_dataset/keypoints \
    --confidence 0.5

# Expected: One .npz file per video
```

**Progress Monitoring:**
```bash
# While running, check progress in another terminal
watch -n 5 'find 1_dataset/keypoints -name "*.npz" | wc -l'
```

### Step 3.3: Verify Extraction Quality

```python
# Check a sample keypoint file
import numpy as np

# Load keypoints
data = np.load('1_dataset/keypoints/shooting/shooting_001.npz')
keypoints = data['keypoints']

print(f"Shape: {keypoints.shape}")  # Should be (T, 33, 4)
print(f"Frames extracted: {len(keypoints)}")
print(f"FPS: {data['fps']}")

# Check quality (visibility scores)
visibility = keypoints[:, :, 3]
avg_visibility = visibility.mean()
print(f"Average visibility: {avg_visibility:.2f}")  # Should be > 0.7
```

---

## 📊 Phase 4: Data Preprocessing (Day 9)

This is where you'll prepare data for training. I'll provide the complete script in the next files.

**Key Steps:**
1. Normalize keypoints by body size
2. Resample to fixed length (60 frames)
3. Split into train/val/test (70/15/15)
4. Apply data augmentation

---

## 🧠 Phase 5: Model Training (Days 10-12)

**Training Configuration:**
- Model: Bidirectional LSTM
- Input: 60 frames × 132 features
- Output: 5 action classes
- Batch size: 16
- Epochs: 50 (with early stopping)
- Learning rate: 0.001

**Expected Training Time:**
- With GPU: 30-60 minutes
- Without GPU: 2-4 hours

---

## 📈 Phase 6: Evaluation (Day 13)

**Metrics to Report:**
- Confusion Matrix
- Per-class Accuracy
- Precision, Recall, F1-Score
- Inference Time

**Target:** ≥80% accuracy

---

## 🎨 Phase 7: Dashboard (Days 14-15)

Simple Streamlit app with:
1. Video upload
2. Pose extraction
3. Action classification
4. Performance metrics display
5. Recommendations

---

## 📝 Phase 8: Documentation (Days 16-18)

**Final Report Sections:**
1. Introduction & Problem Statement
2. Literature Review
3. Methodology (Dataset + Model)
4. Results & Analysis
5. Conclusions & Future Work
6. SDG & Uganda Vision 2040 alignment

---

## 🎯 Daily Checklist

### Week 1: Data Collection
- [ ] Day 1: Setup environment
- [ ] Day 2-3: Record shooting videos (150+)
- [ ] Day 4-5: Record dribbling + passing (300+)
- [ ] Day 6-7: Record defense + idle (250+)

### Week 2: AI Development
- [ ] Day 8: Extract poses from all videos
- [ ] Day 9: Preprocess data & split dataset
- [ ] Day 10-12: Train LSTM model
- [ ] Day 13: Evaluate model & generate metrics
- [ ] Day 14: Implement performance metrics engine

### Week 3: Dashboard & Report
- [ ] Day 15: Build Streamlit dashboard
- [ ] Day 16-17: Write final report
- [ ] Day 18: Create presentation & demo video

---

## 🆘 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'mediapipe'"
**Solution:**
```bash
source venv/bin/activate  # Make sure venv is active
pip install mediapipe
```

### Issue: "CUDA out of memory"
**Solution:**
```bash
# Reduce batch size in training script
# Or use CPU
export CUDA_VISIBLE_DEVICES=""
```

### Issue: "No pose detected in video"
**Reasons:**
- Poor lighting
- Player too far from camera
- Obstructed view
- Low video quality

**Solution:** Re-record those specific videos with better conditions

### Issue: Low model accuracy (<60%)
**Possible Causes:**
- Insufficient data (need more videos)
- Class imbalance (unequal clips per action)
- Poor video quality
- Wrong hyperparameters

**Solutions:**
1. Collect more diverse videos
2. Balance dataset (equal clips per class)
3. Improve recording quality
4. Tune learning rate / epochs

---

## 💡 Pro Tips

1. **Start Small:** Test with 50 videos first, then scale up
2. **Version Control:** Use Git to track changes
3. **Backup:** Keep copies of raw videos (they're irreplaceable!)
4. **Document:** Take notes of what works and what doesn't
5. **Ask for Help:** Your supervisor is there to guide you

---

## 📧 Next Steps

After completing this guide, you should have:
- ✅ Working environment
- ✅ 700+ labeled videos
- ✅ Extracted pose keypoints
- ✅ Trained AI model (≥80% accuracy)
- ✅ Working dashboard
- ✅ Complete report

**Ready to start? Begin with Phase 1!**

---

**Questions? Check the main README.md or contact your supervisor.**

🏀 Let's build something amazing!

