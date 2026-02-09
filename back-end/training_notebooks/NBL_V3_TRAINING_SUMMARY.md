# 🏀 NBL-V3 Training Summary

## ✅ What You Have Now

### **Roboflow Dataset (NBL-V3):**
- **227 total images** (210 train / 10 valid / 7 test)
- **5 classes:** basketball, hoop, player, referee, shot-clock
- **Preprocessing:** 640x640 stretch (✅ CORRECT)
- **Augmentations:** 3x multiplier with brightness, blur, noise, mosaic (✅ CORRECT)

### **Training Notebook:**
- **File:** `training_notebooks/nbl_v3_combined_training.ipynb`
- **Purpose:** Train a single combined model on all 5 classes
- **Output:** `nbl_v3_combined.pt`
- **Replaces:** `nbl_v2_combined.pt` (currently used for both player and ball tracking)

---

## 🎯 Your Current System Architecture

Your system uses **ONE combined model** for multiple tasks:

```python
# configs/configs.py
PLAYER_DETECTOR_PATH = 'models/nbl_v2_combined.pt'  # Used by PlayerTracker
BALL_DETECTOR_PATH = 'models/nbl_v2_combined.pt'    # Used by BallTracker
COURT_KEYPOINT_DETECTOR_PATH = 'models/court_keypoint_detector.pt'  # Separate model
```

### **How It Works:**

1. **PlayerTracker** (`trackers/player_tracker.py`):
   - Loads `nbl_v2_combined.pt`
   - Detects: `player`, `referee`
   - Confidence: 0.15 for players, 0.45 for referees
   - Resolution: 1080px

2. **BallTracker** (`trackers/ball_tracker.py`):
   - Loads `nbl_v2_combined.pt` (same model!)
   - Detects: `basketball`
   - Confidence: 0.05 (super sensitive for small ball)
   - Resolution: 1080px

3. **ShotDetector** (`shot_detector/shot_detector.py`):
   - Optionally loads hoop detection model
   - Detects: `hoop` (class 2)
   - Confidence: 0.5
   - Uses same combined model or separate hoop model

---

## 🚀 Recommended Training Approach

### **Step 1: Train Combined Model (RECOMMENDED)**

**Why Combined?**
- ✅ Your current system already uses ONE model for both players and ball
- ✅ Simpler deployment (just replace one file)
- ✅ Faster inference (single model pass)
- ✅ Model learns relationships between objects

**Notebook:** `nbl_v3_combined_training.ipynb`

**What it does:**
1. Downloads NBL-V3 dataset from Roboflow
2. Trains YOLOv11n on all 5 classes
3. Validates on test set
4. Exports `nbl_v3_combined.pt`

**After training:**
```python
# Update configs/configs.py
PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
```

---

## 📋 Training Checklist

### **Before Training:**
- [x] Roboflow preprocessing set to 640x640 stretch
- [x] Augmentations enabled (brightness, blur, noise, mosaic)
- [x] Dataset split: 210 train / 10 valid / 7 test
- [x] Training notebook created

### **During Training (in Colab):**
1. Upload `nbl_v3_combined_training.ipynb` to Google Colab
2. Enable T4 GPU (Runtime → Change runtime type)
3. Run all cells
4. Monitor training metrics:
   - Target mAP50: > 0.80
   - Target mAP50-95: > 0.60
5. Download `nbl_v3_model.zip` when complete

### **After Training:**
1. Extract `best.pt` from zip
2. Rename to `nbl_v3_combined.pt`
3. Copy to `back-end/models/`
4. Update `configs/configs.py`
5. Test with `test_new_model.py`
6. Compare performance with `nbl_v2_combined.pt`

---

## 🔍 Expected Improvements

### **NBL-V2 → NBL-V3:**

