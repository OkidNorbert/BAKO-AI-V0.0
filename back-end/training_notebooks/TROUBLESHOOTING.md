# 🔧 NBL-V3 Training Troubleshooting

## ❌ Error: "Dataset images not found, missing path"

### **Problem:**
```
FileNotFoundError: Dataset '/content/NBL-3/data.yaml' images not found, 
missing path '/content/NBL-3/valid/images'
```

### **Cause:**
The `shutil.move()` commands in the original notebook were creating an incorrect nested directory structure.

### **Solution:**
✅ **FIXED!** The notebook has been updated to remove the problematic `shutil.move()` commands.

The Roboflow download already creates the correct structure:
```
NBL-3/
├── train/
│   ├── images/
│   └── labels/
├── valid/
│   ├── images/
│   └── labels/
├── test/
│   ├── images/
│   └── labels/
└── data.yaml
```

---

## ✅ **Updated Notebooks:**

All three notebooks have been fixed:
- ✅ `nbl_v3_training.ipynb` (combined model)
- ✅ `nbl_v3_ball_only_training.ipynb` (ball-only)
- ✅ `nbl_v3_players_only_training.ipynb` (player-only)

---

## 🚀 **What to Do Now:**

### **1. Re-upload the Fixed Notebook**
- Download the updated `nbl_v3_training.ipynb` from your project
- Upload to Google Colab
- Enable T4 GPU

### **2. Run All Cells**
The notebook will now:
1. Download NBL-3 dataset from Roboflow
2. Verify the directory structure (new cell!)
3. Train YOLOv11n on all 5 classes
4. Save model to `nbl_v3_runs/train/weights/best.pt`

### **3. Verify Dataset Structure**
The new verification cell will show:
```bash
Dataset contents:
NBL-3/
  train/
  valid/
  test/
  data.yaml

Train images:
image1.jpg
image2.jpg
...

data.yaml:
train: ../train/images
val: ../valid/images
...
```

---

## 🔍 **Other Common Issues:**

### **Issue: Out of Memory (OOM)**
**Error:** `CUDA out of memory`

**Solution:**
```python
# Reduce batch size in training cell:
batch=8,  # Instead of 16
```

### **Issue: Training Too Slow**
**Check:**
1. GPU is enabled: Runtime → Change runtime type → T4 GPU
2. GPU is being used: Look for `CUDA:0 (Tesla T4, 15095MiB)` in output

### **Issue: Low Accuracy**
**After training, if mAP50 < 0.70 for any class:**
- For **ball**: Use `nbl_v3_ball_only_training.ipynb`
- For **players**: Use `nbl_v3_players_only_training.ipynb`

---

## 📊 **Expected Training Output:**

```
Ultralytics 8.4.13 🚀 Python-3.12.12 torch-2.9.0+cu126 CUDA:0 (Tesla T4, 15095MiB)

Epoch    GPU_mem   box_loss   cls_loss   dfl_loss  Instances       Size
  1/100      6.8G      1.442      2.379      1.446        163        640
  2/100      7.7G      1.342      1.383      1.292         99        640
  ...
 50/100      8.5G      0.812      0.558      1.012        185        640

Training complete (45.2 minutes)
Results saved to nbl_v3_runs/train/
```

---

## ✅ **Verification Checklist:**

Before training:
- [ ] Notebook uploaded to Colab
- [ ] T4 GPU enabled
- [ ] Roboflow API key is correct
- [ ] Dataset downloads successfully

During training:
- [ ] GPU memory shows usage (e.g., `6.8G`)
- [ ] Loss values decrease over epochs
- [ ] No error messages

After training:
- [ ] `best.pt` file exists in `nbl_v3_runs/train/weights/`
- [ ] mAP50 > 0.70 for all classes
- [ ] Model file downloads successfully

---

## 🎯 **Next Steps After Successful Training:**

1. **Download Model:**
   ```bash
   # From Colab, download:
   nbl_v3_runs/train/weights/best.pt
   ```

2. **Copy to Project:**
   ```bash
   cp best.pt models/nbl_v3_combined.pt
   ```

3. **Update Config:**
   ```python
   # configs/configs.py
   PLAYER_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
   BALL_DETECTOR_PATH = 'models/nbl_v3_combined.pt'
   ```

4. **Test:**
   ```bash
   python test_new_model.py
   ```

---

## 📞 **Still Having Issues?**

Check these in order:
1. ✅ Notebook is the latest version (with verification cell)
2. ✅ GPU is enabled in Colab
3. ✅ Roboflow API key is correct
4. ✅ Dataset downloads without errors
5. ✅ Directory structure matches expected format

The error you encountered has been **FIXED**! Re-upload the notebook and try again. 🚀
