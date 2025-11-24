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

from app.core.config import settings

from app.models.yolo_detector import PlayerDetector
from app.models.pose_extractor import PoseExtractor
from app.models.action_classifier import ActionClassifier
from app.models.metrics_engine import PerformanceMetricsEngine
from app.models.shot_outcome_detector import ShotOutcomeDetector
from app.models.ai_coach import AICoach
from app.models.court_detector import CourtDetector
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
    
    def _draw_annotations(
        self, 
        frame: np.ndarray, 
        detections: List[Dict], 
        pose_landmarks,
        basketball_detections: List[Dict] = None,
        court_info: Dict = None,
        hoop_info: Dict = None
    ) -> np.ndarray:
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
        
        if width == 0 or height == 0 or total_frames == 0:
            logger.error("❌ Invalid video properties detected")
            raise ValueError("Invalid video file: dimensions or frame count is zero")
        
        # Prepare output video
        output_filename = f"processed_{os.path.basename(video_path)}"
        output_path = os.path.join(os.path.dirname(video_path), output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
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
                
                # Draw annotations (players + basketballs + court + hoop)
                annotated_frame = self._draw_annotations(
                    frame, 
                    detections, 
                    pose_results.pose_landmarks, 
                    basketball_detections,
                    court_info,
                    hoop_info
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
                    
                    # Calculate Metrics for this window (needs keypoints)
                    # Filter out empty keypoints if needed, or engine handles it
                    valid_keypoints = [k for k in keypoints_window if k]
                    if valid_keypoints:
                        window_metrics = self._calculate_metrics(valid_keypoints, action_label)
                        all_metrics.append(window_metrics)
                        
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
                            metrics=window_metrics
                        ))
                    
                    # Slide window
                    frames_buffer = frames_buffer[stride:]
                    keypoints_buffer = keypoints_buffer[stride:]
                
                frame_count += 1
                
        finally:
            cap.release()
            out.release()
            
        if not timeline:
            # If no timeline, maybe video was too short or no poses found
            if frame_count < window_size:
                 raise ValueError(f"Video too short for analysis. Need at least {window_size} frames.")
            raise ValueError("Insufficient frames with detected poses to analyze video")
            
        # Aggregate results
        # Find most frequent action
        actions = [t.action.label for t in timeline]
        main_action = max(set(actions), key=actions.count)
        
        # Average metrics
        avg_metrics = self._aggregate_metrics(timeline)
        
        # Average confidence
        avg_confidence = sum(t.action.confidence for t in timeline) / len(timeline)
        
        # Aggregate probabilities (average across all segments)
        all_probs = {}
        for prob_key in ["free_throw", "two_point_shot", "three_point_shot", "layup", "dunk",
                         "dribbling", "passing", "defense", "running", "walking",
                         "blocking", "picking", "ball_in_hand", "idle"]:
            all_probs[prob_key] = sum(getattr(t.action.probabilities, prob_key) for t in timeline) / len(timeline)
        
        # Detect shot outcome if applicable (using court and hoop detection)
        shot_outcome = None
        if "shot" in main_action or "free_throw" in main_action or "layup" in main_action or "dunk" in main_action:
            shot_outcome = self._detect_shot_outcome_with_court(ball_trajectory, hoop_info, court_info)
        
        # Generate recommendations
        # Convert PerformanceMetrics Pydantic object to dict for AI coach
        metrics_dict = avg_metrics.model_dump() if hasattr(avg_metrics, 'model_dump') else avg_metrics.dict()
        shot_outcome_dict = None
        if shot_outcome:
            shot_outcome_dict = shot_outcome.model_dump() if hasattr(shot_outcome, 'model_dump') else shot_outcome.dict()
        
        recommendations_dicts = self.ai_coach.generate_initial_recommendations(
            action_type=main_action,
            metrics=metrics_dict,
            shot_outcome=shot_outcome_dict
        )
        
        # Convert dicts to Recommendation Pydantic objects
        recommendations = [Recommendation(**rec) for rec in recommendations_dicts]

        # Upload annotated video to Supabase if available
        annotated_video_url = None
        try:
            from app.services.supabase_service import supabase_service
            if supabase_service.enabled:
                annotated_video_url = supabase_service.upload_video(output_path, output_filename)
        except Exception as e:
            logger.error(f"Failed to upload annotated video: {e}")

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
            timeline=timeline if len(timeline) > 1 else None,  # Only include timeline if multiple segments
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

    def _calculate_metrics(self, keypoints: List[List[float]], action_label: str) -> PerformanceMetrics:
        """Calculate metrics for a window of keypoints"""
        metrics_dict = self.metrics_engine.compute_all_metrics(keypoints, action_label)
        return PerformanceMetrics(**metrics_dict)

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