| Aspect | NBL-V2 | NBL-V3 | Improvement |
|--------|--------|--------|-------------|
| **Dataset Size** | ~87 images | 227 images (3x aug) | +161% |
| **Preprocessing** | 512x512 fit | 640x640 stretch | More pixels for detection |
| **Augmentations** | Basic | Brightness, blur, noise, mosaic | Better generalization |
| **African Courts** | Limited | Optimized | Handles sun/shadows/grainy footage |
| **Small Objects** | Moderate | Better | 640x640 preserves ball detail |

### **Performance Targets:**

| Class | Current (V2) | Target (V3) | Why |
|-------|--------------|-------------|-----|
| **Player** | ~0.80 | > 0.85 | More training data |
| **Referee** | ~0.70 | > 0.75 | Better augmentation |
| **Basketball** | ~0.65 | > 0.75 | Higher resolution |
| **Hoop** | ~0.75 | > 0.85 | Static object, more data |
| **Shot-clock** | N/A | > 0.65 | New class |

---

## 🛠️ Alternative: Specialized Models

If the combined model doesn't meet your accuracy requirements, you can train **specialized models**:

### **Option B: Separate Models**

1. **Player Model** (`nbl_v3_players.pt`):
   - Classes: player, referee only
   - Higher accuracy for player tracking
   - Used by: `PlayerTracker`

2. **Ball Model** (`nbl_v3_ball.pt`):
   - Classes: basketball only
   - Optimized for small object detection
   - Used by: `BallTracker`

3. **Hoop Model** (`nbl_v3_hoop.pt`):
   - Classes: hoop only
   - High precision for shot detection
   - Used by: `ShotDetector`

**Trade-offs:**
- ✅ Higher per-class accuracy
- ✅ Fine-tuned hyperparameters
- ❌ More complex deployment
- ❌ Slower inference (3 model passes instead of 1)

---

## 📊 Training Configuration

### **Combined Model Settings:**

```python
Model: YOLOv11n  # Fast, real-time inference
Image Size: 640x640
Epochs: 100
Batch Size: 16
Patience: 50  # Early stopping
Optimizer: AdamW (auto)

# Augmentations (complement Roboflow)
HSV: h=0.015, s=0.7, v=0.4
Rotation: ±5°
Mosaic: 1.0
Horizontal Flip: 0.5
```

### **Why YOLOv11n?**
- ✅ Fast inference (~15ms per frame on GPU)
- ✅ Good accuracy for real-time applications
- ✅ Smaller model size (easier deployment)
- ✅ Matches your current system's performance needs

**Upgrade to YOLOv11s or YOLOv11m if:**
- You need higher accuracy
- Inference speed is not critical
- You have more powerful hardware

---

## 🎯 Next Steps

1. **Review the training guide:**
   - Read `NBL_V3_TRAINING_GUIDE.md`

2. **Upload notebook to Colab:**
   - File: `nbl_v3_combined_training.ipynb`
   - Enable GPU: T4 (free tier)

3. **Run training:**
   - Execute all cells
   - Wait ~45-60 minutes
   - Download trained model

4. **Integrate and test:**
   - Copy `nbl_v3_combined.pt` to `models/`
   - Update `configs/configs.py`
   - Run `test_new_model.py`

5. **Evaluate:**
   - Compare with NBL-V2
   - Check African court performance
   - Adjust if needed

---

## 📞 Questions?

**Q: Should I train one combined model or separate models?**  
A: Start with the **combined model**. It's simpler and matches your current architecture. Only split if you need higher accuracy for specific tasks.

**Q: What if ball detection is still poor?**  
A: Try these in order:
1. Lower confidence threshold in `BallTracker` (currently 0.05)
2. Increase image resolution to 1280px
3. Train a specialized ball-only model

**Q: Can I use the same model for hoop detection in ShotDetector?**  
A: Yes! The combined model includes the `hoop` class. Update `ShotDetector` to use `nbl_v3_combined.pt`.

**Q: How long will training take?**  
A: ~45-60 minutes on Colab T4 GPU for 100 epochs (may stop early with patience=50).

---

## ✅ You're Ready!

Everything is set up. Just upload the notebook to Colab and start training! 🚀🏀
