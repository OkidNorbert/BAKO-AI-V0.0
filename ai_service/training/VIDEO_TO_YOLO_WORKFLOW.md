# 🎬 Video to YOLOv8 Training Workflow

## 📋 Complete Process Overview

### **Step 1: Video Frame Extraction** 🎬
Extract individual frames from basketball videos for training.

### **Step 2: Frame Annotation** 🏷️
Annotate extracted frames with basketball object bounding boxes.

### **Step 3: Dataset Preparation** 📊
Organize frames and annotations into YOLOv8 training format.

### **Step 4: Model Training** 🏋️
Train YOLOv8 model on basketball-specific objects.

---

## 🎬 Step 1: Extract Frames from Videos

### **Available Extraction Strategies:**

#### **1. Uniform Extraction** (Recommended for beginners)
```bash
# Extract every 30th frame (about 1 frame per second at 30fps)
python extract_frames.py --input basketball_video.mp4 --strategy uniform --interval 30
```

#### **2. Temporal Extraction** (Balanced approach)
```bash
# Extract 100 frames evenly distributed across video duration
python extract_frames.py --input basketball_video.mp4 --strategy temporal --num_frames 100
```

#### **3. Motion-Based Extraction** (Advanced)
```bash
# Extract frames with significant motion/activity
python extract_frames.py --input basketball_video.mp4 --strategy motion --motion_threshold 0.1
```

#### **4. Key Moments Extraction** (Basketball-specific)
```bash
# Extract frames at key basketball moments (shots, jumps, etc.)
python extract_frames.py --input basketball_video.mp4 --strategy key_moments
```

#### **5. All Strategies Combined**
```bash
# Use all extraction methods for maximum coverage
python extract_frames.py --input basketball_video.mp4 --strategy all
```

### **Frame Extraction Output:**
```
training/datasets/basketball/
├── frames/                    # Extracted frames
│   ├── frame_000030.jpg
│   ├── frame_000060.jpg
│   └── ...
├── labels/                    # Annotation templates
│   ├── frame_000030.txt
│   ├── frame_000060.txt
│   └── ...
└── extraction_info.json       # Extraction metadata
```

---

## 🏷️ Step 2: Annotate Frames

### **Basketball Object Classes:**
- **0: ball** - Basketball
- **1: player** - Basketball player
- **2: court_lines** - Court boundary lines
- **3: hoop** - Basketball hoop/rim

### **Annotation Tools:**

#### **Option 1: LabelImg (Recommended)**
```bash
# Install LabelImg
pip install labelImg

# Launch annotation tool
labelImg

# Or specify directories
labelImg training/datasets/basketball/frames training/datasets/basketball/labels
```

