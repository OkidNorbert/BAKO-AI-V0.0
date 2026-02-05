from ultralytics import YOLO
import supervision as sv
import numpy as np
import sys 
import pandas as pd
sys.path.append('../')
from utils import read_stub, save_stub


class BallTracker:
    """
    A class that handles basketball detection and tracking using YOLO.
    """
    def __init__(self, model_path):
        self.model = YOLO(model_path) 

    def detect_frames(self, frames):
        batch_size=10 
        detections = [] 
        for i in range(0,len(frames),batch_size):
            # HIGHER RESOLUTION (imgsz=1080) for small ball
            # Even lower confidence for the ball
            detections_batch = self.model.predict(
                frames[i:i+batch_size],
                conf=0.05, # SUPER SENSITIVE for the ball
                imgsz=1080
            )
            detections += detections_batch
        return detections

    def get_object_tracks(self, frames, read_from_stub=False, stub_path=None):
        tracks = read_stub(read_from_stub,stub_path)
        if tracks is not None:
            if len(tracks) == len(frames):
                return tracks

        detections = self.detect_frames(frames)
        tracks=[]

        for frame_num, detection in enumerate(detections):
            cls_names = detection.names
            ball_indices = [idx for idx, name in cls_names.items() if 'basketbal' in name.lower()]

            detection_supervision = sv.Detections.from_ultralytics(detection)

            tracks.append({})
            # Find the single best ball in the frame
            chosen_bbox = None
            max_confidence = -1
            
            # Iterate through detections for the current frame
            for bbox, confidence, class_id in zip(detection_supervision.xyxy, detection_supervision.confidence, detection_supervision.class_id):
                if class_id in ball_indices:
                    if confidence > max_confidence:
                        max_confidence = confidence
                        chosen_bbox = bbox.tolist()

            if chosen_bbox is not None:
                tracks[frame_num][1] = {"bbox": chosen_bbox, "confidence": float(max_confidence)}

        save_stub(stub_path,tracks)
        return tracks

    def remove_wrong_detections(self,ball_positions):
        maximum_allowed_distance = 60 # Increased distance for high res
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
            adjusted_max_distance = maximum_allowed_distance * frame_gap

            if np.linalg.norm(np.array(last_good_box[:2]) - np.array(current_box[:2])) > adjusted_max_distance:
                ball_positions[i] = {}
            else:
                last_good_frame_index = i

        return ball_positions

    def interpolate_ball_positions(self,ball_positions):
        extracted_bboxes = [x.get(1,{}).get('bbox', [np.nan, np.nan, np.nan, np.nan]) for x in ball_positions]
        if all(np.isnan(bbox).all() for bbox in extracted_bboxes):
            return ball_positions

        df_ball_positions = pd.DataFrame(extracted_bboxes, columns=['x1','y1','x2','y2'])
        df_ball_positions = df_ball_positions.interpolate()
        df_ball_positions = df_ball_positions.bfill()

        output_positions = []
        for x in df_ball_positions.to_numpy().tolist():
            if np.isnan(x).any():
                output_positions.append({})
            else:
                output_positions.append({1: {"bbox": x}})
        return output_positions