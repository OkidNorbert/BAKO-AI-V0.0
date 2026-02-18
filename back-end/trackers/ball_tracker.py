from ultralytics import YOLO
import supervision as sv
import numpy as np
import sys 
import pandas as pd
sys.path.append('../')
from utils import read_stub, save_stub


class BallTracker:
    """
    Handles basketball detection and tracking using YOLO.
    Picks the single highest-confidence ball per frame, then
    interpolates short gaps (occlusion by players) and removes
    impossible jumps (false positives).
    """
    def __init__(self, model_path):
        self.model = YOLO(model_path) 

    def detect_frames(self, frames):
        batch_size = 10 
        detections = [] 
        for i in range(0, len(frames), batch_size):
            detections_batch = self.model.predict(
                frames[i:i+batch_size],
                conf=0.15,   # Sensitive enough to catch the ball in motion/occlusion
                imgsz=1080
            )
            detections += detections_batch
        return detections

    def get_object_tracks(self, frames, read_from_stub=False, stub_path=None):
        tracks = read_stub(read_from_stub, stub_path)
        if tracks is not None:
            if len(tracks) == len(frames):
                return tracks

        detections = self.detect_frames(frames)
        tracks = []

        for frame_num, detection in enumerate(detections):
            cls_names = detection.names
            ball_indices = [idx for idx, name in cls_names.items() if 'basketball' in name.lower() or 'ball' in name.lower()]

            detection_supervision = sv.Detections.from_ultralytics(detection)

            tracks.append({})
            chosen_bbox = None
            max_confidence = -1
            
            for bbox, confidence, class_id in zip(detection_supervision.xyxy, detection_supervision.confidence, detection_supervision.class_id):
                if class_id in ball_indices:
                    if confidence > max_confidence:
                        max_confidence = confidence
                        chosen_bbox = bbox.tolist()

            if chosen_bbox is not None:
                tracks[frame_num][1] = {"bbox": chosen_bbox, "confidence": float(max_confidence)}

        save_stub(stub_path, tracks)
        return tracks

    def remove_wrong_detections(self, ball_positions):
        """
        Remove detections that are impossibly far from the previous good detection.
        A basketball at 30fps can travel at most ~200px between frames in 1080p.
        """
        maximum_allowed_distance = 200
        last_good_frame_index = -1

        for i in range(len(ball_positions)):
            current_box = ball_positions[i].get(1, {}).get('bbox', [])
            if len(current_box) == 0:
                continue

            if last_good_frame_index == -1:
                last_good_frame_index = i
                continue

            last_good_box = ball_positions[last_good_frame_index].get(1, {}).get('bbox', [])
            frame_gap = i - last_good_frame_index
            # Allow proportionally more movement for larger gaps (ball was occluded)
            adjusted_max_distance = maximum_allowed_distance * min(frame_gap, 5)

            dist = np.linalg.norm(np.array(last_good_box[:2]) - np.array(current_box[:2]))
            if dist > adjusted_max_distance:
                ball_positions[i] = {}
            else:
                last_good_frame_index = i

        return ball_positions

    def interpolate_ball_positions(self, ball_positions):
        """
        Linearly interpolate ball position across short gaps (e.g. ball hidden behind player).
        Gaps longer than 1 second (30 frames) are left empty to avoid false paths.
        """
        extracted_bboxes = [x.get(1, {}).get('bbox', [np.nan, np.nan, np.nan, np.nan]) for x in ball_positions]
        if all(np.isnan(bbox).all() for bbox in extracted_bboxes):
            return ball_positions

        df = pd.DataFrame(extracted_bboxes, columns=['x1', 'y1', 'x2', 'y2'])
        # Interpolate gaps up to 30 frames (1 second) — covers occlusion by players
        df = df.interpolate(limit=30, limit_direction='both')
        df = df.bfill(limit=5)
        df = df.ffill(limit=5)

        output_positions = []
        for x in df.to_numpy().tolist():
            if any(np.isnan(v) for v in x):
                output_positions.append({})
            else:
                output_positions.append({1: {"bbox": x}})
        return output_positions