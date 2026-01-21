#!/usr/bin/env python3
"""
YOLO Model Training GUI

A comprehensive GUI for training YOLO models for the Basketball Analysis System:
- YOLOv5: Ball detection
- YOLOv8: Player detection  
- YOLOv11: Personal/individual pose analysis

Features:
- GPU acceleration support
- Roboflow dataset integration
- Automatic model placement and naming
- Training progress monitoring
- Hyperparameter configuration
"""

import os
import sys
import json
import threading
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional, Callable

try:
    import customtkinter as ctk
    from customtkinter import filedialog
    CTK_AVAILABLE = True
except ImportError:
    CTK_AVAILABLE = False
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox, scrolledtext

# Check for torch/CUDA
try:
    import torch
    CUDA_AVAILABLE = torch.cuda.is_available()
    if CUDA_AVAILABLE:
        GPU_NAME = torch.cuda.get_device_name(0)
        GPU_COUNT = torch.cuda.device_count()
    else:
        GPU_NAME = "N/A"
        GPU_COUNT = 0
except ImportError:
    CUDA_AVAILABLE = False
    GPU_NAME = "PyTorch not installed"
    GPU_COUNT = 0


# ============================================
# Configuration
# ============================================
BACKEND_ROOT = Path(__file__).parent.parent
MODELS_DIR = BACKEND_ROOT / "models"
DATASETS_DIR = BACKEND_ROOT / "datasets"

# Model configurations
MODEL_CONFIGS = {
    "ball_detector": {
        "name": "Ball Detector",
        "yolo_version": "yolov5",
        "output_name": "ball_detector_model.pt",
        "description": "YOLOv5 - Optimized for basketball/ball detection with motion blur handling",
        "default_epochs": 100,
        "default_batch": 16,
        "default_imgsz": 640,
        "roboflow_dataset": "basketball-w2xcw",
        "classes": ["Ball"],
    },
    "player_detector": {
        "name": "Player Detector",
        "yolo_version": "yolov8",
        "output_name": "player_detector.pt",
        "description": "YOLOv8 - Multi-player detection and tracking",
        "default_epochs": 100,
        "default_batch": 16,
        "default_imgsz": 640,
        "roboflow_dataset": "basketball-players-detection",
        "classes": ["Player"],
    },
    "court_keypoints": {
        "name": "Court Keypoint Detector",
        "yolo_version": "yolov8",
        "output_name": "court_keypoint_detector.pt",
        "description": "YOLOv8 Pose - Court line and keypoint detection",
        "default_epochs": 50,
        "default_batch": 8,
        "default_imgsz": 640,
        "roboflow_dataset": "basketball-court-detection",
        "classes": ["Keypoint"],
    },
    "pose_model": {
        "name": "Personal Pose Analyzer",
        "yolo_version": "yolo11",
        "output_name": "personal_pose_model.pt",
        "description": "YOLO11-Pose - Individual player pose estimation for personal training",
        "default_epochs": 100,
        "default_batch": 8,
        "default_imgsz": 640,
        "roboflow_dataset": None,  # Uses pretrained or custom
        "classes": ["Person"],
    },
}


