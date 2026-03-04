# 🏃 Basketball Player Detection Training Script for Google Colab
# Copy all code below into a single Colab cell and run it.

print("🚀 Starting Setup...")

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

# 3. Download Dataset (Custom NBL Dataset)
ROBOFLOW_API_KEY = "ZzD21wz5oTPdE0fhb04C" # ⬅️ Updated with your key 
rf = Roboflow(api_key=ROBOFLOW_API_KEY)
project = rf.workspace("tomatoes-iicln").project("nbl")
version = project.version(13)
dataset = version.download("yolov5")

# 🛠️ Path Fix: Roboflow often nests paths incorrectly in data.yaml
def fix_data_yaml(dataset_location):
    yaml_path = os.path.join(dataset_location, 'data.yaml')
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    
    # Force absolute paths to avoid "images not found" errors
    data['train'] = os.path.join(dataset_location, 'train', 'images')
    data['val'] = os.path.join(dataset_location, 'valid', 'images')
    if 'test' in data:
        data['test'] = os.path.join(dataset_location, 'test', 'images')
    
    with open(yaml_path, 'w') as f:
        yaml.dump(data, f)
    print(f"✅ Paths corrected in {yaml_path}")

fix_data_yaml(dataset.location)

# 4. Training Parameters
# Using yolov5l6u.pt (Large model, 640px). 
# v1 analysis found 100 epochs is sufficient for player detection.
MODEL = "yolov5l6u.pt"
IMG_SIZE = 640
EPOCHS = 100
BATCH_SIZE = 16 # Players are larger than balls; can usually handle larger batch sizes on T4 GPU.

# 5. Start Training
print(f"🔥 Starting training for {EPOCHS} epochs...")
!yolo task=detect mode=train model={MODEL} data={dataset.location}/data.yaml epochs={EPOCHS} imgsz={IMG_SIZE} batch={BATCH_SIZE} plots=True

# 6. Save Weights to Google Drive
print("💾 Saving weights to Google Drive...")
# The path below assumes this is your first training run (runs/detect/train)
source_path = "runs/detect/train/weights/best.pt"
dest_path = "/content/drive/MyDrive/basketball_player_detector_best.pt"

if os.path.exists(source_path):
    shutil.copy(source_path, dest_path)
    print(f"✅ SUCCESS: Weights saved to {dest_path}")
else:
    print("❌ ERROR: Could not find trained weights at " + source_path)
