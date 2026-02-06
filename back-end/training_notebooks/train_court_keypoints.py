"""
Training script for African Basketball Court Keypoint Detection
This trains a YOLO Pose model to detect the 18 court keypoints
"""

# Install dependencies
# !pip install ultralytics roboflow

from roboflow import Roboflow
from ultralytics import YOLO
import os

# Download your custom dataset
print("📥 Downloading African Court Keypoint Dataset...")
rf = Roboflow(api_key="ZzD21wz5oTPdE0fhb04C")
project = rf.workspace("YOUR_WORKSPACE").project("african-basketball-courts-keypoints")
version = project.version(1)  # Use your version number
dataset = version.download("yolov8")

# Initialize a YOLO Pose model
# Use yolov8x-pose for maximum accuracy (recommended for court detection)
print("🏀 Loading YOLOv8 Pose Model...")
model = YOLO('yolov8x-pose.pt')

# Train the model
print("🚀 Starting Training...")
results = model.train(
    data=f"{dataset.location}/data.yaml",
    epochs=200,              # More epochs for keypoint precision
    imgsz=1280,              # Higher resolution for court detection
    batch=8,                 # Adjust based on your GPU
    patience=50,             # Early stopping patience
    save=True,
    device=0,                # GPU device (use 'cpu' if no GPU)
    project='court_keypoint_training',
    name='african_courts_v1',
    
    # Keypoint-specific parameters
    pose=18,                 # 18 keypoints
    kpt_shape=[18, 2],       # 18 points with (x, y) coordinates
    
    # Augmentation for robustness
    hsv_h=0.015,             # Hue augmentation (lighting variations)
    hsv_s=0.7,               # Saturation (different court colors)
    hsv_v=0.4,               # Value (brightness variations)
    degrees=5,               # Slight rotation (camera angles)
    translate=0.1,           # Translation augmentation
    scale=0.2,               # Scale augmentation
    perspective=0.0001,      # Perspective transform (camera distortion)
    flipud=0.0,              # No vertical flip (courts don't flip upside down)
    fliplr=0.5,              # Horizontal flip (left/right symmetry)
    mosaic=1.0,              # Mosaic augmentation
    mixup=0.1,               # Mixup augmentation
)

print("✅ Training Complete!")
print(f"Best model saved at: court_keypoint_training/african_courts_v1/weights/best.pt")
print("\n📊 Validation Results:")
print(results)

# Test the model on a sample image
print("\n🧪 Testing on validation image...")
model = YOLO('court_keypoint_training/african_courts_v1/weights/best.pt')
results = model.predict(source=f"{dataset.location}/valid/images", save=True, conf=0.5)
print("Test predictions saved to runs/pose/predict/")
