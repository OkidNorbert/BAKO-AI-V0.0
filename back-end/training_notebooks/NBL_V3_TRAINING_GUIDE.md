# 🏀 NBL-V3 Multi-Model Training Guide

## Overview
Your basketball analysis system uses **3 specialized YOLO models** for different detection tasks. This guide explains how to train each model separately for optimal performance.

---

## 🎯 Model Architecture

### **Model 1: Combined Player/Ball/Hoop Detection**
**Purpose:** Primary detection model for players, referees, basketball, hoop, and shot-clock  
**Classes:** `basketball`, `hoop`, `player`, `referee`, `shot-clock` (5 classes)  
**Used By:** `PlayerTracker`, `BallTracker`, `ShotDetector`  
**Current:** `models/nbl_v2_combined.pt`  
**New:** `models/nbl_v3_combined.pt`

**Why Combined?**
- Shared context: Players and ball appear together
- Efficient inference: Single model pass
- Better accuracy: Model learns relationships between objects

### **Model 2: Court Keypoint Detection**
**Purpose:** Detect court lines and keypoints for perspective transformation  
**Classes:** Court line keypoints (corners, free-throw lines, etc.)  
**Used By:** `CourtKeypointDetector`, `TacticalViewConverter`  
**Current:** `models/court_keypoint_detector.pt`  
**New:** `models/court_keypoint_detector_v3.pt`

**Why Separate?**
- Different task: Keypoint detection vs object detection
- Different preprocessing: Needs full court view
- Trained on different dataset

### **Model 3: (Optional) Specialized Hoop Detection**
**Purpose:** High-precision hoop detection for shot analysis  
**Classes:** `hoop` only  
**Used By:** `ShotDetector` (fallback/verification)  
**Optional:** Can use Model 1 for hoop detection

---

## 📊 NBL-V3 Dataset Breakdown

Your Roboflow NBL-V3 dataset contains:
- **227 total images** (210 train / 10 valid / 7 test)
- **5 classes:** basketball, hoop, player, referee, shot-clock
- **Augmentations:** 3x multiplier (brightness, blur, noise, mosaic)
- **Resolution:** 640x640 (stretch preprocessing)

### **Training Strategy:**

#### **Option A: Single Combined Model (Recommended)**
Train ONE model on all 5 classes from NBL-V3:
- ✅ Simpler deployment
- ✅ Faster inference (one model pass)
- ✅ Better context learning
- ❌ Slightly lower per-class accuracy

#### **Option B: Specialized Models**
Train separate models for each task:
- ✅ Higher per-class accuracy
- ✅ Fine-tuned hyperparameters per task
- ❌ More complex deployment
- ❌ Slower inference (multiple model passes)

---

## 🚀 Training Notebooks

### **1. Combined Model Training**
**Notebook:** `nbl_v3_combined_training.ipynb`  
**Classes:** All 5 classes (basketball, hoop, player, referee, shot-clock)  
**Model:** YOLOv11n/s/m  
**Output:** `nbl_v3_combined.pt`

**Use this if:**
- You want simplicity
- You need fast inference
- Your current system uses `nbl_v2_combined.pt` for both player and ball tracking

### **2. Player-Only Model Training**
**Notebook:** `nbl_v3_player_only_training.ipynb`  
**Classes:** player, referee only  
**Model:** YOLOv11n  
**Output:** `nbl_v3_players.pt`

**Use this if:**
- You want specialized player tracking
- You need higher player detection accuracy
- You're willing to run multiple models

### **3. Ball-Only Model Training**
**Notebook:** `nbl_v3_ball_only_training.ipynb`  
**Classes:** basketball only  
**Model:** YOLOv11n (optimized for small objects)  
**Output:** `nbl_v3_ball.pt`

**Use this if:**
- Ball detection is critical
- You need ultra-low confidence thresholds
- You want to optimize for small object detection

### **4. Hoop-Only Model Training**
**Notebook:** `nbl_v3_hoop_only_training.ipynb`  
**Classes:** hoop only  
**Model:** YOLOv11s  
**Output:** `nbl_v3_hoop.pt`

**Use this if:**
- Shot detection accuracy is critical
- You need precise hoop localization
- You want a dedicated model for `ShotDetector`

---

## 📝 Recommended Approach for NBL-V3

Based on your current system architecture (`nbl_v2_combined.pt` used for both players and ball):

### **Phase 1: Train Combined Model**
1. Use `nbl_v3_combined_training.ipynb`
2. Train on all 5 classes
3. Replace `nbl_v2_combined.pt` → `nbl_v3_combined.pt`
4. Test with existing pipeline

### **Phase 2: Evaluate Performance**
- Check player detection accuracy
- Check ball detection accuracy
- Check hoop detection for shot analysis

### **Phase 3: (Optional) Specialize**
If combined model underperforms on specific tasks:
- Train specialized ball model if ball detection is poor
- Train specialized hoop model if shot detection is inaccurate

---

## 🔧 Configuration Updates

After training, update `configs/configs.py`:

```python
# Option A: Combined Model (Recommended)
PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
HOOP_DETECTOR_PATH = 'models/nbl_v3_combined.pt'  # For shot detector

# Option B: Specialized Models
PLAYER_DETECTOR_PATH = 'models/nbl_v3_players.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_ball.pt'
HOOP_DETECTOR_PATH = 'models/nbl_v3_hoop.pt'
```

---

## 📈 Expected Performance

### **Combined Model (YOLOv11n):**
| Class | mAP50 Target | Notes |
|-------|--------------|-------|
| Player | > 0.85 | Most abundant class |
| Referee | > 0.75 | Less frequent |
| Basketball | > 0.70 | Small object |
| Hoop | > 0.80 | Static object |
| Shot-clock | > 0.65 | Small, variable |

### **Specialized Models:**
| Model | mAP50 Target | Inference Time |
|-------|--------------|----------------|
| Players | > 0.90 | ~15ms |
| Ball | > 0.75 | ~10ms |
| Hoop | > 0.85 | ~10ms |

---

## 🎯 Next Steps

1. **Start with Combined Model:**
   - Open `nbl_v3_combined_training.ipynb` in Colab
   - Train on full NBL-V3 dataset
   - Download `nbl_v3_combined.pt`

2. **Test Integration:**
   - Replace model path in configs
   - Run `test_new_model.py`
   - Compare with `nbl_v2_combined.pt`

3. **Iterate if Needed:**
   - If specific class underperforms, train specialized model
   - Fine-tune hyperparameters
   - Collect more data for weak classes

---

## 📚 Training Notebooks Summary

| Notebook | Classes | Model Size | Use Case |
|----------|---------|------------|----------|
| `nbl_v3_combined_training.ipynb` | All 5 | YOLOv11n/s | **Recommended** - Single model for all tasks |
| `nbl_v3_player_only_training.ipynb` | player, referee | YOLOv11n | High-accuracy player tracking |
| `nbl_v3_ball_only_training.ipynb` | basketball | YOLOv11n | High-accuracy ball tracking |
| `nbl_v3_hoop_only_training.ipynb` | hoop | YOLOv11s | High-accuracy shot detection |

**Start with the combined model!** It's the simplest and most efficient approach. Only move to specialized models if you need higher accuracy for specific tasks.
