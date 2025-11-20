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
            
            # Initialize AI Coach
            # LLaMA 3.1 requires Hugging Face authentication for gated models
            # Skip it if not authenticated to avoid errors
            try:
                import os
                from huggingface_hub import whoami
                
                # Quick check: Is user authenticated with Hugging Face?
                try_llama = False
                try:
                    user_info = whoami()
                    if user_info:
                        try_llama = True
                        logger.info(f"✅ Hugging Face authenticated - will try LLaMA 3.1")
                except Exception:
                    # Not authenticated - skip LLaMA entirely
                    logger.info("ℹ️  Hugging Face not authenticated")
                    logger.info("   💡 LLaMA 3.1 requires authentication (gated model)")
                    logger.info("   🔄 Using rule-based AI Coach (no authentication needed)")
                    try_llama = False
                
                # Try LLaMA 3.1 only if authenticated
                if try_llama:
                    try:
                        import torch
                        if torch.cuda.is_available():
                            vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                            if vram_gb >= 40:
                                model_name = "meta-llama/Meta-Llama-3.1-70B-Instruct"
                                logger.info(f"   Using LLaMA 3.1 70B (VRAM: {vram_gb:.1f}GB)")
                            else:
                                model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"
                                logger.info(f"   Using LLaMA 3.1 8B (VRAM: {vram_gb:.1f}GB)")
                        else:
                            model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"
                            logger.info("   Using LLaMA 3.1 8B (CPU mode)")
                        
                        self.ai_coach = AICoach(model_type="llama", model_name=model_name)
                        logger.info("✅ AI Coach initialized with LLaMA 3.1")
                    except Exception as llama_error:
                        error_str = str(llama_error)
                        if "gated" in error_str.lower() or "401" in error_str or "access" in error_str.lower():
                            logger.warning("⚠️  LLaMA model access denied (requires model access approval)")
                            logger.info("   🔄 Falling back to rule-based mode")
                        else:
                            logger.warning(f"⚠️  LLaMA initialization failed: {error_str[:150]}")
                            logger.info("   🔄 Falling back to rule-based mode")
                        try_llama = False
                
                # If LLaMA didn't work, try API alternatives or use fallback
                if not try_llama:
                    # Try DeepSeek API (if key available)
                    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
                    if deepseek_key:
                        try:
                            self.ai_coach = AICoach(model_type="deepseek", model_name="deepseek-chat", api_key=deepseek_key)
                            logger.info("✅ AI Coach initialized with DeepSeek API")
                        except Exception:
                            pass  # Fall through to next option
                    
                    # Try OpenAI API (if key available)
                    if self.ai_coach is None:
                        openai_key = os.getenv("OPENAI_API_KEY")
                        if openai_key:
                            try:
                                self.ai_coach = AICoach(model_type="openai", model_name="gpt-4o-mini", api_key=openai_key)
                                logger.info("✅ AI Coach initialized with OpenAI")
                            except Exception:
                                pass  # Fall through to fallback
                    
                    # Use fallback (rule-based, always works)
                    if self.ai_coach is None:
                        self.ai_coach = AICoach(model_type="fallback")
                        logger.info("✅ AI Coach initialized with rule-based mode (no API/authentication needed)")
                        
            except Exception as e:
                logger.warning(f"⚠️  AI Coach initialization error: {str(e)[:150]}")
                self.ai_coach = AICoach(model_type="fallback")
                logger.info("✅ AI Coach initialized with fallback mode")
            
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
        
        # Map model class names to schema class names
        def map_probabilities(model_probs: Dict[str, float]) -> Dict[str, float]:
            """Map model class names to schema class names"""
            # Model uses: free_throw_shot, 2point_shot, 3point_shot, dribbling, passing, defense, idle
            # Schema expects: free_throw, two_point_shot, three_point_shot, layup, dunk, dribbling, 
            #                 passing, defense, running, walking, blocking, picking, ball_in_hand, idle
            mapping = {
                # Shooting types
                "free_throw_shot": "free_throw",
                "2point_shot": "two_point_shot",
                "3point_shot": "three_point_shot",
                # Ball handling
                "dribbling": "dribbling",
                "passing": "passing",
                # Movement
                "defense": "defense",
                # Other
                "idle": "idle",
            }
            
            # Initialize all schema fields with 0.0
            schema_probs = {
                "free_throw": 0.0,
                "two_point_shot": 0.0,
                "three_point_shot": 0.0,
                "layup": 0.0,
                "dunk": 0.0,
                "dribbling": 0.0,
                "passing": 0.0,
                "defense": 0.0,
                "running": 0.0,
                "walking": 0.0,
                "blocking": 0.0,
                "picking": 0.0,
                "ball_in_hand": 0.0,
                "idle": 0.0,
            }
            
            # Map model probabilities to schema
            for model_key, prob_value in model_probs.items():
                schema_key = mapping.get(model_key, None)
                if schema_key:
                    schema_probs[schema_key] = prob_value
                else:
                    # If unknown class, log it but don't fail
                    logger.debug(f"Unknown model class: {model_key}, skipping")
            
            return schema_probs
        
        # Map probabilities to schema format
        mapped_probabilities = map_probabilities(probabilities)
        
        # Create response
        result = VideoAnalysisResult(
            video_id=video_id,
            action=ActionClassification(
                label=action_label,
                confidence=confidence,
                probabilities=ActionProbabilities(**mapped_probabilities)
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

