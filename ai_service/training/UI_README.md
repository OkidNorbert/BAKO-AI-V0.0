# 🏀 YOLOv8 Basketball Training UI

## 🎯 Overview

A comprehensive web-based interface for automating YOLOv8 basketball object detection training. This UI provides a complete workflow from video frame extraction to model training, testing, and validation.

## ✨ Features

### 🎬 **Frame Extraction**
- **Multiple Strategies**: Uniform, temporal, motion-based, and key moments extraction
- **Video Upload**: Support for MP4, AVI, MOV formats
- **Configurable Parameters**: Frame intervals, motion thresholds, and extraction counts
- **Real-time Progress**: Live extraction status and frame counts

### 🏷️ **Annotation Management**
- **Dataset Statistics**: Real-time stats on frames and annotations
- **Class Distribution**: Visual breakdown of basketball object classes
- **Annotation Tools**: Integration with LabelImg and other annotation tools
- **Dataset Splits**: Automatic train/validation/test split creation

### 🏋️ **Training Interface**
- **Real-time Monitoring**: Live training progress with loss and mAP tracking
- **Configurable Parameters**: Epochs, batch size, image size, device selection
- **Training Status**: Current epoch, progress percentage, and estimated completion
- **Background Processing**: Non-blocking training with progress updates

### 🧪 **Model Testing**
- **Model Selection**: Choose from available trained models
- **Image Upload**: Test models on custom images
- **Confidence Thresholds**: Adjustable detection sensitivity
- **Detection Results**: Detailed bounding box and confidence information

### 📊 **Model Management**
- **Model Library**: View all trained models with metadata
- **Model Information**: Size, creation date, and performance metrics
- **Model Comparison**: Compare different training runs
- **Export Options**: Download models in various formats

## 🚀 Quick Start

### **1. Launch the UI**
```bash
cd /home/okidi6/Documents/Final-Year-Project/ai_service
source venv/bin/activate
python training/launch_ui.py
```

### **2. Access the Interface**
- Open your browser to: `http://localhost:8002`
- The UI will open automatically

### **3. Complete Workflow**
1. **Extract Frames**: Upload video and extract training frames
2. **Annotate Data**: Use LabelImg to create annotations
3. **Create Splits**: Organize data into train/val/test sets
4. **Train Model**: Configure and start YOLOv8 training
5. **Test Model**: Validate performance on test images

## 📋 Detailed Usage

### **Frame Extraction Tab**

#### **Upload Video**
- Click the upload area to select basketball videos
- Supports MP4, AVI, MOV formats
- Video will be processed for frame extraction

#### **Extraction Strategies**
- **Uniform**: Extract every Nth frame (consistent sampling)
- **Temporal**: Extract frames evenly across video duration
- **Motion-based**: Extract frames with significant activity
- **Key Moments**: Extract frames at basketball-specific events
- **All Strategies**: Combine all methods for maximum coverage

#### **Configuration Options**
- **Frame Interval**: For uniform extraction (default: 30 frames)
- **Number of Frames**: For temporal extraction (default: 100)
- **Motion Threshold**: For motion-based extraction (default: 0.1)

### **Annotation Tab**

#### **Dataset Statistics**
- **Total Frames**: Number of extracted frames
- **Annotated Frames**: Frames with annotations
- **Annotation Rate**: Percentage of annotated frames
- **Class Distribution**: Count of each basketball object class

#### **Annotation Tools**
- **LabelImg**: Launch external annotation tool
- **Create Splits**: Organize data into training sets
- **Validation**: Check annotation quality and format

#### **Basketball Classes**
- **0: Ball** - Basketball object
- **1: Player** - Basketball player
- **2: Court Lines** - Court boundary lines
- **3: Hoop** - Basketball hoop/rim

### **Training Tab**

#### **Training Configuration**
- **Epochs**: Number of training iterations (default: 100)
- **Batch Size**: Training batch size (default: 8)
- **Image Size**: Input image dimensions (default: 640)
- **Device**: CPU or GPU selection
- **Model Name**: Custom name for training run

#### **Training Monitoring**
- **Real-time Progress**: Live training status updates
- **Progress Bar**: Visual training completion percentage
- **Current Epoch**: Current training epoch
- **Loss Tracking**: Training and validation loss
- **mAP Metrics**: Model performance metrics

### **Testing Tab**

#### **Model Testing**
- **Model Selection**: Choose from trained models
- **Image Upload**: Upload test images
- **Confidence Threshold**: Adjust detection sensitivity
- **Results Display**: Detailed detection information

#### **Test Results**
- **Detection Count**: Number of objects found
- **Class Information**: Object class and confidence
- **Bounding Boxes**: Precise object locations
- **Performance Metrics**: Detection accuracy

### **Models Tab**

#### **Model Management**
- **Available Models**: List of all trained models
- **Model Details**: Size, creation date, performance
- **Model Comparison**: Compare different training runs
- **Export Options**: Download models

## 🛠️ Technical Details

