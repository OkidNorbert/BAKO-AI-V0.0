# 🏀 Basketball Court Keypoint Training Script for Google Colab
# Copy all code below into a single Colab cell and run it.

print("🚀 Starting Court Keypoint Setup...")

# 1. Install Libraries
!pip install -q ultralytics roboflow

# 2. Imports & Drive Mount
import os
import shutil
import yaml
import torch
from roboflow import Roboflow
from google.colab import drive

# 🚨 MANDATORY: Check for GPU
if not torch.cuda.is_available():
    print("❌ ERROR: GPU not detected! Go to 'Runtime' -> 'Change runtime type' and select 'T4 GPU' before running.")
else:
    print("✅ GPU detected: " + torch.cuda.get_device_name(0))

# Mount Google Drive to save weights persistently
drive.mount('/content/drive')

# 3. Download Dataset (Optimized V1 Version)
# Note: Roboflow project reloc2-den7l is the industry standard for 
# basketball court keypoint detection (YOLOv8-pose format).
ROBOFLOW_API_KEY = "ZzD21wz5oTPdE0fhb04C" # ⬅️ Updated with your key 
rf = Roboflow(api_key=ROBOFLOW_API_KEY)
project = rf.workspace("fyp-3bwmg").project("reloc2-den7l")
version = project.version(1)
dataset = version.download("yolov8")

# 🛠️ Path Fix: Re-routing dataset paths for YOLOv8-pose
def fix_data_yaml(dataset_location):
    yaml_path = os.path.join(dataset_location, 'data.yaml')
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    
    # Correcting standard Roboflow path issues
    data['train'] = os.path.join(dataset_location, 'train', 'images')
    data['val'] = os.path.join(dataset_location, 'valid', 'images')
    if 'test' in data:
        data['test'] = os.path.join(dataset_location, 'test', 'images')
    
    with open(yaml_path, 'w') as f:
        yaml.dump(data, f)
    print(f"✅ Paths corrected in {yaml_path}")

fix_data_yaml(dataset.location)

# 4. Training Parameters
# Using yolov8x-pose (Extra Large Pose model) for maximum precision in mapping lines.
MODEL = "yolov8x-pose.pt"
IMG_SIZE = 640
EPOCHS = 500 # Keypoints require more epochs to converge than object detection.
BATCH_SIZE = 16 # Safe for T4 GPU

# 5. Start Training
print(f"🔥 Starting training for {EPOCHS} epochs... this may take several hours.")
!yolo task=pose mode=train model={MODEL} data={dataset.location}/data.yaml epochs={EPOCHS} imgsz={IMG_SIZE} batch={BATCH_SIZE} plots=True

# 6. Save Weights to Google Drive
print("💾 Saving weights to Google Drive...")
# Path for first training run
source_path = "runs/pose/train/weights/best.pt"
dest_path = "/content/drive/MyDrive/basketball_court_keypoints_best.pt"

if os.path.exists(source_path):
    shutil.copy(source_path, dest_path)
    print(f"✅ SUCCESS: Weights saved to {dest_path}")
else:
    print("❌ ERROR: Could not find trained weights at " + source_path)
