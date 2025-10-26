# 🎬 Frame Extraction System - READY!

## ✅ What's Been Created

### **1. Frame Extraction Script** (`extract_frames.py`)
- ✅ **Uniform Extraction**: Extract every Nth frame
- ✅ **Temporal Extraction**: Extract frames evenly across video duration  
- ✅ **Motion-Based Extraction**: Extract frames with significant activity
- ✅ **Key Moments Extraction**: Extract frames at basketball-specific moments
- ✅ **Combined Strategy**: Use all methods for maximum coverage

### **2. Annotation Helper** (`annotation_helper.py`)
- ✅ **Validation**: Check annotation quality and format
- ✅ **Statistics**: Generate dataset statistics and class distribution
- ✅ **Dataset Splits**: Create train/validation/test splits
- ✅ **Sample Creation**: Generate sample annotations for testing
- ✅ **Guidelines**: Print annotation best practices

### **3. Complete Workflow Guide** (`VIDEO_TO_YOLO_WORKFLOW.md`)
- ✅ **Step-by-step process** from video to trained model
- ✅ **Command examples** for each step
- ✅ **Annotation guidelines** for basketball objects
- ✅ **Tool recommendations** (LabelImg, Roboflow, CVAT)

---

## 🚀 Ready to Use Commands

### **Extract Frames from Video:**
```bash
# Basic extraction (every 30th frame)
python training/extract_frames.py --input your_video.mp4 --strategy uniform --interval 30

# Advanced extraction (all strategies)
python training/extract_frames.py --input your_video.mp4 --strategy all

# Motion-based extraction
python training/extract_frames.py --input your_video.mp4 --strategy motion --motion_threshold 0.1
```

### **Annotate Frames:**
```bash
# Install and launch LabelImg
pip install labelImg
labelImg training/datasets/basketball/frames training/datasets/basketball/labels
```

### **Validate Annotations:**
```bash
python training/annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action validate
```

### **Create Dataset Splits:**
```bash
python training/annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action splits
```

### **Train YOLOv8:**
```bash
python training/train_basketball_yolo.py
```

---

## 🏀 Basketball Object Classes

| Class ID | Class Name | Description |
|----------|------------|-------------|
| 0 | ball | Basketball |
| 1 | player | Basketball player |
| 2 | court_lines | Court boundary lines |
| 3 | hoop | Basketball hoop/rim |

---

## 📊 Expected Workflow

### **Step 1: Video → Frames**
- Input: Basketball video file
- Output: 100-500 extracted frames
- Time: 5-10 minutes

### **Step 2: Frames → Annotations**
- Input: Extracted frames
- Output: YOLO format annotations
- Time: 2-4 hours (manual annotation)

### **Step 3: Annotations → Dataset**
- Input: Frames + annotations
- Output: Train/val/test splits
- Time: 1-2 minutes

### **Step 4: Dataset → Model**
- Input: Organized dataset
- Output: Trained YOLOv8 model
- Time: 2-4 hours (CPU) / 30-60 minutes (GPU)

---

## 🎯 Quick Start Example

```bash
# 1. Extract frames from your basketball video
python training/extract_frames.py --input basketball_game.mp4 --strategy uniform --interval 30

# 2. Annotate frames (manual step - use LabelImg)
labelImg training/datasets/basketball/frames training/datasets/basketball/labels

# 3. Validate and organize dataset
python training/annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action splits

# 4. Train your basketball YOLOv8 model
python training/train_basketball_yolo.py
```

---

## 💡 Pro Tips

### **Video Selection:**
- Use high-quality basketball videos (720p+)
- Include various lighting conditions
- Mix indoor and outdoor courts
- Different camera angles and distances

### **Frame Extraction:**
- Start with `uniform` strategy for simplicity
- Use `motion` strategy for action-heavy videos
- Combine strategies for comprehensive coverage
- Extract 200-500 frames for good training

### **Annotation Quality:**
- Be consistent with bounding box placement
- Include diverse examples of each class
- Annotate partial objects when >50% visible
- Review and validate before training

### **Training Optimization:**
- Start with fewer epochs for testing
- Monitor validation loss
- Use data augmentation
- Save model checkpoints

---

## 🎉 System Status: READY FOR USE!

Your complete video-to-YOLOv8 training pipeline is now ready:

✅ **Frame Extraction**: Multiple strategies available  
✅ **Annotation Tools**: Helper scripts and guidelines  
✅ **Dataset Management**: Validation and splitting  
✅ **Training Pipeline**: YOLOv8 basketball model training  
✅ **Documentation**: Complete workflow guide  

**🚀 Start with frame extraction and work through each step systematically!**

---

**Date**: October 26, 2025  
**Status**: ✅ **FRAME EXTRACTION SYSTEM READY**  
**Next Step**: Extract frames from your basketball videos