### **Architecture**
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: FastAPI with Python
- **AI Framework**: YOLOv8 (Ultralytics)
- **Computer Vision**: OpenCV, MediaPipe
- **Data Processing**: NumPy, Pandas

### **API Endpoints**
- `POST /api/extract-frames` - Extract frames from video
- `GET /api/dataset-stats` - Get dataset statistics
- `POST /api/create-splits` - Create dataset splits
- `POST /api/start-training` - Start YOLOv8 training
- `GET /api/training-status` - Get training progress
- `POST /api/test-model` - Test trained model
- `GET /api/models` - Get available models

### **File Structure**
```
training/
├── yolo_training_ui.py          # Main UI application
├── launch_ui.py                 # UI launcher script
├── extract_frames.py            # Frame extraction
├── annotation_helper.py         # Annotation management
├── train_basketball_yolo.py     # YOLOv8 training
├── test_yolo.py                 # YOLOv8 testing
├── datasets/basketball/         # Training data
│   ├── frames/                  # Extracted frames
│   ├── labels/                  # Annotations
│   └── images/                  # Organized images
│       ├── train/               # Training set
│       ├── val/                 # Validation set
│       └── test/                # Test set
├── models/                      # Trained models
├── runs/                        # Training runs
└── static/                      # UI static files
```

## 🎯 Basketball Object Detection

### **Supported Classes**
1. **Ball (0)**: Basketball object detection
2. **Player (1)**: Basketball player detection
3. **Court Lines (2)**: Court boundary line detection
4. **Hoop (3)**: Basketball hoop/rim detection

### **Annotation Format**
```
class_id x_center y_center width height
```
- All values normalized (0-1)
- x_center, y_center: center of bounding box
- width, height: size of bounding box

### **Performance Targets**
- **mAP@0.5**: > 0.7 (70% accuracy)
- **mAP@0.5:0.95**: > 0.5 (50% accuracy)
- **Precision**: > 0.8 (80% precision)
- **Recall**: > 0.7 (70% recall)

## 🔧 Configuration

### **Training Parameters**
```python
# Recommended settings
epochs = 100              # Training iterations
batch_size = 8            # Batch size (adjust for GPU memory)
img_size = 640            # Input image size
device = "cpu"            # Use "cuda" for GPU
learning_rate = 0.01      # Initial learning rate
patience = 20             # Early stopping patience
```

### **Extraction Settings**
```python
# Frame extraction options
uniform_interval = 30     # Extract every 30th frame
temporal_frames = 100     # Extract 100 frames temporally
motion_threshold = 0.1    # Motion detection threshold
```

## 🚨 Troubleshooting

### **Common Issues**

#### **UI Won't Start**
```bash
# Check dependencies
pip install fastapi uvicorn python-multipart

# Check port availability
netstat -tulpn | grep 8002
```

#### **Training Fails**
```bash
# Check dataset structure
ls -la training/datasets/basketball/images/train/
ls -la training/datasets/basketball/labels/train/

# Verify YAML configuration
cat training/datasets/basketball/basketball_dataset.yaml
```

#### **Frame Extraction Issues**
```bash
# Check video format support
ffmpeg -formats | grep -E "(mp4|avi|mov)"

# Verify OpenCV installation
python -c "import cv2; print(cv2.__version__)"
```

### **Performance Optimization**

#### **GPU Training**
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# Use GPU for training
# Set device to "cuda" in training configuration
```

#### **Memory Management**
```bash
# Reduce batch size for limited memory
batch_size = 4  # Instead of 8

# Use smaller image size
img_size = 416  # Instead of 640
```

## 📊 Expected Results

### **Training Performance**
- **CPU Training**: 2-4 hours for 100 epochs
- **GPU Training**: 30-60 minutes for 100 epochs
- **Memory Usage**: 4-8 GB RAM, 2-4 GB VRAM (GPU)

### **Model Performance**
- **Training Loss**: Should decrease over epochs
- **Validation mAP**: Should improve with training
- **Final Accuracy**: Target >70% mAP@0.5

### **Output Files**
- **Best Model**: `training/runs/detect/basketball_detection/weights/best.pt`
- **Last Model**: `training/runs/detect/basketball_detection/weights/last.pt`
- **Training Plots**: `training/runs/detect/basketball_detection/`
- **Validation Results**: `training/runs/detect/basketball_detection/val_batch*.jpg`

## 🎉 Success Indicators

Your YOLOv8 basketball training is successful when:
- ✅ Training completes without errors
- ✅ Validation mAP@0.5 > 0.7
- ✅ Model detects basketball objects accurately
- ✅ Test images show correct bounding boxes
- ✅ Model exports successfully

## 🚀 Next Steps

After successful training:
1. **Integrate Model**: Use trained model in AI service
2. **Deploy Model**: Set up model serving
3. **Monitor Performance**: Track real-world accuracy
4. **Iterate Training**: Improve with more data
5. **Scale Up**: Train on larger datasets

---

**🎯 Ready to train your basketball AI model!**

The YOLOv8 Training UI provides everything needed for successful basketball object detection training. Start with frame extraction and work through each step systematically.
