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
from app.core.schemas import VideoAnalysisResult, ActionClassification, PerformanceMetrics, ActionProbabilities, Recommendation, ShotOutcome, TimelineSegment

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
    
    def _draw_annotations(self, frame: np.ndarray, detections: List[Dict], pose_landmarks) -> np.ndarray:
        """Draw bounding boxes and pose landmarks on frame"""
        annotated_frame = frame.copy()
        
        # Draw pose landmarks
        if pose_landmarks:
            self.mp_drawing.draw_landmarks(
                annotated_frame,
                pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
            )
            
        # Draw bounding boxes
        for det in detections:
            bbox = det['bbox']
            conf = det['confidence']
            cls = det['class']
            
            x1, y1, x2, y2 = map(int, bbox)
            
            # Draw box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label = f"{cls} {conf:.2f}"
            cv2.putText(annotated_frame, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                       
        return annotated_frame

    async def process_video(self, video_path: str) -> VideoAnalysisResult:
        """
        Process video file and return analysis results
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")
            
        # Video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Prepare output video
        output_filename = f"processed_{os.path.basename(video_path)}"
        output_path = os.path.join(os.path.dirname(video_path), output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frames_buffer = []
        all_detections = []
        all_metrics = []
        timeline = []
        
        frame_count = 0
        window_size = settings.SEQUENCE_LENGTH
        stride = 8  # Overlap windows
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # Process frame for detection
                # YOLO Detection
                results = self.yolo_model(frame, verbose=False)[0]
                detections = []
                
                for box in results.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # Filter for person class (usually 0 in COCO)
                    if cls == 0 and conf > settings.CONFIDENCE_THRESHOLD:
                        detections.append({
                            "bbox": box.xyxy[0].tolist(),
                            "confidence": conf,
                            "class": "player"
                        })
                
                # Pose Estimation
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pose_results = self.pose_model.process(frame_rgb)
                
                # Draw annotations
                annotated_frame = self._draw_annotations(frame, detections, pose_results.pose_landmarks)
                out.write(annotated_frame)
                
                if pose_results.pose_landmarks:
                    # Extract keypoints
                    keypoints = []
                    for landmark in pose_results.pose_landmarks.landmark:
                        keypoints.append([landmark.x, landmark.y, landmark.z])
                    
                    frames_buffer.append(keypoints)
                    all_detections.append(detections)
                else:
                    # If no pose detected, append None or handle gracefully
                    # For sequence processing, we need continuous frames
                    # If we skip, the sequence is broken.
                    # Let's append empty keypoints but mark as invalid?
                    # Or just skip this frame for action classification but keep for timeline?
                    pass
                
                # Process window if buffer is full
                if len(frames_buffer) >= window_size:
                    # Create window
                    window = np.array(frames_buffer[-window_size:])
                    
                    # Action Classification
                    action_probs = self._classify_action(window)
                    action_label = self._get_action_label(action_probs)
                    
                    # Calculate Metrics for this window
                    window_metrics = self._calculate_metrics(window)
                    all_metrics.append(window_metrics)
                    
                    # Add to timeline
                    timestamp = frame_count / fps
                    timeline.append(TimelineSegment(
                        start_time=max(0, timestamp - (window_size/fps)),
                        end_time=timestamp,
                        action=action_label,
                        confidence=float(np.max(action_probs)),
                        metrics=window_metrics
                    ))
                    
                    # Slide window
                    frames_buffer = frames_buffer[stride:]
                
                frame_count += 1
                
        finally:
            cap.release()
            out.release()
            
        if not timeline:
            raise ValueError("Insufficient frames with detected poses to analyze video")
            
        # Aggregate results
        # Find most frequent action
        # Generate recommendations
        recommendations = self.ai_coach.analyze_performance(
            {
                "label": main_action,
                "confidence": avg_confidence,
                "probabilities": {} # We could aggregate probs too if needed
            },
            avg_metrics
        )
        # Detect shot outcome if applicable
        shot_outcome = None
        if "shot" in main_action:
            shot_outcome = self._detect_shot_outcome(all_detections)

        # Upload annotated video to Supabase if available
        annotated_video_url = None
        try:
            from app.services.supabase_service import supabase_service
            if supabase_service.enabled:
                annotated_video_url = supabase_service.upload_video(output_path, output_filename)
        except Exception as e:
            logger.error(f"Failed to upload annotated video: {e}")

        return VideoAnalysisResult(
            action={
                "label": main_action,
                "confidence": float(avg_confidence),
                "probabilities": {} # Simplified
            },
            metrics=avg_metrics,
            recommendations=recommendations,
            shot_outcome=shot_outcome,
            timeline=timeline,
            annotated_video_url=annotated_video_url
        )


    def _map_probabilities(self, model_probs: Dict[str, float]) -> Dict[str, float]:
        """Map model class names to schema class names"""
        mapping = {
            "free_throw_shot": "free_throw",
            "2point_shot": "two_point_shot",
            "3point_shot": "three_point_shot",
            "dribbling": "dribbling",
            "passing": "passing",
            "defense": "defense",
            "idle": "idle",
        }
        
        schema_probs = {
            "free_throw": 0.0, "two_point_shot": 0.0, "three_point_shot": 0.0,
            "layup": 0.0, "dunk": 0.0, "dribbling": 0.0, "passing": 0.0,
            "defense": 0.0, "running": 0.0, "walking": 0.0,
            "blocking": 0.0, "picking": 0.0, "ball_in_hand": 0.0, "idle": 0.0,
        }
        
        for model_key, prob_value in model_probs.items():
            schema_key = mapping.get(model_key, None)
            if schema_key:
                schema_probs[schema_key] = prob_value
        
        return schema_probs

    def _aggregate_metrics(self, segments: List[TimelineSegment]) -> PerformanceMetrics:
        """Average metrics across segments"""
        if not segments:
            return PerformanceMetrics(
                jump_height=0.0, movement_speed=0.0, form_score=0.0,
                reaction_time=0.0, pose_stability=0.0, energy_efficiency=0.0
            )
        
        count = len(segments)
        return PerformanceMetrics(
            jump_height=sum(s.metrics.jump_height for s in segments) / count,
            movement_speed=sum(s.metrics.movement_speed for s in segments) / count,
            form_score=sum(s.metrics.form_score for s in segments) / count,
            reaction_time=sum(s.metrics.reaction_time for s in segments) / count,
            pose_stability=sum(s.metrics.pose_stability for s in segments) / count,
            energy_efficiency=sum(s.metrics.energy_efficiency for s in segments) / count,
        )

    async def process_sequence(self, frames: List[np.ndarray]) -> Optional[VideoAnalysisResult]:
        """
        Process a sequence of frames (real-time)
        """
        if not frames:
            return None
            
        # Extract keypoints for all frames
        all_keypoints = []
        valid_frames = []
        
        for frame in frames:
            # Detect player
            detections = self.player_detector.detect_players(frame, return_largest=True)
            if detections:
                bbox = detections[0][:4]
                roi = self.player_detector.extract_roi(frame, bbox)
                pose_result = self.pose_extractor.extract_keypoints(roi)
                
                if pose_result:
                    keypoints_2d, _, _ = pose_result
                    all_keypoints.append(keypoints_2d)
                    valid_frames.append(cv2.cvtColor(roi, cv2.COLOR_BGR2RGB))
        
        if len(valid_frames) < 8: # Minimum frames for valid analysis
            return None
            
        # Classify action
        action_label, confidence, probabilities = self.action_classifier.classify(
            valid_frames,
            return_probabilities=True
        )
        
        # Compute metrics
        metrics_dict = self.metrics_engine.compute_all_metrics(
            all_keypoints,
            action_label
        )
        
        # Map probabilities
        mapped_probs = self._map_probabilities(probabilities)
        
        # Create result (simplified for real-time)
        result = VideoAnalysisResult(
            video_id="realtime",
            action=ActionClassification(
                label=action_label,
                confidence=confidence,
                probabilities=ActionProbabilities(**mapped_probs)
            ),
            metrics=PerformanceMetrics(**metrics_dict),
            recommendations=[], # Skip recommendations for real-time to save time
            timestamp=datetime.now()
        )
        
        return result
