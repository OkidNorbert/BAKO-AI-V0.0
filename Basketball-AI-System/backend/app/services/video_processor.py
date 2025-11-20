"""
Video Processing Service
Combines YOLO detection + Pose extraction + Action classification + Metrics
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
import logging
from datetime import datetime
import uuid

from app.models.yolo_detector import PlayerDetector
from app.models.pose_extractor import PoseExtractor
from app.models.action_classifier import ActionClassifier
from app.models.metrics_engine import PerformanceMetricsEngine
from app.models.shot_outcome_detector import ShotOutcomeDetector
from app.models.ai_coach import AICoach
from app.core.schemas import VideoAnalysisResult, ActionClassification, PerformanceMetrics, ActionProbabilities, Recommendation, ShotOutcome

logger = logging.getLogger(__name__)


class VideoProcessor:
    """
    Main video processing pipeline
    Improved from Basketball-Action-Recognition project with:
    - Automatic player detection (YOLOv11)
    - Modern action classification (VideoMAE)
    - Performance metrics (NEW!)
    """
    
    def __init__(self):
        """Initialize all AI models"""
        logger.info("🚀 Initializing Video Processor...")
        
        try:
            self.player_detector = PlayerDetector()
            self.pose_extractor = PoseExtractor()
            
            # Try to load trained model first (if available)
            project_root = Path(__file__).parent.parent.parent.parent
            trained_model_path = project_root / "models" / "best_model"
            if trained_model_path.exists():
                logger.info(f"📂 Found trained model at: {trained_model_path}")
                self.action_classifier = ActionClassifier(model_path=str(trained_model_path))
            else:
                logger.info("📂 No trained model found, using pre-trained VideoMAE")
                self.action_classifier = ActionClassifier()
            
            self.metrics_engine = PerformanceMetricsEngine()
            self.shot_outcome_detector = ShotOutcomeDetector()
            
            # Initialize AI Coach (try LLaMA 3.1 first - BEST! Open-source, offline, free!)
            try:
                import os
                
                # Try LLaMA 3.1 first (Open-source, offline, FREE!)
                try:
                    # Use 8B model (smaller, faster) or 70B (better quality, needs more RAM)
                    # Check available RAM/VRAM to decide
                    import torch
                    if torch.cuda.is_available():
                        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                        if vram_gb >= 40:  # Can handle 70B with quantization
                            model_name = "meta-llama/Meta-Llama-3.1-70B-Instruct"
                            logger.info(f"   Using LLaMA 3.1 70B (VRAM: {vram_gb:.1f}GB)")
                        else:
                            model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"
                            logger.info(f"   Using LLaMA 3.1 8B (VRAM: {vram_gb:.1f}GB)")
                    else:
                        model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"
                        logger.info("   Using LLaMA 3.1 8B (CPU mode)")
                    
                    self.ai_coach = AICoach(model_type="llama", model_name=model_name)
                    logger.info("✅ AI Coach initialized with LLaMA 3.1 (Open-source, offline, FREE!)")
                except Exception as llama_error:
                    logger.warning(f"⚠️  LLaMA 3.1 not available: {llama_error}")
                    logger.info("   Trying alternative models...")
                    
                    # Try DeepSeek as backup (API-based, free/cheap)
                    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
                    if deepseek_key:
                        self.ai_coach = AICoach(model_type="deepseek", model_name="deepseek-chat", api_key=deepseek_key)
                        logger.info("✅ AI Coach initialized with DeepSeek (FREE/Cheap API!)")
                    else:
                        # Try OpenAI as backup
                        openai_key = os.getenv("OPENAI_API_KEY")
                        if openai_key:
                            self.ai_coach = AICoach(model_type="openai", model_name="gpt-4o-mini", api_key=openai_key)
                            logger.info("✅ AI Coach initialized with OpenAI")
                        else:
                            # Use fallback (rule-based, works without API)
                            self.ai_coach = AICoach(model_type="fallback")
                            logger.info("✅ AI Coach initialized with fallback mode (no API key needed)")
            except Exception as e:
                logger.warning(f"⚠️  AI Coach initialization failed: {e}. Using fallback mode.")
                self.ai_coach = AICoach(model_type="fallback")
            
            logger.info("✅ All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize models: {e}")
            raise
    
    async def process_video(
        self,
        video_path: str,
        target_fps: int = 10
    ) -> VideoAnalysisResult:
        """
        Process video and extract all analysis
        
        Args:
            video_path: Path to video file
            target_fps: Target FPS for processing (10 = 1 frame every 0.1s)
            
        Returns:
            VideoAnalysisResult with complete analysis
        """
        video_id = str(uuid.uuid4())
        logger.info(f"🎬 Processing video: {video_id}")
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate frame skip for target FPS
        frame_skip = max(1, int(fps / target_fps))
        
        # Storage
        all_frames = []
        all_keypoints = []
        frame_idx = 0
        processed_frames = 0
        
        logger.info(f"   Video FPS: {fps}, Total frames: {total_frames}")
        logger.info(f"   Processing every {frame_skip} frames (target {target_fps} FPS)")
        
        while cap.isOpened() and processed_frames < 60:  # Limit to ~6 seconds
            ret, frame = cap.read()
            if not ret:
                break
            
            # Skip frames to match target FPS
            if frame_idx % frame_skip != 0:
                frame_idx += 1
                continue
            
            # Step 1: Detect player with YOLOv11
            detections = self.player_detector.detect_players(frame, return_largest=True)
            
            if detections:
                bbox = detections[0][:4]
                
                # Step 2: Extract ROI
                roi = self.player_detector.extract_roi(frame, bbox)
                
                # Step 3: Extract pose from ROI
                pose_result = self.pose_extractor.extract_keypoints(roi)
                
                if pose_result:
                    keypoints_2d, keypoints_3d, confidence = pose_result
                    
                    # Store for action classification
                    rgb_frame = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
                    all_frames.append(rgb_frame)
                    all_keypoints.append(keypoints_2d)
                    
                    processed_frames += 1
            
            frame_idx += 1
        
        cap.release()
        
        logger.info(f"   Extracted {processed_frames} frames with poses")
        
        if len(all_frames) < 8:
            raise ValueError("Insufficient frames with detected poses. Please ensure player is clearly visible.")
        
        # Step 4: Classify action using VideoMAE/TimeSformer
        action_label, confidence, probabilities = self.action_classifier.classify(
            all_frames,
            return_probabilities=True
        )
        
        logger.info(f"   🎯 Action detected: {action_label} ({confidence*100:.1f}%)")
        
        # Step 5: Compute performance metrics (NEW!)
        metrics_dict = self.metrics_engine.compute_all_metrics(
            all_keypoints,
            action_label
        )
        
        logger.info(f"   📊 Metrics calculated: Jump={metrics_dict['jump_height']:.2f}m, Speed={metrics_dict['movement_speed']:.1f}m/s")
        
        # Step 6: Detect shot outcome (for shooting actions)
        shot_outcome_dict = self.shot_outcome_detector.detect_outcome(
            all_frames,
            all_keypoints,
            action_label,
            metrics_dict['form_score'],
            metrics_dict
        )
        
        shot_outcome_obj = None
        if shot_outcome_dict['outcome'] != 'not_applicable':
            shot_outcome_obj = ShotOutcome(**shot_outcome_dict)
            logger.info(f"   🎯 Shot outcome: {shot_outcome_dict['outcome']} ({shot_outcome_dict['confidence']*100:.1f}%) via {shot_outcome_dict['method']}")
        
        # Step 7: Generate AI-powered recommendations (replaces hardcoded)
        try:
            recommendations_list = self.ai_coach.generate_initial_recommendations(
                action_label,
                metrics_dict,
                shot_outcome_dict if shot_outcome_dict['outcome'] != 'not_applicable' else None
            )
            logger.info("   🤖 AI Coach generated personalized recommendations")
        except Exception as e:
            logger.warning(f"   ⚠️  AI Coach failed: {e}. Using fallback recommendations.")
            # Fallback to metrics engine
            recommendations_list = self.metrics_engine.generate_recommendations(
                metrics_dict,
                action_label
            )
        
        # Create response
        result = VideoAnalysisResult(
            video_id=video_id,
            action=ActionClassification(
                label=action_label,
                confidence=confidence,
                probabilities=ActionProbabilities(**probabilities)
            ),
            metrics=PerformanceMetrics(**metrics_dict),
            recommendations=[
                Recommendation(**rec) for rec in recommendations_list
            ],
            shot_outcome=shot_outcome_obj,
            timestamp=datetime.now()
        )
        
        logger.info(f"✅ Analysis complete for {video_id}")
        
        return result

