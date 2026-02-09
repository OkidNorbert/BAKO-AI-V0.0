# 🚀 NBL-V3 Quick Start Guide

## TL;DR - 3 Steps to Train Your Model

### 1️⃣ Upload to Colab
- Go to [colab.research.google.com](https://colab.research.google.com)
- Upload: `nbl_v3_combined_training.ipynb`
- Enable GPU: Runtime → Change runtime type → T4 GPU

### 2️⃣ Run Training
- Click: Runtime → Run all
- Wait: ~45-60 minutes
- Download: `nbl_v3_model.zip` (last cell)

### 3️⃣ Deploy
```bash
# Extract and copy model
unzip nbl_v3_model.zip
cp best.pt models/nbl_v3_combined.pt

# Update config
# Edit configs/configs.py:
PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
BALL_DETECTOR_PATH = 'models/nbl_v3_combined.pt'

# Test
python test_new_model.py
```

---

## 📁 Files You Need

| File | Purpose | Location |
|------|---------|----------|
| `nbl_v3_combined_training.ipynb` | Training notebook | Upload to Colab |
| `NBL_V3_TRAINING_SUMMARY.md` | Full guide | Read for details |
| `NBL_V3_TRAINING_GUIDE.md` | Architecture explanation | Reference |

---

## ✅ Pre-Training Checklist

Your Roboflow NBL-V3 dataset should have:
- [x] **Resize:** 640x640 (Stretch) ← NOT 512x512!
- [x] **Augmentations:** Brightness, Blur, Noise, Mosaic
- [x] **Split:** 210 train / 10 valid / 7 test
- [x] **Total:** 227 images (3x augmentation)

---

## 🎯 Expected Results

| Metric | Target | What it means |
|--------|--------|---------------|
| **mAP50** | > 0.80 | Overall detection accuracy |
| **mAP50-95** | > 0.60 | Precise bounding boxes |
| **Training Time** | ~45 min | On T4 GPU |
| **Model Size** | ~6 MB | YOLOv11n |

---

## 🔧 Your System Architecture

```
Current (NBL-V2):
┌─────────────────────────────────────┐
│   nbl_v2_combined.pt                │
│   (player, referee, basketball)     │
└─────────────────────────────────────┘
         ↓                ↓
   PlayerTracker    BallTracker

After NBL-V3:
┌─────────────────────────────────────────────────┐
│   nbl_v3_combined.pt                            │
│   (player, referee, basketball, hoop, shot-clock)│
└─────────────────────────────────────────────────┘
         ↓                ↓              ↓
   PlayerTracker    BallTracker    ShotDetector
```

---

## 🏀 African Court Optimizations

NBL-V3 is specifically optimized for:
- ✅ **Harsh sunlight** (brightness augmentation)
- ✅ **Deep shadows** (exposure variation)
- ✅ **Grainy footage** (noise augmentation)
- ✅ **Motion blur** (blur augmentation)
- ✅ **Diverse backgrounds** (more training data)

---

## 📞 Troubleshooting

### **Problem: Out of Memory (OOM) Error**
```python
# In notebook, reduce batch size:
batch=8  # Instead of 16
```

### **Problem: Training too slow**
- Check GPU is enabled (Runtime → Change runtime type)
- Verify T4 GPU is selected
- Close other Colab notebooks

### **Problem: Low accuracy on specific class**
- Check class distribution in dataset
- Increase confidence threshold for that class
- Consider training specialized model

### **Problem: Model not detecting small objects (ball)**
```python
# In BallTracker, lower confidence:
conf=0.03  # Instead of 0.05

# Or increase resolution:
imgsz=1280  # Instead of 1080
```

---

## 🎓 Training Parameters Explained

```python
epochs=100          # Max training iterations
patience=50         # Stop if no improvement for 50 epochs
batch=16           # Images per training step
imgsz=640          # Input image size (matches Roboflow)
conf=0.25          # Confidence threshold for validation
optimizer='auto'   # AdamW (automatically selected)
```

---

## 📊 Model Comparison

| Model | Classes | Size | Speed | Accuracy | Use Case |
|-------|---------|------|-------|----------|----------|
| YOLOv11n | 5 | 6 MB | ⚡⚡⚡ | ⭐⭐⭐ | **Recommended** - Real-time |
| YOLOv11s | 5 | 22 MB | ⚡⚡ | ⭐⭐⭐⭐ | Higher accuracy |
| YOLOv11m | 5 | 52 MB | ⚡ | ⭐⭐⭐⭐⭐ | Best accuracy |

**Start with YOLOv11n!** Upgrade only if accuracy is insufficient.

---

## 🔄 Workflow

```
1. Roboflow (NBL-V3)
   ↓
2. Download dataset (Colab)
   ↓
3. Train YOLOv11n (45 min)
   ↓
4. Download best.pt
   ↓
5. Copy to models/
   ↓
6. Update configs
   ↓
7. Test with test_new_model.py
   ↓
8. Deploy! 🚀
```

---

## ✨ You're All Set!

**Next action:** Upload `nbl_v3_combined_training.ipynb` to Colab and click "Run all"! 🏀

**Questions?** Check `NBL_V3_TRAINING_SUMMARY.md` for detailed explanations.