# ============================================
# Training Manager
# ============================================
class TrainingManager:
    """Handles YOLO model training operations."""
    
    def __init__(self, log_callback: Optional[Callable] = None):
        self.log_callback = log_callback or print
        self.current_process: Optional[subprocess.Popen] = None
        self.is_training = False
        
    def log(self, message: str):
        """Log a message."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_callback(f"[{timestamp}] {message}")
    
    def check_gpu(self) -> dict:
        """Check GPU availability and info."""
        info = {
            "cuda_available": CUDA_AVAILABLE,
            "gpu_count": GPU_COUNT,
            "gpu_name": GPU_NAME,
        }
        
        if CUDA_AVAILABLE:
            info["memory_total"] = torch.cuda.get_device_properties(0).total_memory / 1e9
            info["memory_allocated"] = torch.cuda.memory_allocated(0) / 1e9
        
        return info
    
    def download_dataset(self, dataset_id: str, api_key: str, save_dir: Path) -> bool:
        """Download dataset from Roboflow."""
        try:
            from roboflow import Roboflow
            
            rf = Roboflow(api_key=api_key)
            project = rf.workspace().project(dataset_id)
            dataset = project.version(1).download("yolov5", location=str(save_dir))
            
            self.log(f"Dataset downloaded to: {save_dir}")
            return True
        except Exception as e:
            self.log(f"Error downloading dataset: {e}")
            return False
    
    def train_yolov5(
        self,
        data_yaml: str,
        epochs: int = 100,
        batch_size: int = 16,
        img_size: int = 640,
        device: str = "0",
        output_name: str = "best.pt",
        project_dir: str = "runs/train",
    ) -> bool:
        """Train YOLOv5 model."""
        try:
            # Clone YOLOv5 if not exists
            yolov5_dir = BACKEND_ROOT / "yolov5"
            if not yolov5_dir.exists():
                self.log("Cloning YOLOv5 repository...")
                subprocess.run(
                    ["git", "clone", "https://github.com/ultralytics/yolov5.git", str(yolov5_dir)],
                    check=True
                )
            
            # Build training command
            cmd = [
                sys.executable, str(yolov5_dir / "train.py"),
                "--data", data_yaml,
                "--epochs", str(epochs),
                "--batch-size", str(batch_size),
                "--img", str(img_size),
                "--device", device,
                "--project", project_dir,
                "--name", "basketball_ball",
                "--exist-ok",
            ]
            
            self.log(f"Starting YOLOv5 training: {' '.join(cmd)}")
            self._run_training(cmd, output_name, "yolov5")
            return True
            
        except Exception as e:
            self.log(f"YOLOv5 training error: {e}")
            return False
    
    def train_yolov8(
        self,
        data_yaml: str,
        epochs: int = 100,
        batch_size: int = 16,
        img_size: int = 640,
        device: str = "0",
        output_name: str = "best.pt",
        model_type: str = "yolov8n.pt",
        task: str = "detect",
    ) -> bool:
        """Train YOLOv8 model."""
        try:
            from ultralytics import YOLO
            
            self.log(f"Loading YOLOv8 base model: {model_type}")
            model = YOLO(model_type)
            
            self.log(f"Starting YOLOv8 training...")
            self.is_training = True
            
            # Train the model
            results = model.train(
                data=data_yaml,
                epochs=epochs,
                batch=batch_size,
                imgsz=img_size,
                device=device if device != "cpu" else device,
                project=str(BACKEND_ROOT / "runs" / "train"),
                name="basketball_player",
                exist_ok=True,
            )
            
            # Copy best model to models directory
            best_model = Path(results.save_dir) / "weights" / "best.pt"
            if best_model.exists():
                output_path = MODELS_DIR / output_name
                import shutil
                shutil.copy(best_model, output_path)
                self.log(f"Model saved to: {output_path}")
            
            self.is_training = False
            return True
            
        except Exception as e:
            self.log(f"YOLOv8 training error: {e}")
            self.is_training = False
            return False
    
    def train_yolo11(
        self,
        data_yaml: str,
        epochs: int = 100,
        batch_size: int = 8,
        img_size: int = 640,
        device: str = "0",
        output_name: str = "best.pt",
        task: str = "pose",
    ) -> bool:
        """Train YOLO11 model (latest ultralytics)."""
        try:
            from ultralytics import YOLO
            
            # Use YOLO11 pose model for personal analysis
            if task == "pose":
                model_type = "yolo11n-pose.pt"
            else:
                model_type = "yolo11n.pt"
            
            self.log(f"Loading YOLO11 base model: {model_type}")
            model = YOLO(model_type)
            
            self.log(f"Starting YOLO11 training for {task}...")
            self.is_training = True
            
            results = model.train(
                data=data_yaml,
                epochs=epochs,
                batch=batch_size,
                imgsz=img_size,
                device=device if device != "cpu" else device,
                project=str(BACKEND_ROOT / "runs" / "train"),
                name="personal_pose",
                exist_ok=True,
            )
            
            # Copy best model
            best_model = Path(results.save_dir) / "weights" / "best.pt"
            if best_model.exists():
                output_path = MODELS_DIR / output_name
                import shutil
                shutil.copy(best_model, output_path)
                self.log(f"Model saved to: {output_path}")
            
            self.is_training = False
            return True
            
        except Exception as e:
            self.log(f"YOLO11 training error: {e}")
            self.is_training = False
            return False
    
    def _run_training(self, cmd: list, output_name: str, version: str):
        """Run training command in subprocess."""
        self.is_training = True
        
        def run():
            try:
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                )
                self.current_process = process
                
                for line in process.stdout:
                    self.log(line.strip())
                
                process.wait()
                
                if process.returncode == 0:
                    self.log("Training completed successfully!")
                    # Move model to correct location
                    self._move_trained_model(output_name, version)
                else:
                    self.log(f"Training failed with code: {process.returncode}")
                    
            except Exception as e:
                self.log(f"Training error: {e}")
            finally:
                self.is_training = False
                self.current_process = None
        
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
    
    def _move_trained_model(self, output_name: str, version: str):
        """Move trained model to models directory."""
        import shutil
        
        if version == "yolov5":
            source = BACKEND_ROOT / "runs" / "train" / "basketball_ball" / "weights" / "best.pt"
        else:
            source = BACKEND_ROOT / "runs" / "train" / "exp" / "weights" / "best.pt"
        
        if source.exists():
            dest = MODELS_DIR / output_name
            MODELS_DIR.mkdir(exist_ok=True)
            shutil.copy(source, dest)
            self.log(f"Model saved to: {dest}")
        else:
            self.log(f"Warning: Could not find trained model at {source}")
    
    def stop_training(self):
        """Stop current training process."""
        if self.current_process:
            self.current_process.terminate()
            self.log("Training stopped by user")
            self.is_training = False


# ============================================
# GUI Application
# ============================================
if CTK_AVAILABLE:
    # Modern CustomTkinter GUI
    class TrainingGUI(ctk.CTk):
        def __init__(self):
            super().__init__()
            
            self.title("🏀 Basketball YOLO Training Center")
            self.geometry("1200x800")
            
            ctk.set_appearance_mode("dark")
            ctk.set_default_color_theme("blue")
            
            self.trainer = TrainingManager(log_callback=self.log_message)
            self.setup_ui()
            
        def setup_ui(self):
            # Main container
            self.grid_columnconfigure(1, weight=1)
            self.grid_rowconfigure(0, weight=1)
            
            # Sidebar
            self.sidebar = ctk.CTkFrame(self, width=250, corner_radius=0)
            self.sidebar.grid(row=0, column=0, sticky="nsew")
            self.sidebar.grid_rowconfigure(10, weight=1)
            
            # Logo/Title
            self.logo_label = ctk.CTkLabel(
                self.sidebar, text="🏀 YOLO Trainer",
                font=ctk.CTkFont(size=24, weight="bold")
            )
            self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))
            
            # GPU Status
            gpu_info = self.trainer.check_gpu()
            gpu_status = "✅ GPU" if gpu_info["cuda_available"] else "❌ CPU Only"
            self.gpu_label = ctk.CTkLabel(
                self.sidebar, 
                text=f"{gpu_status}\n{gpu_info['gpu_name'][:30] if gpu_info['cuda_available'] else 'No GPU detected'}",
                font=ctk.CTkFont(size=12)
            )
            self.gpu_label.grid(row=1, column=0, padx=20, pady=10)
            
            # Model Selection
            self.model_label = ctk.CTkLabel(self.sidebar, text="Select Model:", font=ctk.CTkFont(size=14, weight="bold"))
            self.model_label.grid(row=2, column=0, padx=20, pady=(20, 5))
            
            self.model_var = ctk.StringVar(value="ball_detector")
            
            for i, (key, config) in enumerate(MODEL_CONFIGS.items()):
                btn = ctk.CTkRadioButton(
                    self.sidebar, text=config["name"],
                    variable=self.model_var, value=key,
                    command=self.on_model_select
                )
                btn.grid(row=3+i, column=0, padx=20, pady=5, sticky="w")
            
            # Main content
            self.main_frame = ctk.CTkFrame(self)
            self.main_frame.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)
            self.main_frame.grid_columnconfigure(0, weight=1)
            self.main_frame.grid_rowconfigure(2, weight=1)
            
            # Configuration panel
            self.config_frame = ctk.CTkFrame(self.main_frame)
            self.config_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=10)
            self.config_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)
            
            # Model description
            self.desc_label = ctk.CTkLabel(
                self.config_frame, 
                text=MODEL_CONFIGS["ball_detector"]["description"],
                font=ctk.CTkFont(size=12),
                wraplength=500
            )
            self.desc_label.grid(row=0, column=0, columnspan=4, padx=10, pady=10)
            
            # Training parameters
            ctk.CTkLabel(self.config_frame, text="Epochs:").grid(row=1, column=0, padx=5, pady=5)
            self.epochs_entry = ctk.CTkEntry(self.config_frame, width=80)
            self.epochs_entry.insert(0, "100")
            self.epochs_entry.grid(row=1, column=1, padx=5, pady=5, sticky="w")
            
            ctk.CTkLabel(self.config_frame, text="Batch Size:").grid(row=1, column=2, padx=5, pady=5)
            self.batch_entry = ctk.CTkEntry(self.config_frame, width=80)
            self.batch_entry.insert(0, "16")
            self.batch_entry.grid(row=1, column=3, padx=5, pady=5, sticky="w")
            
            ctk.CTkLabel(self.config_frame, text="Image Size:").grid(row=2, column=0, padx=5, pady=5)
            self.imgsz_entry = ctk.CTkEntry(self.config_frame, width=80)
            self.imgsz_entry.insert(0, "640")
            self.imgsz_entry.grid(row=2, column=1, padx=5, pady=5, sticky="w")
            
            ctk.CTkLabel(self.config_frame, text="Device:").grid(row=2, column=2, padx=5, pady=5)
            self.device_combo = ctk.CTkComboBox(
                self.config_frame, 
                values=["0 (GPU)", "cpu"] if CUDA_AVAILABLE else ["cpu"],
                width=100
            )
            self.device_combo.grid(row=2, column=3, padx=5, pady=5, sticky="w")
            
            # Dataset path
            ctk.CTkLabel(self.config_frame, text="Dataset (data.yaml):").grid(row=3, column=0, padx=5, pady=5)
            self.dataset_entry = ctk.CTkEntry(self.config_frame, width=300)
            self.dataset_entry.grid(row=3, column=1, columnspan=2, padx=5, pady=5, sticky="ew")
            
            self.browse_btn = ctk.CTkButton(
                self.config_frame, text="Browse", width=80,
                command=self.browse_dataset
            )
            self.browse_btn.grid(row=3, column=3, padx=5, pady=5)
            
            # Buttons
            self.btn_frame = ctk.CTkFrame(self.main_frame)
            self.btn_frame.grid(row=1, column=0, sticky="ew", padx=10, pady=10)
            
            self.train_btn = ctk.CTkButton(
                self.btn_frame, text="🚀 Start Training", 
                command=self.start_training,
                fg_color="green", hover_color="darkgreen"
            )
            self.train_btn.pack(side="left", padx=10, pady=10)
            
            self.stop_btn = ctk.CTkButton(
                self.btn_frame, text="🛑 Stop Training",
                command=self.stop_training,
                fg_color="red", hover_color="darkred",
                state="disabled"
            )
            self.stop_btn.pack(side="left", padx=10, pady=10)
            
            self.download_btn = ctk.CTkButton(
                self.btn_frame, text="📥 Download Pretrained",
                command=self.download_pretrained
            )
            self.download_btn.pack(side="left", padx=10, pady=10)
            
            # Log output
            self.log_frame = ctk.CTkFrame(self.main_frame)
            self.log_frame.grid(row=2, column=0, sticky="nsew", padx=10, pady=10)
            self.log_frame.grid_columnconfigure(0, weight=1)
            self.log_frame.grid_rowconfigure(0, weight=1)
            
            self.log_text = ctk.CTkTextbox(self.log_frame, wrap="word")
            self.log_text.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
            
            # Output location info
            self.output_label = ctk.CTkLabel(
                self.main_frame,
                text=f"📁 Models will be saved to: {MODELS_DIR}",
                font=ctk.CTkFont(size=11)
            )
            self.output_label.grid(row=3, column=0, padx=10, pady=5, sticky="w")
            
            # Initial log
            self.log_message("Basketball YOLO Training Center initialized")
            self.log_message(f"GPU Available: {CUDA_AVAILABLE}")
            if CUDA_AVAILABLE:
                self.log_message(f"GPU: {GPU_NAME}")
        
        def on_model_select(self):
            """Update UI when model selection changes."""
            model_key = self.model_var.get()
            config = MODEL_CONFIGS[model_key]
            
            self.desc_label.configure(text=config["description"])
            
            self.epochs_entry.delete(0, "end")
            self.epochs_entry.insert(0, str(config["default_epochs"]))
            
            self.batch_entry.delete(0, "end")
            self.batch_entry.insert(0, str(config["default_batch"]))
            
            self.imgsz_entry.delete(0, "end")
            self.imgsz_entry.insert(0, str(config["default_imgsz"]))
        
        def browse_dataset(self):
            """Open file dialog to select dataset."""
            filepath = filedialog.askopenfilename(
                title="Select data.yaml",
                filetypes=[("YAML files", "*.yaml *.yml"), ("All files", "*.*")]
            )
            if filepath:
                self.dataset_entry.delete(0, "end")
                self.dataset_entry.insert(0, filepath)
        
        def start_training(self):
            """Start model training."""
            model_key = self.model_var.get()
            config = MODEL_CONFIGS[model_key]
            
            data_yaml = self.dataset_entry.get()
            if not data_yaml or not Path(data_yaml).exists():
                self.log_message("Error: Please select a valid dataset (data.yaml)")
                return
            
            epochs = int(self.epochs_entry.get())
            batch_size = int(self.batch_entry.get())
            img_size = int(self.imgsz_entry.get())
            device = "0" if "GPU" in self.device_combo.get() else "cpu"
            
            self.train_btn.configure(state="disabled")
            self.stop_btn.configure(state="normal")
            
            self.log_message(f"Starting {config['name']} training...")
            self.log_message(f"  YOLO Version: {config['yolo_version']}")
            self.log_message(f"  Epochs: {epochs}, Batch: {batch_size}, ImgSize: {img_size}")
            self.log_message(f"  Device: {device}")
            self.log_message(f"  Output: {MODELS_DIR / config['output_name']}")
            
            def train_thread():
                if config["yolo_version"] == "yolov5":
                    self.trainer.train_yolov5(
                        data_yaml, epochs, batch_size, img_size,
                        device, config["output_name"]
                    )
                elif config["yolo_version"] == "yolov8":
                    self.trainer.train_yolov8(
                        data_yaml, epochs, batch_size, img_size,
                        device, config["output_name"]
                    )
                elif config["yolo_version"] == "yolo11":
                    self.trainer.train_yolo11(
                        data_yaml, epochs, batch_size, img_size,
                        device, config["output_name"], task="pose"
                    )
                
                self.after(0, self._training_complete)
            
            threading.Thread(target=train_thread, daemon=True).start()
        
        def _training_complete(self):
            """Called when training completes."""
            self.train_btn.configure(state="normal")
            self.stop_btn.configure(state="disabled")
        
        def stop_training(self):
            """Stop training."""
            self.trainer.stop_training()
            self._training_complete()
        
        def download_pretrained(self):
            """Download pretrained model."""
            model_key = self.model_var.get()
            config = MODEL_CONFIGS[model_key]
            
            self.log_message(f"Downloading pretrained {config['yolo_version']} model...")
            
            try:
                from ultralytics import YOLO
                
                if config["yolo_version"] == "yolov5":
                    model = YOLO("yolov5n.pt")
                elif config["yolo_version"] == "yolov8":
                    model = YOLO("yolov8n.pt")
                else:
                    model = YOLO("yolo11n-pose.pt")
                
                MODELS_DIR.mkdir(exist_ok=True)
                output_path = MODELS_DIR / config["output_name"]
                
                # Export/save model
                import shutil
                if hasattr(model, 'ckpt_path'):
                    shutil.copy(model.ckpt_path, output_path)
                
                self.log_message(f"Pretrained model saved to: {output_path}")
                
            except Exception as e:
                self.log_message(f"Error downloading model: {e}")
        
        def log_message(self, message: str):
            """Add message to log."""
            self.log_text.insert("end", message + "\n")
            self.log_text.see("end")

else:
    # Fallback Tkinter GUI
    class TrainingGUI(tk.Tk):
        def __init__(self):
            super().__init__()
            
            self.title("🏀 Basketball YOLO Training Center")
            self.geometry("1000x700")
            self.configure(bg="#2b2b2b")
            
            self.trainer = TrainingManager(log_callback=self.log_message)
            self.setup_ui()
        
        def setup_ui(self):
            # Style configuration
            style = ttk.Style()
            style.theme_use('clam')
            style.configure("TFrame", background="#2b2b2b")
            style.configure("TLabel", background="#2b2b2b", foreground="white")
            style.configure("TButton", padding=10)
            style.configure("TRadiobutton", background="#2b2b2b", foreground="white")
            
            # Main container
            main_frame = ttk.Frame(self, padding=10)
            main_frame.pack(fill="both", expand=True)
            
            # Left panel - Model selection
            left_frame = ttk.Frame(main_frame)
            left_frame.pack(side="left", fill="y", padx=10)
            
            ttk.Label(left_frame, text="🏀 YOLO Trainer", font=("Arial", 18, "bold")).pack(pady=10)
            
            # GPU Status
            gpu_info = self.trainer.check_gpu()
            gpu_text = f"{'✅ GPU: ' + gpu_info['gpu_name'][:25] if gpu_info['cuda_available'] else '❌ CPU Only'}"
            ttk.Label(left_frame, text=gpu_text, font=("Arial", 10)).pack(pady=5)
            
            ttk.Label(left_frame, text="Select Model:", font=("Arial", 12, "bold")).pack(pady=(20, 5))
            
            self.model_var = tk.StringVar(value="ball_detector")
            for key, config in MODEL_CONFIGS.items():
                rb = ttk.Radiobutton(
                    left_frame, text=config["name"],
                    variable=self.model_var, value=key,
                    command=self.on_model_select
                )
                rb.pack(anchor="w", padx=10, pady=3)
            
            # Right panel - Configuration
            right_frame = ttk.Frame(main_frame)
            right_frame.pack(side="right", fill="both", expand=True, padx=10)
            
            # Description
            self.desc_var = tk.StringVar(value=MODEL_CONFIGS["ball_detector"]["description"])
            ttk.Label(right_frame, textvariable=self.desc_var, wraplength=500).pack(pady=10)
            
            # Parameters frame
            param_frame = ttk.Frame(right_frame)
            param_frame.pack(fill="x", pady=10)
            
            ttk.Label(param_frame, text="Epochs:").grid(row=0, column=0, padx=5, pady=5)
            self.epochs_entry = ttk.Entry(param_frame, width=10)
            self.epochs_entry.insert(0, "100")
            self.epochs_entry.grid(row=0, column=1, padx=5, pady=5)
            
            ttk.Label(param_frame, text="Batch Size:").grid(row=0, column=2, padx=5, pady=5)
            self.batch_entry = ttk.Entry(param_frame, width=10)
            self.batch_entry.insert(0, "16")
            self.batch_entry.grid(row=0, column=3, padx=5, pady=5)
            
            ttk.Label(param_frame, text="Image Size:").grid(row=1, column=0, padx=5, pady=5)
            self.imgsz_entry = ttk.Entry(param_frame, width=10)
            self.imgsz_entry.insert(0, "640")
            self.imgsz_entry.grid(row=1, column=1, padx=5, pady=5)
            
            ttk.Label(param_frame, text="Device:").grid(row=1, column=2, padx=5, pady=5)
            self.device_combo = ttk.Combobox(
                param_frame,
                values=["0 (GPU)", "cpu"] if CUDA_AVAILABLE else ["cpu"],
                width=10
            )
            self.device_combo.current(0)
            self.device_combo.grid(row=1, column=3, padx=5, pady=5)
            
            # Dataset
            dataset_frame = ttk.Frame(right_frame)
            dataset_frame.pack(fill="x", pady=10)
            
            ttk.Label(dataset_frame, text="Dataset (data.yaml):").pack(side="left", padx=5)
            self.dataset_entry = ttk.Entry(dataset_frame, width=40)
            self.dataset_entry.pack(side="left", padx=5, fill="x", expand=True)
            
            browse_btn = ttk.Button(dataset_frame, text="Browse", command=self.browse_dataset)
            browse_btn.pack(side="left", padx=5)
            
            # Buttons
            btn_frame = ttk.Frame(right_frame)
            btn_frame.pack(fill="x", pady=10)
            
            self.train_btn = ttk.Button(btn_frame, text="🚀 Start Training", command=self.start_training)
            self.train_btn.pack(side="left", padx=5)
            
            self.stop_btn = ttk.Button(btn_frame, text="🛑 Stop", command=self.stop_training, state="disabled")
            self.stop_btn.pack(side="left", padx=5)
            
            download_btn = ttk.Button(btn_frame, text="📥 Download Pretrained", command=self.download_pretrained)
            download_btn.pack(side="left", padx=5)
            
            # Log
            log_frame = ttk.Frame(right_frame)
            log_frame.pack(fill="both", expand=True, pady=10)
            
            self.log_text = scrolledtext.ScrolledText(log_frame, height=15, bg="#1e1e1e", fg="white")
            self.log_text.pack(fill="both", expand=True)
            
            # Output info
            ttk.Label(right_frame, text=f"📁 Models saved to: {MODELS_DIR}").pack(anchor="w", pady=5)
            
            self.log_message("Basketball YOLO Training Center initialized")
            self.log_message(f"GPU Available: {CUDA_AVAILABLE}")
        
        def on_model_select(self):
            model_key = self.model_var.get()
            config = MODEL_CONFIGS[model_key]
            self.desc_var.set(config["description"])
            
            self.epochs_entry.delete(0, "end")
            self.epochs_entry.insert(0, str(config["default_epochs"]))
            
            self.batch_entry.delete(0, "end")
            self.batch_entry.insert(0, str(config["default_batch"]))
        
        def browse_dataset(self):
            filepath = filedialog.askopenfilename(
                title="Select data.yaml",
                filetypes=[("YAML files", "*.yaml *.yml"), ("All files", "*.*")]
            )
            if filepath:
                self.dataset_entry.delete(0, "end")
                self.dataset_entry.insert(0, filepath)
        
        def start_training(self):
            model_key = self.model_var.get()
            config = MODEL_CONFIGS[model_key]
            
            data_yaml = self.dataset_entry.get()
            if not data_yaml:
                messagebox.showerror("Error", "Please select a dataset")
                return
            
            self.train_btn.configure(state="disabled")
            self.stop_btn.configure(state="normal")
            
            self.log_message(f"Starting {config['name']} training...")
            
            def train():
                epochs = int(self.epochs_entry.get())
                batch = int(self.batch_entry.get())
                imgsz = int(self.imgsz_entry.get())
                device = "0" if "GPU" in self.device_combo.get() else "cpu"
                
                if config["yolo_version"] == "yolov5":
                    self.trainer.train_yolov5(data_yaml, epochs, batch, imgsz, device, config["output_name"])
                elif config["yolo_version"] == "yolov8":
                    self.trainer.train_yolov8(data_yaml, epochs, batch, imgsz, device, config["output_name"])
                else:
                    self.trainer.train_yolo11(data_yaml, epochs, batch, imgsz, device, config["output_name"])
                
                self.after(0, self._training_done)
            
            threading.Thread(target=train, daemon=True).start()
        
        def _training_done(self):
            self.train_btn.configure(state="normal")
            self.stop_btn.configure(state="disabled")
        
        def stop_training(self):
            self.trainer.stop_training()
            self._training_done()
        
        def download_pretrained(self):
            model_key = self.model_var.get()
            config = MODEL_CONFIGS[model_key]
            
            self.log_message(f"Downloading pretrained model...")
            
            try:
                from ultralytics import YOLO
                
                if config["yolo_version"] == "yolo11":
                    model = YOLO("yolo11n-pose.pt")
                else:
                    model = YOLO("yolov8n.pt")
                
                MODELS_DIR.mkdir(exist_ok=True)
                self.log_message(f"Model ready at: {MODELS_DIR / config['output_name']}")
                
            except Exception as e:
                self.log_message(f"Error: {e}")
        
        def log_message(self, message: str):
            timestamp = datetime.now().strftime("%H:%M:%S")
            self.log_text.insert("end", f"[{timestamp}] {message}\n")
            self.log_text.see("end")


# ============================================
# Main Entry Point
# ============================================
def main():
    """Run the training GUI."""
    print("🏀 Starting Basketball YOLO Training Center...")
    print(f"GPU Available: {CUDA_AVAILABLE}")
    if CUDA_AVAILABLE:
        print(f"GPU: {GPU_NAME}")
    
    # Ensure directories exist
    MODELS_DIR.mkdir(exist_ok=True)
    DATASETS_DIR.mkdir(exist_ok=True)
    
    app = TrainingGUI()
    app.mainloop()


if __name__ == "__main__":
    main()
