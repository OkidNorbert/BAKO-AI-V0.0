# 🎯 NBL-V3 Training Strategy - Which Approach?

## 📊 **The Accuracy Question**

You're right! Specialized models **DO** perform better for specific object types. Here's the trade-off:

| Approach | Accuracy | Speed | Complexity | Memory |
|----------|----------|-------|------------|--------|
| **Combined** | ⭐⭐⭐ (80-85%) | ⚡⚡⚡ Fast | ✅ Simple | 💾 Low |
| **Specialized** | ⭐⭐⭐⭐⭐ (85-95%) | ⚡ Slower | ⚠️ Complex | 💾💾💾 High |

---

## 🚀 **Recommended Strategy: Hybrid Approach**

### **Phase 1: Start with Combined Model**
**Notebook:** `nbl_v3_training.ipynb`

**Train first, then evaluate:**
```
If mAP50 for all classes > 0.80 → ✅ Use combined model
If mAP50 for ball < 0.70 → ⚠️ Train specialized ball model
If mAP50 for players < 0.80 → ⚠️ Train specialized player model
```

### **Phase 2: Specialize Where Needed**

**Most Common Issue: Ball Detection**
- Basketball is SMALL (hardest to detect)
- **Solution:** Train specialized ball model
- **Notebook:** `nbl_v3_ball_only_training.ipynb`

**If Player Tracking is Critical:**
- Need high accuracy for team assignment
- **Solution:** Train specialized player model
- **Notebook:** `nbl_v3_players_only_training.ipynb`

---

## 📁 **Available Training Notebooks**

### **1. Combined Model (Start Here)**
**File:** `nbl_v3_training.ipynb`  
**Classes:** All 5 (basketball, hoop, player, referee, shot-clock)  
**Model:** YOLOv11n  
**Resolution:** 640x640  
**Output:** `nbl_v3_combined.pt`

**Use when:**
- ✅ You want to test first
- ✅ Speed is important
- ✅ Accuracy > 80% is acceptable

---

### **2. Ball-Only Model (If Ball Detection Fails)**
**File:** `nbl_v3_ball_only_training.ipynb`  
**Classes:** basketball only  
**Model:** YOLOv11n  
**Resolution:** 1280x1280 (HIGHER for small objects)  
**Output:** `nbl_v3_ball.pt`

**Optimizations:**
- 🎯 Higher resolution (1280 vs 640)
- 🎯 More epochs (150 vs 100)
- 🎯 Copy-paste augmentation for small objects
- 🎯 Aggressive scaling

**Use when:**
- ⚠️ Combined model mAP50 for ball < 0.70
- ⚠️ Ball tracking is unreliable
- ⚠️ Missing ball detections in video

---

### **3. Player-Only Model (If Player Tracking Fails)**
**File:** `nbl_v3_players_only_training.ipynb`  
**Classes:** player, referee  
**Model:** YOLOv11s (larger for better accuracy)  
**Resolution:** 1080x1080  
**Output:** `nbl_v3_players.pt`

**Optimizations:**
- 🎯 Larger model (YOLOv11s vs YOLOv11n)
- 🎯 Mixup augmentation for overlapping players
- 🎯 Optimized for congestion scenarios

**Use when:**
- ⚠️ Combined model mAP50 for players < 0.80
- ⚠️ Player tracking loses IDs in congestion
- ⚠️ Team assignment is inaccurate

---

## 🔧 **Configuration After Training**

### **Option A: Combined Model Only**
```python
# configs/configs.py
PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
```

**Inference:** ~15ms per frame (ONE model pass)

---

### **Option B: Specialized Models**
```python
# configs/configs.py
PLAYER_DETECTOR_PATH = 'models/nbl_v3_players.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_ball.pt'
```

**Inference:** ~35ms per frame (TWO model passes)

---

### **Option C: Hybrid (Recommended if ball fails)**
```python
# configs/configs.py
PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'  # Use combined for players
BALL_DETECTOR_PATH = 'models/nbl_v3_ball.pt'        # Use specialized for ball
```

**Inference:** ~25ms per frame (1.5 model passes - combined model cached)

---

## 📊 **Expected Performance Comparison**

### **Combined Model:**
| Class | mAP50 | Notes |
|-------|-------|-------|
| Player | 0.82 | Good |
| Referee | 0.75 | Acceptable |
| Basketball | **0.68** | ⚠️ May be too low |
| Hoop | 0.85 | Good (static object) |
| Shot-clock | 0.70 | Acceptable |

### **Specialized Ball Model:**
| Class | mAP50 | Notes |
|-------|-------|-------|
| Basketball | **0.80+** | ✅ Much better! |

### **Specialized Player Model:**
| Class | mAP50 | Notes |
|-------|-------|-------|
| Player | **0.90+** | ✅ Excellent |
| Referee | **0.85+** | ✅ Much better |

---

## 🎯 **My Recommendation**

### **Step 1: Train Combined Model**
```bash
# Upload to Colab: nbl_v3_training.ipynb
# Wait: ~45 minutes
# Evaluate: Check mAP50 for each class
```

### **Step 2: Evaluate Results**
```python
# If ball mAP50 < 0.70:
→ Train specialized ball model (nbl_v3_ball_only_training.ipynb)

# If player mAP50 < 0.80:
→ Train specialized player model (nbl_v3_players_only_training.ipynb)

# If all classes > 0.80:
→ ✅ Use combined model! No need for specialization
```

### **Step 3: Deploy Best Configuration**
```python
# Best accuracy (if you trained all 3):
PLAYER_DETECTOR_PATH = 'models/nbl_v3_players.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_ball.pt'

# Best speed (if combined works):
PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_combined.pt'

# Hybrid (if only ball fails):
PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_ball.pt'
```

---

## ⚡ **Quick Decision Tree**

```
Start
  ↓
Train Combined Model (nbl_v3_training.ipynb)
  ↓
Evaluate mAP50
  ↓
  ├─ All classes > 0.80? → ✅ DONE! Use combined model
  ├─ Ball < 0.70? → Train ball-only model
  ├─ Players < 0.80? → Train player-only model
  └─ Both low? → Train both specialized models
```

---

## 🏀 **Why Ball Detection Often Fails in Combined Models**

1. **Size imbalance:** Basketball is 10-50x smaller than players
2. **Class imbalance:** Fewer ball annotations than player annotations
3. **Motion blur:** Ball moves fast, gets blurry
4. **Occlusion:** Ball often hidden by players

**Solution:** Specialized ball model with:
- Higher resolution (1280 vs 640)
- More aggressive augmentation
- Optimized for small objects

---

## ✅ **Summary**

**Your concern is valid!** Specialized models DO work better.

**My recommendation:**
1. **Train combined first** (fastest to test)
2. **Evaluate accuracy** (especially ball detection)
3. **Train specialized models** if needed (likely for ball)

**Most likely outcome:**
- Combined model works well for players, hoop, shot-clock
- Ball detection needs specialized model
- **Final config:** Hybrid (combined + specialized ball)

Start with `nbl_v3_training.ipynb` and we'll iterate from there! 🚀