#### **Option 2: Roboflow (Online)**
1. Go to [roboflow.com](https://roboflow.com)
2. Create account and new project
3. Upload extracted frames
4. Annotate online with team collaboration
5. Export in YOLO format

#### **Option 3: CVAT (Advanced)**
```bash
# Install CVAT
pip install cvat

# Launch web interface
cvat
```

### **Annotation Guidelines:**

#### **🏀 Ball Annotation:**
- Draw tight bounding box around the basketball
- Include ball even if partially occluded (>50% visible)
- Don't include player hands unless holding ball

#### **👤 Player Annotation:**
- Include full body from head to feet
- Include arms and legs in motion
- Annotate each player separately
- Include players even if partially off-screen

#### **📏 Court Lines Annotation:**
- Focus on key boundary lines (3-point line, free throw line, etc.)
- Include center court line
- Don't annotate every small line detail

#### **🏀 Hoop Annotation:**
- Include rim and backboard
- Annotate from front view when possible
- Include hoop even if partially visible

### **YOLO Format:**
```
class_id x_center y_center width height
```
- All values normalized (0-1)
- x_center, y_center: center of bounding box
- width, height: size of bounding box

### **Example Annotation:**
```
# YOLO format: class_id x_center y_center width height
# 0=ball, 1=player, 2=court_lines, 3=hoop
# All values normalized (0-1)

0 0.5 0.3 0.1 0.1    # Ball in center
1 0.3 0.7 0.2 0.4    # Player on left
1 0.7 0.6 0.2 0.4    # Player on right
3 0.8 0.2 0.15 0.2   # Hoop on right side
```

---

## 📊 Step 3: Dataset Preparation

### **Validate Annotations:**
```bash
python annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action validate
```

### **Generate Statistics:**
```bash
python annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action stats
```

### **Create Dataset Splits:**
```bash
# Split into train/val/test (70%/20%/10%)
python annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action splits
```

### **Final Dataset Structure:**
```
training/datasets/basketball/
├── images/
│   ├── train/          # Training images
│   ├── val/            # Validation images
│   └── test/           # Test images
├── labels/
│   ├── train/          # Training annotations
│   ├── val/            # Validation annotations
│   └── test/           # Test annotations
└── data.yaml           # YOLOv8 dataset configuration
```

---

## 🏋️ Step 4: Train YOLOv8 Model

### **Start Training:**
```bash
cd /home/okidi6/Documents/Final-Year-Project/ai_service
source venv/bin/activate
python training/train_basketball_yolo.py
```

### **Training Configuration:**
```python
# Recommended settings for basketball detection
trainer.train_model(
    epochs=100,           # Number of training epochs
    batch_size=8,         # Batch size (adjust based on GPU memory)
    img_size=640,         # Input image size
    device="cpu"          # Use "cuda" if GPU available
)
```

### **Monitor Training:**
- Training results saved to: `training/runs/detect/basketball_detection/`
- View training plots and validation results
- Target mAP@0.5 > 0.7 for good performance

---

## 🎯 Complete Workflow Commands

### **1. Extract Frames:**
```bash
# Extract frames from basketball video
python training/extract_frames.py --input your_basketball_video.mp4 --strategy all
```

### **2. Annotate Frames:**
```bash
# Launch annotation tool
labelImg training/datasets/basketball/frames training/datasets/basketball/labels
```

### **3. Validate Annotations:**
```bash
# Check annotation quality
python training/annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action validate
```

### **4. Create Dataset Splits:**
```bash
# Split into train/val/test
python training/annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action splits
```

### **5. Train Model:**
```bash
# Start YOLOv8 training
python training/train_basketball_yolo.py
```

---

## 📊 Expected Results

### **Training Performance:**
- **Training Time**: 2-4 hours (CPU), 30-60 minutes (GPU)
- **Target mAP@0.5**: > 0.7 (70% accuracy)
- **Target mAP@0.5:0.95**: > 0.5 (50% accuracy)

### **Model Output:**
- Trained model: `training/runs/detect/basketball_detection/weights/best.pt`
- Training plots and metrics
- Validation results and confusion matrix

### **Integration:**
- Replace `yolov8n.pt` with your trained model
- Update AI service to use basketball-specific model
- Test on new basketball videos

---

## 🚀 Quick Start Example

```bash
# 1. Extract frames from video
python training/extract_frames.py --input basketball_game.mp4 --strategy uniform --interval 30

# 2. Annotate frames (manual step)
labelImg training/datasets/basketball/frames training/datasets/basketball/labels

# 3. Validate and split dataset
python training/annotation_helper.py --frames-dir training/datasets/basketball/frames --labels-dir training/datasets/basketball/labels --action splits

# 4. Train YOLOv8 model
python training/train_basketball_yolo.py
```

---

## 💡 Tips for Success

### **Video Selection:**
- Use high-quality basketball videos
- Include various lighting conditions
- Mix indoor and outdoor courts
- Include different camera angles

### **Annotation Quality:**
- Be consistent with bounding box placement
- Include diverse examples of each class
- Annotate partial objects when >50% visible
- Review annotations before training

### **Training Optimization:**
- Start with fewer epochs for testing
- Use data augmentation for better generalization
- Monitor validation loss to prevent overfitting
- Save model checkpoints during training

---

**🎉 You're now ready to create a basketball-specific YOLOv8 model!**

The complete workflow from video to trained model is set up and ready to use. Start with frame extraction and work through each step systematically.
