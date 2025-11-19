# 🎮 Training GUI Guide - Visual Walkthrough

**Your One-Click AI Training Solution**

---

## 🎯 What You Get

A **beautiful graphical interface** that:
- ✅ Shows dataset progress (video counts by category)
- ✅ Automates entire training pipeline (4 steps)
- ✅ Real-time progress tracking
- ✅ Training logs in console
- ✅ **ONE BUTTON** to train everything!

---

## 🖼️ GUI Preview (What It Looks Like)

```
┌──────────────────────────────────────────────────────────────┐
│         🏀 Basketball AI Training Dashboard                  │
├────────────────────┬─────────────────────────────────────────┤
│                    │                                          │
│ 📊 Dataset Status  │   🚀 Training Pipeline                  │
│                    │                                          │
│ Shooting:   45 ▓░░│   ⏸ 1️⃣ Extract Poses (MediaPipe)       │
│ Dribbling:  32 ▓░░│   ⏸ 2️⃣ Preprocess Dataset               │
│ Passing:    28 ▓░░│   ⏸ 3️⃣ Train Action Classifier          │
│ Defense:    38 ▓░░│   ⏸ 4️⃣ Evaluate & Save Model            │
│ Idle:       41 ▓░░│                                          │
│                    │   Progress: Ready to train               │
│ Total: 184/700    │   [████░░░░░░░] 0%                       │
│                    │                                          │
│ [📂 Open Folder]   │   [🚀 START TRAINING] [⏹ STOP]         │
│ [🔄 Refresh]       │                                          │
│                    │   📝 Training Log                        │
│                    │   ┌────────────────────────────────────┐│
│                    │   │ 🏀 Dashboard initialized            ││
│                    │   │ 📁 Dataset: 184 videos found        ││
│                    │   │ ⚠️  Need 700+ for best results      ││
│                    │   │                                     ││
│                    │   └────────────────────────────────────┘│
└────────────────────┴─────────────────────────────────────────┘
```

---

## 🚀 How to Launch

### Method 1: Quick Start Script ⭐ (Recommended)

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System
./START_TRAINING.sh
```

**That's it!** GUI opens automatically!

### Method 2: Manual Launch

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/backend
source venv/bin/activate
cd ../training
python training_gui.py
```

---

## 📊 Understanding the Interface

### Left Panel: Dataset Status

**What it shows:**
- Video count for each category
- Progress bars (target: 140 per category)
- Color coding:
  - 🔴 **Red** (< 70): "Need more videos!"
  - 🟡 **Yellow** (70-139): "Getting there!"
  - 🟢 **Green** (≥ 140): "Perfect!"

**Buttons:**
- **📂 Open Dataset Folder:** Quick access to add videos
- **🔄 Refresh Count:** Update video counts

**Total Counter:**
- Shows: "Total: X/700 videos"
- Changes color based on progress

### Right Panel: Training Control

**Pipeline Steps:**
1. **1️⃣ Extract Poses** - MediaPipe extracts keypoints
2. **2️⃣ Preprocess** - Normalize and split data
3. **3️⃣ Train Classifier** - Train the AI model
4. **4️⃣ Evaluate** - Test accuracy and save

**Status Icons:**
- ⏸ **Pending** (gray) - Not started
- ⏳ **Running** (yellow) - In progress
- ✅ **Done** (green) - Completed
- ❌ **Error** (red) - Failed

**Progress Bar:**
- 0% → 25% → 50% → 75% → 100%
- Updates as each step completes

**Training Log:**
- Real-time console output
- Shows what's happening
- Displays errors if any
- Final metrics when done

---

## 🎬 Step-by-Step Usage

### Before Training

#### 1. Record Videos (PRIORITY!)

```bash
# Navigate to dataset folder
cd Basketball-AI-System/dataset/raw_videos

# You should have:
shooting/     # 140+ videos
dribbling/    # 140+ videos
passing/      # 140+ videos
defense/      # 140+ videos
idle/         # 140+ videos
```

**Recording checklist:**
- [ ] Phone camera ready (1080p, 30 FPS)
- [ ] Basketball court access
- [ ] Friends/teammates to help
- [ ] Plan: 50 videos per day for 14 days
- [ ] Good lighting (daytime is best)

