from ultralytics import YOLO
import torch

def test_new_model():
    model_path = "models/nbl_v3_combined.pt"
    print(f"Loading model from {model_path}...")
    
    try:
        model = YOLO(model_path)
        print("✅ Model loaded successfully!")
        
        # Print class names to verify multi-class
        print("\nModel Classes:")
        for idx, name in model.names.items():
            print(f"  {idx}: {name}")
            
        # Check if 'player' and 'basketball' are present
        class_names = [name.lower() for name in model.names.values()]
        if 'player' in class_names and 'basketball' in class_names:
            print("\n✅ Verification SUCCESS: Model contains both 'player' and 'basketball' classes.")
        else:
            print("\n❌ Verification FAILED: Model missing required classes.")
            
    except Exception as e:
        print(f"❌ Error loading model: {e}")

if __name__ == "__main__":
    test_new_model()
