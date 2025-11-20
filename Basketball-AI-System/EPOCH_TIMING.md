# ⏱️ Epoch Timing Guide

## 📊 **HOW LONG DOES 1 EPOCH TAKE?**

The training script now automatically measures and reports epoch timing!

---

## 🔍 **FACTORS AFFECTING EPOCH TIME:**

### **1. Dataset Size:**
- **More samples = Longer epoch**
- Current: 46 train samples
- Formula: `epoch_time ≈ (num_samples / batch_size) × time_per_batch`

### **2. Batch Size:**
- **Larger batch = Faster epoch** (but needs more GPU memory)
- Default: 4 (for GUI) or 8 (for CLI)
- Your RTX 4080 can handle batch_size=8-16

### **3. GPU vs CPU:**
- **GPU (CUDA):** ~10-50x faster
- **CPU:** Much slower (not recommended)

### **4. Video Length:**
- Longer videos = More processing per sample
- Current: ~5-10 second clips

### **5. Model Size:**
- VideoMAE-base: Medium size
- VideoMAE-large: Slower but more accurate

---

## 📈 **ESTIMATED TIMES:**

### **With Your Current Setup (46 samples, batch_size=4):**

| Device | Time per Epoch | Time for 25 Epochs |
|--------|---------------|-------------------|
| **RTX 4080 (GPU)** | ~2-5 minutes | ~50-125 minutes |
| **CPU** | ~30-60 minutes | ~12-25 hours |

### **With Larger Dataset (200 samples, batch_size=8):**

| Device | Time per Epoch | Time for 25 Epochs |
|--------|---------------|-------------------|
| **RTX 4080 (GPU)** | ~5-10 minutes | ~2-4 hours |
| **CPU** | ~2-4 hours | ~50-100 hours |

---

## 🚀 **HOW TO CHECK EPOCH TIME:**

### **During Training:**
The training script now automatically logs:
```
⏱️  TRAINING TIME STATISTICS:
============================================================
   Total Training Time: 1:23:45
   Epochs Completed: 25.0
   Average Time per Epoch: 0:03:21
   Time per Epoch: ~201.0 seconds (3.4 minutes)
   Samples per Second: 0.15
============================================================
```

### **After Training:**
Check `models/model_info.json`:
```json
{
  "average_epoch_time_seconds": 201.0,
  "total_training_time_seconds": 5025.0,
  "training_device": "cuda",
  "batch_size": 4
}
```

---

## ⚡ **SPEED OPTIMIZATION TIPS:**

### **1. Increase Batch Size:**
```bash
# Instead of batch_size=4, use:
python train_videomae.py --batch-size 8  # 2x faster
python train_videomae.py --batch-size 16  # 4x faster (if GPU memory allows)
```

### **2. Use Mixed Precision (FP16):**
Already enabled! The script uses `fp16=True` when GPU is available.

### **3. Reduce Number of Frames:**
Currently using 16 frames. Could reduce to 8 for faster training (but lower accuracy).

### **4. Use GPU:**
Always use GPU if available! CPU is 10-50x slower.

---

## 📊 **YOUR CURRENT MODEL TIMING:**

Based on `model_info.json`:
- **Epochs Trained:** 192
- **Device:** Check if GPU was used
- **Batch Size:** Check training logs

To see actual timing, run training again and check the output!

---

## 🎯 **QUICK TEST:**

Run a quick 1-epoch test to measure:
```bash
cd training
python train_videomae.py \
    --data-dir ../dataset/raw_videos \
    --output-dir ../models \
    --epochs 1 \
    --batch-size 8
```

This will show you exactly how long 1 epoch takes on your system!

---

## 💡 **TYPICAL TIMES:**

For **VideoMAE-base** with **16 frames**:

| Samples | Batch Size | GPU | Time/Epoch |
|---------|-----------|-----|------------|
| 50 | 4 | RTX 4080 | ~3-5 min |
| 50 | 8 | RTX 4080 | ~2-3 min |
| 200 | 8 | RTX 4080 | ~8-12 min |
| 500 | 16 | RTX 4080 | ~15-20 min |

---

## ✅ **RESULT:**

The training script now automatically measures and reports:
- ✅ Total training time
- ✅ Average time per epoch
- ✅ Samples per second
- ✅ Saves timing info to `model_info.json`

**Run training to see your exact epoch timing!** ⏱️

