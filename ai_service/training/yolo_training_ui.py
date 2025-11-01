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

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from minio import Minio
from minio.error import S3Error

try:
    from PIL import Image
except ImportError:
    logging.error("❌ 'Pillow' library not found. Please install it: pip install Pillow")
    # Exit is not good in a FastAPI app, so we'll log and handle gracefully
    Image = None

try:
    import imagehash
except ImportError:
    logging.error("❌ 'imagehash' library not found. Please install it: pip install imagehash")
    # Exit is not good in a FastAPI app, so we'll log and handle gracefully
    imagehash = None

try:
    import cv2
    import numpy as np
except ImportError:
    logging.error("❌ 'opencv-python' library not found. Please install it: pip install opencv-python")
    # Exit is not good in a FastAPI app, so we'll log and handle gracefully
    cv2 = None
    np = None

# Pydantic Models
class TrainingConfig(BaseModel):
    model_name: str = Field("yolov8n.pt", description="Base YOLOv8 model to use for training (e.g., yolov8n.pt, yolov8s.pt)")
    epochs: int = Field(50, description="Number of training epochs")
    batch_size: int = Field(16, description="Batch size for training")
    img_size: int = Field(640, description="Image size for training and inference")
    data_yaml_path: str = Field("datasets/basketball/basketball_data.yaml", description="Path to the data.yaml file")
    patience: int = Field(50, description="Epochs to wait for no improvement before stopping early")
    project_name: str = Field("yolov8_basketball", description="Name of the training project")

class VideoUploadResponse(BaseModel):
    success: bool
    message: str
    video_id: Optional[str] = None
    video_url: Optional[str] = None
    area_tag: Optional[str] = None

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

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MinIO Configuration
MINIO_ENDPOINT = "localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
MINIO_BUCKET = "basketball-videos" # Reintroduced global MinIO bucket

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

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
    allow_origins=["*"],  # Adjust as needed for security in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
