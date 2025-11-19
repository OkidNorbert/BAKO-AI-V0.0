# 🎮 Basketball AI Training GUI

**Automated Training Pipeline with Beautiful Interface**

---

## 🎯 What Is This?

A **graphical training dashboard** that automates the entire AI model training process:
- ✅ Extract poses from videos (MediaPipe)
- ✅ Preprocess dataset
- ✅ Train action classifier (Vision Transformer)
- ✅ Evaluate model performance
- ✅ Save trained model

**No command line needed!** Just click buttons! 🖱️

---

## 🚀 Quick Start

### Method 1: Using Start Script (Easiest)

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System
./START_TRAINING.sh
```

### Method 2: Manual Start

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/backend
source venv/bin/activate
cd ../training
python training_gui.py
```

---

## 📊 GUI Features

### Left Panel: Dataset Status
- **Real-time video count** for each category
- **Progress bars** showing completion (target: 140 per category)
- **Color coding:**
  - 🔴 Red: < 70 videos (needs more!)
  - 🟡 Yellow: 70-139 videos (getting there!)
  - 🟢 Green: ≥ 140 videos (perfect!)
- **Total counter:** Shows X/700 videos
- **Buttons:**
  - 📂 Open Dataset Folder (quick access)
  - 🔄 Refresh Count (update stats)

### Right Panel: Training Control
- **4-Step Pipeline Visualization:**
  1. 1️⃣ Extract Poses (MediaPipe)
  2. 2️⃣ Preprocess Dataset
  3. 3️⃣ Train Action Classifier
  4. 4️⃣ Evaluate & Save Model

- **Status Indicators:**
  - ⏸ Pending (gray)
  - ⏳ Running (yellow)
  - ✅ Complete (green)
  - ❌ Error (red)

- **Progress Bar:** Shows overall completion
- **Training Log:** Real-time console output
- **Buttons:**
  - 🚀 START TRAINING (green, big button!)
  - ⏹ STOP (red, emergency stop)

---

## 📹 How to Use

### Step 1: Record Videos (Most Important!)

```bash
# Videos should be in:
Basketball-AI-System/dataset/raw_videos/
├── shooting/      # 140+ videos (5-10 sec each)
├── dribbling/     # 140+ videos
├── passing/       # 140+ videos
├── defense/       # 140+ videos
└── idle/          # 140+ videos
```

**Tips:**
- Use phone camera (1080p, 30 FPS)
- 5-10 seconds per clip
- One action per video
- Horizontal orientation
- Good lighting

### Step 2: Launch GUI

```bash
cd Basketball-AI-System
./START_TRAINING.sh
```

### Step 3: Check Dataset

The GUI will automatically:
- Count videos in each category
- Show progress bars
- Display total count

**Want to add more videos?**
1. Click "📂 Open Dataset Folder"
2. Add videos to appropriate category folder
3. Click "🔄 Refresh Count"

### Step 4: Start Training

1. **Click "🚀 START TRAINING"**

2. **Watch the magic happen!**
   - Step 1: Extracting poses... (2-5 min)
   - Step 2: Preprocessing... (1-2 min)
   - Step 3: Training model... (5-15 min)
   - Step 4: Evaluating... (1-2 min)

3. **See results in real-time**
   - Training log shows progress
   - Progress bar fills up
   - Steps turn green when complete

4. **Get final metrics**
   - Accuracy: 85%+ (target)
   - Precision, Recall, F1-Score
   - Model automatically saved!

### Step 5: Use Trained Model

After training completes:
```bash
# Model saved to:
Basketball-AI-System/models/
├── best_model.pth       # Trained model
├── label_encoder.pkl    # Action labels
└── model_info.json      # Performance metrics
```