#### 2. Check Dataset Count

```bash
# Launch GUI
./START_TRAINING.sh

# In GUI:
- Click "🔄 Refresh Count"
- Check video counts
- Aim for all green (140+ per category)
```

### During Training

#### 3. Start Training

**When ready (have 700+ videos):**
1. Click **"🚀 START TRAINING"**
2. GUI will warn if < 100 videos
3. Confirm to proceed

**What happens:**
- Button turns disabled (can't click twice)
- Steps start turning yellow → green
- Progress bar fills up
- Training log shows activity
- **DON'T CLOSE THE GUI!**

#### 4. Monitor Progress

**Step 1: Extract Poses** (2-10 minutes)
```
⏳ 1️⃣ Extract Poses (MediaPipe) [YELLOW]
   
Log shows:
📹 Extracting keypoints from videos...
⏳ This may take several minutes...
Processing: shooting/video_001.mp4 [1/184]
Processing: shooting/video_002.mp4 [2/184]
...
✅ Pose extraction complete!
```

**Step 2: Preprocess** (1-3 minutes)
```
✅ 1️⃣ Extract Poses (MediaPipe) [GREEN]
⏳ 2️⃣ Preprocess Dataset [YELLOW]

Log shows:
🔄 Normalizing keypoints...
📊 Creating train/val/test splits...
✅ Preprocessing complete!
```

**Step 3: Train Model** (10-20 minutes - longest step!)
```
✅ 1️⃣ Extract Poses (MediaPipe) [GREEN]
✅ 2️⃣ Preprocess Dataset [GREEN]
⏳ 3️⃣ Train Action Classifier [YELLOW]

Log shows:
🧠 Training Vision Transformer model...
📈 Epoch 1/10...
   Epoch 1/10 - Loss: 0.5000
   Epoch 2/10 - Loss: 0.4600
   ...
   Epoch 10/10 - Loss: 0.1400
✅ Model training complete!
```

**Step 4: Evaluate** (1-2 minutes)
```
✅ 1️⃣ Extract Poses (MediaPipe) [GREEN]
✅ 2️⃣ Preprocess Dataset [GREEN]
✅ 3️⃣ Train Action Classifier [GREEN]
⏳ 4️⃣ Evaluate & Save Model [YELLOW]

Log shows:
📊 Evaluating model on test set...
📈 Model Performance:
   Accuracy:  87.3%
   Precision: 0.86
   Recall:    0.85
   F1-Score:  0.85
✅ Excellent! Accuracy target met (87.3% ≥ 85%)
```

### After Training

#### 5. Training Complete! 🎉

**GUI shows:**
```
ALL STEPS GREEN: ✅✅✅✅
Progress: 100% [████████████████████]

Training Log:
════════════════════════════════════════
🎉 TRAINING COMPLETED SUCCESSFULLY!
════════════════════════════════════════
💾 Model saved to: Basketball-AI-System/models
✅ Your AI is ready to use!
🚀 Next: Integrate model into backend
```

**Popup message:**
```
╔══════════════════════════════════════╗
║   Training Complete! 🎉               ║
║                                       ║
║   Your basketball AI model has been   ║
║   trained successfully!               ║
║                                       ║
║   Model saved to:                     ║
║   Basketball-AI-System/models/        ║
║                                       ║
║   Next step:                          ║
║   Integrate model into backend        ║
╚══════════════════════════════════════╝
```

#### 6. Find Your Trained Model

```bash
cd Basketball-AI-System/models

ls -lh
# You'll see:
# - best_model.pth         (Your trained AI!)
# - label_encoder.pkl      (Action labels)
# - model_info.json        (Performance metrics)
```

---

## ⚙️ Advanced Features

### Real-time Dataset Monitoring

**While recording videos:**
1. Keep GUI open
2. Record videos → transfer to folders
3. Click "🔄 Refresh Count" periodically
4. Watch progress bars fill up!
5. When all green → ready to train!

### Resume Training

**If training stops:**
- The GUI will show which step failed
- Check the training log for errors
- Fix the issue
- Click "🚀 START TRAINING" again
- It will start from beginning (safe)

### Emergency Stop

**If you need to stop:**
- Click "⏹ STOP" button
- Training will halt gracefully
- No data lost
- Can restart later

---

## 🎯 Training Scenarios

### Scenario 1: Testing with Few Videos (100-200)

**When:** You want to test the pipeline before recording all 700
**Result:** Low accuracy (60-75%), but proves system works
**Time:** 5-10 minutes total

**Steps:**
1. Record 100 videos (20 per category)
2. Launch GUI
3. Click "START TRAINING"
4. Accept low accuracy warning
5. See it works!

### Scenario 2: Good Dataset (500-700 videos)

**When:** You've recorded most videos
**Result:** Good accuracy (80-87%)
**Time:** 20-30 minutes total

**Steps:**
1. Record 500-700 videos
2. Launch GUI
3. Verify counts are yellow/green
4. Click "START TRAINING"
5. Wait 20-30 minutes
6. Get 80%+ accuracy!

### Scenario 3: Excellent Dataset (700+ videos)

**When:** You've completed full dataset
**Result:** Excellent accuracy (85-90%)
**Time:** 30-40 minutes total

**Steps:**
1. Record 700+ videos (140+ per category)
2. Launch GUI
3. All categories should be GREEN
4. Click "START TRAINING"
5. Wait 30-40 minutes
6. Get 85%+ accuracy! 🎯

---

## 🐛 Troubleshooting

### GUI Won't Open

**Problem:** `No module named 'tkinter'`
```bash
# Solution:
sudo apt-get install python3-tk python3.11-tk
```

**Problem:** `Permission denied`
```bash
# Solution:
chmod +x START_TRAINING.sh
./START_TRAINING.sh
```

### Dataset Count Shows 0

**Problem:** Videos not detected
```bash
# Check:
1. Videos are in correct folders
2. File extensions are .mp4, .avi, or .mov
3. Click "🔄 Refresh Count"
```

### Training Fails at Step 1

**Problem:** MediaPipe not installed
```bash
# Solution:
cd backend
source venv/bin/activate
pip install mediapipe opencv-python
```

### Training Fails at Step 3

**Problem:** Out of memory
```bash
# Solution 1: Close other programs
# Solution 2: Reduce batch size (edit training code)
# Solution 3: Use CPU instead of GPU
```

### Low Accuracy (<70%)

**Causes:**
- Not enough videos (<300)
- Poor video quality
- All videos from same player
- All videos same location

**Solutions:**
- Record more videos (target: 700+)
- Use multiple players
- Vary locations and lighting
- Check video quality

---

## 💡 Pro Tips

### Tip 1: Incremental Training
```
Week 1: Record 200 videos → Test training (expect ~70%)
Week 2: Record 300 more → Train again (expect ~80%)
Week 3: Record 200 more → Final training (expect 85%+)
```

### Tip 2: Quality Over Quantity
- 500 good videos > 700 bad videos
- Clear action > blurry video
- Full body > partial body
- Good lighting > dark video

### Tip 3: Use GPU
```bash
# Check GPU
nvidia-smi

# If available, training is 5-10x faster!
# GPU: 10-15 minutes
# CPU: 30-40 minutes
```

### Tip 4: Monitor While Recording
- Keep GUI open
- After every 10 videos → Refresh count
- Visual progress = motivation!

---

## 📈 Progress Milestones

### 🔴 100 Videos (Week 1)
- Test the pipeline
- Verify everything works
- Low accuracy expected (~65%)
- **Keep recording!**

### 🟡 350 Videos (Week 2)
- Half-way there!
- Train again
- Expect ~75% accuracy
- Getting better!

### 🟢 700 Videos (Week 3)
- Dataset complete!
- Final training
- Expect 85%+ accuracy
- **Project ready!**

---

## 🎬 Complete Workflow

### Week 1-2: Recording Phase

```bash
# Day 1-14: Record videos
For each day:
  1. Record 50 videos (10 per category)
  2. Transfer to dataset folders
  3. Open GUI → Refresh count
  4. See progress bars grow!
```

### Week 3: Training Phase

```bash
# When you have 700+ videos:

1. Launch GUI
   ./START_TRAINING.sh

2. Check all categories GREEN
   ✅ All ≥ 140 videos

3. Click "🚀 START TRAINING"
   
4. Go for coffee ☕
   Training takes 20-40 minutes
   
5. Come back to:
   🎉 Training Complete!
   ✅ 87% Accuracy!
```

### Week 4: Integration Phase

```bash
# After training succeeds:

1. Model saved to: models/best_model.pth
2. Integrate into backend (I'll help!)
3. Test with real videos
4. Deploy to React dashboard
```

---

## 🎯 Success Indicators

### During Training

**Good signs:**
- ✅ All steps turning green
- ✅ Loss decreasing each epoch
- ✅ No error messages
- ✅ Progress bar moving

**Warning signs:**
- ⚠️ Steps staying yellow too long
- ⚠️ Loss not decreasing
- ⚠️ Error messages in log
- ⚠️ Training crashes

### After Training

**Success criteria:**
- ✅ Accuracy ≥ 85%
- ✅ All 4 steps completed
- ✅ Model file exists
- ✅ No error messages

**If accuracy < 85%:**
1. Record more diverse videos
2. Check video quality
3. Ensure multiple players
4. Train again with better data

---

## 🔄 Typical Training Session

```
Time: 0:00  → Launch GUI
              Check dataset: 720 videos ✅
              All categories green!
              
Time: 0:01  → Click "START TRAINING"
              Step 1 starts (yellow)
              
Time: 5:00  → Step 1 done (green) ✅
              Step 2 starts (yellow)
              
Time: 7:00  → Step 2 done (green) ✅
              Step 3 starts (yellow)
              Training epochs begin...
              
Time: 25:00 → Step 3 done (green) ✅
              Step 4 starts (yellow)
              
Time: 27:00 → Step 4 done (green) ✅
              ALL COMPLETE! 🎉
              
Final metrics:
- Accuracy: 87.3%
- Precision: 0.86
- Recall: 0.85
- F1-Score: 0.85

✅ Model saved!
✅ Ready to use!
```

---

## 📞 Common Questions

**Q: Do I need to keep terminal open?**  
A: Yes! Don't close the GUI or terminal during training.

**Q: Can I use my computer during training?**  
A: Yes, but it might slow down training. Best to let it run.

**Q: How long does training take?**  
A: 
- With GPU: 15-25 minutes
- With CPU: 30-45 minutes
- Depends on dataset size

**Q: What if training fails?**  
A: 
1. Check the training log for error message
2. Fix the issue (usually missing dependencies)
3. Click "START TRAINING" again

**Q: Can I train multiple times?**  
A: Yes! Each training creates a new model. Previous model is backed up.

**Q: What if I get <70% accuracy?**  
A: Record more diverse videos and train again. More data = better accuracy!

---

## 🎉 After Successful Training

### What You Have

```
Basketball-AI-System/
├── models/
│   ├── best_model.pth        # ✅ Your trained AI!
│   ├── label_encoder.pkl     # ✅ Action labels
│   └── model_info.json       # ✅ Performance metrics
│
└── dataset/
    ├── keypoints/            # ✅ Extracted poses
    └── preprocessed/         # ✅ Processed data
```

### What's Next

1. **Integrate model into backend** (I'll help!)
2. **Test with real videos**
3. **Deploy to React dashboard**
4. **Demo to supervisor**
5. **Submit project! 🎓**

---

## 🚀 Quick Commands Reference

```bash
# Launch GUI
cd Basketball-AI-System
./START_TRAINING.sh

# Check video count manually
find dataset/raw_videos -name "*.mp4" | wc -l

# Open dataset folder
xdg-open dataset/raw_videos

# Check if model exists
ls -lh models/best_model.pth
```

---

## ✅ Checklist for Training Day

Before clicking "START TRAINING":

- [ ] **700+ videos recorded**
- [ ] Videos organized in correct folders
- [ ] All categories have 140+ videos
- [ ] GUI shows all green
- [ ] Backend venv activated
- [ ] Enough disk space (5GB+)
- [ ] Enough RAM (8GB+)
- [ ] Computer plugged in (not on battery)
- [ ] No other heavy programs running
- [ ] Ready to wait 20-40 minutes

---

**You're all set! Start recording those videos! 🏀🎥**

**Questions?** Check the training log or ask for help!

**Ready to train?** Launch the GUI and let the AI magic happen! 🚀


