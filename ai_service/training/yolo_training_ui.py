#!/usr/bin/env python3
"""
YOLOv8 Basketball Training Web UI
================================

A comprehensive web interface for automating YOLOv8 basketball object detection training.
Includes frame extraction, annotation management, training, testing, and model validation.

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

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Pydantic models
class FrameExtractionRequest(BaseModel):
    video_path: str
    strategy: str = "uniform"
    interval: int = 30
    num_frames: int = 100
    motion_threshold: float = 0.1
    output_dir: str = "training/datasets/basketball/frames"
    areas: Optional[List[str]] = None

class BatchProcessingRequest(BaseModel):
    video_paths: List[str]
    strategy: str = "uniform"
    interval: int = 30
    num_frames: int = 100
    motion_threshold: float = 0.1
    output_dir: str = "training/datasets/basketball/batch_frames"
    parallel: bool = True
    max_workers: Optional[int] = None
    areas: Optional[List[str]] = None
    max_frames_per_area: int = 100

class TrainingRequest(BaseModel):
    epochs: int = 100
    batch_size: int = 8
    img_size: int = 640
    device: str = "cpu"
    data_yaml: str = "training/datasets/basketball/data.yaml"
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
    """Manages YOLOv8 training operations."""
    
    def __init__(self):
        self.base_dir = Path("training")
        self.datasets_dir = self.base_dir / "datasets" / "basketball"
        self.models_dir = self.base_dir / "models"
        self.runs_dir = self.base_dir / "runs"
        
        # Create directories
        for dir_path in [self.datasets_dir, self.models_dir, self.runs_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
            
        self.basketball_classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
    def extract_frames(self, request: FrameExtractionRequest) -> Dict[str, Any]:
        """Extract frames from video using the frame extraction script."""
        try:
            logger.info(f"🎬 Starting frame extraction: {request.video_path}")
            
            # Handle area-specific extraction
            if request.strategy == "area_specific":
                return self._extract_area_specific_frames(request)
            
            # Build command for regular extraction
            cmd = [
                "python", "training/extract_frames.py",
                "--input", request.video_path,
                "--output", request.output_dir,
                "--strategy", request.strategy
            ]
            
            if request.strategy == "uniform":
                cmd.extend(["--interval", str(request.interval)])
            elif request.strategy == "temporal":
                cmd.extend(["--num_frames", str(request.num_frames)])
            elif request.strategy == "motion":
                cmd.extend(["--motion_threshold", str(request.motion_threshold)])
                
            # Run extraction
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                # Count extracted frames
                frames_dir = Path(request.output_dir)
                frame_count = len(list(frames_dir.glob("*.jpg")))
                
                return {
                    "success": True,
                    "message": f"Successfully extracted {frame_count} frames",
                    "frame_count": frame_count,
                    "output_dir": request.output_dir
                }
            else:
                return {
                    "success": False,
                    "message": f"Frame extraction failed: {result.stderr}",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"❌ Frame extraction error: {e}")
            return {
                "success": False,
                "message": f"Frame extraction error: {str(e)}",
                "error": str(e)
            }
    
    def _extract_area_specific_frames(self, request: FrameExtractionRequest) -> Dict[str, Any]:
        """Extract frames specifically for each basketball area."""
        try:
            logger.info(f"🎯 Starting area-specific extraction for: {request.areas}")
            
            # Handle video path - if it's just a filename, try to find it
            video_path = request.video_path
            if not os.path.isabs(video_path) and not os.path.exists(video_path):
                # Try to find the video in common locations
                possible_paths = [
                    f"/home/okidi6/Videos/Dataset/{video_path}",
                    f"/home/okidi6/Videos/{video_path}",
                    f"/home/okidi6/Downloads/{video_path}",
                    f"./uploads/{video_path}"
                ]
                
                for path in possible_paths:
                    if os.path.exists(path):
                        video_path = path
                        logger.info(f"📹 Found video at: {video_path}")
                        break
                else:
                    return {
                        "success": False,
                        "message": f"Video file not found: {request.video_path}",
                        "error": "Video file not found"
                    }
            
            # Build command for area-specific extraction
            cmd = [
                "python", "training/area_specific_extraction.py",
                "--input", video_path,
                "--output", "training/datasets/basketball/area_frames"
            ]
            
            if request.areas:
                areas_str = ",".join(request.areas)
                cmd.extend(["--areas", areas_str])
            
            # Run area-specific extraction
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                # Count extracted frames for each area
                area_frames_dir = Path("training/datasets/basketball/area_frames")
                total_frames = 0
                area_breakdown = {}
                
                for area in request.areas or ["ball", "player", "court_lines", "hoop"]:
                    area_dir = area_frames_dir / area / "images"
                    if area_dir.exists():
                        frame_count = len(list(area_dir.glob("*.jpg")))
                        area_breakdown[area] = frame_count
                        total_frames += frame_count
                
                return {
                    "success": True,
                    "message": f"Successfully extracted {total_frames} area-specific frames",
                    "frame_count": total_frames,
                    "area_breakdown": area_breakdown,
                    "output_dir": str(area_frames_dir)
                }
            else:
                return {
                    "success": False,
                    "message": f"Area-specific extraction failed: {result.stderr}",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"❌ Area-specific extraction error: {e}")
            return {
                "success": False,
                "message": f"Area-specific extraction error: {str(e)}",
                "error": str(e)
            }
    
    def process_batch_videos(self, request: BatchProcessingRequest) -> Dict[str, Any]:
        """Process multiple videos in batch for frame extraction."""
        try:
            logger.info(f"📹 Starting batch processing for {len(request.video_paths)} videos")
            
            # Build command for batch processing
            cmd = ["python", "training/batch_video_processing.py"]
            
            # Add video paths
            for video_path in request.video_paths:
                cmd.extend(["--videos", video_path])
            
            cmd.extend([
                "--strategy", request.strategy,
                "--output", request.output_dir
            ])
            
            # Add parallel flag
            if request.parallel:
                cmd.append("--parallel")
                if request.max_workers:
                    cmd.extend(["--max-workers", str(request.max_workers)])
            
            # Add strategy-specific parameters
            if request.strategy == "uniform":
                cmd.extend(["--interval", str(request.interval)])
            elif request.strategy == "temporal":
                cmd.extend(["--num-frames", str(request.num_frames)])
            elif request.strategy == "motion":
                cmd.extend(["--motion-threshold", str(request.motion_threshold)])
            
            # Run batch processing
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                # Parse the batch report
                report_path = Path(request.output_dir) / "batch_report.json"
                if report_path.exists():
                    with open(report_path, 'r') as f:
                        report = json.load(f)
                    
                    return {
                        "success": True,
                        "message": f"Successfully processed {report.get('successful', 0)} videos",
                        "total_videos": report.get("total_videos", 0),
                        "successful": report.get("successful", 0),
                        "failed": report.get("failed", 0),
                        "total_frames": report.get("total_frames_extracted", 0),
                        "video_results": report.get("video_results", []),
                        "output_dir": request.output_dir
                    }
                else:
                    return {
                        "success": True,
                        "message": f"Batch processing completed",
                        "total_videos": len(request.video_paths),
                        "output_dir": request.output_dir
                    }
            else:
                return {
                    "success": False,
                    "message": f"Batch processing failed: {result.stderr}",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"❌ Batch processing error: {e}")
            return {
                "success": False,
                "message": f"Batch processing error: {str(e)}",
                "error": str(e)
            }
    
    def process_batch_area_specific(self, request: BatchProcessingRequest) -> Dict[str, Any]:
        """Process multiple videos for area-specific frame extraction."""
        try:
            logger.info(f"🎯 Starting area-specific batch processing for {len(request.video_paths)} videos")
            
            # Build command for batch area extraction
            cmd = ["python", "training/batch_area_extraction.py"]
            
            # Add video paths
            for video_path in request.video_paths:
                cmd.extend(["--videos", video_path])
            
            cmd.extend([
                "--output", request.output_dir
            ])
            
            # Add areas
            if request.areas:
                areas_str = ",".join(request.areas)
                cmd.extend(["--areas", areas_str])
            
            # Add parallel flag
            if request.parallel:
                cmd.append("--parallel")
                if request.max_workers:
                    cmd.extend(["--max-workers", str(request.max_workers)])
            
            # Add max frames per area
            cmd.extend(["--max-frames", str(request.max_frames_per_area)])
            
            # Run batch area extraction
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                # Parse the batch report
                report_path = Path(request.output_dir) / "batch_area_report.json"
                if report_path.exists():
                    with open(report_path, 'r') as f:
                        report = json.load(f)
                    
                    return {
                        "success": True,
                        "message": f"Successfully processed {report.get('successful', 0)} videos",
                        "total_videos": report.get("total_videos", 0),
                        "successful": report.get("successful", 0),
                        "failed": report.get("failed", 0),
                        "areas_requested": report.get("areas_requested", []),
                        "area_totals": report.get("area_totals", {}),
                        "total_frames": report.get("total_frames_extracted", 0),
                        "video_results": report.get("video_results", []),
                        "output_dir": request.output_dir
                    }
                else:
                    return {
                        "success": True,
                        "message": "Batch area-specific processing completed",
                        "total_videos": len(request.video_paths),
                        "output_dir": request.output_dir
                    }
            else:
                return {
                    "success": False,
                    "message": f"Batch area-specific processing failed: {result.stderr}",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"❌ Batch area-specific processing error: {e}")
            return {
                "success": False,
                "message": f"Batch area-specific processing error: {str(e)}",
                "error": str(e)
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
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .header p { font-size: 1.2em; opacity: 0.9; }
            .section { background: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .section h2 { color: #333; margin-bottom: 20px; font-size: 1.8em; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
            .form-group { margin-bottom: 20px; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; }
            .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #667eea; }
            .btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; transition: transform 0.2s; }
            .btn:hover { transform: translateY(-2px); }
            .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
            .btn-secondary { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); }
            .btn-success { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
            .btn-danger { background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%); }
            .btn-warning { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .card h3 { color: #333; margin-bottom: 15px; }
            .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s; }
            .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
            .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .status.info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            .status.warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #667eea; }
            .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; margin-top: 5px; }
            .log-container { background: #1e1e1e; color: #00ff00; padding: 20px; border-radius: 10px; font-family: 'Courier New', monospace; height: 300px; overflow-y: auto; margin: 20px 0; }
            .tabs { display: flex; border-bottom: 2px solid #ddd; margin-bottom: 20px; }
            .tab { padding: 15px 30px; cursor: pointer; border: none; background: none; font-size: 16px; font-weight: bold; color: #666; }
            .tab.active { color: #667eea; border-bottom: 3px solid #667eea; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .file-upload { border: 2px dashed #ddd; padding: 40px; text-align: center; border-radius: 10px; cursor: pointer; transition: border-color 0.3s; }
            .file-upload:hover { border-color: #667eea; }
            .file-upload.dragover { border-color: #667eea; background: #f8f9ff; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏀 YOLOv8 Basketball Training UI</h1>
                <p>Automated Basketball Object Detection Training Platform</p>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="showTab('extraction')">🎬 Frame Extraction</button>
                <button class="tab" onclick="showTab('annotation')">🏷️ Annotation</button>
                <button class="tab" onclick="showTab('training')">🏋️ Training</button>
                <button class="tab" onclick="showTab('testing')">🧪 Testing</button>
                <button class="tab" onclick="showTab('models')">📊 Models</button>
            </div>

            <!-- Frame Extraction Tab -->
            <div id="extraction" class="tab-content active">
                <div class="section">
                    <h2>🎬 Video Frame Extraction</h2>
                    <div class="grid">
                        <div class="card">
                            <h3>Upload Video(s)</h3>
                            <div class="file-upload" id="video-upload" onclick="document.getElementById('video-file').click()">
                                <p>📹 Click to upload basketball video(s)</p>
                                <p style="color: #666; font-size: 14px;">Supports MP4, AVI, MOV formats</p>
                                <p style="color: #888; font-size: 12px;">💡 Hold <strong>Ctrl</strong> (Windows/Linux) or <strong>Cmd</strong> (Mac) while clicking to select multiple videos</p>
                                <p style="color: #f39c12; font-size: 12px; font-weight: bold;">⚠️ IMPORTANT: Use Ctrl/Cmd + Click in the file dialog to select multiple files</p>
                            </div>
                            <input type="file" id="video-file" multiple accept="video/*" style="display: none;" onchange="handleVideoUpload(event)">
                            <div id="video-list" class="file-list"></div>
                            <div id="video-status" class="status" style="display: none;"></div>
                        </div>
                        <div class="card">
                            <h3>Extraction Settings</h3>
                            <div class="form-group">
                                <label>Extraction Strategy:</label>
                                <select id="extraction-strategy">
                                    <option value="uniform">Uniform (every N frames)</option>
                                    <option value="temporal">Temporal (evenly distributed)</option>
                                    <option value="motion">Motion-based</option>
                                    <option value="key_moments">Key Moments</option>
                                    <option value="area_specific">Area-Specific (Ball, Player, Court, Hoop)</option>
                                    <option value="all">All Strategies</option>
                                </select>
                            </div>
                            <div class="form-group" id="area-selection" style="display: none;">
                                <label>Basketball Areas to Extract:</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                                    <label><input type="checkbox" id="area-ball" checked> 🏀 Ball</label>
                                    <label><input type="checkbox" id="area-player" checked> 👤 Player</label>
                                    <label><input type="checkbox" id="area-court" checked> 📏 Court Lines</label>
                                    <label><input type="checkbox" id="area-hoop" checked> 🏀 Hoop</label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Frame Interval (for uniform):</label>
                                <input type="number" id="frame-interval" value="30" min="1" max="300">
                            </div>
                            <div class="form-group">
                                <label>Number of Frames (for temporal):</label>
                                <input type="number" id="num-frames" value="100" min="10" max="1000">
                            </div>
                            <button class="btn" onclick="extractFrames()">🎬 Extract Frames</button>
                        </div>
                    </div>
                    <div id="extraction-results" class="status" style="display: none;"></div>
                </div>
            </div>

            <!-- Annotation Tab -->
            <div id="annotation" class="tab-content">
                <div class="section">
                    <h2>🏷️ Dataset Annotation</h2>
                    <div class="grid">
                        <div class="card">
                            <h3>Dataset Statistics</h3>
                            <div id="dataset-stats">
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-number" id="total-frames">0</div>
                                        <div class="stat-label">Total Frames</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-number" id="annotated-frames">0</div>
                                        <div class="stat-label">Annotated Frames</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-number" id="annotation-rate">0%</div>
                                        <div class="stat-label">Annotation Rate</div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Class Distribution:</label>
                                    <div id="class-distribution"></div>
                                </div>
                            </div>
                            <button class="btn btn-secondary" onclick="refreshStats()">🔄 Refresh Stats</button>
                        </div>
                        <div class="card">
                            <h3>Annotation Tools</h3>
                            <p>Use these tools to annotate your extracted frames:</p>
                            <div style="margin: 20px 0;">
                                <button class="btn btn-success" onclick="openLabelImg()">🏷️ Open LabelImg</button>
                                <button class="btn btn-warning" onclick="createSplits()">📊 Create Dataset Splits</button>
                            </div>
                            <div class="form-group">
                                <label>Annotation Guidelines:</label>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li><strong>Ball (0):</strong> Tight bounding box around basketball</li>
                                    <li><strong>Player (1):</strong> Full body from head to feet</li>
                                    <li><strong>Court Lines (2):</strong> Key boundary lines</li>
                                    <li><strong>Hoop (3):</strong> Rim and backboard</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Training Tab -->
            <div id="training" class="tab-content">
                <div class="section">
                    <h2>🏋️ YOLOv8 Training</h2>
                    <div class="grid">
                        <div class="card">
                            <h3>Training Configuration</h3>
                            <div class="form-group">
                                <label>Epochs:</label>
                                <input type="number" id="epochs" value="100" min="1" max="1000">
                            </div>
                            <div class="form-group">
                                <label>Batch Size:</label>
                                <input type="number" id="batch-size" value="8" min="1" max="64">
                            </div>
                            <div class="form-group">
                                <label>Image Size:</label>
                                <input type="number" id="img-size" value="640" min="320" max="1280" step="32">
                            </div>
                            <div class="form-group">
                                <label>Device:</label>
                                <select id="device">
                                    <option value="cpu">CPU</option>
                                    <option value="cuda">GPU (CUDA)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Model Name:</label>
                                <input type="text" id="model-name" value="yolov8_basketball_detection">
                            </div>
                            <button class="btn btn-success" onclick="startTraining()">🚀 Start Training</button>
                            <button class="btn btn-danger" onclick="stopTraining()">⏹️ Stop Training</button>
                        </div>
                        <div class="card">
                            <h3>Training Progress</h3>
                            <div id="training-status">
                                <div class="status info">Ready to train</div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                            </div>
                            <div id="training-details">
                                <p><strong>Status:</strong> <span id="status-text">Idle</span></p>
                                <p><strong>Epoch:</strong> <span id="epoch-text">0/0</span></p>
                                <p><strong>Loss:</strong> <span id="loss-text">0.000</span></p>
                                <p><strong>mAP:</strong> <span id="map-text">0.000</span></p>
                                <p><strong>Message:</strong> <span id="message-text">Ready to train</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Testing Tab -->
            <div id="testing" class="tab-content">
                <div class="section">
                    <h2>🧪 Model Testing</h2>
                    <div class="grid">
                        <div class="card">
                            <h3>Test Configuration</h3>
                            <div class="form-group">
                                <label>Select Model:</label>
                                <select id="test-model">
                                    <option value="">Select a trained model...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Upload Test Image:</label>
                                <div class="file-upload" id="test-image-upload" onclick="document.getElementById('test-image-file').click()">
                                    <p>🖼️ Click to upload test image</p>
                                    <input type="file" id="test-image-file" accept="image/*" style="display: none;" onchange="handleTestImageUpload(event)">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Confidence Threshold:</label>
                                <input type="range" id="confidence-threshold" min="0.1" max="1.0" step="0.1" value="0.5">
                                <span id="confidence-value">0.5</span>
                            </div>
                            <button class="btn btn-warning" onclick="testModel()">🧪 Test Model</button>
                        </div>
                        <div class="card">
                            <h3>Test Results</h3>
                            <div id="test-results">
                                <div class="status info">No test results yet</div>
                            </div>
                            <div id="detection-results"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Models Tab -->
            <div id="models" class="tab-content">
                <div class="section">
                    <h2>📊 Model Management</h2>
                    <div class="grid">
                        <div class="card">
                            <h3>Available Models</h3>
                            <div id="models-list">
                                <div class="status info">Loading models...</div>
                            </div>
                            <button class="btn btn-secondary" onclick="refreshModels()">🔄 Refresh Models</button>
                        </div>
                        <div class="card">
                            <h3>Model Information</h3>
                            <div id="model-info">
                                <div class="status info">Select a model to view details</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentVideoPath = '';
            let currentTestImagePath = '';
            let currentBatchVideos = [];
            let currentVideoPaths = [];

            // Tab switching
            function showTab(tabName) {
                // Hide all tab contents
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Remove active class from all tabs
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show selected tab content
                document.getElementById(tabName).classList.add('active');
                
                // Add active class to clicked tab
                event.target.classList.add('active');
                
                // Load data for specific tabs
                if (tabName === 'annotation') {
                    refreshStats();
                } else if (tabName === 'models') {
                    refreshModels();
                } else if (tabName === 'testing') {
                    loadTestModels();
                }
            }

            // Video upload handling
            function handleVideoUpload(event) {
                const files = Array.from(event.target.files);
                
                console.log('Files selected:', files.length);
                console.log('File names:', files.map(f => f.name));
                
                if (files.length === 0) {
                    alert('No files selected. Please try again and make sure to select at least one file.');
                    return;
                } else if (files.length === 1) {
                    // Single video
                    currentVideoPath = files[0].name;
                    currentVideoPaths = [files[0].name];
                    showStatus('video-status', `Video selected: ${files[0].name}`, 'success');
                } else {
                    // Multiple videos - batch processing
                    currentVideoPaths = files.map(f => f.name);
                    currentBatchVideos = files.map(f => f.name);
                    currentVideoPath = files[0].name; // Keep first for compatibility
                    
                    const listDiv = document.getElementById('video-list');
                    if (listDiv) {
                        listDiv.innerHTML = '<strong>Selected Videos:</strong><br>';
                        
                        files.forEach((file, index) => {
                            listDiv.innerHTML += `${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)<br>`;
                        });
                    }
                    
                    showStatus('video-status', `${files.length} videos selected for batch processing`, 'success');
                }
            }
            
            // Test image upload handling
            function handleTestImageUpload(event) {
                const file = event.target.files[0];
                if (file) {
                    currentTestImagePath = file.name;
                    showStatus('test-results', `Test image selected: ${file.name}`, 'info');
                }
            }

            // Frame extraction
            async function extractFrames() {
                if (!currentVideoPath && currentVideoPaths.length === 0) {
                    showStatus('extraction-results', 'Please select video file(s) first', 'error');
                    return;
                }

                const strategy = document.getElementById('extraction-strategy').value;
                const interval = document.getElementById('frame-interval').value;
                const numFrames = document.getElementById('num-frames').value;
                
                // Check if batch processing (multiple videos)
                if (currentVideoPaths.length > 1) {
                    await extractFramesBatch();
                    return;
                }

                // Get selected areas for area-specific extraction
                let selectedAreas = [];
                if (strategy === 'area_specific') {
                    if (document.getElementById('area-ball').checked) selectedAreas.push('ball');
                    if (document.getElementById('area-player').checked) selectedAreas.push('player');
                    if (document.getElementById('area-court').checked) selectedAreas.push('court_lines');
                    if (document.getElementById('area-hoop').checked) selectedAreas.push('hoop');
                    
                    if (selectedAreas.length === 0) {
                        showStatus('extraction-results', 'Please select at least one basketball area', 'error');
                        return;
                    }
                }

                showStatus('extraction-results', 'Extracting frames...', 'info');

                try {
                    const requestBody = {
                        video_path: currentVideoPath,
                        strategy: strategy,
                        interval: parseInt(interval),
                        num_frames: parseInt(numFrames)
                    };

                    // Add areas for area-specific extraction
                    if (strategy === 'area_specific') {
                        requestBody.areas = selectedAreas;
                    }

                    const response = await fetch('/api/extract-frames', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        showStatus('extraction-results', result.message, 'success');
                    } else {
                        showStatus('extraction-results', result.message, 'error');
                    }
                } catch (error) {
                    showStatus('extraction-results', `Error: ${error.message}`, 'error');
                }
            }
            
            // Batch frame extraction
            async function extractFramesBatch() {
                const strategy = document.getElementById('extraction-strategy').value;
                const interval = document.getElementById('frame-interval').value;
                const numFrames = document.getElementById('num-frames').value;
                
                showStatus('extraction-results', `Processing ${currentVideoPaths.length} videos in batch...`, 'info');
                
                try {
                    const requestBody = {
                        video_paths: currentVideoPaths,
                        strategy: strategy,
                        interval: parseInt(interval),
                        num_frames: parseInt(numFrames),
                        parallel: true,
                        max_workers: 4,
                        output_dir: 'training/datasets/basketball/batch_frames'
                    };
                    
                    const response = await fetch('/api/batch-extract-frames', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        let message = `✅ Batch processing completed!\n`;
                        message += `Total Videos: ${result.total_videos}\n`;
                        message += `Successful: ${result.successful}\n`;
                        message += `Failed: ${result.failed || 0}\n`;
                        message += `Total Frames Extracted: ${result.total_frames || 0}`;
                        
                        if (result.video_results && result.video_results.length > 0) {
                            message += '\n\nPer-Video Results:';
                            result.video_results.forEach(r => {
                                message += `\n  ${r.video}: ${r.total_frames || 0} frames`;
                            });
                        }
                        
                        showStatus('extraction-results', message, 'success');
                    } else {
                        showStatus('extraction-results', result.message, 'error');
                    }
                } catch (error) {
                    showStatus('extraction-results', `Error: ${error.message}`, 'error');
                }
            }

            // Refresh dataset statistics
            async function refreshStats() {
                try {
                    const response = await fetch('/api/dataset-stats');
                    const stats = await response.json();
                    
                    document.getElementById('total-frames').textContent = stats.total_frames;
                    document.getElementById('annotated-frames').textContent = stats.annotated_frames;
                    document.getElementById('annotation-rate').textContent = 
                        stats.total_frames > 0 ? Math.round((stats.annotated_frames / stats.total_frames) * 100) + '%' : '0%';
                    
                    // Update class distribution
                    const classDist = document.getElementById('class-distribution');
                    classDist.innerHTML = '';
                    for (const [className, count] of Object.entries(stats.class_distribution)) {
                        const div = document.createElement('div');
                        div.innerHTML = `<strong>${className}:</strong> ${count} annotations`;
                        classDist.appendChild(div);
                    }
                } catch (error) {
                    console.error('Error refreshing stats:', error);
                }
            }

            // Create dataset splits
            async function createSplits() {
                try {
                    const response = await fetch('/api/create-splits', { method: 'POST' });
                    const result = await response.json();
                    
                    if (result.success) {
                        showStatus('extraction-results', result.message, 'success');
                        refreshStats();
                    } else {
                        showStatus('extraction-results', result.message, 'error');
                    }
                } catch (error) {
                    showStatus('extraction-results', `Error: ${error.message}`, 'error');
                }
            }

            // Start training
            async function startTraining() {
                const epochs = document.getElementById('epochs').value;
                const batchSize = document.getElementById('batch-size').value;
                const imgSize = document.getElementById('img-size').value;
                const device = document.getElementById('device').value;
                const modelName = document.getElementById('model-name').value;

                try {
                    const response = await fetch('/api/start-training', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            epochs: parseInt(epochs),
                            batch_size: parseInt(batchSize),
                            img_size: parseInt(imgSize),
                            device: device,
                            model_name: modelName
                        })
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        showStatus('training-status', result.message, 'success');
                        startTrainingMonitor();
                    } else {
                        showStatus('training-status', result.message, 'error');
                    }
                } catch (error) {
                    showStatus('training-status', `Error: ${error.message}`, 'error');
                }
            }

            // Monitor training progress
            function startTrainingMonitor() {
                const interval = setInterval(async () => {
                    try {
                        const response = await fetch('/api/training-status');
                        const status = await response.json();
                        
                        updateTrainingProgress(status);
                        
                        if (status.status === 'completed' || status.status === 'failed') {
                            clearInterval(interval);
                        }
                    } catch (error) {
                        console.error('Error monitoring training:', error);
                    }
                }, 2000);
            }

            // Update training progress display
            function updateTrainingProgress(status) {
                document.getElementById('status-text').textContent = status.status;
                document.getElementById('epoch-text').textContent = `${status.current_epoch}/${status.total_epochs}`;
                document.getElementById('loss-text').textContent = status.loss.toFixed(3);
                document.getElementById('map-text').textContent = status.mAP.toFixed(3);
                document.getElementById('message-text').textContent = status.message;
                
                const progressFill = document.getElementById('progress-fill');
                progressFill.style.width = status.progress + '%';
                
                const statusDiv = document.getElementById('training-status');
                statusDiv.className = `status ${status.status === 'completed' ? 'success' : status.status === 'failed' ? 'error' : 'info'}`;
                statusDiv.textContent = status.message;
            }

            // Test model
            async function testModel() {
                const modelPath = document.getElementById('test-model').value;
                const confidence = document.getElementById('confidence-threshold').value;

                if (!modelPath || !currentTestImagePath) {
                    showStatus('test-results', 'Please select both model and test image', 'error');
                    return;
                }

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
                        showStatus('test-results', result.message, 'success');
                        displayDetections(result.detections);
                    } else {
                        showStatus('test-results', result.message, 'error');
                    }
                } catch (error) {
                    showStatus('test-results', `Error: ${error.message}`, 'error');
                }
            }

            // Display detection results
            function displayDetections(detections) {
                const container = document.getElementById('detection-results');
                container.innerHTML = '';
                
                if (detections.length === 0) {
                    container.innerHTML = '<div class="status warning">No objects detected</div>';
                    return;
                }
                
                detections.forEach((detection, index) => {
                    const div = document.createElement('div');
                    div.className = 'card';
                    div.innerHTML = `
                        <h4>Detection ${index + 1}</h4>
                        <p><strong>Class:</strong> ${detection.class_name}</p>
                        <p><strong>Confidence:</strong> ${(detection.confidence * 100).toFixed(1)}%</p>
                        <p><strong>Bounding Box:</strong> [${detection.bbox.map(x => x.toFixed(2)).join(', ')}]</p>
                    `;
                    container.appendChild(div);
                });
            }

            // Load available models for testing
            async function loadTestModels() {
                try {
                    const response = await fetch('/api/models');
                    const models = await response.json();
                    
                    const select = document.getElementById('test-model');
                    select.innerHTML = '<option value="">Select a trained model...</option>';
                    
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.path;
                        option.textContent = `${model.name} (${model.type})`;
                        select.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading models:', error);
                }
            }

            // Refresh models list
            async function refreshModels() {
                try {
                    const response = await fetch('/api/models');
                    const models = await response.json();
                    
                    const container = document.getElementById('models-list');
                    container.innerHTML = '';
                    
                    if (models.length === 0) {
                        container.innerHTML = '<div class="status warning">No trained models found</div>';
                        return;
                    }
                    
                    models.forEach(model => {
                        const div = document.createElement('div');
                        div.className = 'card';
                        div.innerHTML = `
                            <h4>${model.name}</h4>
                            <p><strong>Type:</strong> ${model.type}</p>
                            <p><strong>Size:</strong> ${(model.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p><strong>Created:</strong> ${new Date(model.created).toLocaleString()}</p>
                        `;
                        container.appendChild(div);
                    });
                } catch (error) {
                    console.error('Error refreshing models:', error);
                }
            }

            // Open LabelImg
            function openLabelImg() {
                window.open('https://github.com/tzutalin/labelImg', '_blank');
            }

            // Stop training
            function stopTraining() {
                showStatus('training-status', 'Training stop requested', 'warning');
            }

            // Utility function to show status messages
            function showStatus(elementId, message, type) {
                const element = document.getElementById(elementId);
                element.className = `status ${type}`;
                element.textContent = message;
                element.style.display = 'block';
            }

            // Update confidence threshold display
            document.getElementById('confidence-threshold').addEventListener('input', function() {
                document.getElementById('confidence-value').textContent = this.value;
            });

            // Show/hide area selection based on extraction strategy
            document.getElementById('extraction-strategy').addEventListener('change', function() {
                const areaSelection = document.getElementById('area-selection');
                if (this.value === 'area_specific') {
                    areaSelection.style.display = 'block';
                } else {
                    areaSelection.style.display = 'none';
                }
            });

            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                refreshStats();
                refreshModels();
                loadTestModels();
            });
        </script>
    </body>
    </html>
    """

# API Endpoints
@app.post("/api/extract-frames")
async def extract_frames(request: FrameExtractionRequest):
    """Extract frames from video."""
    result = training_manager.extract_frames(request)
    return JSONResponse(content=result)

@app.post("/api/batch-extract-frames")
async def batch_extract_frames(request: BatchProcessingRequest):
    """Process multiple videos in batch."""
    if request.areas:
        result = training_manager.process_batch_area_specific(request)
    else:
        result = training_manager.process_batch_videos(request)
    return JSONResponse(content=result)

@app.get("/api/dataset-stats")
async def get_dataset_stats():
    """Get dataset statistics."""
    stats = training_manager.get_dataset_stats()
    return JSONResponse(content=stats.model_dump())

@app.post("/api/create-splits")
async def create_splits():
    """Create dataset splits."""
    result = training_manager.create_dataset_splits()
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
