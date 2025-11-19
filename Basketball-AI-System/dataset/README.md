# 📁 Dataset Directory

**Basketball AI Training Dataset**

---

## 📂 Directory Structure

```
dataset/
├── raw_videos/           # Your recorded videos
│   ├── shooting/         # 140+ shooting videos
│   ├── dribbling/        # 140+ dribbling videos
│   ├── passing/          # 140+ passing videos
│   ├── defense/          # 140+ defense videos
│   └── idle/             # 140+ idle/standing videos
│
├── keypoints/            # Extracted poses (auto-generated)
│   └── *.npz files
│
├── preprocessed/         # Preprocessed data (auto-generated)
│   ├── train_data.npz
│   ├── val_data.npz
│   └── test_data.npz
│
└── README.md             # This file
```

---

## 🎬 How to Add Videos

### Step 1: Record Videos

**Requirements:**
- **Duration:** 5-10 seconds each
- **Format:** .mp4, .avi, or .mov
- **Resolution:** 720p or 1080p
- **FPS:** 30 FPS
- **Orientation:** Horizontal (landscape)
- **Framing:** Full body visible

### Step 2: Organize by Category

Put videos in the correct folder:

**Shooting** (`raw_videos/shooting/`):
- Player taking a shot
- Shooting form
- Free throws
- Jump shots

**Dribbling** (`raw_videos/dribbling/`):
- Ball handling
- Crossovers
- Dribbling moves

**Passing** (`raw_videos/passing/`):
- Chest pass
- Bounce pass
- Overhead pass

**Defense** (`raw_videos/defense/`):
- Defensive stance
- Sliding
- Guarding movements

**Idle** (`raw_videos/idle/`):
- Standing still
- Waiting
- Baseline pose

### Step 3: Naming Convention (Recommended)

```
{category}_{player}_{number}.mp4

Examples:
- shooting_player1_001.mp4
- dribbling_john_045.mp4
- passing_team1_012.mp4
```

---

## 📊 Target Dataset Size

| Category | Target | Minimum |
|----------|--------|---------|
| Shooting | 140+ | 50 |
| Dribbling | 140+ | 50 |
| Passing | 140+ | 50 |
| Defense | 140+ | 50 |
| Idle | 140+ | 50 |
| **TOTAL** | **700+** | **250** |

**Why 700+?**
- More data = better accuracy
- Diverse data = better generalization
- Target: 85%+ accuracy

---

## ✅ Quality Checklist

Before adding a video, check:

- [ ] 5-10 seconds duration
- [ ] Horizontal orientation
- [ ] Full body visible
- [ ] Good lighting (not too dark)
- [ ] Clear action (not blurry)
- [ ] One action per video
- [ ] Correct category
- [ ] Proper file format (.mp4/.avi/.mov)

---

## 🚫 What to Avoid

❌ **Don't:**
- Too short (<3 seconds)
- Too long (>15 seconds)
- Vertical orientation
- Multiple actions in one video
- Very dark or blurry
- Face/upper body only (need full body!)
- Wrong category

---

## 🎥 Recording Tips

### Setup
1. **Camera:** Phone camera is perfect!
2. **Position:** 10-15 feet away from player
3. **Height:** Waist/chest level
4. **Angle:** Slightly side view (45°) is best

### During Recording
1. Start recording
2. Wait 1 second
3. Execute action clearly
4. Hold final pose for 1 second
5. Stop recording

### After Recording
1. Review video quality
2. Check if action is clear
3. Rename appropriately
4. Move to correct folder

---

## 📈 Progress Tracking

Use the Training GUI to check progress:

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System
./START_TRAINING.sh
```

The GUI shows:
- Video count per category
- Progress bars
- Total: X/700 videos
- Color indicators (red/yellow/green)

---

## 🔄 After Recording

Once you have 700+ videos:

1. **Launch Training GUI**
   ```bash
   ./START_TRAINING.sh
   ```

2. **Check dataset count** (should be green)

3. **Click "🚀 START TRAINING"**

4. **Wait for training** (15-30 minutes)

5. **Check accuracy** (target: ≥85%)

---

## 💾 Auto-Generated Files

After training, you'll see:

**`keypoints/`**
- Extracted pose keypoints
- One .npz file per video
- 33 keypoints x frames x 4 (x,y,z,visibility)

**`preprocessed/`**
- Normalized and split data
- Ready for training
- train_data.npz (70%)
- val_data.npz (15%)
- test_data.npz (15%)

**Don't manually edit these folders!** They're auto-generated.

---

## 🎯 Quick Reference

### Adding Videos
```bash
# 1. Record video with phone
# 2. Transfer to computer
# 3. Move to appropriate folder:
mv my_video.mp4 Basketball-AI-System/dataset/raw_videos/shooting/

# 4. Refresh GUI to see count update
```

### Checking Count
```bash
# In Training GUI:
# - Click "🔄 Refresh Count"
# - See updated numbers
```

### Starting Training
```bash
# When you have 700+ videos:
# 1. Open Training GUI
# 2. Check all categories are green
# 3. Click "🚀 START TRAINING"
```

---

## 📞 Need Help?

- **Not enough videos?** Keep recording! Target: 700+
- **Wrong category?** Move video to correct folder
- **Bad quality video?** Delete and re-record
- **GUI not counting?** Click "🔄 Refresh Count"

---

## 🎉 You've Got This!

**Recording 700 videos seems like a lot, but:**
- Can record 50 videos in 1 hour
- Get friends/teammates to help
- 14 hours total = 2 weeks at 1 hour/day
- **Result:** Professional-grade basketball AI!

---

**Start recording NOW! Your AI is waiting! 🏀🚀**


