# ⏱️ How Long Does 1 Epoch Take?

## 📊 **YOUR CURRENT MODEL:**

Based on your trained model (`model_info.json`):
- **Total Epochs:** 192
- **Train Samples:** 46
- **Batch Size:** 4 (from training logs)
- **Device:** RTX 4080 (likely, based on literature review)

### **Estimated Time:**
According to your literature review:
- **Total Training Time:** 4-6 hours for 192 epochs
- **Time per Epoch:** ~1.25 - 1.875 minutes (75-112 seconds)

---

## 🧮 **CALCULATION:**

```
Total Time: 4-6 hours = 240-360 minutes
Epochs: 192
Time per Epoch: (240-360) / 192 = 1.25 - 1.875 minutes
```

**So 1 epoch takes approximately:**
- **~1.5 minutes** (90 seconds) on average
- **Range:** 1.25 - 2 minutes per epoch

---

## 📈 **FACTORS AFFECTING TIME:**

### **1. Dataset Size:**
- **Current:** 46 samples
- **More samples = Longer epoch**
- Formula: `epoch_time = (samples / batch_size) × time_per_batch`

### **2. Batch Size:**
- **Current:** 4
- **Larger batch = Faster epoch** (but needs more GPU memory)
- Your RTX 4080 can handle batch_size=8-16

### **3. GPU Performance:**
- **RTX 4080:** ~1.5 min/epoch (current)
- **RTX 4090:** ~1.2 min/epoch (faster)
- **CPU:** ~30-60 min/epoch (much slower!)

### **4. Video Processing:**
- Loading frames from video
- Processing 16 frames per sample
- Current: ~5-10 second clips

---

## 🚀 **HOW TO MEASURE EXACTLY:**

### **Option 1: Run Test Script (Recommended):**
```bash
cd Basketball-AI-System/training
python test_epoch_time.py
```

This will:
- Train for exactly 1 epoch
- Show you the exact time
- Display timing statistics

### **Option 2: Check Training Logs:**
The training script now automatically logs:
```
⏱️  TRAINING TIME STATISTICS:
============================================================
   Total Training Time: 1:23:45
   Epochs Completed: 25.0
   Average Time per Epoch: 0:03:21
   Time per Epoch: ~201.0 seconds (3.4 minutes)
============================================================
```

### **Option 3: Check model_info.json:**
After training, check:
```json
{
  "average_epoch_time_seconds": 90.0,
  "total_training_time_seconds": 17280.0
}
```

---

## 📊 **ESTIMATED TIMES FOR DIFFERENT SETUPS:**

### **With Current Setup (46 samples, batch_size=4):**

| Device | Time per Epoch | Time for 25 Epochs |
|--------|---------------|-------------------|
| **RTX 4080** | **~1.5 minutes** | **~37 minutes** |
| **RTX 4090** | ~1.2 minutes | ~30 minutes |
| **CPU** | ~30-60 minutes | ~12-25 hours |

### **With Larger Batch Size (46 samples, batch_size=8):**

| Device | Time per Epoch | Time for 25 Epochs |
|--------|---------------|-------------------|
| **RTX 4080** | **~0.75 minutes** | **~19 minutes** |
| **RTX 4090** | ~0.6 minutes | ~15 minutes |

### **With More Data (200 samples, batch_size=8):**

| Device | Time per Epoch | Time for 25 Epochs |
|--------|---------------|-------------------|
| **RTX 4080** | **~5-8 minutes** | **~2-3 hours** |
| **RTX 4090** | ~4-6 minutes | ~1.5-2.5 hours |

---

## ⚡ **SPEED OPTIMIZATION:**

### **1. Increase Batch Size:**
```bash
# Current: batch_size=4 → ~1.5 min/epoch
# With batch_size=8 → ~0.75 min/epoch (2x faster!)
python train_videomae.py --batch-size 8
```

### **2. Use Mixed Precision (Already Enabled):**
- FP16 is already enabled when GPU available
- Saves ~30-50% time

### **3. Reduce Frames (Trade-off):**
- Current: 16 frames
- Could use 8 frames (faster but lower accuracy)

---

## 🎯 **QUICK ANSWER:**

**For your current setup:**
- **1 epoch ≈ 1.5 minutes** (90 seconds)
- **25 epochs ≈ 37 minutes**
- **192 epochs ≈ 4.8 hours** (matches your literature review!)

**To get exact timing, run:**
```bash
cd training
python test_epoch_time.py
```

---

## ✅ **RESULT:**

The training script now automatically measures and reports:
- ✅ Total training time
- ✅ Average time per epoch
- ✅ Samples per second
- ✅ Saves to `model_info.json`

**Run the test script to see your exact epoch time!** ⏱️

