#!/usr/bin/env python3
"""
YOLOv8 Basketball Training Web UI (Simplified with MinIO)
========================================================

A simplified web interface for YOLOv8 basketball object detection training.
Includes video upload to MinIO, frame extraction, training, and testing.

Usage:
    python yolo_training_ui.py
"""

import os
import json
import asyncio
import logging
import subprocess
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import shutil
import tempfile

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from minio import Minio
from minio.error import S3Error

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MinIO Configuration
MINIO_ENDPOINT = "localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
MINIO_BUCKET = "basketball-videos"

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

# Pydantic models
class VideoUploadResponse(BaseModel):
    success: bool
    message: str
    video_id: Optional[str] = None
    video_url: Optional[str] = None

class FrameExtractionRequest(BaseModel):
    video_ids: List[str]
    strategy: str = "area_specific"
    areas: List[str] = ["ball", "player", "court_lines", "hoop"]
    max_frames_per_area: int = 1000

class TrainingRequest(BaseModel):
    epochs: int = 100
    batch_size: int = 8
    img_size: int = 640
    device: str = "cpu"
    model_name: str = "yolov8_basketball_detection"

class TestRequest(BaseModel):
    model_path: str
    test_image_path: str
    confidence_threshold: float = 0.5

class TrainingStatus(BaseModel):
    status: str
    progress: float
    current_epoch: int
    total_epochs: int
    loss: float
    mAP: float
    message: str
    start_time: str
    estimated_completion: str

class DatasetStats(BaseModel):
    total_frames: int
    annotated_frames: int
    class_distribution: Dict[str, int]
    train_frames: int
    val_frames: int
    test_frames: int

# Global state
training_status = TrainingStatus(
    status="idle",
    progress=0.0,
    current_epoch=0,
    total_epochs=0,
    loss=0.0,
    mAP=0.0,
    message="Ready to train",
    start_time="",
    estimated_completion=""
)

