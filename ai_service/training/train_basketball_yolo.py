#!/usr/bin/env python3
"""
YOLOv8 Basketball Object Detection Training Script
Trains YOLOv8 to detect: ball, player, court_lines, hoop
"""

import os
import yaml
from ultralytics import YOLO
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BasketballYOLOTrainer:
    """YOLOv8 trainer for basketball object detection."""
    
    def __init__(self, dataset_path: str = "training/datasets/basketball"):
        self.dataset_path = Path(dataset_path)
        self.model = None
        self.results = None
        
        # Basketball object classes
        self.classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
        logger.info(f"🏀 Basketball YOLO Trainer initialized")
        logger.info(f"Classes: {list(self.classes.values())}")
    
    def create_dataset_config(self) -> str:
        """Create YAML configuration file for the dataset."""
        config = {
            'path': str(self.dataset_path.absolute()),
            'train': 'images/train',
            'val': 'images/val', 
            'test': 'images/test',
            'nc': len(self.classes),  # number of classes
            'names': list(self.classes.values())
        }
        
        config_path = self.dataset_path / "basketball_dataset.yaml"
        
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        logger.info(f"📝 Dataset config created: {config_path}")
        return str(config_path)
    
    def download_pretrained_model(self, model_size: str = "n") -> str:
        """Download pretrained YOLOv8 model."""
        model_name = f"yolov8{model_size}.pt"
        logger.info(f"📥 Downloading pretrained model: {model_name}")
        
        self.model = YOLO(model_name)
        logger.info(f"✅ Model downloaded and loaded: {model_name}")
        return model_name
    
    def train_model(self, 
                   epochs: int = 100,
                   batch_size: int = 16,
                   img_size: int = 640,
                   device: str = "cpu") -> dict:
        """Train the YOLOv8 model on basketball dataset."""
        
        if self.model is None:
            self.download_pretrained_model()
        
        config_path = self.create_dataset_config()
        
        logger.info(f"🚀 Starting YOLOv8 training...")
        logger.info(f"Epochs: {epochs}, Batch size: {batch_size}, Image size: {img_size}")
        logger.info(f"Device: {device}")
        
        try:
            # Train the model
            self.results = self.model.train(
                data=config_path,
                epochs=epochs,
                batch=batch_size,
                imgsz=img_size,
                device=device,
                project="training/runs",
                name="basketball_detection",
                save=True,
                save_period=10,  # Save checkpoint every 10 epochs
                plots=True,
                val=True,
                patience=20,  # Early stopping patience
                lr0=0.01,  # Initial learning rate
                lrf=0.01,  # Final learning rate
                momentum=0.937,
                weight_decay=0.0005,
                warmup_epochs=3,
                warmup_momentum=0.8,
                warmup_bias_lr=0.1,
                box=7.5,  # Box loss gain
                cls=0.5,  # Classification loss gain
                dfl=1.5,  # DFL loss gain
                pose=12.0,  # Pose loss gain (if using pose)
                kobj=2.0,  # Keypoint object loss gain
                label_smoothing=0.0,
                nbs=64,  # Nominal batch size
                overlap_mask=True,
                mask_ratio=4,
                drop_path=0.0,
                optimizer="auto",  # Optimizer: SGD, Adam, AdamW, NAdam, RAdam, RMSProp
                verbose=True
            )
            
            logger.info("✅ Training completed successfully!")
            return {
                "status": "success",
                "model_path": str(self.model.ckpt_path),
                "results": self.results
            }
            
        except Exception as e:
            logger.error(f"❌ Training failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def validate_model(self, model_path: str = None) -> dict:
        """Validate the trained model."""
        if model_path is None and self.model is not None:
            model_path = self.model.ckpt_path
        
        if model_path is None:
            return {"status": "error", "error": "No model path provided"}
        
        logger.info(f"🔍 Validating model: {model_path}")
        
        try:
            # Load the trained model
            model = YOLO(model_path)
            
            # Run validation
            config_path = self.create_dataset_config()
            results = model.val(data=config_path)
            
            logger.info("✅ Model validation completed!")
            return {
                "status": "success",
                "results": results,
                "metrics": {
                    "mAP50": results.box.map50,
                    "mAP50-95": results.box.map,
                    "precision": results.box.mp,
                    "recall": results.box.mr
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def export_model(self, model_path: str = None, format: str = "onnx") -> dict:
        """Export the trained model to different formats."""
        if model_path is None and self.model is not None:
            model_path = self.model.ckpt_path
        
        if model_path is None:
            return {"status": "error", "error": "No model path provided"}
        
        logger.info(f"📤 Exporting model to {format} format...")
        
        try:
            model = YOLO(model_path)
            exported_path = model.export(format=format)
            
            logger.info(f"✅ Model exported successfully: {exported_path}")
            return {
                "status": "success",
                "exported_path": exported_path,
                "format": format
            }
            
        except Exception as e:
            logger.error(f"❌ Export failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def create_sample_annotations(self):
        """Create sample annotation files for testing."""
        logger.info("📝 Creating sample annotation files...")
        
        # Create sample training annotations
        train_labels_dir = self.dataset_path / "labels" / "train"
        train_labels_dir.mkdir(parents=True, exist_ok=True)
        
        # Sample annotation: ball detection
        sample_ball_annotation = """0 0.5 0.3 0.1 0.1
1 0.3 0.7 0.2 0.4
2 0.1 0.1 0.8 0.05
3 0.8 0.1 0.15 0.2"""
        
        with open(train_labels_dir / "sample_001.txt", "w") as f:
            f.write(sample_ball_annotation)
        
        # Sample annotation: multiple objects
        sample_multi_annotation = """0 0.6 0.4 0.08 0.08
1 0.2 0.6 0.15 0.3
1 0.7 0.5 0.12 0.25
2 0.0 0.0 1.0 0.02
3 0.9 0.05 0.08 0.15"""
        
        with open(train_labels_dir / "sample_002.txt", "w") as f:
            f.write(sample_multi_annotation)
        
        logger.info("✅ Sample annotations created")
        logger.info("📋 Annotation format: class_id x_center y_center width height")
        logger.info("   - All values are normalized (0-1)")
        logger.info("   - class_id: 0=ball, 1=player, 2=court_lines, 3=hoop")


def main():
    """Main training function with command line argument support."""
    import argparse
    
    parser = argparse.ArgumentParser(description="YOLOv8 Basketball Training")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size")
    parser.add_argument("--img_size", type=int, default=640, help="Image size")
    parser.add_argument("--device", type=str, default="cpu", help="Device (cpu/cuda)")
    parser.add_argument("--data_yaml", type=str, default="training/datasets/basketball/basketball_dataset.yaml", help="Dataset YAML path")
    parser.add_argument("--name", type=str, default="basketball_detection", help="Training run name")
    
    args = parser.parse_args()
    
    print("🏀 Basketball YOLOv8 Training Pipeline")
    print("=" * 50)
    
    # Initialize trainer
    trainer = BasketballYOLOTrainer()
    
    # Create sample annotations for testing
    trainer.create_sample_annotations()
    
    # Check if we have actual data
    dataset_path = Path("training/datasets/basketball")
    train_images = dataset_path / "images" / "train"
    
    if not train_images.exists() or len(list(train_images.glob("*.jpg"))) == 0:
        print("\n⚠️  No training images found!")
        print("📁 Please add basketball images to: training/datasets/basketball/images/train/")
        print("📝 And corresponding labels to: training/datasets/basketball/labels/train/")
        print("\n📋 Label format (YOLO): class_id x_center y_center width height")
        print("   - class_id: 0=ball, 1=player, 2=court_lines, 3=hoop")
        print("   - All values normalized (0-1)")
        return
    
    # Start training
    print("\n🚀 Starting training with available data...")
    results = trainer.train_model(
        epochs=args.epochs,
        batch_size=args.batch_size,
        img_size=args.img_size,
        device=args.device
    )
    
    if results["status"] == "success":
        print(f"\n✅ Training completed!")
        print(f"📁 Model saved to: {results['model_path']}")
        
        # Validate the model
        print("\n🔍 Validating model...")
        validation_results = trainer.validate_model()
        
        if validation_results["status"] == "success":
            metrics = validation_results["metrics"]
            print(f"📊 Validation Results:")
            print(f"   mAP@0.5: {metrics['mAP50']:.3f}")
            print(f"   mAP@0.5:0.95: {metrics['mAP50-95']:.3f}")
            print(f"   Precision: {metrics['precision']:.3f}")
            print(f"   Recall: {metrics['recall']:.3f}")
        
        # Export model
        print("\n📤 Exporting model...")
        export_results = trainer.export_model(format="onnx")
        
        if export_results["status"] == "success":
            print(f"✅ Model exported to: {export_results['exported_path']}")
    
    else:
        print(f"\n❌ Training failed: {results['error']}")


if __name__ == "__main__":
    main()