Now integrate into backend! (I'll help with that next)

---

## ⚙️ Configuration

### Minimum Requirements
- **Videos:** 100+ total (for testing)
- **Recommended:** 700+ videos (140+ per category)
- **RAM:** 8GB+
- **Time:** 10-30 minutes (depending on dataset size)

### Optional: GPU Acceleration
If you have NVIDIA GPU:
```bash
# Check GPU
nvidia-smi

# Training will automatically use GPU if available
# 5-10x faster!
```

---

## 📊 What Happens Behind the Scenes

### Step 1: Extract Poses (MediaPipe)
```python
# For each video:
- Open video file
- Extract frames (30 FPS)
- Detect 33 keypoints per frame
  - Head, shoulders, elbows, wrists
  - Hips, knees, ankles
  - x, y, z coordinates
- Save keypoints as .npz files
```

**Output:** `dataset/keypoints/*.npz`

### Step 2: Preprocess Dataset
```python
# Normalize keypoints:
- Center by torso position
- Scale by body size
- Resample to fixed length (60 frames)
- Split into train/val/test (70/15/15)
- Apply data augmentation
```

**Output:** `dataset/preprocessed/*.npz`

### Step 3: Train Classifier
```python
# Vision Transformer training:
- Load preprocessed data
- Initialize pre-trained ViT model
- Fine-tune on basketball actions
- Save best checkpoint
- Training: 10-20 epochs
```

**Output:** `models/best_model.pth`

### Step 4: Evaluate Model
```python
# Test on validation set:
- Calculate accuracy
- Per-class precision/recall
- Confusion matrix
- Save metrics
```

**Output:** `models/model_info.json`

---

## 🐛 Troubleshooting

### GUI Won't Start
```bash
# Problem: Missing tkinter
sudo apt-get install python3-tk

# Problem: Wrong Python version
python3.11 -m venv venv
source venv/bin/activate
```

### "Insufficient Dataset" Warning
- **Minimum:** 100 videos (for testing only)
- **Recommended:** 700+ videos
- **If training with <100:** Accuracy will be very low
- **Solution:** Record more videos!

### Training Fails at Step 1
```bash
# Problem: Missing MediaPipe
pip install mediapipe opencv-python

# Problem: Video file corrupted
# Check videos can play in VLC
```

### Training Fails at Step 3
```bash
# Problem: Out of memory
# Solution: Reduce batch size in code
# Or: Close other programs

# Problem: GPU out of memory
# Solution: Use CPU training (automatic fallback)
```

### Low Accuracy (<70%)
**Causes:**
- Not enough videos (<200)
- Poor video quality
- Same player in all videos
- Same location/lighting

**Solutions:**
- Record more videos (target: 700+)
- Use multiple players
- Vary locations and lighting
- Check videos are correctly categorized

---

## 📈 Expected Performance

### Good Dataset (700+ videos)
- ✅ Accuracy: 85-90%
- ✅ Training time: 15-30 minutes
- ✅ All actions classified well

### Medium Dataset (300-500 videos)
- ⚠️ Accuracy: 75-85%
- ⚠️ Training time: 10-20 minutes
- ⚠️ Some confusion between actions

### Small Dataset (<200 videos)
- ❌ Accuracy: <70%
- ❌ Training time: 5-10 minutes
- ❌ Poor generalization

---

## 🎯 Tips for Best Results

### 1. Dataset Quality
- ✅ Clear view of full body
- ✅ Good lighting
- ✅ Multiple players
- ✅ Various angles
- ✅ Different locations

### 2. Video Recording
- ✅ Horizontal orientation
- ✅ Steady camera (not shaky)
- ✅ 5-10 seconds per clip
- ✅ One action per video
- ✅ Clear action execution

### 3. Training
- ✅ Start with 700+ videos
- ✅ Use GPU if available
- ✅ Monitor training log
- ✅ Check accuracy ≥85%
- ✅ Save model when done

---

## 🔄 Workflow

```
1. RECORD VIDEOS
   ↓
2. OPEN GUI (./START_TRAINING.sh)
   ↓
3. CHECK DATASET COUNT
   ↓
4. ADD MORE VIDEOS (if needed)
   ↓
5. CLICK "START TRAINING"
   ↓
6. WAIT 10-30 MINUTES
   ↓
7. CHECK ACCURACY ≥85%
   ↓
8. USE TRAINED MODEL!
```

---

## 📞 Need Help?

### Common Issues
1. **"GUI won't start"** → Install python3-tk
2. **"Not enough videos"** → Record more! (target: 700+)
3. **"Training crashes"** → Check RAM usage
4. **"Low accuracy"** → Need more diverse videos

### Getting Support
- Check error in training log
- Read this README fully
- Ask for help with specific error message

---

## 🎉 Success!

When training completes successfully:
- ✅ GUI shows "Training Complete! 🎉"
- ✅ Model saved to `models/best_model.pth`
- ✅ Accuracy report in `models/model_info.json`
- ✅ Ready to integrate into backend!

**Next step:** I'll help you integrate the trained model into the FastAPI backend!

---

## 📚 Additional Resources

- **Main README:** `../README.md`
- **Quick Start:** `../QUICK_START.md`
- **Dataset Guide:** (Ask me to create this!)
- **Integration Guide:** (Coming after training!)

---

**You're ready to train your basketball AI! Let's go! 🏀🚀**


