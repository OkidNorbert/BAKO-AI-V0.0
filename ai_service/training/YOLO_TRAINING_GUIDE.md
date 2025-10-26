# 🏀 YOLOv8 Basketball Object Detection Training Guide

## 📋 Overview

This guide will help you train YOLOv8 to detect basketball-specific objects:
- **Ball** (class_id: 0)
- **Player** (class_id: 1) 
- **Court Lines** (class_id: 2)
- **Hoop** (class_id: 3)

## 🚀 Quick Start

### 1. Test YOLOv8 Installation
```bash
cd /home/okidi6/Documents/Final-Year-Project/ai_service
source venv/bin/activate
python training/test_yolo.py
```

### 2. Prepare Dataset Structure
```bash
python training/prepare_dataset.py
```

### 3. Add Your Basketball Images
- Place images in: `training/datasets/basketball/images/train/`
- Create corresponding labels in: `training/datasets/basketball/labels/train/`

### 4. Start Training
```bash
python training/train_basketball_yolo.py
```

## 📁 Dataset Structure

```
training/datasets/basketball/
├── images/
│   ├── train/          # Training images
│   ├── val/            # Validation images  
│   └── test/           # Test images
├── labels/
│   ├── train/          # Training annotations (.txt files)
│   ├── val/            # Validation annotations
│   └── test/           # Test annotations
└── basketball_dataset.yaml  # Dataset configuration
```

## 🏷️ Annotation Format (YOLO)

Each image needs a corresponding `.txt` file with the same name.

**Format**: `class_id x_center y_center width height`

**Example** (`basketball_court_001.txt`):
```
0 0.5 0.3 0.1 0.1
1 0.3 0.7 0.2 0.4
2 0.1 0.1 0.8 0.05
3 0.8 0.1 0.15 0.2
```

**Explanation**:
- `0 0.5 0.3 0.1 0.1` = Ball at center (50%, 30%) with 10% width/height
- `1 0.3 0.7 0.2 0.4` = Player at (30%, 70%) with 20% width, 40% height
- `2 0.1 0.1 0.8 0.05` = Court lines spanning 80% width, 5% height
- `3 0.8 0.1 0.15 0.2` = Hoop at (80%, 10%) with 15% width, 20% height

## 🎯 Class Definitions

| Class ID | Name | Description |
|----------|------|-------------|
| 0 | ball | Basketball |
| 1 | player | Basketball player |
| 2 | court_lines | Court boundary lines |
| 3 | hoop | Basketball hoop/rim |

## 🛠️ Annotation Tools

### Option 1: LabelImg (Recommended)
```bash
pip install labelImg
labelImg
```

### Option 2: Roboflow (Online)
- Visit: https://roboflow.com
- Upload images and annotate online
- Export in YOLO format

### Option 3: CVAT (Advanced)
- Self-hosted annotation tool
- More features for complex datasets

## 📊 Training Configuration

### Basic Training
```python
trainer.train_model(
    epochs=100,        # Number of training epochs
    batch_size=16,     # Batch size (adjust based on GPU memory)
    img_size=640,      # Input image size
    device="cpu"       # Use "cuda" if GPU available
)
```

### Advanced Training Parameters
```python
trainer.train_model(
    epochs=200,
    batch_size=32,
    img_size=640,
    device="cuda",
    lr0=0.01,          # Initial learning rate
    lrf=0.01,          # Final learning rate
    momentum=0.937,
    weight_decay=0.0005,
    warmup_epochs=3,
    patience=20,       # Early stopping patience
    save_period=10     # Save checkpoint every 10 epochs
)
```

## 📈 Training Process

### 1. Data Preparation
- Collect basketball images (minimum 100-200 images)
- Annotate objects using annotation tools
- Split data: 70% train, 20% validation, 10% test
- Ensure balanced representation of all classes

### 2. Training Execution
```bash
python training/train_basketball_yolo.py
```

### 3. Monitoring Training
- Training progress saved to: `training/runs/detect/basketball_detection/`
- View training plots: `results.png`
- Monitor loss curves: `train_batch*.jpg`

### 4. Model Validation
- Automatic validation after training
- Metrics: mAP@0.5, mAP@0.5:0.95, Precision, Recall
- Validation results: `val_batch*.jpg`

## 🎯 Expected Results

### Good Performance Targets
- **mAP@0.5**: > 0.7 (70% accuracy)
- **mAP@0.5:0.95**: > 0.5 (50% accuracy)
- **Precision**: > 0.8 (80% precision)
- **Recall**: > 0.7 (70% recall)

### Training Time Estimates
- **CPU**: 2-4 hours for 100 epochs
- **GPU**: 30-60 minutes for 100 epochs
- **Dataset size**: 200-500 images recommended

## 🔧 Troubleshooting

### Common Issues

#### 1. "No training images found"
**Solution**: Add images to `training/datasets/basketball/images/train/`

#### 2. "Mismatch in images/labels"
**Solution**: Ensure each image has a corresponding `.txt` annotation file

#### 3. "CUDA out of memory"
**Solution**: Reduce batch size or use CPU training
```python
trainer.train_model(batch_size=8, device="cpu")
```

#### 4. "Low mAP scores"
**Solutions**:
- Increase training epochs
- Add more diverse training data
- Check annotation quality
- Adjust learning rate

### Performance Optimization

#### For CPU Training
```python
trainer.train_model(
    epochs=50,         # Fewer epochs
    batch_size=4,      # Smaller batch
    img_size=416,      # Smaller image size
    device="cpu"
)
```

#### For GPU Training
```python
trainer.train_model(
    epochs=200,        # More epochs
    batch_size=32,     # Larger batch
    img_size=640,      # Full resolution
    device="cuda"
)
```

## 📤 Model Export

After training, export model for deployment:

```python
# Export to ONNX format
trainer.export_model(format="onnx")

# Export to TensorRT (for NVIDIA GPUs)
trainer.export_model(format="engine")

# Export to CoreML (for Apple devices)
trainer.export_model(format="coreml")
```

## 🚀 Integration with AI Service

Once trained, integrate the model:

```python
# Load trained model
from ultralytics import YOLO
model = YOLO('training/runs/detect/basketball_detection/weights/best.pt')

# Use in video analysis
results = model(video_frame)
```

## 📚 Additional Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [YOLOv8 GitHub](https://github.com/ultralytics/ultralytics)
- [Basketball Dataset Examples](https://roboflow.com/datasets)
- [Computer Vision Best Practices](https://docs.ultralytics.com/guides/training/)

## 🎯 Next Steps

1. **Collect Basketball Images**: Gather 200-500 basketball images
2. **Annotate Objects**: Use LabelImg or Roboflow to create annotations
3. **Train Model**: Run the training script with your data
4. **Validate Results**: Check mAP scores and detection quality
5. **Integrate**: Use trained model in your AI service
6. **Iterate**: Improve model with more data and fine-tuning

---

**Happy Training! 🏀🤖**