# Create FastAPI app
app = FastAPI(
    title="YOLOv8 Basketball Training UI",
    description="Comprehensive web interface for YOLOv8 basketball object detection training",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = Path("training/static")
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

class YOLOTrainingManager:
    """Manages YOLOv8 training operations with MinIO integration."""
    
    def __init__(self):
        self.base_dir = Path("training")
        self.datasets_dir = self.base_dir / "datasets" / "basketball"
        self.models_dir = self.base_dir / "models"
        self.runs_dir = self.base_dir / "runs"
        self.temp_dir = Path(tempfile.gettempdir()) / "basketball_training"
        
        # Create directories
        for dir_path in [self.datasets_dir, self.models_dir, self.runs_dir, self.temp_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
            
        self.basketball_classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
        # Ensure MinIO bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the MinIO bucket exists."""
        try:
            if not minio_client.bucket_exists(MINIO_BUCKET):
                minio_client.make_bucket(MINIO_BUCKET)
                logger.info(f"✅ Created MinIO bucket: {MINIO_BUCKET}")
            else:
                logger.info(f"✅ MinIO bucket exists: {MINIO_BUCKET}")
        except Exception as e:
            logger.warning(f"⚠️ MinIO not available: {e}")
            logger.warning("App will work in local mode without MinIO storage")
    
    def upload_video(self, file: UploadFile) -> VideoUploadResponse:
        """Upload video to local storage (fallback if MinIO not available)."""
        try:
            # Generate unique video ID
            video_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
            
            # Create uploads directory
            uploads_dir = self.base_dir / "uploads"
            uploads_dir.mkdir(exist_ok=True)
            
            # Save file locally
            video_path = uploads_dir / video_id
            with open(video_path, "wb") as buffer:
                content = file.file.read()
                buffer.write(content)
            
            logger.info(f"✅ Video uploaded locally: {video_id}")
            
            return VideoUploadResponse(
                success=True,
                message=f"Video uploaded successfully: {file.filename}",
                video_id=video_id,
                video_url=f"file://{video_path}"
            )
            
        except Exception as e:
            logger.error(f"❌ Video upload error: {e}")
            return VideoUploadResponse(
                success=False,
                message=f"Video upload failed: {str(e)}"
            )
    
    def download_video_from_minio(self, video_id: str) -> str:
        """Get video path (local storage fallback)."""
        try:
            # Check local uploads directory first
            uploads_dir = self.base_dir / "uploads"
            local_video_path = uploads_dir / video_id
            
            if local_video_path.exists():
                logger.info(f"✅ Video found locally: {video_id}")
                return str(local_video_path)
            
            # Try MinIO if available
            try:
                temp_video_path = self.temp_dir / video_id
                minio_client.fget_object(MINIO_BUCKET, video_id, str(temp_video_path))
                logger.info(f"✅ Video downloaded from MinIO: {video_id}")
                return str(temp_video_path)
            except:
                raise FileNotFoundError(f"Video not found: {video_id}")
            
        except Exception as e:
            logger.error(f"❌ Video download error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to download video: {str(e)}")
        
    def extract_frames(self, request: FrameExtractionRequest) -> Dict[str, Any]:
        """Extract frames from multiple videos using MinIO storage."""
        all_extraction_results = []
        overall_success = True
        overall_message = ""
        
        for video_id in request.video_ids:
            try:
                logger.info(f"🎬 Starting frame extraction for video: {video_id}")
                
                # Download video from MinIO
                video_path = self.download_video_from_minio(video_id)
                
                # Build command for area-specific extraction
                cmd = [
                    "python", "training/area_specific_extraction.py",
                    "--input", video_path,
                    "--output", "training/datasets/basketball/area_frames"
                ]
                
                # Add areas
                if request.areas:
                    areas_str = ",".join(request.areas)
                    cmd.extend(["--areas", areas_str])
                
                # Add max frames per area
                cmd.extend(["--max-frames", str(request.max_frames_per_area)])
                
                # Run area-specific extraction
                result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
                
                # Clean up temporary video file
                try:
                    os.remove(video_path)
                except:
                    pass
                
                if result.returncode == 0:
                    # Count extracted frames for each area
                    area_frames_dir = Path("training/datasets/basketball/area_frames")
                    total_frames = 0
                    area_breakdown = {}
                    
                    for area in request.areas:
                        area_dir = area_frames_dir / area / "images"
                        if area_dir.exists():
                            frame_count = len(list(area_dir.glob("*.jpg")))
                            area_breakdown[area] = frame_count
                            total_frames += frame_count
                    
                    all_extraction_results.append({
                        "video_id": video_id,
                        "success": True,
                        "message": f"Successfully extracted {total_frames} area-specific frames",
                        "frame_count": total_frames,
                        "area_breakdown": area_breakdown,
                        "output_dir": str(area_frames_dir)
                    })
                    overall_message += f"✅ Frames extracted for {video_id}. "
                else:
                    overall_success = False
                    all_extraction_results.append({
                        "video_id": video_id,
                        "success": False,
                        "message": f"Area-specific extraction failed for {video_id}: {result.stderr}",
                        "error": result.stderr
                    })
                    overall_message += f"❌ Extraction failed for {video_id}. "
                    
            except Exception as e:
                overall_success = False
                logger.error(f"❌ Frame extraction error for {video_id}: {e}")
                all_extraction_results.append({
                    "video_id": video_id,
                    "success": False,
                    "message": f"Frame extraction error for {video_id}: {str(e)}",
                    "error": str(e)
                })
                overall_message += f"❌ Error for {video_id}: {str(e)}. "
        
        return {
            "overall_success": overall_success,
            "overall_message": overall_message.strip(),
            "results": all_extraction_results
        }
    
    
    def get_dataset_stats(self) -> DatasetStats:
        """Get dataset statistics."""
        try:
            frames_dir = self.datasets_dir / "frames"
            labels_dir = self.datasets_dir / "labels"
            
            total_frames = len(list(frames_dir.glob("*.jpg"))) if frames_dir.exists() else 0
            annotated_frames = len(list(labels_dir.glob("*.txt"))) if labels_dir.exists() else 0
            
            # Count class distribution
            class_distribution = {name: 0 for name in self.basketball_classes.values()}
            
            if labels_dir.exists():
                for label_file in labels_dir.glob("*.txt"):
                    try:
                        with open(label_file, 'r') as f:
                            for line in f:
                                line = line.strip()
                                if line and not line.startswith('#'):
                                    parts = line.split()
                                    if len(parts) >= 1:
                                        class_id = int(parts[0])
                                        if class_id in self.basketball_classes:
                                            class_name = self.basketball_classes[class_id]
                                            class_distribution[class_name] += 1
                    except Exception as e:
                        logger.warning(f"⚠️ Error reading {label_file}: {e}")
            
            # Count train/val/test splits
            train_frames = len(list((self.datasets_dir / "images" / "train").glob("*.jpg"))) if (self.datasets_dir / "images" / "train").exists() else 0
            val_frames = len(list((self.datasets_dir / "images" / "val").glob("*.jpg"))) if (self.datasets_dir / "images" / "val").exists() else 0
            test_frames = len(list((self.datasets_dir / "images" / "test").glob("*.jpg"))) if (self.datasets_dir / "images" / "test").exists() else 0
            
            # Count area-specific frames
            area_frames_dir = Path("training/datasets/basketball/area_frames")
            area_frame_count = 0
            if area_frames_dir.exists():
                for area in ["ball", "player", "court_lines", "hoop"]:
                    area_images_dir = area_frames_dir / area / "images"
                    if area_images_dir.exists():
                        area_frame_count += len(list(area_images_dir.glob("*.jpg")))
            
            return DatasetStats(
                total_frames=total_frames + area_frame_count,
                annotated_frames=annotated_frames,
                class_distribution=class_distribution,
                train_frames=train_frames,
                val_frames=val_frames,
                test_frames=test_frames
            )
            
        except Exception as e:
            logger.error(f"❌ Error getting dataset stats: {e}")
            return DatasetStats(
                total_frames=0,
                annotated_frames=0,
                class_distribution={},
                train_frames=0,
                val_frames=0,
                test_frames=0
            )
    
    def create_dataset_splits(self) -> Dict[str, Any]:
        """Create train/validation/test splits."""
        try:
            logger.info("📊 Creating dataset splits...")
            
            cmd = [
                "python", "training/annotation_helper.py",
                "--frames-dir", str(self.datasets_dir / "frames"),
                "--labels-dir", str(self.datasets_dir / "labels"),
                "--action", "splits"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "message": "Dataset splits created successfully"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to create splits: {result.stderr}",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"❌ Error creating dataset splits: {e}")
            return {
                "success": False,
                "message": f"Error creating splits: {str(e)}",
                "error": str(e)
            }
    
    def start_training(self, request: TrainingRequest) -> Dict[str, Any]:
        """Start YOLOv8 training in background."""
        try:
            logger.info(f"🏋️ Starting YOLOv8 training: {request.model_name}")
            
            # Update training status
            global training_status
            training_status.status = "starting"
            training_status.progress = 0.0
            training_status.current_epoch = 0
            training_status.total_epochs = request.epochs
            training_status.start_time = datetime.now().isoformat()
            training_status.message = "Initializing training..."
            
            # Start training in background thread
            training_thread = threading.Thread(
                target=self._run_training,
                args=(request,),
                daemon=True
            )
            training_thread.start()
            
            return {
                "success": True,
                "message": "Training started successfully",
                "training_id": request.model_name
            }
            
        except Exception as e:
            logger.error(f"❌ Error starting training: {e}")
            return {
                "success": False,
                "message": f"Error starting training: {str(e)}",
                "error": str(e)
            }
    
    def _run_training(self, request: TrainingRequest):
        """Run YOLOv8 training (background thread)."""
        global training_status
        try:
            training_status.status = "training"
            training_status.message = "Training in progress..."
            
            # Build training command
            cmd = [
                "python", "training/train_basketball_yolo.py",
                "--epochs", str(request.epochs),
                "--batch_size", str(request.batch_size),
                "--img_size", str(request.img_size),
                "--device", request.device,
                "--data_yaml", request.data_yaml,
                "--name", request.model_name
            ]
            
            # Run training
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=".",
                bufsize=1,
                universal_newlines=True
            )
            
            # Monitor training progress
            for line in process.stdout:
                line = line.strip()
                if line:
                    logger.info(f"Training: {line}")
                    
                    # Parse training progress
                    if "epoch" in line.lower() and "/" in line:
                        try:
                            # Extract epoch information
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if "/" in part and "epoch" in parts[i-1].lower():
                                    epoch_parts = part.split("/")
                                    current_epoch = int(epoch_parts[0])
                                    total_epochs = int(epoch_parts[1])
                                    
                                    training_status.current_epoch = current_epoch
                                    training_status.total_epochs = total_epochs
                                    training_status.progress = (current_epoch / total_epochs) * 100
                                    break
                        except:
                            pass
                    
                    # Parse loss information
                    if "loss" in line.lower():
                        try:
                            # Extract loss value
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if "loss" in part.lower() and i + 1 < len(parts):
                                    loss_value = float(parts[i + 1])
                                    training_status.loss = loss_value
                                    break
                        except:
                            pass
                    
                    # Parse mAP information
                    if "map" in line.lower():
                        try:
                            # Extract mAP value
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if "map" in part.lower() and i + 1 < len(parts):
                                    map_value = float(parts[i + 1])
                                    training_status.mAP = map_value
                                    break
                        except:
                            pass
            
            # Wait for training to complete
            return_code = process.wait()
            
            if return_code == 0:
                training_status.status = "completed"
                training_status.progress = 100.0
                training_status.message = "Training completed successfully!"
                logger.info("✅ Training completed successfully")
            else:
                training_status.status = "failed"
                training_status.message = "Training failed"
                logger.error("❌ Training failed")
                
        except Exception as e:
            logger.error(f"❌ Training error: {e}")
            training_status.status = "failed"
            training_status.message = f"Training error: {str(e)}"
    
    def test_model(self, request: TestRequest) -> Dict[str, Any]:
        """Test trained model on an image."""
        try:
            logger.info(f"🧪 Testing model: {request.model_path}")
            
            # Create test script
            test_script = f"""
import cv2
from ultralytics import YOLO
import json

# Load model
model = YOLO('{request.model_path}')

# Run inference
results = model('{request.test_image_path}', conf={request.confidence_threshold})

# Process results
detections = []
for result in results:
    for box in result.boxes:
        detection = {{
            'class_id': int(box.cls[0]),
            'class_name': model.names[int(box.cls[0])],
            'confidence': float(box.conf[0]),
            'bbox': box.xyxy[0].tolist()
        }}
        detections.append(detection)

print(json.dumps(detections))
"""
            
            # Write and run test script
            test_file = self.base_dir / "test_model_temp.py"
            with open(test_file, 'w') as f:
                f.write(test_script)
            
            result = subprocess.run(
                ["python", str(test_file)],
                capture_output=True,
                text=True,
                cwd="."
            )
            
            # Clean up
            test_file.unlink()
            
            if result.returncode == 0:
                detections = json.loads(result.stdout)
                return {
                    "success": True,
                    "detections": detections,
                    "message": f"Found {len(detections)} detections"
                }
            else:
                return {
                    "success": False,
                    "message": f"Model testing failed: {result.stderr}",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"❌ Model testing error: {e}")
            return {
                "success": False,
                "message": f"Model testing error: {str(e)}",
                "error": str(e)
            }
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available trained models."""
        try:
            models = []
            
            # Check runs directory for trained models
            if self.runs_dir.exists():
                for run_dir in self.runs_dir.glob("detect/*"):
                    weights_dir = run_dir / "weights"
                    if weights_dir.exists():
                        best_model = weights_dir / "best.pt"
                        last_model = weights_dir / "last.pt"
                        
                        if best_model.exists():
                            models.append({
                                "name": run_dir.name,
                                "path": str(best_model),
                                "type": "best",
                                "size": best_model.stat().st_size,
                                "created": datetime.fromtimestamp(best_model.stat().st_mtime).isoformat()
                            })
                        
                        if last_model.exists():
                            models.append({
                                "name": run_dir.name,
                                "path": str(last_model),
                                "type": "last",
                                "size": last_model.stat().st_size,
                                "created": datetime.fromtimestamp(last_model.stat().st_mtime).isoformat()
                            })
            
            return models
            
        except Exception as e:
            logger.error(f"❌ Error getting models: {e}")
            return []

# Initialize training manager
training_manager = YOLOTrainingManager()

# API Routes
@app.get("/", response_class=HTMLResponse)
async def get_ui():
    """Serve the main UI."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>YOLOv8 Basketball Training UI</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary-color: #4A90E2;
                --secondary-color: #50B3A2;
                --accent-color: #FF6B6B;
                --bg-light: #f8f9fa;
                --bg-dark: #e9ecef;
                --text-dark: #343a40;
                --text-light: #6c757d;
                --border-color: #dee2e6;
                --card-bg: #ffffff;
                --shadow-light: rgba(0, 0, 0, 0.05);
                --shadow-medium: rgba(0, 0, 0, 0.1);
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Poppins', sans-serif;
                background-color: var(--bg-light);
                color: var(--text-dark);
                line-height: 1.6;
            }

            .container {
                max-width: 1200px;
                margin: 30px auto;
                padding: 20px;
                background-color: var(--card-bg);
                border-radius: 12px;
                box-shadow: 0 8px 20px var(--shadow-medium);
            }

            .header {
                text-align: center;
                padding: 40px 20px;
                background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%);
                color: white;
                border-radius: 10px;
                margin-bottom: 30px;
                box-shadow: 0 4px 15px var(--shadow-medium);
            }

            .header h1 {
                font-size: 2.8em;
                margin-bottom: 10px;
                font-weight: 700;
            }

            .header p {
                font-size: 1.1em;
                opacity: 0.9;
            }

            .tabs {
                display: flex;
                justify-content: center;
                margin-bottom: 30px;
                background-color: var(--bg-dark);
                border-radius: 8px;
                padding: 5px;
                box-shadow: inset 0 1px 3px var(--shadow-light);
            }

            .tab {
                flex: 1;
                padding: 14px 25px;
                border: none;
                background: none;
                font-size: 1em;
                font-weight: 600;
                color: var(--text-light);
                cursor: pointer;
                transition: all 0.3s ease;
                border-radius: 6px;
                text-align: center;
            }

            .tab:hover {
                color: var(--primary-color);
                background-color: rgba(74, 144, 226, 0.1);
            }

            .tab.active {
                color: white;
                background: linear-gradient(90deg, var(--primary-color) 0%, #6a67d6 100%);
                box-shadow: 0 4px 10px rgba(74, 144, 226, 0.4);
            }

            .tab-content {
                display: none;
                animation: fadeIn 0.5s ease-out;
            }

            .tab-content.active {
                display: block;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .section-title {
                font-size: 1.8em;
                color: var(--primary-color);
                margin-bottom: 25px;
                border-bottom: 2px solid var(--primary-color);
                padding-bottom: 10px;
                font-weight: 600;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 25px;
            }

            .card {
                background-color: var(--card-bg);
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px var(--shadow-light);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid var(--border-color);
            }

            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 20px var(--shadow-medium);
            }

            .card h3 {
                font-size: 1.4em;
                color: var(--text-dark);
                margin-bottom: 15px;
                font-weight: 600;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: var(--text-dark);
                font-size: 0.95em;
            }

            .form-group input[type="text"],
            .form-group input[type="number"],
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                font-size: 1em;
                color: var(--text-dark);
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
            }

            .btn {
                display: inline-block;
                padding: 12px 25px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1em;
                font-weight: 600;
                color: white;
                background: linear-gradient(90deg, var(--primary-color) 0%, #6a67d6 100%);
                transition: all 0.3s ease;
                box-shadow: 0 4px 10px rgba(74, 144, 226, 0.3);
                margin-top: 10px;
            }

            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(74, 144, 226, 0.4);
            }

            .btn-secondary {
                background: linear-gradient(90deg, var(--text-light) 0%, #868e96 100%);
                box-shadow: 0 4px 10px rgba(108, 117, 125, 0.3);
            }
            .btn-secondary:hover {
                box-shadow: 0 6px 15px rgba(108, 117, 125, 0.4);
            }

            .btn-success {
                background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
                box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
            }
            .btn-success:hover {
                box-shadow: 0 6px 15px rgba(40, 167, 69, 0.4);
            }

            .btn-danger {
                background: linear-gradient(90deg, #dc3545 0%, #e83e8c 100%);
                box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
            }
            .btn-danger:hover {
                box-shadow: 0 6px 15px rgba(220, 53, 69, 0.4);
            }

            .btn-warning {
                background: linear-gradient(90deg, #ffc107 0%, #fd7e14 100%);
                box-shadow: 0 4px 10px rgba(255, 193, 7, 0.3);
            }
            .btn-warning:hover {
                box-shadow: 0 6px 15px rgba(255, 193, 7, 0.4);
            }

            .file-upload {
                border: 2px dashed var(--border-color);
                padding: 30px;
                text-align: center;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background-color: var(--bg-light);
            }

            .file-upload:hover {
                border-color: var(--primary-color);
                background-color: rgba(74, 144, 226, 0.05);
            }

            .file-upload p {
                margin: 5px 0;
                color: var(--text-light);
            }

            .file-list {
                margin-top: 20px;
                border-top: 1px solid var(--border-color);
                padding-top: 15px;
                max-height: 250px;
                overflow-y: auto;
            }

            .file-list strong {
                color: var(--text-dark);
                display: block;
                margin-bottom: 10px;
            }

            .file-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px dashed var(--bg-dark);
            }
            .file-item:last-child {
                border-bottom: none;
            }

            .file-item span {
                font-size: 0.9em;
            }

            .status-message {
                padding: 12px;
                border-radius: 6px;
                margin: 15px 0;
                font-weight: 600;
                display: none; /* Hidden by default */
            }

            .status-message.success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .status-message.error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .status-message.info {
                background-color: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }

            .status-message.warning {
                background-color: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }

            .progress-bar-container {
                width: 100%;
                background-color: var(--bg-dark);
                border-radius: 8px;
                overflow: hidden;
                margin-top: 20px;
                height: 25px;
                box-shadow: inset 0 1px 3px var(--shadow-light);
            }

            .progress-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
                transition: width 0.4s ease-in-out;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 0.9em;
            }

            .metric-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }

            .metric-card {
                background-color: var(--bg-light);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid var(--border-color);
                text-align: center;
                box-shadow: 0 2px 8px var(--shadow-light);
            }

            .metric-card .value {
                font-size: 1.8em;
                font-weight: 700;
                color: var(--primary-color);
                margin-bottom: 5px;
            }

            .metric-card .label {
                font-size: 0.9em;
                color: var(--text-light);
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .container {
                    margin: 20px auto;
                    padding: 15px;
                }
                .header h1 {
                    font-size: 2em;
                }
                .header p {
                    font-size: 1em;
                }
                .tabs {
                    flex-direction: column;
                }
                .tab {
                    border-radius: 6px;
                    margin-bottom: 5px;
                }
                .grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏀 YOLOv8 Basketball Training UI</h1>
                <p>Automated Basketball Object Detection Training Platform</p>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="showTab('upload', this)">📹 Video Upload</button>
                <button class="tab" onclick="showTab('extraction', this)">🎬 Frame Extraction</button>
                <button class="tab" onclick="showTab('training', this)">🏋️ Training</button>
                <button class="tab" onclick="showTab('testing', this)">🧪 Testing</button>
            </div>

            <!-- Video Upload Tab -->
            <div id="upload" class="tab-content active">
                <h2 class="section-title">📹 Upload Basketball Videos</h2>
                <div class="grid">
                    <div class="card">
                        <h3>Upload Video(s)</h3>
                        <div class="file-upload" id="video-upload-area" onclick="document.getElementById('video-file-input').click()">
                            <p>Click or drag & drop to upload basketball video(s)</p>
                            <p style="font-size: 0.9em; color: var(--text-light);">Supports MP4, AVI, MOV formats</p>
                            <p style="font-size: 0.8em; color: var(--text-light);">💡 Hold <strong>Ctrl</strong> (Windows/Linux) or <strong>Cmd</strong> (Mac) to select multiple videos</p>
                            <p style="font-size: 0.8em; color: var(--secondary-color);">✅ Videos are stored locally (MinIO fallback available)</p>
                        </div>
                        <input type="file" id="video-file-input" multiple accept="video/*" style="display: none;" onchange="handleVideoUpload(event)">
                        <div id="video-list" class="file-list">
                            <strong>Selected Videos:</strong>
                            <p class="status-message info">No videos selected yet.</p>
                        </div>
                        <div id="upload-status" class="status-message"></div>
                    </div>
                    <div class="card">
                        <h3>Uploaded Videos</h3>
                        <div id="uploaded-videos-display">
                            <p class="status-message info">No videos uploaded yet.</p>
                        </div>
                        <button class="btn btn-secondary" onclick="refreshUploadedVideos()">🔄 Refresh List</button>
                    </div>
                </div>
            </div>

            <!-- Frame Extraction Tab -->
            <div id="extraction" class="tab-content">
                <h2 class="section-title">🎬 Frame Extraction</h2>
                <div class="grid">
                    <div class="card">
                        <h3>Select Video & Areas</h3>
                        <div class="form-group">
                            <label for="video-select-extraction">Choose uploaded video(s):</label>
                            <select id="video-select-extraction" class="form-control" multiple size="5">
                                <option value="" disabled>Select videos...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Basketball Areas to Extract:</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                                <label><input type="checkbox" name="area" value="ball" checked> 🏀 Ball</label>
                                <label><input type="checkbox" name="area" value="player" checked> 👤 Player</label>
                                <label><input type="checkbox" name="area" value="court_lines" checked> 📏 Court Lines</label>
                                <label><input type="checkbox" name="area" value="hoop" checked> 🏀 Hoop</label>
                            </div>
                            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 5px;">
                                💡 Each selected area will have frames extracted and stored in organized subfolders.
                            </p>
                        </div>
                        <div class="form-group">
                            <label for="max-frames">Max Frames per Area:</label>
                            <input type="number" id="max-frames" class="form-control" value="1000" min="100" max="5000">
                            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 5px;">
                                Recommended: 1000 frames per area for diverse training data.
                            </p>
                        </div>
                        <button class="btn btn-primary" onclick="extractFrames()">🎬 Start Frame Extraction</button>
                    </div>
                    <div class="card">
                        <h3>Extraction Progress & Results</h3>
                        <div id="extraction-status" class="status-message"></div>
                        <div id="extraction-progress-container" class="progress-bar-container" style="display: none;">
                            <div id="extraction-progress-bar" class="progress-bar">0%</div>
                        </div>
                        <div id="extraction-results-display" class="file-list">
                            <strong>Extracted Frames Summary:</strong>
                            <p class="status-message info">No frames extracted yet.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Training Tab -->
            <div id="training" class="tab-content">
                <h2 class="section-title">🏋️ YOLOv8 Training</h2>
                <div class="grid">
                    <div class="card">
                        <h3>Training Configuration</h3>
                        <div class="form-group">
                            <label for="epochs">Epochs:</label>
                            <input type="number" id="epochs" class="form-control" value="100" min="1" max="1000">
                        </div>
                        <div class="form-group">
                            <label for="batch-size">Batch Size:</label>
                            <input type="number" id="batch-size" class="form-control" value="8" min="1" max="64">
                        </div>
                        <div class="form-group">
                            <label for="img-size">Image Size:</label>
                            <input type="number" id="img-size" class="form-control" value="640" min="320" max="1280" step="32">
                        </div>
                        <div class="form-group">
                            <label for="device">Device:</label>
                            <select id="device" class="form-control">
                                <option value="cpu">CPU</option>
                                <option value="cuda">GPU (CUDA)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="model-name">Model Name:</label>
                            <input type="text" id="model-name" class="form-control" value="yolov8_basketball_detection">
                        </div>
                        <button class="btn btn-success" onclick="startTraining()">🚀 Start Training</button>
                        <button class="btn btn-danger" onclick="stopTraining()">⏹️ Stop Training</button>
                    </div>
                    <div class="card">
                        <h3>Training Progress & Metrics</h3>
                        <div id="training-status-display" class="status-message info">Ready to train.</div>
                        <div class="progress-bar-container">
                            <div id="training-progress-bar" class="progress-bar">0%</div>
                        </div>
                        <div class="metric-grid">
                            <div class="metric-card">
                                <div class="value" id="status-text">Idle</div>
                                <div class="label">Status</div>
                            </div>
                            <div class="metric-card">
                                <div class="value" id="epoch-text">0/0</div>
                                <div class="label">Epoch</div>
                            </div>
                            <div class="metric-card">
                                <div class="value" id="loss-text">0.000</div>
                                <div class="label">Loss</div>
                            </div>
                            <div class="metric-card">
                                <div class="value" id="map-text">0.000</div>
                                <div class="label">mAP</div>
                            </div>
                        </div>
                        <p style="margin-top: 15px; font-size: 0.9em; color: var(--text-light);"><strong>Message:</strong> <span id="message-text"></span></p>
                    </div>
                </div>
            </div>

            <!-- Testing Tab -->
            <div id="testing" class="tab-content">
                <h2 class="section-title">🧪 Model Testing</h2>
                <div class="grid">
                    <div class="card">
                        <h3>Test Configuration</h3>
                        <div class="form-group">
                            <label for="test-model-select">Select Model:</label>
                            <select id="test-model-select" class="form-control">
                                <option value="">Select a trained model...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="test-image-input">Upload Test Image:</label>
                            <div class="file-upload" onclick="document.getElementById('test-image-input').click()">
                                <p>🖼️ Click to upload test image</p>
                            </div>
                            <input type="file" id="test-image-input" accept="image/*" style="display: none;" onchange="handleTestImageUpload(event)">
                            <p id="test-image-name" style="margin-top: 10px; font-size: 0.9em; color: var(--text-light);">No image selected.</p>
                        </div>
                        <div class="form-group">
                            <label for="confidence-threshold">Confidence Threshold:</label>
                            <input type="range" id="confidence-threshold" min="0.1" max="1.0" step="0.05" value="0.5" oninput="document.getElementById('confidence-value').textContent=this.value">
                            <span id="confidence-value" style="font-weight: 600; color: var(--primary-color);">0.5</span>
                        </div>
                        <button class="btn btn-warning" onclick="testModel()">🧪 Run Test</button>
                    </div>
                    <div class="card">
                        <h3>Test Results & Detections</h3>
                        <div id="test-results-display" class="status-message info">No test results yet.</div>
                        <div id="detection-results" class="file-list">
                            <strong>Detected Objects:</strong>
                            <p class="status-message info">No detections to display.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentVideoId = '';
            let currentTestImagePath = '';
            let uploadedVideos = []; // Stores objects with { id, name, url }
            let trainingInterval = null;

            // Utility function to show status messages
            function showStatus(elementId, message, type) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.className = `status-message ${type}`;
                    element.textContent = message;
                    element.style.display = 'block';
                }
            }

            // Tab switching
            function showTab(tabName, element = null) {
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });

                document.getElementById(tabName).classList.add('active');
                if (element) {
                    element.classList.add('active');
                } else {
                    const initialTabButton = document.querySelector(`.tab[onclick*='${tabName}']`);
                    if (initialTabButton) {
                        initialTabButton.classList.add('active');
                    }
                }

                // Load data for specific tabs
                if (tabName === 'upload') {
                    loadUploadedVideos();
                } else if (tabName === 'extraction') {
                    loadUploadedVideosForExtraction();
                } else if (tabName === 'testing') {
                    loadTestModels();
                }
            }

            // Video upload handling
            document.getElementById('video-upload-area').addEventListener('dragover', (event) => {
                event.preventDefault();
                event.currentTarget.style.borderColor = 'var(--primary-color)';
            });

            document.getElementById('video-upload-area').addEventListener('dragleave', (event) => {
                event.preventDefault();
                event.currentTarget.style.borderColor = 'var(--border-color)';
            });

            document.getElementById('video-upload-area').addEventListener('drop', (event) => {
                event.preventDefault();
                event.currentTarget.style.borderColor = 'var(--border-color)';
                const files = event.dataTransfer.files;
                handleVideoUploadInternal(Array.from(files));
            });

            async function handleVideoUpload(event) {
                const files = Array.from(event.target.files);
                await handleVideoUploadInternal(files);
            }

            async function handleVideoUploadInternal(files) {
                if (files.length === 0) {
                    showStatus('upload-status', 'No files selected.', 'error');
                    return;
                }

                const uploadListDiv = document.getElementById('video-list');
                uploadListDiv.innerHTML = '<strong>Selected Videos:</strong>';
                files.forEach((file, index) => {
                    uploadListDiv.innerHTML += `<div class="file-item"><span>${index + 1}. ${file.name}</span><span>(${(file.size / 1024 / 1024).toFixed(2)} MB)</span></div>`;
                });
                
                showStatus('upload-status', `Uploading ${files.length} videos...`, 'info');

                let successCount = 0;
                let errorCount = 0;

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch('/api/upload-video', {
                            method: 'POST',
                            body: formData
                        });

                        const result = await response.json();

                        if (result.success) {
                            successCount++;
                            uploadedVideos.push({
                                id: result.video_id,
                                name: file.name,
                                url: result.video_url
                            });
                        } else {
                            errorCount++;
                            console.error(`Failed to upload ${file.name}: ${result.message}`);
                        }
                    } catch (error) {
                        errorCount++;
                        console.error(`Upload error for ${file.name}:`, error);
                    }
                }

                if (successCount > 0) {
                    showStatus('upload-status', `✅ Uploaded ${successCount} videos successfully${errorCount > 0 ? `, ${errorCount} failed.` : '.'}`, 'success');
                    refreshUploadedVideos();
                } else {
                    showStatus('upload-status', '❌ All uploads failed.', 'error');
                }
                uploadListDiv.innerHTML = '<strong>Selected Videos:</strong><p class="status-message info">No videos selected yet.</p>'; // Clear selection list
            }

            // Load uploaded videos for display in the upload tab
            async function loadUploadedVideos() {
                try {
                    const response = await fetch('/api/videos');
                    const videos = await response.json();
                    uploadedVideos = videos; // Update the global list

                    const container = document.getElementById('uploaded-videos-display');
                    container.innerHTML = ''; // Clear previous content

                    if (videos.length === 0) {
                        container.innerHTML = '<p class="status-message info">No videos uploaded yet.</p>';
                    } else {
                        videos.forEach(video => {
                            const div = document.createElement('div');
                            div.className = 'card uploaded-video-item'; // Add a specific class for styling
                            div.innerHTML = `
                                <h4>${video.name}</h4>
                                <p><strong>ID:</strong> ${video.id.split('_')[0]}...</p>
                                <p><strong>Size:</strong> ${(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <p><strong>Uploaded:</strong> ${new Date(video.last_modified).toLocaleString()}</p>
                            `;
                            container.appendChild(div);
                        });
                    }
                } catch (error) {
                    console.error('Error loading uploaded videos:', error);
                    showStatus('uploaded-videos-display', `Failed to load videos: ${error.message}`, 'error');
                }
            }

            // Load uploaded videos specifically for the extraction select dropdown
            async function loadUploadedVideosForExtraction() {
                try {
                    const response = await fetch('/api/videos');
                    const videos = await response.json();
                    uploadedVideos = videos;

                    const select = document.getElementById('video-select-extraction');
                    select.innerHTML = '<option value="" disabled>Select videos...</option>';

                    if (videos.length === 0) {
                        select.innerHTML += '<option value="" disabled>No videos available</option>';
                    } else {
                        videos.forEach(video => {
                            const option = document.createElement('option');
                            option.value = video.id;
                            option.textContent = video.name;
                            select.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Error loading videos for extraction:', error);
                }
            }

            // Refresh uploaded videos display (called after upload or explicitly)
            function refreshUploadedVideos() {
                loadUploadedVideos(); // Simply re-load the list
            }
            
            // Frame extraction
            async function extractFrames() {
                const videoSelect = document.getElementById('video-select-extraction');
                const videoIds = Array.from(videoSelect.selectedOptions).map(option => option.value);

                if (videoIds.length === 0) {
                    showStatus('extraction-status', 'Please select at least one video first.', 'error');
                    return;
                }

                let selectedAreas = [];
                document.querySelectorAll('#extraction .form-group input[type="checkbox"]:checked').forEach(checkbox => {
                    selectedAreas.push(checkbox.value);
                });

                if (selectedAreas.length === 0) {
                    showStatus('extraction-status', 'Please select at least one basketball area.', 'error');
                    return;
                }

                const maxFrames = document.getElementById('max-frames').value;
                showStatus('extraction-status', 'Starting frame extraction...', 'info');
                document.getElementById('extraction-progress-container').style.display = 'block';
                document.getElementById('extraction-progress-bar').style.width = '0%';
                document.getElementById('extraction-progress-bar').textContent = '0%';
                document.getElementById('extraction-results-display').innerHTML = '<strong>Extracted Frames Summary:</strong><p class="status-message info">Processing...</p>';

                try {
                    const requestBody = {
                        video_ids: videoIds,
                        strategy: 'area_specific',
                        areas: selectedAreas,
                        max_frames_per_area: parseInt(maxFrames)
                    };

                    const response = await fetch('/api/extract-frames', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });

                    const result = await response.json();
                    
                    if (result.overall_success) {
                        showStatus('extraction-status', `✅ ${result.overall_message}`, 'success');
                        document.getElementById('extraction-progress-bar').style.width = '100%';
                        document.getElementById('extraction-progress-bar').textContent = '100%';
                        
                        let resultsHtml = '<strong>Extracted Frames Summary:</strong>';
                        if (result.results) {
                            result.results.forEach(videoResult => {
                                if (videoResult.success) {
                                    resultsHtml += `<div class="file-item"><span>✅ ${videoResult.video_id.split('_')[0]}...</span><span>${videoResult.message}</span></div>`;
                                } else {
                                    resultsHtml += `<div class="file-item"><span>❌ ${videoResult.video_id.split('_')[0]}...</span><span>${videoResult.message}</span></div>`;
                                }
                            });
                        } else {
                            resultsHtml += `<p class="status-message info">No detailed breakdown available.</p>`;
                        }
                        document.getElementById('extraction-results-display').innerHTML = resultsHtml;
                    } else {
                        showStatus('extraction-status', `❌ Extraction failed: ${result.overall_message}`, 'error');
                        document.getElementById('extraction-progress-bar').style.width = '0%';
                        document.getElementById('extraction-progress-bar').textContent = 'Error';
                    }
                } catch (error) {
                    showStatus('extraction-status', `❌ Error during extraction: ${error.message}`, 'error');
                    document.getElementById('extraction-progress-bar').style.width = '0%';
                    document.getElementById('extraction-progress-bar').textContent = 'Error';
                } finally {
                    document.getElementById('extraction-progress-container').style.display = 'none';
                }
            }

            // Training functions
            async function startTraining() {
                const epochs = document.getElementById('epochs').value;
                const batchSize = document.getElementById('batch-size').value;
                const imgSize = document.getElementById('img-size').value;
                const device = document.getElementById('device').value;
                const modelName = document.getElementById('model-name').value;

                showStatus('training-status-display', 'Initializing training...', 'info');
                document.getElementById('training-progress-bar').style.width = '0%';
                document.getElementById('training-progress-bar').textContent = '0%';
                document.getElementById('status-text').textContent = 'Starting...';
                document.getElementById('epoch-text').textContent = '0/0';
                document.getElementById('loss-text').textContent = '0.000';
                document.getElementById('map-text').textContent = '0.000';
                document.getElementById('message-text').textContent = 'Sending request...';

                try {
                    const response = await fetch('/api/start-training', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            epochs: parseInt(epochs),
                            batch_size: parseInt(batchSize),
                            img_size: parseInt(imgSize),
                            device: device,
                            model_name: modelName,
                            data_yaml: "training/datasets/basketball/data.yaml" // Assuming a default data.yaml
                        })
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        showStatus('training-status-display', result.message, 'success');
                        startTrainingMonitor();
                    } else {
                        showStatus('training-status-display', `❌ Training failed to start: ${result.message}`, 'error');
                    }
                } catch (error) {
                    showStatus('training-status-display', `❌ Error starting training: ${error.message}`, 'error');
                }
            }

            function startTrainingMonitor() {
                if (trainingInterval) clearInterval(trainingInterval); // Clear any existing interval

                trainingInterval = setInterval(async () => {
                    try {
                        const response = await fetch('/api/training-status');
                        const status = await response.json();
                        
                        updateTrainingProgress(status);
                        
                        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
                            clearInterval(trainingInterval);
                            trainingInterval = null;
                            if (status.status === 'completed') {
                                showStatus('training-status-display', `✅ Training completed: ${status.message}`, 'success');
                            } else if (status.status === 'failed') {
                                showStatus('training-status-display', `❌ Training failed: ${status.message}`, 'error');
                            } else if (status.status === 'cancelled') {
                                showStatus('training-status-display', `⚠️ Training cancelled: ${status.message}`, 'warning');
                            }
                            loadTestModels(); // Refresh models list after training
                        }
                    } catch (error) {
                        console.error('Error monitoring training:', error);
                        showStatus('training-status-display', `Monitoring error: ${error.message}`, 'error');
                        clearInterval(trainingInterval);
                        trainingInterval = null;
                    }
                }, 2000); // Poll every 2 seconds
            }

            function updateTrainingProgress(status) {
                document.getElementById('status-text').textContent = status.status;
                document.getElementById('epoch-text').textContent = `${status.current_epoch}/${status.total_epochs}`;
                document.getElementById('loss-text').textContent = status.loss.toFixed(3);
                document.getElementById('map-text').textContent = status.mAP.toFixed(3);
                document.getElementById('message-text').textContent = status.message;
                
                const progressPercentage = status.total_epochs > 0 ? (status.current_epoch / status.total_epochs) * 100 : 0;
                document.getElementById('training-progress-bar').style.width = `${progressPercentage}%`;
                document.getElementById('training-progress-bar').textContent = `${progressPercentage.toFixed(0)}%`;
            }

            async function stopTraining() {
                if (trainingInterval) {
                    clearInterval(trainingInterval);
                    trainingInterval = null;
                }
                showStatus('training-status-display', 'Training stop requested. Please note that an ongoing YOLOv8 process might continue until its current epoch/batch is complete.', 'warning');
                // In a real scenario, you'd send a signal to the backend to stop the training process gracefully.
                // For simplicity here, we just update the UI status.
                document.getElementById('status-text').textContent = 'Stopping...';
            }

            // Testing functions
            async function handleTestImageUpload(event) {
                const file = event.target.files[0];
                if (file) {
                    currentTestImagePath = file.name;
                    document.getElementById('test-image-name').textContent = `Selected: ${file.name}`;
                    showStatus('test-results-display', `Test image selected: ${file.name}`, 'info');
                }
            }

            async function testModel() {
                const modelPath = document.getElementById('test-model-select').value;
                const confidence = document.getElementById('confidence-threshold').value;

                if (!modelPath) {
                    showStatus('test-results-display', 'Please select a trained model first.', 'error');
                    return;
                }
                if (!currentTestImagePath) {
                    showStatus('test-results-display', 'Please upload a test image first.', 'error');
                    return;
                }

                showStatus('test-results-display', 'Running model test...', 'info');
                document.getElementById('detection-results').innerHTML = '<strong>Detected Objects:</strong><p class="status-message info">Detecting...</p>';

                try {
                    const response = await fetch('/api/test-model', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model_path: modelPath,
                            test_image_path: currentTestImagePath,
                            confidence_threshold: parseFloat(confidence)
                        })
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        showStatus('test-results-display', `✅ ${result.message}`, 'success');
                        displayDetections(result.detections);
                    } else {
                        showStatus('test-results-display', `❌ Model testing failed: ${result.message}`, 'error');
                        document.getElementById('detection-results').innerHTML = '<strong>Detected Objects:</strong><p class="status-message error">Failed to get detections.</p>';
                    }
                } catch (error) {
                    showStatus('test-results-display', `❌ Error during model testing: ${error.message}`, 'error');
                    document.getElementById('detection-results').innerHTML = '<strong>Detected Objects:</strong><p class="status-message error">Failed to get detections.</p>';
                }
            }

            function displayDetections(detections) {
                const container = document.getElementById('detection-results');
                container.innerHTML = '<strong>Detected Objects:</strong>';
                
                if (detections.length === 0) {
                    container.innerHTML += '<p class="status-message warning">No objects detected.</p>';
                    return;
                }
                
                detections.forEach((detection, index) => {
                    const div = document.createElement('div');
                    div.className = 'file-item'; // Re-using file-item style for consistency
                    div.innerHTML = `
                        <span><strong>${detection.class_name}</strong> (Conf: ${(detection.confidence * 100).toFixed(1)}%)</span>
                        <span>[${detection.bbox.map(x => x.toFixed(0)).join(', ')}]</span>
                    `;
                    container.appendChild(div);
                });
            }

            async function loadTestModels() {
                try {
                    const response = await fetch('/api/models');
                    const models = await response.json();
                    
                    const select = document.getElementById('test-model-select');
                    select.innerHTML = '<option value="">Select a trained model...</option>';
                    
                    if (models.length === 0) {
                        select.innerHTML += '<option value="" disabled>No trained models found</option>';
                    } else {
                        models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model.path;
                            option.textContent = `${model.name} (${model.type}, ${(model.size / (1024 * 1024)).toFixed(2)} MB)`;
                            select.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Error loading models:', error);
                    showStatus('test-results-display', `Failed to load models: ${error.message}`, 'error');
                }
            }

            // Initialize on DOMContentLoaded
            document.addEventListener('DOMContentLoaded', function() {
                showTab('upload'); // Set initial active tab
                loadUploadedVideos(); // Load videos for the upload tab initially
            });
        </script>
    </body>
    </html>
    """

# API Endpoints
@app.post("/api/upload-video")
async def upload_video(file: UploadFile = File(...)):
    """Upload video to MinIO storage."""
    result = training_manager.upload_video(file)
    return JSONResponse(content=result.model_dump())

@app.get("/api/videos")
async def get_videos():
    """Get list of uploaded videos (local storage fallback)."""
    try:
        videos = []
        
        # Check local uploads directory first
        uploads_dir = Path("training/uploads")
        if uploads_dir.exists():
            for video_file in uploads_dir.glob("*"):
                if video_file.is_file():
                    videos.append({
                        "id": video_file.name,
                        "name": video_file.name.split('_', 1)[1] if '_' in video_file.name else video_file.name,
                        "size": video_file.stat().st_size,
                        "last_modified": datetime.fromtimestamp(video_file.stat().st_mtime).isoformat()
                    })
        
        # Try MinIO if available
        try:
            objects = minio_client.list_objects(MINIO_BUCKET, recursive=True)
            for obj in objects:
                videos.append({
                    "id": obj.object_name,
                    "name": obj.object_name.split('_', 1)[1] if '_' in obj.object_name else obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.isoformat()
                })
        except:
            pass  # MinIO not available, use local files only
        
        return JSONResponse(content=videos)
    except Exception as e:
        logger.error(f"❌ Error listing videos: {e}")
        return JSONResponse(content=[], status_code=500)

@app.post("/api/extract-frames")
async def extract_frames(request: FrameExtractionRequest):
    """Extract frames from video using MinIO storage."""
    result = training_manager.extract_frames(request)
    return JSONResponse(content=result)

@app.post("/api/start-training")
async def start_training(request: TrainingRequest):
    """Start YOLOv8 training."""
    result = training_manager.start_training(request)
    return JSONResponse(content=result)

@app.get("/api/training-status")
async def get_training_status():
    """Get current training status."""
    return JSONResponse(content=training_status.model_dump())

@app.post("/api/test-model")
async def test_model(request: TestRequest):
    """Test trained model."""
    result = training_manager.test_model(request)
    return JSONResponse(content=result)

@app.get("/api/models")
async def get_models():
    """Get available trained models."""
    models = training_manager.get_available_models()
    return JSONResponse(content=models)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "YOLOv8 Training UI"}

if __name__ == "__main__":
    print("🚀 Starting YOLOv8 Basketball Training UI...")
    print("📱 Open your browser and go to: http://localhost:8002")
    print("🏀 Ready for basketball object detection training!")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        log_level="info"
    )
