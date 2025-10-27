#!/usr/bin/env python3
"""
Simplified YOLOv8 Basketball Training UI
========================================

Essential features only:
1. Video Upload
2. Area-Specific Frame Extraction (Ball, Player, Court Lines, Hoop)
3. YOLOv8 Training
4. Model Testing

No unnecessary features - just the core workflow.
"""

import os
import json
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Pydantic models
class FrameExtractionRequest(BaseModel):
    video_path: str
    areas: List[str] = ["ball", "player", "court_lines", "hoop"]
    max_frames_per_area: int = 50

class TrainingRequest(BaseModel):
    epochs: int = 50
    batch_size: int = 8
    img_size: int = 640
    device: str = "cpu"

class TestRequest(BaseModel):
    image_path: str
    model_path: str
    confidence: float = 0.5

# Global state
training_status = {"status": "idle", "progress": 0, "message": ""}

# Initialize FastAPI
app = FastAPI(title="Simple YOLOv8 Basketball Training", version="1.0.0")

class SimpleTrainingManager:
    """Simplified training manager with only essential features."""
    
    def __init__(self):
        self.datasets_dir = Path("training/datasets/basketball")
        self.models_dir = Path("training/models")
        self.basketball_classes = {
            0: "ball",
            1: "player", 
            2: "court_lines",
            3: "hoop"
        }
        
        # Create directories
        self.datasets_dir.mkdir(parents=True, exist_ok=True)
        self.models_dir.mkdir(parents=True, exist_ok=True)
    
    def extract_frames(self, request: FrameExtractionRequest) -> Dict[str, Any]:
        """Extract frames for specific basketball areas."""
        try:
            logger.info(f"🎯 Extracting frames for areas: {request.areas}")
            
            # Find video file
            video_path = self._find_video_file(request.video_path)
            if not video_path:
                return {
                    "success": False,
                    "message": f"Video file not found: {request.video_path}",
                    "error": "Video file not found"
                }
            
            # Build command for area-specific extraction
            cmd = [
                "python", "training/area_specific_extraction.py",
                "--input", video_path,
                "--output", "training/datasets/basketball/area_frames",
                "--areas", ",".join(request.areas),
                "--max-frames", str(request.max_frames_per_area)
            ]
            
            # Run extraction
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                # Count extracted frames
                area_frames_dir = Path("training/datasets/basketball/area_frames")
                total_frames = 0
                area_breakdown = {}
                
                for area in request.areas:
                    area_dir = area_frames_dir / area / "images"
                    if area_dir.exists():
                        frame_count = len(list(area_dir.glob("*.jpg")))
                        area_breakdown[area] = frame_count
                        total_frames += frame_count
                
                return {
                    "success": True,
                    "message": f"Successfully extracted {total_frames} frames",
                    "total_frames": total_frames,
                    "area_breakdown": area_breakdown
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
    
    def _find_video_file(self, video_path: str) -> Optional[str]:
        """Find video file in common locations."""
        if os.path.isabs(video_path) and os.path.exists(video_path):
            return video_path
        
        possible_paths = [
            f"/home/okidi6/Videos/Dataset/{video_path}",
            f"/home/okidi6/Videos/{video_path}",
            f"/home/okidi6/Downloads/{video_path}",
            f"./uploads/{video_path}"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                logger.info(f"📹 Found video at: {path}")
                return path
        
        return None
    
    def start_training(self, request: TrainingRequest) -> Dict[str, Any]:
        """Start YOLOv8 training."""
        try:
            logger.info(f"🏋️ Starting YOLOv8 training: {request.epochs} epochs")
            
            # Update training status
            global training_status
            training_status = {
                "status": "training",
                "progress": 0,
                "message": "Starting training..."
            }
            
            # Build training command
            cmd = [
                "python", "training/train_basketball_yolo.py",
                "--epochs", str(request.epochs),
                "--batch-size", str(request.batch_size),
                "--img-size", str(request.img_size),
                "--device", request.device,
                "--data-yaml", "training/datasets/basketball/data.yaml",
                "--name", f"basketball_yolo_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            ]
            
            # Run training in background
            subprocess.Popen(cmd, cwd=".")
            
            return {
                "success": True,
                "message": "Training started successfully",
                "training_id": f"basketball_yolo_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            }
            
        except Exception as e:
            logger.error(f"❌ Training error: {e}")
            return {
                "success": False,
                "message": f"Training error: {str(e)}",
                "error": str(e)
            }
    
    def test_model(self, request: TestRequest) -> Dict[str, Any]:
        """Test trained model on image."""
        try:
            logger.info(f"🧪 Testing model: {request.model_path}")
            
            # Build test command
            cmd = [
                "python", "training/test_yolo.py",
                "--image", request.image_path,
                "--model", request.model_path,
                "--confidence", str(request.confidence)
            ]
            
            # Run test
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "message": "Model test completed",
                    "results": result.stdout
                }
            else:
                return {
                    "success": False,
                    "message": f"Model test failed: {result.stderr}",
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"❌ Model test error: {e}")
            return {
                "success": False,
                "message": f"Model test error: {str(e)}",
                "error": str(e)
            }
    
    def get_dataset_stats(self) -> Dict[str, Any]:
        """Get simple dataset statistics."""
        try:
            # Count area-specific frames
            area_frames_dir = Path("training/datasets/basketball/area_frames")
            total_frames = 0
            area_breakdown = {}
            
            if area_frames_dir.exists():
                for area in self.basketball_classes.values():
                    area_dir = area_frames_dir / area / "images"
                    if area_dir.exists():
                        frame_count = len(list(area_dir.glob("*.jpg")))
                        area_breakdown[area] = frame_count
                        total_frames += frame_count
            
            return {
                "total_frames": total_frames,
                "area_breakdown": area_breakdown,
                "basketball_classes": self.basketball_classes
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting dataset stats: {e}")
            return {
                "total_frames": 0,
                "area_breakdown": {},
                "basketball_classes": self.basketball_classes
            }
    
    def get_training_status(self) -> Dict[str, Any]:
        """Get current training status."""
        global training_status
        return training_status

# Initialize training manager
training_manager = SimpleTrainingManager()

# HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏀 Simple YOLOv8 Basketball Training</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
            padding: 25px;
            border: 2px solid #f1f2f6;
            border-radius: 10px;
            background: #fafafa;
        }
        
        .section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #3498db;
        }
        
        .checkbox-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
            transition: all 0.3s;
        }
        
        .checkbox-item:hover {
            border-color: #3498db;
            background: #f8f9fa;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
            transform: scale(1.2);
        }
        
        .btn {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            margin: 10px 5px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #27ae60, #229954);
        }
        
        .btn-warning {
            background: linear-gradient(135deg, #f39c12, #e67e22);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
        }
        
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: bold;
            display: none;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #e0e0e0;
        }
        
        .stat-card h3 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .stat-card .number {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }
        
        .file-upload {
            border: 3px dashed #3498db;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            background: #f8f9fa;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .file-upload:hover {
            border-color: #2980b9;
            background: #e3f2fd;
        }
        
        .file-upload p {
            font-size: 1.1em;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .file-upload .file-info {
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏀 Simple YOLOv8 Basketball Training</h1>
            <p>Essential AI Training for Basketball Object Detection</p>
        </div>
        
        <div class="content">
            <!-- Dataset Statistics -->
            <div class="section">
                <h2>📊 Dataset Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Frames</h3>
                        <div class="number" id="total-frames">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Ball Frames</h3>
                        <div class="number" id="ball-frames">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Player Frames</h3>
                        <div class="number" id="player-frames">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Court Frames</h3>
                        <div class="number" id="court-frames">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Hoop Frames</h3>
                        <div class="number" id="hoop-frames">0</div>
                    </div>
                </div>
                <button class="btn" onclick="refreshStats()">🔄 Refresh Stats</button>
            </div>
            
            <!-- Video Upload & Frame Extraction -->
            <div class="section">
                <h2>🎬 Video Upload & Frame Extraction</h2>
                
                <div class="form-group">
                    <label>Upload Basketball Video:</label>
                    <div class="file-upload" onclick="document.getElementById('video-file').click()">
                        <p>📹 Click to upload basketball video</p>
                        <p class="file-info">Supports MP4, AVI, MOV formats</p>
                        <input type="file" id="video-file" accept="video/*" style="display: none;" onchange="handleVideoUpload(event)">
                    </div>
                    <div id="video-status" class="status" style="display: none;"></div>
                </div>
                
                <div class="form-group">
                    <label>Basketball Areas to Extract:</label>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="area-ball" checked>
                            <label for="area-ball">🏀 Ball</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="area-player" checked>
                            <label for="area-player">👤 Player</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="area-court" checked>
                            <label for="area-court">📏 Court Lines</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="area-hoop" checked>
                            <label for="area-hoop">🏀 Hoop</label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Max Frames per Area:</label>
                    <input type="number" id="max-frames" value="50" min="10" max="200">
                </div>
                
                <button class="btn btn-success" onclick="extractFrames()">🎯 Extract Frames</button>
                <div id="extraction-status" class="status" style="display: none;"></div>
            </div>
            
            <!-- YOLOv8 Training -->
            <div class="section">
                <h2>🏋️ YOLOv8 Training</h2>
                
                <div class="form-group">
                    <label>Epochs:</label>
                    <input type="number" id="epochs" value="50" min="10" max="200">
                </div>
                
                <div class="form-group">
                    <label>Batch Size:</label>
                    <input type="number" id="batch-size" value="8" min="1" max="32">
                </div>
                
                <div class="form-group">
                    <label>Image Size:</label>
                    <select id="img-size">
                        <option value="640">640x640</option>
                        <option value="416">416x416</option>
                        <option value="320">320x320</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Device:</label>
                    <select id="device">
                        <option value="cpu">CPU</option>
                        <option value="cuda">GPU (CUDA)</option>
                    </select>
                </div>
                
                <button class="btn btn-warning" onclick="startTraining()">🚀 Start Training</button>
                <div id="training-status" class="status" style="display: none;"></div>
            </div>
            
            <!-- Model Testing -->
            <div class="section">
                <h2>🧪 Model Testing</h2>
                
                <div class="form-group">
                    <label>Upload Test Image:</label>
                    <div class="file-upload" onclick="document.getElementById('test-image').click()">
                        <p>🖼️ Click to upload test image</p>
                        <p class="file-info">Supports JPG, PNG formats</p>
                        <input type="file" id="test-image" accept="image/*" style="display: none;" onchange="handleTestImageUpload(event)">
                    </div>
                    <div id="test-image-status" class="status" style="display: none;"></div>
                </div>
                
                <div class="form-group">
                    <label>Confidence Threshold:</label>
                    <input type="range" id="confidence" min="0.1" max="0.9" step="0.1" value="0.5">
                    <span id="confidence-value">0.5</span>
                </div>
                
                <button class="btn btn-danger" onclick="testModel()">🔍 Test Model</button>
                <div id="test-results" class="status" style="display: none;"></div>
            </div>
        </div>
    </div>

    <script>
        let currentVideoPath = '';
        let currentTestImagePath = '';
        
        // Video upload handling
        function handleVideoUpload(event) {
            const file = event.target.files[0];
            if (file) {
                currentVideoPath = file.name;
                showStatus('video-status', `Video selected: ${file.name}`, 'success');
            }
        }
        
        // Test image upload handling
        function handleTestImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                currentTestImagePath = file.name;
                showStatus('test-image-status', `Test image selected: ${file.name}`, 'success');
            }
        }
        
        // Extract frames
        async function extractFrames() {
            if (!currentVideoPath) {
                showStatus('extraction-status', 'Please select a video file first', 'error');
                return;
            }
            
            const areas = [];
            if (document.getElementById('area-ball').checked) areas.push('ball');
            if (document.getElementById('area-player').checked) areas.push('player');
            if (document.getElementById('area-court').checked) areas.push('court_lines');
            if (document.getElementById('area-hoop').checked) areas.push('hoop');
            
            if (areas.length === 0) {
                showStatus('extraction-status', 'Please select at least one basketball area', 'error');
                return;
            }
            
            const maxFrames = document.getElementById('max-frames').value;
            
            showStatus('extraction-status', 'Extracting frames...', 'info');
            
            try {
                const response = await fetch('/api/extract-frames', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        video_path: currentVideoPath,
                        areas: areas,
                        max_frames_per_area: parseInt(maxFrames)
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showStatus('extraction-status', result.message, 'success');
                    refreshStats();
                } else {
                    showStatus('extraction-status', result.message, 'error');
                }
            } catch (error) {
                showStatus('extraction-status', `Error: ${error.message}`, 'error');
            }
        }
        
        // Start training
        async function startTraining() {
            const epochs = document.getElementById('epochs').value;
            const batchSize = document.getElementById('batch-size').value;
            const imgSize = document.getElementById('img-size').value;
            const device = document.getElementById('device').value;
            
            showStatus('training-status', 'Starting training...', 'info');
            
            try {
                const response = await fetch('/api/start-training', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        epochs: parseInt(epochs),
                        batch_size: parseInt(batchSize),
                        img_size: parseInt(imgSize),
                        device: device
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showStatus('training-status', result.message, 'success');
                } else {
                    showStatus('training-status', result.message, 'error');
                }
            } catch (error) {
                showStatus('training-status', `Error: ${error.message}`, 'error');
            }
        }
        
        // Test model
        async function testModel() {
            if (!currentTestImagePath) {
                showStatus('test-results', 'Please select a test image first', 'error');
                return;
            }
            
            const confidence = document.getElementById('confidence').value;
            
            showStatus('test-results', 'Testing model...', 'info');
            
            try {
                const response = await fetch('/api/test-model', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_path: currentTestImagePath,
                        model_path: 'training/models/best.pt',
                        confidence: parseFloat(confidence)
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showStatus('test-results', result.message, 'success');
                } else {
                    showStatus('test-results', result.message, 'error');
                }
            } catch (error) {
                showStatus('test-results', `Error: ${error.message}`, 'error');
            }
        }
        
        // Refresh statistics
        async function refreshStats() {
            try {
                const response = await fetch('/api/dataset-stats');
                const stats = await response.json();
                
                document.getElementById('total-frames').textContent = stats.total_frames;
                document.getElementById('ball-frames').textContent = stats.area_breakdown.ball || 0;
                document.getElementById('player-frames').textContent = stats.area_breakdown.player || 0;
                document.getElementById('court-frames').textContent = stats.area_breakdown.court_lines || 0;
                document.getElementById('hoop-frames').textContent = stats.area_breakdown.hoop || 0;
            } catch (error) {
                console.error('Error refreshing stats:', error);
            }
        }
        
        // Show status message
        function showStatus(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.className = `status ${type}`;
            element.textContent = message;
            element.style.display = 'block';
        }
        
        // Update confidence threshold display
        document.getElementById('confidence').addEventListener('input', function() {
            document.getElementById('confidence-value').textContent = this.value;
        });
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            refreshStats();
        });
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def get_ui():
    """Serve the simplified UI."""
    return HTMLResponse(content=HTML_TEMPLATE)

@app.post("/api/extract-frames")
async def extract_frames(request: FrameExtractionRequest):
    """Extract frames for specific basketball areas."""
    result = training_manager.extract_frames(request)
    return JSONResponse(content=result)

@app.post("/api/start-training")
async def start_training(request: TrainingRequest):
    """Start YOLOv8 training."""
    result = training_manager.start_training(request)
    return JSONResponse(content=result)

@app.post("/api/test-model")
async def test_model(request: TestRequest):
    """Test trained model on image."""
    result = training_manager.test_model(request)
    return JSONResponse(content=result)

@app.get("/api/dataset-stats")
async def get_dataset_stats():
    """Get dataset statistics."""
    stats = training_manager.get_dataset_stats()
    return JSONResponse(content=stats)

@app.get("/api/training-status")
async def get_training_status():
    """Get training status."""
    status = training_manager.get_training_status()
    return JSONResponse(content=status)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Simple YOLOv8 Training UI"}

if __name__ == "__main__":
    print("🚀 Starting Simple YOLOv8 Basketball Training UI...")
    print("📱 Open your browser and go to: http://localhost:8003")
    print("🏀 Essential features only - focused on your project!")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8003,
        log_level="info"
    )
