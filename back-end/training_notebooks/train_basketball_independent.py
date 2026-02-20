import os
import yaml
import shutil
from ultralytics import YOLO
from roboflow import Roboflow

def train_basketball_model():
    # 1. Configuration
    # ----------------
    # Use the API key found in your existing notebooks. 
    # ideally, store this in an env var: os.environ.get("ROBOFLOW_API_KEY")
    ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY", "ZzD21wz5oTPdE0fhb04C")
    
    WORKSPACE = "tomatoes-iicln"
    PROJECT = "nbl"
    VERSION = 3
    
    # Training params optimized for small ball detection
    IMG_SIZE = 1280       # Higher resolution for small objects
    BATCH_SIZE = 8        # Reduce batch size for GPU memory with high img size
    EPOCHS = 150
    MODEL_SIZE = "yolo11n.pt" # Nano model for speed, or use 's'/'m' for accuracy
    PROJECT_NAME = "nbl_v3_ball_independent"
    
    print(f"🚀 Starting Independent Basketball Model Training...")
    print(f"Target: Class 'basketball' ONLY")
    print(f"Resolution: {IMG_SIZE}")
    
    # 2. Download Dataset
    # -------------------
    rf = Roboflow(api_key=ROBOFLOW_API_KEY)
    project = rf.workspace(WORKSPACE).project(PROJECT)
    version = project.version(VERSION)
    dataset = version.download("yolov11")
    
    dataset_path = dataset.location
    print(f"📂 Dataset downloaded to: {dataset_path}")

    # 3. Filter Dataset for "basketball" Class Only
    # ---------------------------------------------
    # We need to modify data.yaml to treat 'basketball' as the ONLY class (class 0)
    data_yaml_path = os.path.join(dataset_path, "data.yaml")
    
    with open(data_yaml_path, 'r') as f:
        data_config = yaml.safe_load(f)
        
    print(f"Original classes: {data_config.get('names')}")
    
    # Identify the index of 'basketball'
    # The dataset typically has ['basketball', 'hoop', 'player', 'referee', 'shot-clock']
    try:
        # Check standard list or dict format
        names = data_config['names']
        if isinstance(names, dict):
            # inverted dict search
            ball_idx = [k for k, v in names.items() if v == 'basketball'][0]
        else:
            ball_idx = names.index('basketball')
    except (ValueError, IndexError):
        print("❌ Error: 'basketball' class not found in dataset!")
        return

    print(f"Found 'basketball' at index: {ball_idx}")
    
    # Create a new data config for single-class training
    # Note: We are relying on YOLO's 'classes' argument in train() to filter, 
    # OR we need to rewrite labels. The cleanest way in Ultralytics without rewriting 
    # labels is often to use the `single_cls=True` if there's one class, 
    # BUT since the labels files have indices, we need to map them.
    # The 'classes' argument in model.train() filters the dataset to only include specific classes.
    # It effectively ignores other class IDs.
    
    # We update the yaml to reflect that we are focusing on this class,
    # though strictly speaking model.train(classes=...) does the heavy lifting.
    
    # 4. Train Model
    # --------------
    model = YOLO(MODEL_SIZE)
    
    print("\n🏋️ Beginning Training...")
    results = model.train(
        data=data_yaml_path,
        classes=[ball_idx],   # <--- CRITICAL: Filter to only train on basketballs
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        project=PROJECT_NAME,
        name="train_run",
        
        # Hyperparameters for small objects
        optimizer='auto',
        patience=50,
        val=True,
        plot=True,
        
        # Augmentations designed for small objects
        mosaic=1.0,       # Strong mosaic
        mixup=0.1,        # Slight mixup
        copy_paste=0.3,   # Copy-paste augmentation
        degrees=15.0,     # Rotation
        
        # Hardware
        device=0,         # GPU 0
        workers=8,
        exist_ok=True
    )
    
    print(f"\n✅ Training Complete!")
    print(f"Best model saved to: {PROJECT_NAME}/train_run/weights/best.pt")
    print("\nTo use this model in your system, update configs.py:")
    print(f"BALL_DETECTOR_PATH = '{os.path.abspath(PROJECT_NAME)}/train_run/weights/best.pt'")

if __name__ == "__main__":
    train_basketball_model()
