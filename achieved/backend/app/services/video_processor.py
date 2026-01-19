"""
Video Processing Service
Combines YOLO detection + Pose extraction + Action classification + Metrics
"""

import cv2
import numpy as np
import os
import base64
import mediapipe as mp
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime
import uuid
import subprocess
import shutil
import copy

from app.core.config import settings

from app.models.yolo_detector import PlayerDetector
from app.models.pose_extractor import PoseExtractor
from app.models.action_classifier import ActionClassifier
from app.models.metrics_engine import PerformanceMetricsEngine
from app.models.shot_outcome_detector import ShotOutcomeDetector
from app.models.ai_coach import AICoach
from app.models.court_detector import CourtDetector
from app.models.form_quality_analyzer import FormQualityAnalyzer
from app.models.action_segmenter import ActionSegmenter
from app.models.pose_normalizer import PoseNormalizer, PoseSmoother
from app.models.biomechanics_engine import BiomechanicsEngine
from app.models.rule_based_evaluator import RuleBasedEvaluator
from app.core.schemas import VideoAnalysisResult, ActionClassification, PerformanceMetrics, ActionProbabilities, Recommendation, ShotOutcome, TimelineSegment, FormQualityAssessment, FormQualityIssue

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
            
            # Expose underlying models for full-frame processing
            self.yolo_model = self.player_detector.model
            self.pose_model = self.pose_extractor.pose
            self.mp_drawing = self.pose_extractor.mp_drawing
            self.mp_pose = self.pose_extractor.mp_pose
            self.mp_drawing_styles = mp.solutions.drawing_styles
            
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
            self.court_detector = CourtDetector()
            self.form_quality_analyzer = FormQualityAnalyzer()
            
            # Enhanced components for coaching pipeline
            self.action_segmenter = ActionSegmenter(window_size=settings.SEQUENCE_LENGTH, stride=8, smoothing_method='median')
            self.pose_normalizer = PoseNormalizer()
            self.pose_smoother = PoseSmoother(method='one_euro', beta=0.1)
            self.biomechanics_engine = BiomechanicsEngine(fps=30.0)  # Will be updated with actual fps
            
            # Frame-level action tracking for temporal smoothing
            self.frame_action_buffer = []  # Store recent frame predictions
            self.frame_buffer_size = 15  # ~0.5 seconds at 30fps for smoothing
            self.rule_based_evaluator = RuleBasedEvaluator()
            
            # Initialize AI Coach
            # LLaMA 3.1 requires Hugging Face authentication for gated models
            # Skip it if not authenticated to avoid errors
            # Initialize to None first to ensure attribute exists
            self.ai_coach = None
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
                if not try_llama or self.ai_coach is None:
                    # Try DeepSeek API (if key available)
                    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
                    if deepseek_key and self.ai_coach is None:
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
                # Ensure ai_coach is always set, even if initialization fails
                if self.ai_coach is None:
                    try:
                        self.ai_coach = AICoach(model_type="fallback")
                        logger.info("✅ AI Coach initialized with fallback mode")
                    except Exception as fallback_error:
                        logger.error(f"❌ Failed to initialize fallback AI Coach: {fallback_error}")
                        # Set to None if even fallback fails (shouldn't happen, but be safe)
                        self.ai_coach = None
            
            logger.info("✅ All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize models: {e}")
            raise
    
    def _draw_annotations(
        self, 
        frame: np.ndarray, 
        detections: List[Dict], 
        pose_landmarks,
        basketball_detections: List[Dict] = None,
        court_info: Dict = None,
        hoop_info: Dict = None,
        current_action: Optional[str] = None,
        action_confidence: float = 0.0,
        form_quality: Optional[FormQualityAssessment] = None
    ) -> np.ndarray:
        """Draw bounding boxes, pose landmarks, and action labels on frame"""
        annotated_frame = frame.copy()
        
        # Draw pose landmarks
        if pose_landmarks:
            self.mp_drawing.draw_landmarks(
                annotated_frame,
                pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
            )
            
        # Draw player bounding boxes (green)
        for det in detections:
            bbox = det['bbox']
            conf = det['confidence']
            cls = det['class']
            
            x1, y1, x2, y2 = map(int, bbox)
            
            # Draw box (green for players)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label = f"{cls} {conf:.2f}"
            cv2.putText(annotated_frame, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Draw basketball bounding boxes (orange/red)
        if basketball_detections:
            for det in basketball_detections:
                bbox = det['bbox']
                conf = det['confidence']
                cls = det['class']
                is_predicted = det.get('predicted', False)
                
                x1, y1, x2, y2 = map(int, bbox)
                
                # Different colors for detected vs predicted
                if is_predicted:
                    # Lighter orange for predicted position
                    color = (0, 200, 255)
                    thickness = 2
                else:
                    # Solid orange for detected
                    color = (0, 165, 255)
                    thickness = 3
                
                # Draw box
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, thickness)
                
                # Draw label
                label = f"{cls} {conf:.2f}"
                if is_predicted:
                    label += " (pred)"
                cv2.putText(annotated_frame, label, (x1, y1 - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                # Draw circle in center to highlight basketball
                center_x = (x1 + x2) // 2
                center_y = (y1 + y2) // 2
                radius = max(5, min((x2 - x1), (y2 - y1)) // 4)
                cv2.circle(annotated_frame, (center_x, center_y), radius, color, 2 if is_predicted else 3)
                
                # Draw shot zone label if available
                if det.get('shot_zone'):
                    zone_label = det['shot_zone'].replace('_', ' ').title()
                    cv2.putText(annotated_frame, zone_label, (x1, y2 + 20), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Draw court lines (filtered and limited for clarity)
        if court_info and court_info.get("lines"):
            lines = court_info["lines"]
            h, w = annotated_frame.shape[:2]
            
            # Filter and draw only the longest, most prominent court lines
            def filter_court_lines(line_list, min_length=150, max_count=8):
                """Filter lines by length and limit count"""
                filtered = []
                for line in line_list:
                    x1, y1, x2, y2 = line
                    length = ((x2-x1)**2 + (y2-y1)**2)**0.5  # Use **0.5 instead of np.sqrt
                    if length >= min_length:
                        filtered.append((line, length))
                # Sort by length and take top N
                filtered.sort(key=lambda x: x[1], reverse=True)
                return [line for line, _ in filtered[:max_count]]
            
            # Draw horizontal lines (court boundaries, center line, free throw line)
            # Only draw long horizontal lines that are likely court boundaries
            horizontal_lines = filter_court_lines(lines.get("horizontal", []), min_length=200, max_count=5)
            for line in horizontal_lines:
                x1, y1, x2, y2 = map(int, line)
                # Only draw if line is reasonably horizontal and long enough
                if abs(y2 - y1) < 20:  # Nearly horizontal
                    cv2.line(annotated_frame, (x1, y1), (x2, y2), (0, 255, 255), 2)  # Yellow
            
            # Draw vertical lines (sidelines) - be more selective
            vertical_lines = filter_court_lines(lines.get("vertical", []), min_length=150, max_count=4)
            for line in vertical_lines:
                x1, y1, x2, y2 = map(int, line)
                # Only draw if line is reasonably vertical
                if abs(x2 - x1) < 20:  # Nearly vertical
                    cv2.line(annotated_frame, (x1, y1), (x2, y2), (255, 255, 0), 2)  # Cyan
            
            # Draw diagonal lines (3-point arc segments) - very selective
            diagonal_lines = filter_court_lines(lines.get("diagonal", []), min_length=100, max_count=6)
            for line in diagonal_lines:
                x1, y1, x2, y2 = map(int, line)
                # Draw diagonal lines (3-point arc, free throw arc)
                cv2.line(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 1)  # Green, thinner
            
            # Draw key points (only if they make sense)
            # Skip key points drawing to reduce clutter - hoop detection is more reliable
        
        # Draw hoop
        if hoop_info:
            center = hoop_info["center"]
            bbox = hoop_info["bbox"]
            center_x, center_y = int(center[0]), int(center[1])
            
            # Draw hoop circle
            x1, y1, x2, y2 = bbox
            radius = max((x2 - x1), (y2 - y1)) // 2
            cv2.circle(annotated_frame, (center_x, center_y), radius, (0, 255, 255), 3)
            
            # Draw hoop label
            cv2.putText(annotated_frame, "HOOP", (center_x - 20, center_y - radius - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        # Draw current action label (REAL-TIME ACTION DETECTION)
        if current_action:
            h, w = annotated_frame.shape[:2]
            
            # Format action label (capitalize, replace underscores)
            action_display = current_action.replace('_', ' ').title()
            
            # Choose color based on action type
            if 'shot' in current_action.lower() or 'free_throw' in current_action.lower() or 'layup' in current_action.lower() or 'dunk' in current_action.lower():
                action_color = (255, 100, 100)  # Red for shooting
            elif 'dribbl' in current_action.lower():
                action_color = (100, 255, 100)  # Green for dribbling
            elif 'pass' in current_action.lower():
                action_color = (100, 100, 255)  # Blue for passing
            elif 'defense' in current_action.lower():
                action_color = (255, 255, 100)  # Yellow for defense
            else:
                action_color = (200, 200, 200)  # Gray for other actions
            
            # Draw action label background box
            label_text = f"{action_display}"
            if action_confidence > 0:
                label_text += f" ({action_confidence:.0%})"
            
            # Calculate text size
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.8
            thickness = 2
            (text_width, text_height), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)
            
            # Position at top-left corner
            padding = 10
            box_x1 = padding
            box_y1 = padding
            box_x2 = box_x1 + text_width + padding * 2
            box_y2 = box_y1 + text_height + padding * 2
            
            # Draw semi-transparent background
            overlay = annotated_frame.copy()
            cv2.rectangle(overlay, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, annotated_frame, 0.4, 0, annotated_frame)
            
            # Draw action label text
            text_y = box_y1 + text_height + padding
            cv2.putText(annotated_frame, label_text, (box_x1 + padding, text_y), 
                       font, font_scale, action_color, thickness)
            
            # Draw form quality indicator if available
            if form_quality:
                quality_rating = form_quality.quality_rating
                if quality_rating == "excellent":
                    quality_color = (0, 255, 0)  # Green
                    quality_text = "✓ Excellent Form"
                elif quality_rating == "good":
                    quality_color = (0, 255, 255)  # Yellow
                    quality_text = "✓ Good Form"
                elif quality_rating == "needs_improvement":
                    quality_color = (0, 165, 255)  # Orange
                    quality_text = "⚠ Needs Improvement"
                else:  # poor
                    quality_color = (0, 0, 255)  # Red
                    quality_text = "✗ Poor Form"
                
                # Draw quality indicator below action label
                quality_y = box_y2 + padding + text_height
                (quality_width, quality_height), _ = cv2.getTextSize(quality_text, font, 0.6, 1)
                quality_box_x2 = box_x1 + quality_width + padding * 2
                quality_box_y2 = quality_y + quality_height + padding
                
                # Draw quality background
                overlay = annotated_frame.copy()
                cv2.rectangle(overlay, (box_x1, box_y2 + padding), (quality_box_x2, quality_box_y2), (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.6, annotated_frame, 0.4, 0, annotated_frame)
                
                # Draw quality text
                cv2.putText(annotated_frame, quality_text, (box_x1 + padding, quality_y + quality_height), 
                           font, 0.6, quality_color, 1)
                
                # Show top issue if form needs improvement
                if form_quality.issues and quality_rating in ["needs_improvement", "poor"]:
                    top_issue = form_quality.issues[0]
                    issue_text = f"Fix: {top_issue.issue_type.replace('_', ' ').title()}"
                    issue_y = quality_box_y2 + padding + quality_height
                    (issue_width, issue_height), _ = cv2.getTextSize(issue_text, font, 0.5, 1)
                    issue_box_x2 = box_x1 + issue_width + padding * 2
                    issue_box_y2 = issue_y + issue_height + padding
                    
                    # Draw issue background
                    overlay = annotated_frame.copy()
                    cv2.rectangle(overlay, (box_x1, quality_box_y2 + padding), (issue_box_x2, issue_box_y2), (0, 0, 0), -1)
                    cv2.addWeighted(overlay, 0.6, annotated_frame, 0.4, 0, annotated_frame)
                    
                    # Draw issue text
                    cv2.putText(annotated_frame, issue_text, (box_x1 + padding, issue_y + issue_height), 
                               font, 0.5, quality_color, 1)
                       
        return annotated_frame

    async def process_video(self, video_path: str, video_id: Optional[str] = None) -> VideoAnalysisResult:
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
        
        logger.info(f"🎥 Processing video: {video_path}")
        logger.info(f"   Properties: {width}x{height} @ {fps}fps, {total_frames} frames")
        
        # Validate video properties including fps
        if width == 0 or height == 0 or total_frames == 0:
            logger.error("❌ Invalid video properties detected")
            raise ValueError("Invalid video file: dimensions or frame count is zero")
        
        # Validate fps to prevent division by zero errors
        if fps <= 0:
            logger.warning(f"⚠️  Invalid or zero FPS detected ({fps}). Using default FPS of 30.")
            fps = 30  # Default to 30 fps for common video formats
        
        # Prepare output video
        output_filename = f"processed_{os.path.basename(video_path)}"
        output_path = os.path.join(os.path.dirname(video_path), output_filename)
        
        # Use H.264 codec for browser compatibility (avc1/h264)
        # Try different codecs in order of preference
        # Note: OpenCV/FFMPEG may print warnings to stderr, but these are non-fatal
        # The codec selection will automatically fall back to working codecs
        fourcc_options = [
            ('avc1', 'H.264 (avc1)'),  # Best browser support
            ('H264', 'H.264 (H264)'),  # Alternative H.264
            ('XVID', 'Xvid'),          # Fallback
            ('mp4v', 'MPEG-4 Part 2')  # Last resort
        ]
        
        out = None
        used_codec = None
        
        # Suppress OpenCV/FFMPEG stderr output during codec selection
        # OpenCV writes directly to file descriptor, so we need FD-level redirection
        import sys
        devnull_fd = None
        original_stderr_fd = None
        
        try:
            # Open /dev/null for writing
            devnull_fd = os.open(os.devnull, os.O_WRONLY)
            # Save original stderr file descriptor
            original_stderr_fd = os.dup(sys.stderr.fileno())
            # Redirect stderr to /dev/null
            os.dup2(devnull_fd, sys.stderr.fileno())
            
            for fourcc_code, codec_name in fourcc_options:
                try:
                    fourcc = cv2.VideoWriter_fourcc(*fourcc_code)
                    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                    if out.isOpened():
                        used_codec = codec_name
                        logger.info(f"✅ Using video codec: {codec_name}")
                        break
                except Exception as e:
                    logger.debug(f"⚠️  Failed to initialize {codec_name}: {e}")
                    if out:
                        out.release()
                    out = None
                    continue
            
            if out is None or not out.isOpened():
                # Final fallback to mp4v
                logger.warning("⚠️  All preferred codecs failed, trying mp4v as last resort")
                try:
                    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                    if out.isOpened():
                        used_codec = 'MPEG-4 Part 2 (fallback)'
                        logger.info(f"✅ Using fallback codec: {used_codec}")
                except Exception as e:
                    logger.error(f"❌ Failed to initialize fallback codec: {e}")
                    raise ValueError("Failed to initialize video writer with any codec")
        finally:
            # Restore original stderr
            if original_stderr_fd is not None:
                os.dup2(original_stderr_fd, sys.stderr.fileno())
                os.close(original_stderr_fd)
            if devnull_fd is not None:
                os.close(devnull_fd)
        
        if not out.isOpened():
            raise ValueError("Failed to initialize video writer with any codec")
        
        frames_buffer = []
        keypoints_buffer = []
        all_detections = []
        all_metrics = []
        timeline = []
        
        # Basketball tracking state
        last_ball_position = None  # (x, y, w, h)
        ball_velocity = None  # (vx, vy)
        frames_without_ball = 0
        MAX_FRAMES_WITHOUT_BALL = 5  # Predict position for 5 frames if detection fails
        
        # Court and hoop detection (detect once per video or periodically)
        court_info = None
        hoop_info = None
        ball_trajectory = []  # Track ball path for shot outcome detection
        court_detection_frame_interval = max(30, fps)  # Detect court every second or 30 frames
        
        frame_count = 0
        window_size = settings.SEQUENCE_LENGTH
        stride = 8  # Overlap windows
        
        # Update biomechanics engine with actual fps
        self.biomechanics_engine.fps = fps
        self.biomechanics_engine.dt = 1.0 / fps
        
        # Track current action and form quality for real-time display
        current_action_label = None
        current_action_confidence = 0.0
        current_form_quality = None
        
        # Store raw keypoints for normalization and biomechanics
        raw_keypoints_buffer = []
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Detect court and hoop periodically (once per second or on first frame)
                # Keep court_info and hoop_info persistent across frames so lines are always drawn
                if frame_count == 0 or frame_count % court_detection_frame_interval == 0:
                    try:
                        new_court_info = self.court_detector.detect_court_lines(frame)
                        new_hoop_info = self.court_detector.detect_hoop(frame)
                        
                        # Update court and hoop info (keep previous if detection fails)
                        if new_court_info and new_court_info.get("lines"):
                            court_info = new_court_info
                            if frame_count == 0 or frame_count % (court_detection_frame_interval * 2) == 0:
                                logger.info(f"🏟️  Court lines detected: {len(court_info.get('lines', {}).get('horizontal', []))} horizontal, {len(court_info.get('lines', {}).get('vertical', []))} vertical")
                        
                        if new_hoop_info:
                            hoop_info = new_hoop_info
                            if frame_count == 0 or frame_count % (court_detection_frame_interval * 2) == 0:
                                logger.info(f"🏀 Hoop detected at {hoop_info['center']}")
                    except Exception as e:
                        logger.debug(f"Court/hoop detection failed: {e}")
                        # Keep previous court_info and hoop_info if detection fails
                    
                # Process frame for detection
                # YOLO Detection - Players
                results = self.yolo_model(frame, verbose=False)[0]
                detections = []
                
                for box in results.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # Filter for person class (0 in COCO)
                    if cls == 0 and conf > settings.CONFIDENCE_THRESHOLD:
                        detections.append({
                            "bbox": box.xyxy[0].tolist(),
                            "confidence": conf,
                            "class": "player"
                        })
                
                # Basketball detection with very low threshold for immediate tracking
                basketball_threshold = 0.15  # Very low threshold for immediate detection
                basketball_results = self.yolo_model(frame, classes=[32], conf=basketball_threshold, verbose=False)[0]
                basketball_detections = []
                current_ball_detected = False
                
                for box in basketball_results.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # Basketball detection (sports ball class 32 in COCO)
                    if cls == 32:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        center_x = (x1 + x2) / 2
                        center_y = (y1 + y2) / 2
                        w = x2 - x1
                        h = y2 - y1
                        
                        # Update tracking state
                        if last_ball_position:
                            # Calculate velocity
                            old_x, old_y = last_ball_position[0], last_ball_position[1]
                            ball_velocity = (center_x - old_x, center_y - old_y)
                        
                        last_ball_position = (center_x, center_y, w, h)
                        frames_without_ball = 0
                        current_ball_detected = True
                        
                        # Track ball trajectory for shot outcome detection
                        ball_trajectory.append((center_x, center_y))
                        if len(ball_trajectory) > 30:  # Keep last 30 positions
                            ball_trajectory.pop(0)
                        
                        # Classify shot type based on court position if available
                        shot_type_from_court = None
                        if hoop_info and court_info:
                            try:
                                shot_type_from_court = self.court_detector.classify_shot_zone(
                                    (center_x, center_y),
                                    hoop_info["center"],
                                    court_info.get("court_zones", {})
                                )
                            except Exception as e:
                                logger.debug(f"Shot zone classification failed: {e}")
                        
                        basketball_detections.append({
                            "bbox": [x1, y1, x2, y2],
                            "confidence": conf,
                            "class": "basketball",
                            "shot_zone": shot_type_from_court
                        })
                
                # If no detection but we have previous position, predict/continue tracking
                if not current_ball_detected and last_ball_position and frames_without_ball < MAX_FRAMES_WITHOUT_BALL:
                    frames_without_ball += 1
                    
                    # Predict position based on velocity
                    if ball_velocity:
                        pred_x = last_ball_position[0] + ball_velocity[0]
                        pred_y = last_ball_position[1] + ball_velocity[1]
                        pred_w = last_ball_position[2]
                        pred_h = last_ball_position[3]
                        
                        # Update predicted position
                        last_ball_position = (pred_x, pred_y, pred_w, pred_h)
                        
                        # Draw predicted position (with lower confidence)
                        x1 = int(pred_x - pred_w / 2)
                        y1 = int(pred_y - pred_h / 2)
                        x2 = int(pred_x + pred_w / 2)
                        y2 = int(pred_y + pred_h / 2)
                        
                        basketball_detections.append({
                            "bbox": [x1, y1, x2, y2],
                            "confidence": 0.3,  # Lower confidence for predicted
                            "class": "basketball",
                            "predicted": True
                        })
                elif not current_ball_detected:
                    # Reset tracking if ball lost for too long
                    if frames_without_ball >= MAX_FRAMES_WITHOUT_BALL:
                        last_ball_position = None
                        ball_velocity = None
                        frames_without_ball = 0
                
                # Pose Estimation
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pose_results = self.pose_model.process(frame_rgb)
                
                # Draw annotations (players + basketballs + court + hoop + current action)
                annotated_frame = self._draw_annotations(
                    frame, 
                    detections, 
                    pose_results.pose_landmarks, 
                    basketball_detections,
                    court_info,
                    hoop_info,
                    current_action=current_action_label,
                    action_confidence=current_action_confidence,
                    form_quality=current_form_quality
                )
                out.write(annotated_frame)
                
                # Send annotated frame via WebSocket if connection exists
                if video_id:
                    try:
                        from app.api.websocket_video import send_annotated_frame_async, has_connection
                        if has_connection(video_id):
                            # Send every Nth frame to reduce bandwidth (e.g., every 3rd frame for ~10fps)
                            if frame_count % 3 == 0:
                                success = await send_annotated_frame_async(video_id, annotated_frame)
                                if success and frame_count % 30 == 0:  # Log every 30 frames sent
                                    logger.debug(f"📡 Sent frame {frame_count} via WebSocket for {video_id}")
                        elif frame_count == 0:
                            logger.info(f"⚠️  No WebSocket connection for {video_id} - frames won't be streamed")
                    except Exception as e:
                        # Don't fail video processing if WebSocket fails
                        if frame_count % 30 == 0:  # Log occasionally
                            logger.debug(f"WebSocket frame send failed: {e}")
                
                # Store frame for action classification
                # Resize to 224x224 for VideoMAE if needed, but classifier handles it?
                # Classifier expects full frames usually, let's store RGB
                frames_buffer.append(frame_rgb)
                
                if pose_results.pose_landmarks:
                    # Extract keypoints
                    keypoints = []
                    for landmark in pose_results.pose_landmarks.landmark:
                        keypoints.append([landmark.x, landmark.y, landmark.z])
                    
                    keypoints_buffer.append(keypoints)
                    all_detections.append(detections)
                else:
                    # If no pose detected, append empty keypoints to keep sync
                    keypoints_buffer.append([])
                    all_detections.append(detections)
                
                # Process window if buffer is full
                if len(frames_buffer) >= window_size:
                    # Create windows
                    frames_window = frames_buffer[-window_size:]
                    keypoints_window = keypoints_buffer[-window_size:]
                    
                    # Action Classification (needs frames)
                    action_probs = self._classify_action(frames_window)
                    action_label = self._get_action_label(action_probs)
                    confidence = float(max(action_probs.values())) if action_probs else 0.0
                    
                    # Enhance action classification with court-based shot zones if available
                    # If model detected a generic "shot", refine it using court position
                    if "shot" in action_label.lower() and basketball_detections and hoop_info and court_info:
                        try:
                            # Get most recent basketball position
                            if basketball_detections and not basketball_detections[-1].get('predicted', False):
                                ball_bbox = basketball_detections[-1]["bbox"]
                                ball_center = ((ball_bbox[0] + ball_bbox[2]) / 2, (ball_bbox[1] + ball_bbox[3]) / 2)
                                
                                # Classify shot zone
                                shot_zone = self.court_detector.classify_shot_zone(
                                    ball_center,
                                    hoop_info["center"],
                                    court_info.get("court_zones", {})
                                )
                                
                                # Override action label with specific shot type
                                if shot_zone in ["free_throw", "two_point", "three_point"]:
                                    action_label = shot_zone if shot_zone == "free_throw" else f"{shot_zone}_shot"
                                    # Update probabilities to reflect court-based classification
                                    action_probs[action_label] = max(action_probs.values()) if action_probs else 0.8
                        except Exception as e:
                            logger.debug(f"Court-based shot classification enhancement failed: {e}")
                    
                    # Add frame-level prediction tracking for temporal smoothing
                    self.frame_action_buffer.append(action_label)
                    if len(self.frame_action_buffer) > self.frame_buffer_size:
                        self.frame_action_buffer.pop(0)
                    
                    # Apply temporal smoothing for real-time display
                    # This reduces flickering and improves action detection stability
                    if len(self.frame_action_buffer) >= 3:  # Need at least 3 frames for smoothing
                        smoothed_action = self._smooth_action_predictions(
                            self.frame_action_buffer[:-1],  # Recent predictions
                            action_label  # Current prediction
                        )
                        current_action_label = smoothed_action
                        # Use smoothed confidence (average of recent confidences)
                        current_action_confidence = confidence
                    else:
                        # Not enough frames yet, use raw prediction
                        current_action_label = action_label
                        current_action_confidence = confidence
                    
                    # Calculate Metrics for this window (needs keypoints)
                    # Filter out empty keypoints if needed, or engine handles it
                    valid_keypoints = [np.array(k) for k in keypoints_window if k and len(k) > 0]
                    
                    # For portrait videos or videos with fewer detections, be more flexible
                    # Require at least 2 valid keypoints (minimum for any calculation)
                    min_keypoints_required = 2
                    # Initialize metrics_appended before try block to ensure it's always in scope
                    metrics_appended = False
                    if len(valid_keypoints) >= min_keypoints_required:
                        # ENHANCED: Normalize and smooth keypoints before analysis
                        try:
                            # Normalize to player-centric coordinates
                            normalized_sequence, _ = self.pose_normalizer.normalize_sequence(valid_keypoints)
                            
                            # Apply temporal smoothing
                            smoothed_keypoints = self.pose_smoother.smooth_sequence(normalized_sequence, fps=fps)
                            
                            # Compute comprehensive biomechanics features
                            biomechanics_features = self.biomechanics_engine.compute_all_biomechanics(
                                smoothed_keypoints,
                                action_type=action_label,
                                ball_positions=ball_trajectory[-len(smoothed_keypoints):] if ball_trajectory else None
                            )
                            
                            # Ensure biomechanics_features is always a dict (never None) for safe access
                            if biomechanics_features is None:
                                biomechanics_features = {}
                            
                            # Calculate metrics first (before any processing that might fail)
                            # This ensures metrics are calculated even if subsequent processing fails
                            window_metrics = self._calculate_metrics(smoothed_keypoints, action_label)
                            
                            # Add biomechanics features to metrics
                            if biomechanics_features:
                                # Merge biomechanics features into metrics (if not already present)
                                # Validate values before adding (no NaN/Inf, only scalar types)
                                # Skip complex types (lists, dicts) that aren't part of PerformanceMetrics schema
                                for key, value in biomechanics_features.items():
                                    # Skip complex types that aren't valid PerformanceMetrics fields
                                    if isinstance(value, (list, dict)):
                                        continue
                                    
                                    if key not in window_metrics.model_dump():
                                        # Validate value (skip NaN/Inf)
                                        if value is not None:
                                            if isinstance(value, (int, float)):
                                                if not (np.isnan(value) or np.isinf(value)):
                                                    # Only set if the field exists in PerformanceMetrics schema
                                                    if hasattr(window_metrics, key):
                                                        try:
                                                            setattr(window_metrics, key, float(value))
                                                        except (ValueError, AttributeError):
                                                            # Field might not be settable or value invalid
                                                            logger.debug(f"Skipping biomechanics feature '{key}': not a valid PerformanceMetrics field")
                                                    else:
                                                        logger.debug(f"Skipping biomechanics feature '{key}': not in PerformanceMetrics schema")
                            
                            # ENHANCED: Rule-based form evaluation
                            # Initialize form_quality to None to ensure it's always defined
                            form_quality = None
                            # Initialize rule_issues to preserve them even if form_quality is None
                            rule_issues = []
                            
                            # Get key frame for rule-based checks (mid-frame or release frame)
                            mid_frame_idx = len(smoothed_keypoints) // 2
                            if mid_frame_idx < len(smoothed_keypoints) and smoothed_keypoints[mid_frame_idx] is not None:
                                key_frame_kp = smoothed_keypoints[mid_frame_idx]
                                
                                # Rule-based evaluation (action-specific)
                                # Include all shooting actions: shot, free_throw, layup, and dunk
                                if ('shot' in action_label.lower() or 
                                    'free_throw' in action_label.lower() or 
                                    'layup' in action_label.lower() or 
                                    'dunk' in action_label.lower()):
                                    # Shooting form evaluation (applies to all shooting actions)
                                    wrist_velocities = []
                                    release_frame_idx = biomechanics_features.get('release_frame')
                                    
                                    # Compute wrist velocities if available
                                    if len(smoothed_keypoints) > 1:
                                        for i in range(1, len(smoothed_keypoints)):
                                            if smoothed_keypoints[i] is not None and smoothed_keypoints[i-1] is not None:
                                                # Get wrist position
                                                wrist_pos = smoothed_keypoints[i][16][:2]  # RIGHT_WRIST
                                                prev_wrist_pos = smoothed_keypoints[i-1][16][:2]
                                                velocity = np.linalg.norm(wrist_pos - prev_wrist_pos) / (1.0/fps)
                                                wrist_velocities.append(velocity)
                                    
                                    rule_results = self.rule_based_evaluator.evaluate_shooting_form(
                                        key_frame_kp,
                                        ball_trajectory=ball_trajectory[-10:] if ball_trajectory else None,
                                        wrist_velocities=wrist_velocities if wrist_velocities else None,
                                        release_frame_idx=release_frame_idx
                                    )
                                    
                                    # Convert rule results to form quality issues
                                    rule_issues = []
                                    for check_name, result in rule_results.items():
                                        if check_name != 'overall' and not result.get('pass', True):
                                            # Ensure all string fields are never None
                                            drill = result.get('drill') or ''
                                            message = result.get('message') or ''
                                            severity = result.get('severity') or 'moderate'
                                            
                                            rule_issues.append({
                                                'issue_type': check_name,
                                                'severity': severity,
                                                'description': message,
                                                'current_value': result.get('value'),
                                                'optimal_value': result.get('optimal_value'),
                                                'recommendation': drill
                                            })
                                    
                                    # Merge with existing form quality analysis
                                    # Use smoothed_keypoints (normalized) for consistency with metrics calculation
                                    form_quality = self._analyze_form_quality(smoothed_keypoints, action_label)
                                    # Merge rule-based issues into form quality (even if form_quality was None initially)
                                    if rule_issues:
                                        if form_quality:
                                            # Add rule-based issues to existing form quality
                                            for rule_issue in rule_issues:
                                                form_quality.issues.append(FormQualityIssue(**rule_issue))
                                        else:
                                            # form_quality is None, but we have rule_issues - create FormQualityAssessment from them
                                            form_quality = self._create_form_quality_from_rule_issues(rule_issues)
                                
                                elif 'dribbl' in action_label.lower():
                                    # Dribbling form evaluation
                                    # Extract hand positions and COM
                                    hand_positions = []
                                    com_positions = []
                                    for kp in smoothed_keypoints:
                                        if kp is not None and len(kp) >= 25:
                                            # Hand position (wrist)
                                            hand_positions.append(kp[16][:2])  # RIGHT_WRIST
                                            # COM (mid-hip)
                                            left_hip = kp[23][:2]
                                            right_hip = kp[24][:2]
                                            com = (left_hip + right_hip) / 2
                                            com_positions.append(com)
                                    
                                    if hand_positions and com_positions:
                                        rule_results = self.rule_based_evaluator.evaluate_dribbling_form(
                                            smoothed_keypoints,
                                            hand_positions,
                                            np.array(com_positions)
                                        )
                                        
                                        # Convert to form quality issues (reuse existing list)
                                        rule_issues = []
                                        for check_name, result in rule_results.items():
                                            if check_name != 'overall' and isinstance(result, dict) and not result.get('pass', True):
                                                # Ensure all string fields are never None
                                                drill = result.get('drill') or ''
                                                message = result.get('message') or ''
                                                severity = result.get('severity') or 'moderate'
                                                
                                                rule_issues.append({
                                                    'issue_type': check_name,
                                                    'severity': severity,
                                                    'description': message,
                                                    'current_value': result.get('value'),
                                                    'optimal_value': result.get('optimal_value'),
                                                    'recommendation': drill
                                                })
                                        
                                        # Use smoothed_keypoints (normalized) for consistency with metrics calculation
                                        form_quality = self._analyze_form_quality(smoothed_keypoints, action_label)
                                        # Merge rule-based issues into form quality (even if form_quality was None initially)
                                        if rule_issues:
                                            if form_quality:
                                                # Add rule-based issues to existing form quality
                                                for rule_issue in rule_issues:
                                                    form_quality.issues.append(FormQualityIssue(**rule_issue))
                                            else:
                                                # form_quality is None, but we have rule_issues - create FormQualityAssessment from them
                                                form_quality = self._create_form_quality_from_rule_issues(rule_issues)
                            
                            # If no rule-based evaluation, use existing form quality
                            # Use smoothed_keypoints (normalized) for consistency with metrics calculation
                            if not form_quality:
                                form_quality = self._analyze_form_quality(smoothed_keypoints, action_label)
                                # If we have rule_issues that weren't merged yet (because form_quality was None),
                                # merge them now into the newly created form_quality
                                if rule_issues:
                                    if form_quality:
                                        # Add rule-based issues to existing form quality
                                        for rule_issue in rule_issues:
                                            form_quality.issues.append(FormQualityIssue(**rule_issue))
                                    else:
                                        # form_quality is still None, but we have rule_issues - create FormQualityAssessment from them
                                        form_quality = self._create_form_quality_from_rule_issues(rule_issues)
                            
                            # Update current form quality for real-time display
                            current_form_quality = form_quality
                            
                            # Append metrics only once, after all processing is complete
                            all_metrics.append(window_metrics)
                            metrics_appended = True
                            
                            # Add to timeline - create proper ActionClassification object
                            timestamp = frame_count / fps
                            action_classification = ActionClassification(
                                label=action_label,
                                confidence=confidence,
                                probabilities=ActionProbabilities(**action_probs)
                            )
                            timeline.append(TimelineSegment(
                                start_time=max(0, timestamp - (window_size/fps)),
                                end_time=timestamp,
                                action=action_classification,
                                metrics=window_metrics,
                                form_quality=form_quality
                            ))
                            
                        except Exception as e:
                            logger.warning(f"Enhanced biomechanics processing failed: {e}, using fallback")
                            # Fallback to original method
                            # Metrics may have been calculated at line 767, but if exception occurred before that,
                            # we need to calculate them now
                            if 'window_metrics' not in locals() or window_metrics is None:
                                # Try to use smoothed_keypoints if available, otherwise fall back to valid_keypoints
                                if 'smoothed_keypoints' in locals() and smoothed_keypoints is not None:
                                    window_metrics = self._calculate_metrics(smoothed_keypoints, action_label)
                                else:
                                    window_metrics = self._calculate_metrics(valid_keypoints, action_label)
                            
                            # Only append if metrics haven't been appended yet
                            # metrics_appended is initialized before try block, so it's always in scope
                            if not metrics_appended:
                                all_metrics.append(window_metrics)
                                metrics_appended = True
                            
                            # Try to use smoothed_keypoints if available, otherwise fall back to valid_keypoints
                            if 'smoothed_keypoints' in locals() and smoothed_keypoints is not None:
                                form_quality = self._analyze_form_quality(smoothed_keypoints, action_label)
                            else:
                                form_quality = self._analyze_form_quality(valid_keypoints, action_label)
                            
                            # Update current form quality for real-time display
                            current_form_quality = form_quality
                            
                            # Add to timeline even in fallback
                            timestamp = frame_count / fps
                            action_classification = ActionClassification(
                                label=action_label,
                                confidence=confidence,
                                probabilities=ActionProbabilities(**action_probs)
                            )
                            timeline.append(TimelineSegment(
                                start_time=max(0, timestamp - (window_size/fps)),
                                end_time=timestamp,
                                action=action_classification,
                                metrics=window_metrics,
                                form_quality=form_quality
                            ))
                    else:
                        # Fallback: Use default metrics if not enough valid keypoints
                        logger.debug(f"Only {len(valid_keypoints)} valid keypoint frames in window, using default metrics")
                        window_metrics = self._calculate_metrics(valid_keypoints if valid_keypoints else [[]], action_label)
                        all_metrics.append(window_metrics)
                        form_quality = self._analyze_form_quality(valid_keypoints if valid_keypoints else [[]], action_label)
                        
                        # Update current form quality for real-time display
                        current_form_quality = form_quality
                        
                        # Add to timeline - create proper ActionClassification object
                        timestamp = frame_count / fps
                        action_classification = ActionClassification(
                            label=action_label,
                            confidence=confidence,
                            probabilities=ActionProbabilities(**action_probs)
                        )
                        timeline.append(TimelineSegment(
                            start_time=max(0, timestamp - (window_size/fps)),
                            end_time=timestamp,
                            action=action_classification,
                            metrics=window_metrics,
                            form_quality=form_quality
                        ))
                    
                    # Slide window
                    frames_buffer = frames_buffer[stride:]
                    keypoints_buffer = keypoints_buffer[stride:]
                
                frame_count += 1
                
        finally:
            cap.release()
            if out:
                out.release()
        
        # Re-encode video with ffmpeg for browser compatibility (H.264)
        # This ensures the video can be played in all modern browsers
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            try:
                # Check if ffmpeg is available
                ffmpeg_path = shutil.which('ffmpeg')
                if ffmpeg_path:
                    temp_output = output_path + '.tmp.mp4'
                    # Re-encode to H.264 with browser-compatible settings
                    cmd = [
                        ffmpeg_path,
                        '-i', output_path,
                        '-c:v', 'libx264',  # H.264 codec
                        '-preset', 'medium',  # Encoding speed vs quality
                        '-crf', '23',  # Quality (18-28, lower is better)
                        '-c:a', 'aac',  # Audio codec
                        '-movflags', '+faststart',  # Enable fast start for web streaming
                        '-pix_fmt', 'yuv420p',  # Pixel format for compatibility
                        '-y',  # Overwrite output file
                        temp_output
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=300  # 5 minute timeout
                    )
                    
                    if result.returncode == 0 and os.path.exists(temp_output):
                        # Replace original with re-encoded version
                        os.replace(temp_output, output_path)
                        logger.info(f"✅ Video re-encoded with H.264 for browser compatibility")
                    else:
                        logger.warning(f"⚠️  FFmpeg re-encoding failed: {result.stderr}")
                        if os.path.exists(temp_output):
                            os.remove(temp_output)
                else:
                    logger.warning("⚠️  FFmpeg not found, skipping re-encoding. Video may not play in all browsers.")
            except subprocess.TimeoutExpired:
                logger.warning("⚠️  FFmpeg re-encoding timed out, using original video")
            except Exception as e:
                logger.warning(f"⚠️  Failed to re-encode video with ffmpeg: {e}")
            
        if not timeline:
            # If no timeline, maybe video was too short or no poses found
            # Be more flexible for portrait videos or videos with fewer detections
            if frame_count < window_size:
                # Try with smaller window if video is short
                min_frames_required = max(8, window_size // 2)  # At least 8 frames or half window
                if frame_count < min_frames_required:
                    raise ValueError(f"Video too short for analysis. Need at least {min_frames_required} frames (got {frame_count}).")
                else:
                    logger.warning(f"Video has {frame_count} frames (less than ideal {window_size}), but proceeding with analysis")
                    # Continue with available frames - but timeline is still empty, so raise error
                    raise ValueError("Insufficient frames with detected poses to analyze video. Ensure player is clearly visible in the video.")
            else:
                raise ValueError("Insufficient frames with detected poses to analyze video. Ensure player is clearly visible in the video.")
        
        # Ensure timeline is not empty before proceeding (defensive check)
        if not timeline or len(timeline) == 0:
            raise ValueError("Timeline is empty. Cannot proceed with analysis.")
        
        # Aggregate results
        # Find most frequent action
        actions = [t.action.label for t in timeline]
        if not actions:
            raise ValueError("No actions detected in timeline. Cannot determine main action.")
        main_action = max(set(actions), key=actions.count)
        
        # Average metrics
        avg_metrics = self._aggregate_metrics(timeline)
        
        # Average confidence (safe division - already checked timeline is not empty)
        avg_confidence = sum(t.action.confidence for t in timeline) / len(timeline)
        
        # Aggregate probabilities (average across all segments)
        all_probs = {}
        for prob_key in ["free_throw", "two_point_shot", "three_point_shot", "layup", "dunk",
                         "dribbling", "passing", "defense", "running", "walking",
                         "blocking", "picking", "ball_in_hand", "idle"]:
            all_probs[prob_key] = sum(getattr(t.action.probabilities, prob_key) for t in timeline) / len(timeline)
        
        # Coalesce timeline segments (enhanced version with noise filtering)
        # This merges adjacent same-action segments and filters out very short noise segments
        coalesced_timeline = self._coalesce_timeline_enhanced(timeline, min_duration=0.3)
        
        # Detect shot outcome if applicable (using court and hoop detection)
        shot_outcome = None
        if "shot" in main_action or "free_throw" in main_action or "layup" in main_action or "dunk" in main_action:
            shot_outcome = self._detect_shot_outcome_with_court(ball_trajectory, hoop_info, court_info)
        
        # Generate recommendations based on form quality issues and action-specific analysis
        # Convert PerformanceMetrics Pydantic object to dict for AI coach
        metrics_dict = avg_metrics.model_dump() if hasattr(avg_metrics, 'model_dump') else avg_metrics.dict()
        shot_outcome_dict = None
        if shot_outcome:
            shot_outcome_dict = shot_outcome.model_dump() if hasattr(shot_outcome, 'model_dump') else shot_outcome.dict()
        
        # Collect form quality issues from timeline segments
        form_quality_issues = []
        form_strengths = []
        for segment in coalesced_timeline if coalesced_timeline else []:
            if segment.form_quality:
                form_quality_issues.extend(segment.form_quality.issues)
                form_strengths.extend(segment.form_quality.strengths)
        
        # Generate action-specific recommendations based on form quality
        # Use fallback rule-based recommendations if AI Coach is not available
        if self.ai_coach is None:
            logger.warning("⚠️  AI Coach not available, using fallback rule-based recommendations")
            # Create a temporary fallback AICoach instance for rule-based recommendations
            try:
                from app.models.ai_coach import AICoach
                fallback_coach = AICoach(model_type="fallback")
                recommendations_dicts = fallback_coach.generate_skill_improvement_recommendations(
                    action_type=main_action,
                    metrics=metrics_dict,
                    shot_outcome=shot_outcome_dict,
                    form_quality_issues=form_quality_issues,
                    form_strengths=form_strengths,
                    timeline=coalesced_timeline if coalesced_timeline else []
                )
            except Exception as e:
                logger.error(f"❌ Error generating fallback recommendations: {e}")
                recommendations_dicts = []
        else:
            try:
                recommendations_dicts = self.ai_coach.generate_skill_improvement_recommendations(
                    action_type=main_action,
                    metrics=metrics_dict,
                    shot_outcome=shot_outcome_dict,
                    form_quality_issues=form_quality_issues,
                    form_strengths=form_strengths,
                    timeline=coalesced_timeline if coalesced_timeline else []
                )
            except Exception as e:
                logger.error(f"❌ Error generating recommendations: {e}")
                # Try fallback if main AI coach fails
                try:
                    from app.models.ai_coach import AICoach
                    fallback_coach = AICoach(model_type="fallback")
                    recommendations_dicts = fallback_coach.generate_skill_improvement_recommendations(
                        action_type=main_action,
                        metrics=metrics_dict,
                        shot_outcome=shot_outcome_dict,
                        form_quality_issues=form_quality_issues,
                        form_strengths=form_strengths,
                        timeline=coalesced_timeline if coalesced_timeline else []
                    )
                except Exception as fallback_error:
                    logger.error(f"❌ Fallback recommendations also failed: {fallback_error}")
                    recommendations_dicts = []
        
        # Convert dicts to Recommendation Pydantic objects
        recommendations = [Recommendation(**rec) for rec in recommendations_dicts]

        # Upload annotated video to Supabase if available, otherwise serve locally
        annotated_video_url = None
        try:
            from app.services.supabase_service import supabase_service
            if supabase_service.enabled and os.path.exists(output_path):
                # Check file size to ensure it was written properly
                file_size = os.path.getsize(output_path)
                if file_size > 0:
                    annotated_video_url = supabase_service.upload_video(output_path, output_filename)
                    if not annotated_video_url:
                        # Upload failed, fall back to local serving
                        logger.info(f"📹 Supabase upload failed, serving video locally: {output_filename}")
                        # Use relative path that will be served by /api/videos endpoint
                        annotated_video_url = f"/api/videos/{output_filename}"
                else:
                    logger.warning(f"⚠️  Processed video file is empty, skipping upload: {output_path}")
            elif supabase_service.enabled:
                logger.warning(f"⚠️  Processed video file not found, skipping upload: {output_path}")
            
            # If Supabase is not enabled or upload failed, serve locally
            if not annotated_video_url and os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                if file_size > 0:
                    logger.info(f"📹 Supabase not available, serving annotated video locally: {output_filename}")
                    # Use relative path that will be served by /api/videos endpoint
                    annotated_video_url = f"/api/videos/{output_filename}"
                else:
                    logger.warning(f"⚠️  Processed video file is empty: {output_path}")
        except Exception as e:
            logger.warning(f"⚠️  Failed to upload annotated video: {e}")
            # Try to serve locally as fallback
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                if file_size > 0:
                    logger.info(f"📹 Serving annotated video locally after upload error: {output_filename}")
                    annotated_video_url = f"/api/videos/{output_filename}"

        # Create main action classification
        main_action_classification = ActionClassification(
            label=main_action,
            confidence=float(avg_confidence),
            probabilities=ActionProbabilities(**all_probs)
        )
        
        return VideoAnalysisResult(
            video_id=video_id or str(uuid.uuid4()),
            action=main_action_classification,
            metrics=avg_metrics,
            recommendations=recommendations,
            shot_outcome=shot_outcome,
            timeline=coalesced_timeline if coalesced_timeline else None,
            annotated_video_url=annotated_video_url
        )

    def _classify_action(self, frames: List[np.ndarray]) -> Dict[str, float]:
        """Classify action for a window of frames"""
        # Classifier expects list of RGB frames
        _, _, probabilities = self.action_classifier.classify(frames, return_probabilities=True)
        return self._map_probabilities(probabilities)

    def _get_action_label(self, probs: Dict[str, float]) -> str:
        """Get label with highest probability"""
        if not probs:
            return "idle"
        return max(probs, key=probs.get)
    
    def _smooth_action_predictions(self, recent_predictions: List[str], current_prediction: str) -> str:
        """Apply temporal smoothing to action predictions to avoid flickering.
        
        Uses majority voting over recent frames to smooth out rapid action changes
        and reduce visual flickering in real-time display.
        
        Args:
            recent_predictions: List of recent action predictions
            current_prediction: Current frame's action prediction
            
        Returns:
            Smoothed action label based on majority voting
        """
        from collections import Counter
        
        # Combine recent predictions with current
        all_predictions = recent_predictions + [current_prediction]
        
        # Use majority voting (mode) to smooth predictions
        vote_counts = Counter(all_predictions)
        smoothed_action = vote_counts.most_common(1)[0][0]
        
        return smoothed_action

    def _calculate_metrics(self, keypoints: List[List[float]], action_label: str) -> PerformanceMetrics:
        """Calculate metrics for a window of keypoints"""
        metrics_dict = self.metrics_engine.compute_all_metrics(keypoints, action_label)
        return PerformanceMetrics(**metrics_dict)
    
    def _analyze_form_quality(self, keypoints: List[List[float]], action_label: str) -> Optional[FormQualityAssessment]:
        """Analyze form quality for a window of keypoints"""
        try:
            # Determine which form analyzer to use based on action
            if "shot" in action_label.lower() or "free_throw" in action_label.lower() or "layup" in action_label.lower() or "dunk" in action_label.lower():
                # Shooting form analysis
                assessment_dict = self.form_quality_analyzer.analyze_shooting_form(keypoints, action_label)
            elif "dribbl" in action_label.lower():
                # Dribbling form analysis
                assessment_dict = self.form_quality_analyzer.analyze_dribbling_form(keypoints)
            elif "pass" in action_label.lower():
                # Passing form analysis
                assessment_dict = self.form_quality_analyzer.analyze_passing_form(keypoints)
            else:
                # No form analysis for other actions (defense, idle, etc.)
                return None
            
            # Convert dict to Pydantic model
            issues = [FormQualityIssue(**issue) for issue in assessment_dict.get('issues', [])]
            form_quality = FormQualityAssessment(
                overall_score=assessment_dict['overall_score'],
                quality_rating=assessment_dict['quality_rating'],
                issues=issues,
                strengths=assessment_dict.get('strengths', [])
            )
            
            return form_quality
        except Exception as e:
            logger.warning(f"Form quality analysis failed: {e}")
            return None

    def _create_form_quality_from_rule_issues(self, rule_issues: List[Dict]) -> FormQualityAssessment:
        """
        Create a FormQualityAssessment from rule-based issues when form_quality analysis returns None.
        This ensures rule_issues are never lost.
        """
        if not rule_issues:
            # Should not be called with empty rule_issues, but handle gracefully
            return FormQualityAssessment(
                overall_score=0.5,
                quality_rating="needs_improvement",
                issues=[],
                strengths=[]
            )
        
        # Calculate overall_score based on number and severity of issues
        # More issues or more severe issues = lower score
        severity_weights = {'major': 0.3, 'moderate': 0.2, 'minor': 0.1}
        total_penalty = sum(severity_weights.get(issue.get('severity', 'moderate'), 0.2) for issue in rule_issues)
        # Cap penalty at 0.8 (so score is at least 0.2)
        total_penalty = min(total_penalty, 0.8)
        overall_score = max(0.2, 1.0 - total_penalty)
        
        # Determine quality_rating based on score
        if overall_score >= 0.8:
            quality_rating = "excellent"
        elif overall_score >= 0.6:
            quality_rating = "good"
        elif overall_score >= 0.4:
            quality_rating = "needs_improvement"
        else:
            quality_rating = "poor"
        
        # Convert rule_issues to FormQualityIssue objects
        issues = [FormQualityIssue(**issue) for issue in rule_issues]
        
        return FormQualityAssessment(
            overall_score=overall_score,
            quality_rating=quality_rating,
            issues=issues,
            strengths=[]  # No strengths when only rule-based issues exist
        )


    def _detect_shot_outcome(self, detections: List[List[Dict]]) -> Optional[ShotOutcome]:
        """Detect shot outcome from detections (legacy method)"""
        # This would require ball detection which we might not have fully implemented
        # For now, return None or a dummy outcome
        return None
    
    def _detect_shot_outcome_with_court(
        self, 
        ball_trajectory: List[Tuple[float, float]],
        hoop_info: Optional[Dict],
        court_info: Optional[Dict]
    ) -> Optional[ShotOutcome]:
        """
        Detect shot outcome using ball trajectory and hoop position
        
        Args:
            ball_trajectory: List of (x, y) ball positions
            hoop_info: Hoop detection information
            court_info: Court detection information
            
        Returns:
            ShotOutcome object or None
        """
        if not ball_trajectory or len(ball_trajectory) < 3:
            return None
        
        if not hoop_info:
            # Fallback to existing shot outcome detector
            return None
        
        try:
            # Use court detector to analyze shot outcome
            hoop_center = hoop_info["center"]
            hoop_bbox = hoop_info["bbox"]
            
            outcome_result = self.court_detector.detect_shot_outcome(
                ball_trajectory,
                hoop_center,
                hoop_bbox
            )
            
            if outcome_result and outcome_result.get("outcome") != "unknown":
                return ShotOutcome(
                    outcome=outcome_result["outcome"],
                    confidence=outcome_result["confidence"],
                    method=outcome_result["method"],
                    make_probability=0.9 if outcome_result["outcome"] == "made" else 0.1
                )
        except Exception as e:
            logger.debug(f"Shot outcome detection with court failed: {e}")
        
        return None


    def _coalesce_timeline(self, timeline: List[TimelineSegment]) -> List[TimelineSegment]:
        """
        Merge adjacent timeline segments with the same action label
        
        Args:
            timeline: List of timeline segments
            
        Returns:
            Coalesced timeline with merged adjacent segments (new objects, original unchanged)
        """
        if not timeline:
            return []
        
        if len(timeline) == 1:
            # Return a copy to avoid mutating the original
            return [copy.deepcopy(timeline[0])]
        
        coalesced = []
        # Create a deep copy of the first segment to avoid mutating the original
        current_segment = copy.deepcopy(timeline[0])
        
        for i in range(1, len(timeline)):
            # Create a deep copy of next_segment to avoid mutating the original
            next_segment = copy.deepcopy(timeline[i])
            
            # Check if segments are adjacent and have the same action
            time_gap = next_segment.start_time - current_segment.end_time
            same_action = current_segment.action.label == next_segment.action.label
            
            # Merge if same action and adjacent (within 0.5 seconds)
            if same_action and time_gap <= 0.5:
                # Merge segments: extend end time, average metrics, combine form quality
                current_segment.end_time = next_segment.end_time
                
                # Average confidence
                current_segment.action.confidence = (
                    current_segment.action.confidence + next_segment.action.confidence
                ) / 2
                
                # Average probabilities
                for prob_key in ["free_throw", "two_point_shot", "three_point_shot", "layup", "dunk",
                                "dribbling", "passing", "defense", "running", "walking",
                                "blocking", "picking", "ball_in_hand", "idle"]:
                    current_prob = getattr(current_segment.action.probabilities, prob_key)
                    next_prob = getattr(next_segment.action.probabilities, prob_key)
                    setattr(current_segment.action.probabilities, prob_key, (current_prob + next_prob) / 2)
                
                # Average metrics (with None checks to prevent TypeError)
                if current_segment.metrics.jump_height is not None and next_segment.metrics.jump_height is not None:
                    current_segment.metrics.jump_height = (
                        current_segment.metrics.jump_height + next_segment.metrics.jump_height
                    ) / 2
                elif current_segment.metrics.jump_height is None:
                    current_segment.metrics.jump_height = next_segment.metrics.jump_height
                
                if current_segment.metrics.movement_speed is not None and next_segment.metrics.movement_speed is not None:
                    current_segment.metrics.movement_speed = (
                        current_segment.metrics.movement_speed + next_segment.metrics.movement_speed
                    ) / 2
                elif current_segment.metrics.movement_speed is None:
                    current_segment.metrics.movement_speed = next_segment.metrics.movement_speed
                
                if current_segment.metrics.form_score is not None and next_segment.metrics.form_score is not None:
                    current_segment.metrics.form_score = (
                        current_segment.metrics.form_score + next_segment.metrics.form_score
                    ) / 2
                elif current_segment.metrics.form_score is None:
                    current_segment.metrics.form_score = next_segment.metrics.form_score
                
                if current_segment.metrics.reaction_time is not None and next_segment.metrics.reaction_time is not None:
                    current_segment.metrics.reaction_time = (
                        current_segment.metrics.reaction_time + next_segment.metrics.reaction_time
                    ) / 2
                elif current_segment.metrics.reaction_time is None:
                    current_segment.metrics.reaction_time = next_segment.metrics.reaction_time
                
                if current_segment.metrics.pose_stability is not None and next_segment.metrics.pose_stability is not None:
                    current_segment.metrics.pose_stability = (
                        current_segment.metrics.pose_stability + next_segment.metrics.pose_stability
                    ) / 2
                elif current_segment.metrics.pose_stability is None:
                    current_segment.metrics.pose_stability = next_segment.metrics.pose_stability
                
                if current_segment.metrics.energy_efficiency is not None and next_segment.metrics.energy_efficiency is not None:
                    current_segment.metrics.energy_efficiency = (
                        current_segment.metrics.energy_efficiency + next_segment.metrics.energy_efficiency
                    ) / 2
                elif current_segment.metrics.energy_efficiency is None:
                    current_segment.metrics.energy_efficiency = next_segment.metrics.energy_efficiency
                
                # Merge form quality issues (combine unique issues)
                if next_segment.form_quality and current_segment.form_quality:
                    # Combine issues (avoid duplicates)
                    existing_issue_types = {issue.issue_type for issue in current_segment.form_quality.issues}
                    for issue in next_segment.form_quality.issues:
                        if issue.issue_type not in existing_issue_types:
                            current_segment.form_quality.issues.append(issue)
                            existing_issue_types.add(issue.issue_type)
                    
                    # Average overall score
                    current_segment.form_quality.overall_score = (
                        current_segment.form_quality.overall_score + next_segment.form_quality.overall_score
                    ) / 2
                    
                    # Combine strengths (unique)
                    existing_strengths = set(current_segment.form_quality.strengths)
                    for strength in next_segment.form_quality.strengths:
                        if strength not in existing_strengths:
                            current_segment.form_quality.strengths.append(strength)
                    
                    # Update quality rating based on new score
                    score = current_segment.form_quality.overall_score
                    if score >= 0.85:
                        current_segment.form_quality.quality_rating = "excellent"
                    elif score >= 0.70:
                        current_segment.form_quality.quality_rating = "good"
                    elif score >= 0.50:
                        current_segment.form_quality.quality_rating = "needs_improvement"
                    else:
                        current_segment.form_quality.quality_rating = "poor"
                elif next_segment.form_quality:
                    # If current doesn't have form quality but next does, use next
                    current_segment.form_quality = next_segment.form_quality
            else:
                # Different action or gap too large - save current and start new
                coalesced.append(current_segment)
                # next_segment is already a copy, so we can use it directly
                current_segment = next_segment
        
        # Add last segment
        coalesced.append(current_segment)
        
        return coalesced
    
    def _coalesce_timeline_enhanced(self, timeline: List[TimelineSegment], min_duration: float = 0.3) -> List[TimelineSegment]:
        """Enhanced timeline coalescing with noise filtering.
        
        Performs two-pass coalescing:
        1. First pass: merge adjacent segments with same action (using _coalesce_timeline)
        2. Second pass: filter out very short segments (likely noise) and merge them with adjacent segments
        
        Args:
            timeline: List of timeline segments
            min_duration: Minimum segment duration in seconds (default 0.3s)
            
        Returns:
            Enhanced coalesced timeline with noise filtered out
        """
        if not timeline:
            return []
        
        # First pass: merge adjacent same-action segments
        coalesced = self._coalesce_timeline(timeline)
        
        if not coalesced:
            return []
        
        # Second pass: filter out very short segments (likely noise)
        filtered = []
        for i, segment in enumerate(coalesced):
            duration = segment.end_time - segment.start_time
            
            if duration >= min_duration:
                # Segment is long enough, keep it
                filtered.append(segment)
            else:
                # Segment is too short (noise), merge with adjacent segment
                if filtered:
                    # Merge with previous segment (extend its end time)
                    filtered[-1].end_time = segment.end_time
                    
                    # Average metrics with previous segment
                    prev = filtered[-1]
                    
                    # Average confidence
                    prev.action.confidence = (prev.action.confidence + segment.action.confidence) / 2
                    
                    # Average metrics (with None checks)
                    if prev.metrics.jump_height is not None and segment.metrics.jump_height is not None:
                        prev.metrics.jump_height = (prev.metrics.jump_height + segment.metrics.jump_height) / 2
                    elif prev.metrics.jump_height is None:
                        prev.metrics.jump_height = segment.metrics.jump_height
                    
                    if prev.metrics.movement_speed is not None and segment.metrics.movement_speed is not None:
                        prev.metrics.movement_speed = (prev.metrics.movement_speed + segment.metrics.movement_speed) / 2
                    elif prev.metrics.movement_speed is None:
                        prev.metrics.movement_speed = segment.metrics.movement_speed
                    
                    if prev.metrics.form_score is not None and segment.metrics.form_score is not None:
                        prev.metrics.form_score = (prev.metrics.form_score + segment.metrics.form_score) / 2
                    elif prev.metrics.form_score is None:
                        prev.metrics.form_score = segment.metrics.form_score
                    
                    # Merge form quality if both have it
                    if segment.form_quality and prev.form_quality:
                        # Combine unique issues
                        existing_issue_types = {issue.issue_type for issue in prev.form_quality.issues}
                        for issue in segment.form_quality.issues:
                            if issue.issue_type not in existing_issue_types:
                                prev.form_quality.issues.append(issue)
                                existing_issue_types.add(issue.issue_type)
                        
                        # Average overall score
                        prev.form_quality.overall_score = (
                            prev.form_quality.overall_score + segment.form_quality.overall_score
                        ) / 2
                    elif segment.form_quality:
                        # Previous doesn't have form quality, use segment's
                        prev.form_quality = segment.form_quality
                elif i < len(coalesced) - 1:
                    # No previous segment, merge with next if available
                    # For now, just skip this segment (it's at the start and too short)
                    pass
                else:
                    # Last segment and too short, but no previous to merge with
                    # Keep it anyway to avoid losing data
                    filtered.append(segment)
        
        return filtered

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