# Original static directory for index.html and other UI assets
static_dir = Path(__file__).parent / "static"
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

        # Ensure the single global MinIO bucket exists on startup
        self._ensure_bucket_exists(MINIO_BUCKET)
    
    def _ensure_bucket_exists(self, bucket_name: str):
        """Ensure the MinIO bucket exists."""
        try:
            if not minio_client.bucket_exists(bucket_name):
                minio_client.make_bucket(bucket_name)
                logger.info(f"✅ Created MinIO bucket: {bucket_name}")
            else:
                logger.info(f"✅ MinIO bucket exists: {bucket_name}")
        except Exception as e:
            logger.warning(f"⚠️ MinIO not available: {e}")
            logger.warning("App will work in local mode without MinIO storage")
    
    def upload_video(self, file: UploadFile, area_tag: Optional[str] = None) -> VideoUploadResponse:
        """Upload video to MinIO storage."""
        # Ensure the main bucket exists (done in __init__)
        
        # If no area_tag, default to 'unspecified'
        effective_area_tag = area_tag if area_tag else "unspecified"
        
        try:
            # Generate unique video ID (just filename portion)
            video_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
            
            # MinIO object name will be {area_tag}/{video_filename}
            minio_object_name = f"{effective_area_tag}/{video_filename}"
            
            # Full video ID for UI will be {area_tag}/{video_filename}
            full_video_id = minio_object_name

            # Create local uploads directory for this area_tag within the main bucket structure
            uploads_dir_for_area = self.base_dir / "uploads" / MINIO_BUCKET / effective_area_tag
            uploads_dir_for_area.mkdir(parents=True, exist_ok=True)
            
            # Save file locally
            local_video_path = uploads_dir_for_area / video_filename
            file.file.seek(0) # Ensure file pointer is at the beginning for local save
            with open(local_video_path, "wb") as buffer:
                content = file.file.read()
                buffer.write(content)
            
            logger.info(f"✅ Video uploaded locally to {MINIO_BUCKET}/{minio_object_name}")
            
            # Upload to MinIO
            try:
                file.file.seek(0) # Reset file pointer for MinIO upload again
                minio_client.put_object(MINIO_BUCKET, minio_object_name, file.file, length=-1, part_size=10*1024*1024)
                logger.info(f"✅ Video uploaded to MinIO: {MINIO_BUCKET}/{minio_object_name}")
                video_url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{minio_object_name}"
            except Exception as minio_e:
                logger.warning(f"⚠️ MinIO upload failed for {MINIO_BUCKET}/{minio_object_name}: {minio_e}. Video remains in local storage only.")
                video_url = f"file://{local_video_path}"

            return VideoUploadResponse(
                success=True,
                message=f"Video uploaded successfully to {effective_area_tag}: {file.filename}",
                video_id=full_video_id,
                video_url=video_url,
                area_tag=effective_area_tag
            )
            
        except Exception as e:
            logger.error(f"❌ Video upload error: {e}")
            return VideoUploadResponse(
                success=False,
                message=f"Video upload failed: {str(e)}"
            )
    
    def download_video_from_minio(self, bucket_name: str, video_id: str) -> str:
        """Get video path (local storage fallback)."""
        # video_id is now expected to be in format 'area_tag/video_filename'
        parts = video_id.split('/', 1)
        if len(parts) == 2:
            area_tag = parts[0]
            video_filename = parts[1]
        else:
            # Fallback for old format or if area_tag is not present in video_id
            area_tag = "unspecified"
            video_filename = video_id

        # Use the global MINIO_BUCKET
        effective_bucket = MINIO_BUCKET

        try:
            # Check local uploads directory first
            uploads_dir = self.base_dir / "uploads" / effective_bucket / area_tag
            local_video_path = uploads_dir / video_filename
            
            if local_video_path.exists():
                logger.info(f"✅ Video found locally: {effective_bucket}/{area_tag}/{video_filename}")
                return str(local_video_path)
            
            # Try MinIO if available
            minio_object_name = f"{area_tag}/{video_filename}"
            try:
                temp_video_path = self.temp_dir / video_filename # Use only filename for temp storage
                minio_client.fget_object(effective_bucket, minio_object_name, str(temp_video_path))
                logger.info(f"✅ Video downloaded from MinIO: {effective_bucket}/{minio_object_name}")
                return str(temp_video_path)
            except S3Error as e:
                raise FileNotFoundError(f"Video not found in MinIO {effective_bucket}/{minio_object_name}: {e.code}")
            except Exception as e:
                raise FileNotFoundError(f"Video not found: {effective_bucket}/{minio_object_name}: {e}")
            
        except Exception as e:
            logger.error(f"❌ Video download error for {video_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to download video {video_id}: {str(e)}")
    
    def extract_frames(self, request: FrameExtractionRequest) -> Dict[str, Any]:
        """Extract frames from multiple videos using MinIO storage."""
        all_extraction_results = []
        overall_success = True
        overall_message = ""
        
        for video_id in request.video_ids:
            try:
                logger.info(f"🎬 Starting frame extraction for video: {video_id}")
                
                # The video_id is now in the format area_tag/video_filename
                # We need to extract the area_tag and video_filename for correct MinIO pathing
                parts = video_id.split('/', 1)
                if len(parts) == 2:
                    area_tag = parts[0]
                    actual_video_id = parts[1] # This is the video_filename
                else:
                    # Fallback if not in expected format, treat entire video_id as filename
                    area_tag = "unspecified" # Default area tag
                    actual_video_id = video_id

                # Download video from MinIO
                # Pass the global MINIO_BUCKET and the parsed video_id (which is area_tag/video_filename)
                video_path = self.download_video_from_minio(MINIO_BUCKET, video_id)
                
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
    
    def start_training(self, config: TrainingConfig):
        """Initiate the training process in a separate thread."""
        if self.training_thread and self.training_thread.is_alive():
            logger.warning("⚠️ Training is already in progress.")
            return {"success": False, "message": "Training already in progress.", "status": self.get_training_status()}

        logger.info(f"Starting training with config: {config.model_dump()}")
        
        # Reset training status
        global training_status
        training_status.status = "running"
        training_status.progress = 0.0
        training_status.current_epoch = 0
        training_status.total_epochs = config.epochs
        training_status.loss = 0.0
        training_status.mAP = 0.0
        training_status.message = "Initializing training..."
        training_status.start_time = datetime.now().isoformat()
        training_status.estimated_completion = "Calculating..."

        self.training_thread = threading.Thread(
            target=self._run_training,
            args=(config.model_name, config.data_yaml_path, config.epochs, config.batch_size, config.img_size, config.patience, config.project_name)
        )
        self.training_thread.start()
        logger.info("Training thread started.")
    
    def _run_training(self, model_name, data_yaml, epochs, batch_size, img_size, patience, project_name):
        """Run YOLOv8 training (background thread)."""
        global training_status
        try:
            training_status.status = "training"
            training_status.message = "Training in progress..."
            
            # Build training command
            cmd = [
                "python", "training/train_basketball_yolo.py",
                "--epochs", str(epochs),
                "--batch_size", str(batch_size),
                "--img_size", str(img_size),
                "--device", "cpu",
                "--data_yaml", data_yaml,
                "--name", model_name
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

# Initialize training manager
training_manager = YOLOTrainingManager()

# Mount the frames directory specifically after training_manager is initialized
app.mount("/frames", StaticFiles(directory=str(training_manager.base_dir / "datasets" / "basketball" / "area_frames")), name="frames")            

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

    def delete_videos_by_area(self, area_tag: str) -> Dict[str, Any]:
        """Delete videos from MinIO and local storage based on area tag (folder prefix)."""
        deleted_count = 0
        errors = []
        
        effective_area_tag = area_tag if area_tag else "unspecified"
        minio_prefix = f"{effective_area_tag}/"

        # Delete from local storage
        uploads_dir_for_area = self.base_dir / "uploads" / MINIO_BUCKET / effective_area_tag
        if uploads_dir_for_area.exists():
            for video_file in uploads_dir_for_area.glob("*"):
                if video_file.is_file():
                    try:
                        os.remove(video_file)
                        deleted_count += 1
                        logger.info(f"🗑️ Deleted local video: {video_file.name} from {MINIO_BUCKET}/{effective_area_tag}")
                    except Exception as e:
                        errors.append(f"Failed to delete local video {video_file.name}: {str(e)}")
                        logger.error(f"❌ Error deleting local video {video_file.name}: {e}")
            
            # Attempt to remove the local area_tag directory if it's empty
            try:
                if not any(uploads_dir_for_area.iterdir()): 
                    shutil.rmtree(uploads_dir_for_area)
                    logger.info(f"🗑️ Deleted empty local folder: {uploads_dir_for_area}")
            except Exception as e:
                errors.append(f"Failed to remove local area folder {uploads_dir_for_area}: {str(e)}")
                logger.error(f"❌ Error removing local area folder {uploads_dir_for_area}: {e}")

        # Delete from MinIO
        try:
            objects_to_delete = minio_client.list_objects(MINIO_BUCKET, prefix=minio_prefix, recursive=True)
            for obj in objects_to_delete:
                try:
                    minio_client.remove_object(MINIO_BUCKET, obj.object_name)
                    deleted_count += 1
                    logger.info(f"🗑️ Deleted MinIO object: {MINIO_BUCKET}/{obj.object_name}")
                except S3Error as e:
                    errors.append(f"Failed to delete MinIO object {MINIO_BUCKET}/{obj.object_name}: {e.code}")
                    logger.error(f"❌ Error deleting MinIO object {MINIO_BUCKET}/{obj.object_name}: {e}")
        except S3Error as e:
            errors.append(f"Failed to list MinIO objects in bucket {MINIO_BUCKET} with prefix {minio_prefix}: {e.code}")
            logger.error(f"❌ Error listing MinIO objects in bucket {MINIO_BUCKET} with prefix {minio_prefix}: {e}")
        except Exception as e:
            errors.append(f"Generic error listing MinIO objects in bucket {MINIO_BUCKET} with prefix {minio_prefix}: {str(e)}")
            logger.error(f"❌ Generic error listing MinIO objects in bucket {MINIO_BUCKET} with prefix {minio_prefix}: {e}")
            
        if not errors:
            return {"success": True, "message": f"Successfully deleted {deleted_count} videos from area tag '{area_tag}'."}
        else:
            return {"success": False, "message": f"Deleted {deleted_count} videos, but encountered errors: {', '.join(errors)}", "errors": errors}

    def get_uploaded_videos(self, area_tag: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get list of uploaded videos from MinIO and local storage, with optional area tag filter."""
        videos = []
        unique_video_ids = set()

        minio_prefix = f"{area_tag}/" if area_tag else ""

        # Fetch from MinIO
        try:
            objects = minio_client.list_objects(MINIO_BUCKET, prefix=minio_prefix, recursive=True)
            for obj in objects:
                # Object name is expected to be 'area_tag/video_filename'
                parts = obj.object_name.split('/', 1)
                if len(parts) == 2:
                    current_area_tag = parts[0]
                    video_filename = parts[1]
                else:
                    current_area_tag = "unspecified" # Fallback if no area tag in path
                    video_filename = obj.object_name

                full_video_id_with_path = f"{current_area_tag}/{video_filename}"

                if full_video_id_with_path not in unique_video_ids:
                    videos.append({
                        "id": full_video_id_with_path, # Store as area_tag/video_filename
                        "name": video_filename, # Display just the filename
                        "size": obj.size,
                        "last_modified": obj.last_modified.isoformat(),
                        "area_tag": current_area_tag
                    })
                    unique_video_ids.add(full_video_id_with_path)
        except S3Error as e:
            if e.code == "NoSuchBucket":
                logger.info(f"MinIO bucket '{MINIO_BUCKET}' does not exist.")
            else:
                logger.error(f"❌ Error listing MinIO objects in bucket {MINIO_BUCKET}: {e}")
        except Exception as e:
            logger.error(f"❌ Generic error listing MinIO objects in bucket {MINIO_BUCKET}: {e}")

        # Fetch from local storage
        local_base_dir = self.base_dir / "uploads" / MINIO_BUCKET
        if local_base_dir.exists():
            # Iterate through area_tag subdirectories or directly in base if no area_tag filter
            if area_tag:
                local_area_dir = local_base_dir / area_tag
                if local_area_dir.exists():
                    self._add_local_videos_from_dir(local_area_dir, area_tag, videos, unique_video_ids)
            else:
                for sub_dir in local_base_dir.iterdir():
                    if sub_dir.is_dir():
                        self._add_local_videos_from_dir(sub_dir, sub_dir.name, videos, unique_video_ids)
                    elif sub_dir.is_file(): # Handle files directly in MINIO_BUCKET if they exist (unspecified)
                        video_id = sub_dir.name
                        video_name = video_id.split('_', 1)[1] if '_' in video_id else video_id
                        full_video_id_with_path = f"unspecified/{video_id}" # Default to unspecified

                        if full_video_id_with_path not in unique_video_ids:
                            videos.append({
                                "id": full_video_id_with_path,
                                "name": video_name,
                                "size": sub_dir.stat().st_size,
                                "last_modified": datetime.fromtimestamp(sub_dir.stat().st_mtime).isoformat(),
                                "area_tag": "unspecified"
                            })
                            unique_video_ids.add(full_video_id_with_path)
        
        return videos

    def _add_local_videos_from_dir(self, directory: Path, area_tag: str, videos: List[Dict[str, Any]], unique_video_ids: set):
        """Helper to add videos from a local directory to the list."""
        for video_file in directory.glob("*"):
            if video_file.is_file():
                video_id = video_file.name
                video_name = video_id.split('_', 1)[1] if '_' in video_id else video_id
                full_video_id_with_path = f"{area_tag}/{video_id}"

                if full_video_id_with_path not in unique_video_ids:
                    videos.append({
                        "id": full_video_id_with_path,
                        "name": video_name,
                        "size": video_file.stat().st_size,
                        "last_modified": datetime.fromtimestamp(video_file.stat().st_mtime).isoformat(),
                        "area_tag": area_tag
                    })
                    unique_video_ids.add(full_video_id_with_path)

    def get_minio_bucket_names(self) -> List[str]:
        """Get list of unique area tags (folder prefixes) from the main MinIO bucket."""
        area_tags = set()
        try:
            objects = minio_client.list_objects(MINIO_BUCKET, recursive=True, prefix="") # List all objects
            for obj in objects:
                if '/' in obj.object_name:
                    area_tags.add(obj.object_name.split('/')[0])
                else:
                    # Objects directly in the bucket with no prefix are 'unspecified'
                    area_tags.add("unspecified")
            
            # Also check local storage for area tags
            local_base_dir = self.base_dir / "uploads" / MINIO_BUCKET
            if local_base_dir.exists():
                for sub_dir in local_base_dir.iterdir():
                    if sub_dir.is_dir():
                        area_tags.add(sub_dir.name)
                    elif sub_dir.is_file():
                        area_tags.add("unspecified")

            return sorted(list(area_tags))
        except S3Error as e:
            if e.code == "NoSuchBucket":
                logger.info(f"MinIO bucket '{MINIO_BUCKET}' does not exist.")
                # Still try to get local tags even if MinIO bucket is missing
                local_tags = set()
                local_base_dir = self.base_dir / "uploads" / MINIO_BUCKET
                if local_base_dir.exists():
                    for sub_dir in local_base_dir.iterdir():
                        if sub_dir.is_dir():
                            local_tags.add(sub_dir.name)
                        elif sub_dir.is_file():
                            local_tags.add("unspecified")
                return sorted(list(local_tags))
            else:
                logger.error(f"❌ Error listing MinIO objects in bucket {MINIO_BUCKET}: {e}")
                return []
        except Exception as e:
            logger.error(f"❌ Generic error listing MinIO area tags: {e}")
            return []

    def find_and_remove_duplicates_from_area(self, area_tag: str, hash_size: int = 8, tolerance: int = 5, delete_duplicates: bool = True) -> Dict[str, Any]:
        """Finds and optionally removes duplicate images from a specific area_tag using perceptual hashing."""
        if Image is None or imagehash is None:
            return {"success": False, "message": "Pillow or imagehash library not installed. Cannot perform duplicate cleaning."}

        effective_area_tag = area_tag if area_tag else "unspecified"
        input_dir = self.base_dir / "datasets" / "basketball" / "area_frames" / effective_area_tag / "images"
        
        if not input_dir.is_dir():
            return {"success": False, "message": f"Input directory for area '{effective_area_tag}' not found: {input_dir}"}

        logger.info(f"🔍 Scanning {input_dir} for duplicate frames (Hash Size: {hash_size}, Tolerance: {tolerance})...")

        hashes = {}
        duplicates_found = []
        images_processed = 0
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

        for img_path in input_dir.iterdir():
            if img_path.is_file() and img_path.suffix.lower() in image_extensions:
                images_processed += 1
                try:
                    img = Image.open(img_path)
                    current_hash = imagehash.average_hash(img, hash_size=hash_size)
                    
                    is_duplicate = False
                    for existing_hash, original_path in hashes.items():
                        if abs(current_hash - existing_hash) <= tolerance:
                            is_duplicate = True
                            duplicates_found.append({"duplicate": str(img_path), "original": str(original_path), "hash_diff": abs(current_hash - existing_hash)})
                            logger.info(f"  ⚠️ Duplicate found: {img_path.name} is similar to {original_path.name} (Diff: {abs(current_hash - existing_hash)}) ")
                            if delete_duplicates:
                                os.remove(img_path)
                                logger.info(f"  🗑️ Deleted duplicate: {img_path.name}")
                            break
                    
                    if not is_duplicate:
                        hashes[current_hash] = img_path

                except Exception as e:
                    logger.warning(f"Skipping {img_path.name} due to error: {e}")

        logger.info(f"✅ Finished scanning. Processed {images_processed} images.")
        logger.info(f"Found {len(duplicates_found)} near-duplicate frames.")
        if delete_duplicates:
            logger.info(f"Deleted {len(duplicates_found)} duplicate frames.")

        return {
            "success": True,
            "total_images_processed": images_processed,
            "duplicates_found": len(duplicates_found),
            "duplicates_deleted": len(duplicates_found) if delete_duplicates else 0,
            "details": duplicates_found,
            "message": f"Duplicate frame detection and removal completed for area '{effective_area_tag}'."
        }

    def find_and_remove_blurry_frames_from_area(self, area_tag: str, threshold: float = 100.0, delete_blurry: bool = True) -> Dict[str, Any]:
        """Finds and optionally removes blurry images from a specific area_tag using Laplacian variance."""
        if cv2 is None or np is None:
            return {"success": False, "message": "opencv-python or numpy library not installed. Cannot perform blur cleaning."}

        effective_area_tag = area_tag if area_tag else "unspecified"
        input_dir = self.base_dir / "datasets" / "basketball" / "area_frames" / effective_area_tag / "images"
        
        if not input_dir.is_dir():
            return {"success": False, "message": f"Input directory for area '{effective_area_tag}' not found: {input_dir}"}

        logger.info(f"🔍 Scanning {input_dir} for blurry frames (Threshold: {threshold})...")

        blurry_frames_found = []
        images_processed = 0
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

        for img_path in input_dir.iterdir():
            if img_path.is_file() and img_path.suffix.lower() in image_extensions:
                images_processed += 1
                try:
                    img = cv2.imread(str(img_path))
                    if img is None:
                        logger.warning(f"Skipping {img_path.name}: Could not read image.")
                        continue

                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    fm = cv2.Laplacian(gray, cv2.CV_64F).var()
                    
                    if fm < threshold:
                        blurry_frames_found.append({"path": str(img_path), "laplacian_variance": fm})
                        logger.info(f"  ⚠️ Blurry frame found: {img_path.name} (Laplacian Variance: {fm:.2f}) ")
                        if delete_blurry:
                            os.remove(img_path)
                            logger.info(f"  🗑️ Deleted blurry frame: {img_path.name}")

                except Exception as e:
                    logger.warning(f"Skipping {img_path.name} due to error: {e}")

        logger.info(f"✅ Finished scanning. Processed {images_processed} images.")
        logger.info(f"Found {len(blurry_frames_found)} blurry frames.")
        if delete_blurry:
            logger.info(f"Deleted {len(blurry_frames_found)} blurry frames.")

        return {
            "success": True,
            "total_images_processed": images_processed,
            "blurry_frames_found": len(blurry_frames_found),
            "blurry_frames_deleted": len(blurry_frames_found) if delete_blurry else 0,
            "details": blurry_frames_found,
            "message": f"Blurry frame detection and removal completed for area '{effective_area_tag}'."
        }

    def find_and_remove_empty_labels_from_area(self, area_tag: str, delete_files: bool = True) -> Dict[str, Any]:
        """Finds and optionally removes images and their empty label files for a specific area_tag."""
        effective_area_tag = area_tag if area_tag else "unspecified"
        input_images_dir = self.base_dir / "datasets" / "basketball" / "area_frames" / effective_area_tag / "images"
        input_labels_dir = self.base_dir / "datasets" / "basketball" / "area_frames" / effective_area_tag / "labels"
        
        if not input_images_dir.is_dir():
            return {"success": False, "message": f"Input images directory for area '{effective_area_tag}' not found: {input_images_dir}"}
        if not input_labels_dir.is_dir():
            return {"success": False, "message": f"Input labels directory for area '{effective_area_tag}' not found: {input_labels_dir}"}

        logger.info(f"🔍 Scanning {input_labels_dir} for empty label files for area '{effective_area_tag}'...")

        empty_labels_found = []
        files_processed = 0
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

        for label_path in input_labels_dir.glob("*.txt"):
            files_processed += 1
            try:
                if label_path.stat().st_size == 0: # Check if file is empty
                    empty_labels_found.append(str(label_path))
                    logger.info(f"  ⚠️ Empty label found: {label_path.name}")
                    
                    if delete_files:
                        os.remove(label_path)
                        logger.info(f"  🗑️ Deleted empty label file: {label_path.name}")

                        image_stem = label_path.stem
                        deleted_image = False
                        for ext in image_extensions:
                            image_path = input_images_dir / f"{image_stem}{ext}"
                            if image_path.is_file():
                                os.remove(image_path)
                                logger.info(f"  🗑️ Deleted corresponding image: {image_path.name}")
                                deleted_image = True
                                break
                        if not deleted_image:
                            logger.warning(f"  Could not find corresponding image for {label_path.name} in {input_images_dir}")

            except Exception as e:
                logger.warning(f"Skipping {label_path.name} due to error: {e}")

        logger.info(f"✅ Finished scanning. Processed {files_processed} label files.")
        logger.info(f"Found and {('deleted' if delete_files else 'reported')} {len(empty_labels_found)} empty label files and their images for area '{effective_area_tag}'.")

        return {
            "success": True,
            "total_label_files_processed": files_processed,
            "empty_labels_found": len(empty_labels_found),
            "empty_labels_deleted": len(empty_labels_found) if delete_files else 0,
            "details": empty_labels_found,
            "message": f"Empty label detection and removal completed for area '{effective_area_tag}'."
        }

    def get_image_label_pairs_for_review(self, area_tag: str) -> List[Dict[str, str]]:
        """Lists all image-label pairs for a given area_tag, suitable for manual review."""
        effective_area_tag = area_tag if area_tag else "unspecified"
        images_dir = self.base_dir / "datasets" / "basketball" / "area_frames" / effective_area_tag / "images"
        labels_dir = self.base_dir / "datasets" / "basketball" / "area_frames" / effective_area_tag / "labels"

        if not images_dir.is_dir():
            logger.warning(f"Images directory for area '{effective_area_tag}' not found: {images_dir}")
            return []
        if not labels_dir.is_dir():
            logger.warning(f"Labels directory for area '{effective_area_tag}' not found: {labels_dir}")
            return []

        image_label_pairs = []
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

        for img_path in images_dir.iterdir():
            if img_path.is_file() and img_path.suffix.lower() in image_extensions:
                label_path = labels_dir / f"{img_path.stem}.txt"
                image_label_pairs.append({
                    "filename": img_path.name,
                    "image_path": str(img_path),
                    "label_path": str(label_path) if label_path.is_file() else None
                })
        
        # Sort for consistent order
        image_label_pairs.sort(key=lambda x: x["filename"])

        logger.info(f"Found {len(image_label_pairs)} image-label pairs for review in area '{effective_area_tag}'.")
        return image_label_pairs

    def import_local_videos(self, source_directory: str, area_tag: str) -> Dict[str, Any]:
        """Imports videos from a local directory into the MinIO/local storage system."""
        source_path = Path(source_directory)
        if not source_path.exists():
            return {"success": False, "message": f"Source directory not found: {source_directory}"}
        if not source_path.is_dir():
            return {"success": False, "message": f"Source path is not a directory: {source_directory}"}

        imported_count = 0
        errors = []

        effective_area_tag = area_tag if area_tag else "unspecified"

        # Ensure the main bucket exists
        self._ensure_bucket_exists(MINIO_BUCKET)

        # Create local uploads directory for this area_tag within the main bucket structure
        uploads_dir_for_area = self.base_dir / "uploads" / MINIO_BUCKET / effective_area_tag
        uploads_dir_for_area.mkdir(parents=True, exist_ok=True)

        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}

        for video_file in source_path.iterdir():
            if video_file.is_file() and video_file.suffix.lower() in video_extensions:
                try:
                    video_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{video_file.name}"
                    minio_object_name = f"{effective_area_tag}/{video_filename}"
                    full_video_id = minio_object_name

                    # Copy to local storage
                    local_target_path = uploads_dir_for_area / video_filename
                    shutil.copy2(video_file, local_target_path)
                    logger.info(f"✅ Copied video locally: {local_target_path}")

                    # Upload to MinIO
                    with open(video_file, "rb") as data:
                        minio_client.put_object(MINIO_BUCKET, minio_object_name, data, length=video_file.stat().st_size, part_size=10*1024*1024)
                    logger.info(f"✅ Uploaded to MinIO: {MINIO_BUCKET}/{minio_object_name}")

                    imported_count += 1
                except Exception as e:
                    errors.append(f"Failed to import {video_file.name}: {str(e)}")
                    logger.error(f"❌ Error importing {video_file.name}: {e}")

        if not errors:
            return {"success": True, "message": f"Successfully imported {imported_count} videos into area '{effective_area_tag}'."}
        else:
            return {"success": False, "message": f"Imported {imported_count} videos, but encountered errors: {', '.join(errors)}", "errors": errors}

    def delete_image_and_label(self, image_path: str, label_path: Optional[str]) -> Dict[str, Any]:
        """Deletes a specific image file and its corresponding label file."""
        success = True
        message = []

        img_path = Path(image_path)
        if img_path.is_file():
            try:
                os.remove(img_path)
                message.append(f"Deleted image: {img_path.name}")
                logger.info(f"🗑️ Deleted image: {img_path.name}")
            except Exception as e:
                success = False
                message.append(f"Failed to delete image {img_path.name}: {e}")
                logger.error(f"❌ Failed to delete image {img_path.name}: {e}")
        else:
            message.append(f"Image not found: {img_path.name}")
            logger.warning(f"Image not found for deletion: {img_path.name}")

        if label_path:
            lbl_path = Path(label_path)
            if lbl_path.is_file():
                try:
                    os.remove(lbl_path)
                    message.append(f"Deleted label: {lbl_path.name}")
                    logger.info(f"🗑️ Deleted label: {lbl_path.name}")
                except Exception as e:
                    success = False
                    message.append(f"Failed to delete label {lbl_path.name}: {e}")
                    logger.error(f"❌ Failed to delete label {lbl_path.name}: {e}")
            else:
                message.append(f"Label not found: {lbl_path.name}")
                logger.warning(f"Label not found for deletion: {lbl_path.name}")

        return {"success": success, "message": "; ".join(message)}

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
                <button class="tab" onclick="showTab('cleaning', this)">🧹 Dataset Cleaning</button>
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
                        <div class="form-group">
                            <label for="upload-area-tag-select">Area Tag (optional):</label>
                            <select id="upload-area-tag-select" class="form-control" onchange="handleAreaTagSelectChange()">
                                <option value="">None</option>
                                <option value="create-new">Create New Area Tag...</option>
                            </select>
                        </div>
                        <div class="form-group" id="new-area-tag-input-group" style="display: none;">
                            <label for="new-area-tag">New Area Tag Name:</label>
                            <input type="text" id="new-area-tag" class="form-control" placeholder="Enter new area tag (e.g., 'game1', 'practice')">
                        </div>
                        <div id="video-list" class="file-list">
                            <strong>Selected Videos:</strong>
                            <p class="status-message info">No videos selected yet.</p>
                        </div>
                        <div id="upload-status" class="status-message"></div>

                        <hr style="margin: 30px 0; border-color: var(--border-color);">

                        <h3>Import Videos from Local Directory</h3>
                        <p style="font-size: 0.9em; color: var(--text-light); margin-bottom: 15px;">
                            Scan a local directory for video files and import them to the selected Area Tag.
                        </p>
                        <div class="form-group">
                            <label for="local-import-dir">Local Directory Path:</label>
                            <input type="text" id="local-import-dir" class="form-control" placeholder="e.g., /home/user/downloads/bal_videos">
                        </div>
                        <div class="form-group">
                            <label for="local-import-area-tag-select">Area Tag for Imported Videos:</label>
                            <select id="local-import-area-tag-select" class="form-control" onchange="handleLocalImportAreaTagSelectChange()">
                                <option value="">None</option>
                                <option value="create-new">Create New Area Tag...</option>
                            </select>
                        </div>
                        <div class="form-group" id="new-local-import-area-tag-input-group" style="display: none;">
                            <label for="new-local-import-area-tag">New Area Tag Name:</label>
                            <input type="text" id="new-local-import-area-tag" class="form-control" placeholder="Enter new area tag (e.g., 'game1', 'practice')">
                        </div>
                        <button class="btn btn-success" onclick="importLocalVideos()">📁 Import Videos</button>
                        <div id="import-status" class="status-message"></div>
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
                            <label for="area-filter-extraction">Filter by Area Tag:</label>
                            <select id="area-filter-extraction" class="form-control" onchange="loadUploadedVideosForExtraction()">
                                <option value="">All Areas</option>
                                <option value="ball">Ball</option>
                                <option value="player">Player</option>
                                <option value="court_lines">Court Lines</option>
                                <option value="hoop">Hoop</option>
                                <option value="unspecified">Unspecified</option>
                            </select>
                            <button class="btn btn-danger" style="margin-top: 10px;" onclick="confirmAndDeleteVideosByArea()">🗑️ Clear Videos by Selected Area</button>
                        </div>
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

            <!-- Dataset Cleaning Tab -->
            <div id="cleaning" class="tab-content">
                <h2 class="section-title">🧹 Dataset Cleaning Tools</h2>
                <p>Tools to clean and refine your extracted frames and annotations.</p>

                <div class="grid">
                    <div class="card">
                        <h3>Duplicate Frame Cleaner</h3>
                        <p style="font-size: 0.9em; color: var(--text-light); margin-bottom: 15px;">
                            Remove near-duplicate images from your dataset based on perceptual hashing.
                        </p>
                        <div class="form-group">
                            <label for="duplicate-cleaner-area-tag-select">Area Tag:</label>
                            <select id="duplicate-cleaner-area-tag-select" class="form-control">
                                <option value="">Select an Area Tag</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="duplicate-hash-size">Hash Size (e.g., 8, 16):</label>
                            <input type="number" id="duplicate-hash-size" class="form-control" value="8" min="4" max="64">
                        </div>
                        <div class="form-group">
                            <label for="duplicate-tolerance">Tolerance (0 for exact match, e.g., 5):</label>
                            <input type="number" id="duplicate-tolerance" class="form-control" value="5" min="0" max="63">
                        </div>
                        <div class="form-check" style="margin-bottom: 15px;">
                            <input type="checkbox" class="form-check-input" id="duplicate-dry-run">
                            <label class="form-check-label" for="duplicate-dry-run">Dry Run (only report, don't delete)</label>
                        </div>
                        <button class="btn btn-primary" onclick="runDuplicateCleaner()">🗑️ Run Duplicate Cleaner</button>
                        <div id="duplicate-cleaner-status" class="status-message"></div>
                    </div>

                    <div class="card">
                        <h3>Blurry Frame Cleaner</h3>
                        <p style="font-size: 0.9em; color: var(--text-light); margin-bottom: 15px;">
                            Remove blurry images from your dataset using Laplacian variance.
                        </p>
                        <div class="form-group">
                            <label for="blur-cleaner-area-tag-select">Area Tag:</label>
                            <select id="blur-cleaner-area-tag-select" class="form-control">
                                <option value="">Select an Area Tag</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="blur-threshold">Laplacian Variance Threshold (e.g., 100):</label>
                            <input type="number" id="blur-threshold" class="form-control" value="100" min="0">
                        </div>
                        <div class="form-check" style="margin-bottom: 15px;">
                            <input type="checkbox" class="form-check-input" id="blur-dry-run">
                            <label class="form-check-label" for="blur-dry-run">Dry Run (only report, don't delete)</label>
                        </div>
                        <button class="btn btn-primary" onclick="runBlurCleaner()">🗑️ Run Blur Cleaner</button>
                        <div id="blur-cleaner-status" class="status-message"></div>
                    </div>

                    <div class="card">
                        <h3>Empty Label Cleaner</h3>
                        <p style="font-size: 0.9em; color: var(--text-light); margin-bottom: 15px;">
                            Remove image and label files where the label file is empty (no detected objects).
                        </p>
                        <div class="form-group">
                            <label for="empty-label-cleaner-area-tag-select">Area Tag:</label>
                            <select id="empty-label-cleaner-area-tag-select" class="form-control">
                                <option value="">Select an Area Tag</option>
                            </select>
                        </div>
                        <div class="form-check" style="margin-bottom: 15px;">
                            <input type="checkbox" class="form-check-input" id="empty-label-dry-run">
                            <label class="form-check-label" for="empty-label-dry-run">Dry Run (only report, don't delete)</label>
                        </div>
                        <button class="btn btn-primary" onclick="runEmptyLabelCleaner()">🗑️ Run Empty Label Cleaner</button>
                        <div id="empty-label-cleaner-status" class="status-message"></div>
                    </div>

                    <div class="card">
                        <h3>Manual Frame Review</h3>
                        <p style="font-size: 0.9em; color: var(--text-light); margin-bottom: 15px;">
                            Manually review frames and delete irrelevant ones with their labels.
                        </p>
                        <div class="form-group">
                            <label for="manual-review-area-tag-select">Area Tag:</label>
                            <select id="manual-review-area-tag-select" class="form-control" onchange="loadFramesForReview()">
                                <option value="">Select an Area Tag</option>
                            </select>
                        </div>
                        
                        <div id="review-display-area" style="margin-top: 20px; text-align: center; border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; background-color: var(--secondary-bg);">
                            <p id="review-filename" style="font-weight: 600; margin-bottom: 10px;">No frame loaded.</p>
                            <img id="review-image" src="" alt="Frame for review" style="max-width: 100%; height: auto; max-height: 400px; border-radius: 4px; display: none;">
                            <p id="review-index" style="margin-top: 10px; font-size: 0.9em; color: var(--text-light);">0 / 0</p>
                        </div>

                        <div class="d-flex justify-content-between" style="margin-top: 20px;">
                            <button class="btn btn-secondary" onclick="previousFrame()" disabled id="prev-frame-btn">← Previous</button>
                            <button class="btn btn-info" onclick="skipFrame()" disabled id="skip-frame-btn">Skip →</button>
                            <button class="btn btn-success" onclick="nextFrame()" disabled id="next-frame-btn">Next →</button>
                        </div>
                        <button class="btn btn-danger" onclick="deleteCurrentFrame()" style="width: 100%; margin-top: 15px;" disabled id="delete-frame-btn">🗑️ Delete Current Frame & Label</button>
                        <div id="manual-review-status" class="status-message" style="margin-top: 15px;"></div>
                    </div>
                </div>
            </div>
        </div> <!-- End of container -->

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

                const selectedAreaTagOption = document.getElementById('upload-area-tag-select').value;
                let areaTag = '';

                if (selectedAreaTagOption === 'create-new') {
                    areaTag = document.getElementById('new-area-tag').value.trim();
                    if (!areaTag) {
                        showStatus('upload-status', 'Please enter a new area tag name.', 'error');
                        return;
                    }
                    // Basic validation for area tag name (should not contain '/')
                    if (areaTag.includes('/')) {
                        showStatus('upload-status', 'New area tag cannot contain slashes.', 'error');
                        return;
                    }
                } else {
                    areaTag = selectedAreaTagOption;
                }

                // Removed frontend validation for empty areaTag as backend handles 'unspecified'
                // if (!areaTag) {
                //     showStatus('upload-status', 'Please select or create an area tag.', 'error');
                //     return;
                // }

                let successCount = 0;
                let errorCount = 0;

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        if (areaTag) {
                            formData.append('area_tag', areaTag);
                        }

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
                                url: result.video_url,
                                area_tag: result.area_tag
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
                    populateAreaTagDropdowns(); // Refresh dropdowns after new tag might be created
                } else {
                    showStatus('upload-status', '❌ All uploads failed.', 'error');
                }
                uploadListDiv.innerHTML = '<strong>Selected Videos:</strong><p class="status-message info">No videos selected yet.</p>'; // Clear selection list
                // Clear new area tag input if it was used
                if (selectedAreaTagOption === 'create-new') {
                    document.getElementById('new-area-tag').value = '';
                    document.getElementById('new-area-tag-input-group').style.display = 'none';
                    document.getElementById('upload-area-tag-select').value = ''; // Reset dropdown
                }
            }

            // Function to handle change in Area Tag select dropdown
            function handleAreaTagSelectChange() {
                const select = document.getElementById('upload-area-tag-select');
                const newAreaTagInputGroup = document.getElementById('new-area-tag-input-group');
                if (select.value === 'create-new') {
                    newAreaTagInputGroup.style.display = 'block';
                } else {
                    newAreaTagInputGroup.style.display = 'none';
                }
            }

            // Function to handle change in Local Import Area Tag select dropdown
            function handleLocalImportAreaTagSelectChange() {
                const select = document.getElementById('local-import-area-tag-select');
                const newAreaTagInputGroup = document.getElementById('new-local-import-area-tag-input-group');
                if (select.value === 'create-new') {
                    newAreaTagInputGroup.style.display = 'block';
                } else {
                    newAreaTagInputGroup.style.display = 'none';
                }
            }

            // Import local videos function
            async function importLocalVideos() {
                const sourceDirectoryInput = document.getElementById('local-import-dir');
                const sourceDirectory = sourceDirectoryInput.value.trim();
                if (!sourceDirectory) {
                    showStatus('import-status', 'Please enter a local directory path.', 'error');
                    return;
                }

                const selectedAreaTagOption = document.getElementById('local-import-area-tag-select').value;
                let areaTag = '';

                if (selectedAreaTagOption === 'create-new') {
                    areaTag = document.getElementById('new-local-import-area-tag').value.trim();
                    if (!areaTag) {
                        showStatus('import-status', 'Please enter a new area tag name.', 'error');
                        return;
                    }
                    if (areaTag.includes('/')) {
                        showStatus('import-status', 'New area tag cannot contain slashes.', 'error');
                        return;
                    }
                } else {
                    areaTag = selectedAreaTagOption;
                }

                if (!areaTag) {
                    showStatus('import-status', 'Please select or create an area tag for imported videos.', 'error');
                    return;
                }

                showStatus('import-status', `Importing videos from '${sourceDirectory}' to area '${areaTag}'...`, 'info');

                try {
                    const formData = new FormData();
                    formData.append('source_directory', sourceDirectory);
                    if (areaTag) {
                        formData.append('area_tag', areaTag);
                    }

                    const response = await fetch('/api/import-local-videos', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        showStatus('import-status', `✅ ${result.message}`, 'success');
                        refreshUploadedVideos();
                        populateAreaTagDropdowns(); // Refresh dropdowns after new tag might be created
                    } else {
                        showStatus('import-status', `❌ Import failed: ${result.message}`, 'error');
                    }
                } catch (error) {
                    showStatus('import-status', `❌ Error during import: ${error.message}`, 'error');
                } finally {
                    // Clear inputs after attempt
                    sourceDirectoryInput.value = '';
                    document.getElementById('new-local-import-area-tag').value = '';
                    document.getElementById('new-local-import-area-tag-input-group').style.display = 'none';
                    document.getElementById('local-import-area-tag-select').value = '';
                }
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
                                <p><strong>ID:</strong> ${video.id.split('/')[1].split('_')[0]}...</p>
                                <p><strong>Size:</strong> ${(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <p><strong>Uploaded:</strong> ${new Date(video.last_modified).toLocaleString()}</p>
                                <p><strong>Area Tag:</strong> ${video.area_tag || 'N/A'}</p>
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
                const selectedArea = document.getElementById('area-filter-extraction').value;
                let url = '/api/videos';
                if (selectedArea) {
                    url += `?area_tag=${selectedArea}`;
                }
                try {
                    const response = await fetch(url);
                    const videos = await response.json();
                    uploadedVideos = videos;

                    const select = document.getElementById('video-select-extraction');
                    select.innerHTML = '<option value="" disabled>Select videos...</option>';

                    if (videos.length === 0) {
                        select.innerHTML += '<option value="" disabled>No videos available</option>';
                    } else {
                        videos.forEach(video => {
                            const option = document.createElement('option');
                            option.value = video.id; // video.id is now bucket_name/video_id
                            option.textContent = `${video.name} (Area: ${video.area_tag || 'N/A'})`;
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

            async function confirmAndDeleteVideosByArea() {
                const selectedArea = document.getElementById('area-filter-extraction').value;
                if (!selectedArea) {
                    showStatus('extraction-status', 'Please select an area tag to clear.', 'error');
                    return;
                }

                if (confirm(`Are you sure you want to delete all videos with area tag "${selectedArea}"? This action cannot be undone.`)) {
                    try {
                        const response = await fetch('/api/delete-videos-by-area', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `area_tag=${selectedArea}`
                        });
                        const result = await response.json();

                        if (result.success) {
                            showStatus('extraction-status', result.message, 'success');
                            refreshUploadedVideos(); // Refresh the list to show updated count
                            loadUploadedVideosForExtraction(); // Reload filtered list
                        } else {
                            showStatus('extraction-status', `❌ Failed to delete videos: ${result.message}`, 'error');
                        }
                    } catch (error) {
                        showStatus('extraction-status', `❌ Error deleting videos: ${error.message}`, 'error');
                    }
                }
            }

            // Initialize on DOMContentLoaded
            document.addEventListener('DOMContentLoaded', function() {
                showTab('upload'); // Set initial active tab
                loadUploadedVideos(); // Load videos for the upload tab initially
                populateAreaTagDropdowns(); // Populate area tag dropdowns
            });

            // Function to populate Area Tag dropdowns
            async function populateAreaTagDropdowns() {
                try {
                    const response = await fetch('/api/area-tags');
                    const areaTags = await response.json();

                    const uploadSelect = document.getElementById('upload-area-tag-select');
                    const extractionFilterSelect = document.getElementById('area-filter-extraction');

                    // Clear existing options, keep 'None' and 'Create New'
                    uploadSelect.innerHTML = '<option value="">None</option><option value="create-new">Create New Area Tag...</option>';
                    extractionFilterSelect.innerHTML = '<option value="">All Areas</option>';

                    areaTags.forEach(tag => {
                        const option1 = document.createElement('option');
                        option1.value = tag;
                        option1.textContent = tag;
                        uploadSelect.appendChild(option1);

                        const option2 = document.createElement('option');
                        option2.value = tag;
                        option2.textContent = tag;
                        extractionFilterSelect.appendChild(option2);

                        // Populate local import area tag dropdown
                        const localImportSelect = document.getElementById('local-import-area-tag-select');
                        if (localImportSelect) {
                            const option3 = document.createElement('option');
                            option3.value = tag;
                            option3.textContent = tag;
                            localImportSelect.appendChild(option3);
                        }

                        // Populate duplicate cleaner area tag dropdown
                        const duplicateCleanerSelect = document.getElementById('duplicate-cleaner-area-tag-select');
                        if (duplicateCleanerSelect) {
                            const option4 = document.createElement('option');
                            option4.value = tag;
                            option4.textContent = tag;
                            duplicateCleanerSelect.appendChild(option4);
                        }

                        // Populate blur cleaner area tag dropdown
                        const blurCleanerSelect = document.getElementById('blur-cleaner-area-tag-select');
                        if (blurCleanerSelect) {
                            const option5 = document.createElement('option');
                            option5.value = tag;
                            option5.textContent = tag;
                            blurCleanerSelect.appendChild(option5);
                        }

                        // Populate empty label cleaner area tag dropdown
                        const emptyLabelCleanerSelect = document.getElementById('empty-label-cleaner-area-tag-select');
                        if (emptyLabelCleanerSelect) {
                            const option6 = document.createElement('option');
                            option6.value = tag;
                            option6.textContent = tag;
                            emptyLabelCleanerSelect.appendChild(option6);
                        }

                        // Populate manual review area tag dropdown
                        const manualReviewSelect = document.getElementById('manual-review-area-tag-select');
                        if (manualReviewSelect) {
                            const option7 = document.createElement('option');
                            option7.value = tag;
                            option7.textContent = tag;
                            manualReviewSelect.appendChild(option7);
                        }
                    });
                } catch (error) {
                    console.error('Error populating area tag dropdowns:', error);
                }
            }

            // Run Duplicate Cleaner function
            async function runDuplicateCleaner() {
                const areaTagSelect = document.getElementById('duplicate-cleaner-area-tag-select');
                const areaTag = areaTagSelect.value;
                const hashSize = parseInt(document.getElementById('duplicate-hash-size').value);
                const tolerance = parseInt(document.getElementById('duplicate-tolerance').value);
                const dryRun = document.getElementById('duplicate-dry-run').checked;
                const statusDiv = document.getElementById('duplicate-cleaner-status');

                if (!areaTag) {
                    showStatus('duplicate-cleaner-status', 'Please select an Area Tag.', 'error');
                    return;
                }

                showStatus('duplicate-cleaner-status', `Running duplicate cleaner for area '${areaTag}' (Dry Run: ${dryRun})...`, 'info');

                try {
                    const formData = new FormData();
                    formData.append('area_tag', areaTag);
                    formData.append('hash_size', hashSize);
                    formData.append('tolerance', tolerance);
                    formData.append('dry_run', dryRun);

                    const response = await fetch('/api/clean-duplicates', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        let message = `✅ ${result.message}`; // Use backend message directly
                        if (result.duplicates_found > 0) {
                            message += ` Found ${result.duplicates_found} duplicates, ${result.duplicates_deleted} deleted.`;
                        }
                        showStatus('duplicate-cleaner-status', message, 'success');
                        // Optionally refresh video list if duplicates were deleted
                        if (result.duplicates_deleted > 0 && !dryRun) {
                            refreshUploadedVideos();
                            loadUploadedVideosForExtraction();
                        }
                    } else {
                        showStatus('duplicate-cleaner-status', `❌ Duplicate cleaning failed: ${result.message}`, 'error');
                    }
                } catch (error) {
                    showStatus('duplicate-cleaner-status', `❌ Error during duplicate cleaning: ${error.message}`, 'error');
                }
            }

            // Run Blur Cleaner function
            async function runBlurCleaner() {
                const areaTagSelect = document.getElementById('blur-cleaner-area-tag-select');
                const areaTag = areaTagSelect.value;
                const threshold = parseInt(document.getElementById('blur-threshold').value);
                const dryRun = document.getElementById('blur-dry-run').checked;
                const statusDiv = document.getElementById('blur-cleaner-status');

                if (!areaTag) {
                    showStatus('blur-cleaner-status', 'Please select an Area Tag.', 'error');
                    return;
                }

                showStatus('blur-cleaner-status', `Running blur cleaner for area '${areaTag}' (Dry Run: ${dryRun})...`, 'info');

                try {
                    const formData = new FormData();
                    formData.append('area_tag', areaTag);
                    formData.append('threshold', threshold);
                    formData.append('dry_run', dryRun);

                    const response = await fetch('/api/clean-blur', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        let message = `✅ ${result.message}`; // Use backend message directly
                        if (result.blurry_frames_found > 0) {
                            message += ` Found ${result.blurry_frames_found} blurry frames, ${result.blurry_frames_deleted} deleted.`;
                        }
                        showStatus('blur-cleaner-status', message, 'success');
                        // Optionally refresh video list if blurry frames were deleted
                        if (result.blurry_frames_deleted > 0 && !dryRun) {
                            refreshUploadedVideos();
                            loadUploadedVideosForExtraction();
                        }
                    } else {
                        showStatus('blur-cleaner-status', `❌ Blur cleaning failed: ${result.message}`, 'error');
                    }
                } catch (error) {
                    showStatus('blur-cleaner-status', `❌ Error during blur cleaning: ${error.message}`, 'error');
                }
            }

            // Run Empty Label Cleaner function
            async function runEmptyLabelCleaner() {
                const areaTagSelect = document.getElementById('empty-label-cleaner-area-tag-select');
                const areaTag = areaTagSelect.value;
                const dryRun = document.getElementById('empty-label-dry-run').checked;
                const statusDiv = document.getElementById('empty-label-cleaner-status');

                if (!areaTag) {
                    showStatus('empty-label-cleaner-status', 'Please select an Area Tag.', 'error');
                    return;
                }

                showStatus('empty-label-cleaner-status', `Running empty label cleaner for area '${areaTag}' (Dry Run: ${dryRun})...`, 'info');

                try {
                    const formData = new FormData();
                    formData.append('area_tag', areaTag);
                    formData.append('dry_run', dryRun);

                    const response = await fetch('/api/clean-empty-labels', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        let message = `✅ ${result.message}`; // Use backend message directly
                        if (result.empty_labels_found > 0) {
                            message += ` Found ${result.empty_labels_found} empty label files, ${result.empty_labels_deleted} deleted.`;
                        }
                        showStatus('empty-label-cleaner-status', message, 'success');
                        // Optionally refresh video list if empty label files were deleted
                        if (result.empty_labels_deleted > 0 && !dryRun) {
                            refreshUploadedVideos();
                            loadUploadedVideosForExtraction();
                        }
                    } else {
                        showStatus('empty-label-cleaner-status', `❌ Empty label cleaning failed: ${result.message}`, 'error');
                    }
                } catch (error) {
                    showStatus('empty-label-cleaner-status', `❌ Error during empty label cleaning: ${error.message}`, 'error');
                }
            }

            // Manual Frame Review variables
            let frames_for_review = [];
            let current_frame_index = 0;

            // Manual Frame Review functions
            async function loadFramesForReview() {
                const areaTag = document.getElementById('manual-review-area-tag-select').value;
                if (!areaTag) {
                    showStatus('manual-review-status', 'Please select an Area Tag for manual review.', 'error');
                    resetReviewer();
                    return;
                }

                showStatus('manual-review-status', 'Loading frames...', 'info');

                try {
                    const response = await fetch(`/api/review-frames?area_tag=${areaTag}`);
                    const result = await response.json();

                    if (result && result.length > 0) {
                        frames_for_review = result;
                        current_frame_index = 0;
                        displayCurrentFrame();
                        showStatus('manual-review-status', `Loaded ${frames_for_review.length} frames for review.`, 'success');
                    } else {
                        frames_for_review = [];
                        current_frame_index = 0;
                        resetReviewer();
                        showStatus('manual-review-status', 'No frames found for this area tag.', 'warning');
                    }
                } catch (error) {
                    resetReviewer();
                    showStatus('manual-review-status', `Error loading frames: ${error.message}`, 'error');
                }
            }

            function displayCurrentFrame() {
                const reviewImage = document.getElementById('review-image');
                const reviewFilename = document.getElementById('review-filename');
                const reviewIndex = document.getElementById('review-index');
                const prevBtn = document.getElementById('prev-frame-btn');
                const nextBtn = document.getElementById('next-frame-btn');
                const skipBtn = document.getElementById('skip-frame-btn');
                const deleteBtn = document.getElementById('delete-frame-btn');

                if (frames_for_review.length === 0) {
                    resetReviewer();
                    return;
                }

                const frame = frames_for_review[current_frame_index];
                reviewImage.src = `/frames/${frame.image_path.split('datasets/basketball/area_frames/')[1]}`;
                reviewImage.style.display = 'block';
                reviewFilename.textContent = frame.filename;
                reviewIndex.textContent = `${current_frame_index + 1} / ${frames_for_review.length}`;

                prevBtn.disabled = current_frame_index === 0;
                nextBtn.disabled = current_frame_index === frames_for_review.length - 1;
                skipBtn.disabled = current_frame_index === frames_for_review.length - 1;
                deleteBtn.disabled = false;
            }

            function previousFrame() {
                if (current_frame_index > 0) {
                    current_frame_index--;
                    displayCurrentFrame();
                }
            }

            function nextFrame() {
                if (current_frame_index < frames_for_review.length - 1) {
                    current_frame_index++;
                    displayCurrentFrame();
                }
            }

            function skipFrame() {
                nextFrame(); // Skip is same as next for now
            }

            async function deleteCurrentFrame() {
                if (frames_for_review.length === 0) return;

                const frameToDelete = frames_for_review[current_frame_index];
                if (!confirm(`Are you sure you want to delete "${frameToDelete.filename}"? This action cannot be undone.`)) {
                    return;
                }

                showStatus('manual-review-status', `Deleting ${frameToDelete.filename}...`, 'info');

                try {
                    const formData = new FormData();
                    formData.append('image_path', frameToDelete.image_path);
                    if (frameToDelete.label_path) {
                        formData.append('label_path', frameToDelete.label_path);
                    }

                    const response = await fetch('/api/delete-reviewed-frame', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        showStatus('manual-review-status', `✅ ${result.message}`, 'success');
                        // Remove from current review list and update
                        frames_for_review.splice(current_frame_index, 1);
                        if (current_frame_index >= frames_for_review.length && frames_for_review.length > 0) {
                            current_frame_index = frames_for_review.length - 1;
                        }
                        displayCurrentFrame();
                        // Refresh other parts of the UI that list frames
                        refreshUploadedVideos();
                        loadUploadedVideosForExtraction();
                    } else {
                        showStatus('manual-review-status', `❌ Failed to delete: ${result.message}`, 'error');
                    }
                } catch (error) {
                    showStatus('manual-review-status', `❌ Error deleting frame: ${error.message}`, 'error');
                }
            }

            function resetReviewer() {
                document.getElementById('review-image').src = '';
                document.getElementById('review-image').style.display = 'none';
                document.getElementById('review-filename').textContent = 'No frame loaded.';
                document.getElementById('review-index').textContent = '0 / 0';
                document.getElementById('prev-frame-btn').disabled = true;
                document.getElementById('next-frame-btn').disabled = true;
                document.getElementById('skip-frame-btn').disabled = true;
                document.getElementById('delete-frame-btn').disabled = true;
                showStatus('manual-review-status', '', 'info');
            }

        </script>
    </body>
    </html>
    """

# API Endpoints
@app.post("/api/upload-video")
async def upload_video(file: UploadFile = File(...), area_tag: Optional[str] = Form(None)):
    """Upload video to MinIO storage."""
    result = training_manager.upload_video(file, area_tag)
    return JSONResponse(content=result.model_dump())

@app.get("/api/videos")
async def get_videos(area_tag: Optional[str] = None):
    """Get list of uploaded videos from MinIO and local storage, with optional area tag filter."""
    videos = training_manager.get_uploaded_videos(area_tag)
    return JSONResponse(content=videos)

@app.get("/api/models")
async def get_models():
    """Get list of available trained models."""
    models = training_manager.get_available_models()
    return JSONResponse(content=models)

@app.get("/api/area-tags")
async def get_area_tags_endpoint():
    """Get list of all unique area tags from MinIO (folder prefixes in the main bucket)."""
    area_tags = training_manager.get_minio_bucket_names() # This method now gets folder prefixes
    return JSONResponse(content=area_tags)

@app.get("/api/review-frames")
async def review_frames(area_tag: str = Query(...)):
    """Get a list of image-label pairs for manual review for a given area tag."""
    pairs = training_manager.get_image_label_pairs_for_review(area_tag)
    # For the UI, we'll convert local file paths to a client-accessible format if needed.
    # For now, we return paths as is, assuming UI can handle local file paths or server is configured to serve them.
    return JSONResponse(content=pairs)

@app.post("/api/import-local-videos")
async def import_local_videos_endpoint(source_directory: str = Form(...), area_tag: Optional[str] = Form(None)):
    """Import videos from a local directory into the MinIO/local storage system."""
    result = training_manager.import_local_videos(source_directory, area_tag)
    return JSONResponse(content=result)

@app.delete("/api/delete-videos-by-area")
async def delete_videos_by_area(area_tag: str = Form(...)):
    """Delete videos from MinIO and local storage based on area tag (folder prefix)."""
    result = training_manager.delete_videos_by_area(area_tag)
    return JSONResponse(content=result)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "YOLOv8 Training UI"}

@app.post("/api/clean-duplicates")
async def clean_duplicates(area_tag: str = Form(...), hash_size: int = Form(8), tolerance: int = Form(5), dry_run: bool = Form(False)):
    """Endpoint to clean duplicate frames for a given area_tag."""
    result = training_manager.find_and_remove_duplicates_from_area(area_tag, hash_size, tolerance, not dry_run)
    return JSONResponse(content=result)

@app.post("/api/clean-blur")
async def clean_blur(area_tag: str = Form(...), threshold: float = Form(100.0), dry_run: bool = Form(False)):
    """Endpoint to clean blurry frames for a given area_tag."""
    result = training_manager.find_and_remove_blurry_frames_from_area(area_tag, threshold, not dry_run)
    return JSONResponse(content=result)

@app.post("/api/clean-empty-labels")
async def clean_empty_labels(area_tag: str = Form(...), dry_run: bool = Form(False)):
    """Endpoint to clean empty label files and their corresponding images for a given area_tag."""
    result = training_manager.find_and_remove_empty_labels_from_area(area_tag, not dry_run)
    return JSONResponse(content=result)

@app.post("/api/extract-frames")
async def extract_frames(request: FrameExtractionRequest):
    """Extract frames from video using MinIO storage."""
    result = training_manager.extract_frames(request)
    return JSONResponse(content=result)

@app.post("/api/start-training")
async def start_training(config: TrainingConfig):
    """Start YOLOv8 model training with the given configuration."""
    logger.info(f"Received training request with config: {config.model_dump()}")
    try:
        training_manager.start_training(config)
        return {"success": True, "message": "Training initiated successfully.", "config": config.model_dump()}
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to start training: {str(e)}"})

@app.get("/api/training-status")
async def get_training_status():
    """Get the current training status and logs."""
    global training_status
    return JSONResponse(content=training_status.model_dump())

@app.post("/api/test-model")
async def test_model(model_path: str = Form(...), image_file: UploadFile = File(...), confidence: float = Form(0.5)):
    """Test a trained model against an image."""
    logger.info(f"Received test request for model: {model_path} with confidence: {confidence}")
    try:
        # Save the uploaded image temporarily
        temp_image_path = Path("temp_test_image.jpg")
        with open(temp_image_path, "wb") as buffer:
            content = await image_file.read()
            buffer.write(content)

        result = training_manager.test_model(model_path, str(temp_image_path), confidence)
        os.remove(temp_image_path) # Clean up temp file
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error testing model: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to test model: {str(e)}"})

@app.post("/api/delete-reviewed-frame")
async def delete_reviewed_frame(image_path: str = Form(...), label_path: Optional[str] = Form(None)):
    """Deletes a specific image and its corresponding label file from disk."""
    result = training_manager.delete_image_and_label(image_path, label_path)
    return JSONResponse(content=result)

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
