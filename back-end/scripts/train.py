from ultralytics import YOLO
import os

def train_player_referee_model():
    print("--- Training Player/Referee Model (YOLOv11) - CPU MODE ---")
    model = YOLO("yolo11n.pt") 
    
    model.train(
        data="datasets/nbl_dataset/data.yaml",
        epochs=30,           # Reduced epochs for CPU
        imgsz=320,          # Smaller image size is MUCH faster on CPU
        batch=4,            # Smaller batch avoids memory overload
        device='cpu',       # Force CPU
        workers=2,          # Limit background threads
        name="nbl_player_referee"
    )
    print("Player/Referee Training Complete!")

def train_ball_model():
    print("--- Training Ball Model (YOLOv10) - CPU MODE ---")
    model = YOLO("yolov10n.pt")
    
    model.train(
        data="datasets/nbl_dataset/data.yaml",
        epochs=30,
        imgsz=320,
        batch=4,
        device='cpu',
        workers=2,
        name="nbl_ball_model"
    )
    print("Ball Training Complete!")

if __name__ == "__main__":
    # You can choose which one to run, or run both
    # For now, let's run both and then we can update the config to use the best weights
    train_player_referee_model()
    train_ball_model()
