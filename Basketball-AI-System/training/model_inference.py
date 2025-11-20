"""
Model Inference Helper for Training GUI
Loads trained VideoMAE model and performs real inference
"""

import torch
import numpy as np
import cv2
from pathlib import Path
from typing import List, Tuple, Dict, Optional
import logging
import json

logger = logging.getLogger(__name__)


class ModelInference:
    """Load and use trained VideoMAE model for inference"""
    
    def __init__(self, model_dir: Path):
        """
        Initialize model inference
        
        Args:
            model_dir: Directory containing trained model files
        """
        self.model_dir = Path(model_dir)
        self.model = None
        self.processor = None
        self.class_names = [
            "free_throw_shot", "2point_shot", "3point_shot",
            "dribbling", "passing", "defense", "idle"
        ]
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.load_model()
    
    def load_model(self) -> bool:
        """Load trained model from disk"""
        try:
            from transformers import VideoMAEForVideoClassification, VideoMAEImageProcessor
            
            # Check for model files
            model_path = self.model_dir / "best_model"
            model_pth = self.model_dir / "best_model.pth"
            model_info = self.model_dir / "model_info.json"
            
            # Load model info
            if model_info.exists():
                with open(model_info, 'r') as f:
                    info = json.load(f)
                    self.class_names = info.get('categories', self.class_names)
            
            # Try loading from directory first (VideoMAE format)
            if model_path.exists():
                logger.info(f"Loading model from {model_path}")
                self.processor = VideoMAEImageProcessor.from_pretrained(
                    str(model_path)
                )
                self.model = VideoMAEForVideoClassification.from_pretrained(
                    str(model_path)
                )
            # Try loading from .pth file (PyTorch state dict)
            elif model_pth.exists():
                logger.info(f"Loading model from {model_pth}")
                # Load base model
                base_model_name = "MCG-NJU/videomae-base-finetuned-kinetics"
                self.processor = VideoMAEImageProcessor.from_pretrained(base_model_name)
                self.model = VideoMAEForVideoClassification.from_pretrained(
                    base_model_name,
                    num_labels=len(self.class_names),
                    ignore_mismatched_sizes=True
                )
                # Load trained weights
                state_dict = torch.load(model_pth, map_location=self.device)
                self.model.load_state_dict(state_dict)
            else:
                logger.warning("No trained model found, using pre-trained base model")
                base_model_name = "MCG-NJU/videomae-base-finetuned-kinetics"
                self.processor = VideoMAEImageProcessor.from_pretrained(base_model_name)
                self.model = VideoMAEForVideoClassification.from_pretrained(
                    base_model_name,
                    num_labels=len(self.class_names),
                    ignore_mismatched_sizes=True
                )
            
            self.model.to(self.device)
            self.model.eval()
            logger.info(f"✅ Model loaded on {self.device}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False
    
    def load_video_frames(self, video_path: str, num_frames: int = 16) -> List[np.ndarray]:
        """
        Load frames from video
        
        Args:
            video_path: Path to video file
            num_frames: Number of frames to extract
            
        Returns:
            List of RGB frames
        """
        cap = cv2.VideoCapture(str(video_path))
        frames = []
        
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        if total_frames == 0:
            raise ValueError(f"Video has no frames: {video_path}")
        
        # Sample frames uniformly
        frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
        
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if ret:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
        
        cap.release()
        
        # Pad if necessary
        while len(frames) < num_frames:
            frames.append(frames[-1] if frames else np.zeros((224, 224, 3), dtype=np.uint8))
        
        return frames[:num_frames]
    
    def predict(
        self,
        video_path: str,
        return_probabilities: bool = True
    ) -> Tuple[str, float, Dict[str, float]]:
        """
        Predict action from video
        
        Args:
            video_path: Path to video file
            return_probabilities: Return all class probabilities
            
        Returns:
            Tuple of (predicted_action, confidence, probabilities_dict)
        """
        if self.model is None or self.processor is None:
            raise ValueError("Model not loaded! Call load_model() first.")
        
        # Load frames
        frames = self.load_video_frames(video_path)
        
        # Process with VideoMAE
        inputs = self.processor(frames, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Predict
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
        
        # Get probabilities
        probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]
        
        # Get predicted class
        pred_idx = np.argmax(probs)
        confidence = float(probs[pred_idx])
        predicted_action = self.class_names[pred_idx]
        
        # Create probabilities dict
        probabilities_dict = {}
        if return_probabilities:
            for i, class_name in enumerate(self.class_names):
                probabilities_dict[class_name] = float(probs[i])
        
        return predicted_action, confidence, probabilities_dict


