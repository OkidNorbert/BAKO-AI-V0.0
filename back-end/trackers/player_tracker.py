from ultralytics import YOLO
import supervision as sv
import numpy as np
import sys 
sys.path.append('../')
from utils import read_stub, save_stub

class PlayerTracker:
    """
    A class that handles player detection and tracking using YOLO and ByteTrack.
    """
    def __init__(self, model_path):
        self.model = YOLO(model_path) 
        # Tuning for CONGESTION: 
        # track_activation_threshold 0.25 helps pick up lower confidence matches in crowds
        # lost_track_buffer 90 remembers players who are occluded for up to 3 seconds
        self.tracker = sv.ByteTrack(track_activation_threshold=0.25, lost_track_buffer=90)

    def detect_frames(self, frames):
        batch_size=10 # Smaller batch for higher resolution
        detections = [] 
        for i in range(0,len(frames),batch_size):
            # HIGHER RESOLUTION (imgsz=1080) and LOWER CONFIDENCE
            detections_batch = self.model.predict(
                frames[i:i+batch_size], 
                conf=0.1, 
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
            
            # Find 'player' and 'referee' classes
            target_cls_ids = []
            for idx, name in cls_names.items():
                if name.lower() in ['player', 'referee']:
                    target_cls_ids.append(idx)

            detection_supervision = sv.Detections.from_ultralytics(detection)
            
            # Create a refined mask based on class-specific confidence
            refined_mask = []
            for class_id, confidence in zip(detection_supervision.class_id, detection_supervision.confidence):
                class_name = cls_names[class_id].lower()
                if class_name == 'player' and confidence >= 0.1:
                    refined_mask.append(True)
                elif class_name == 'referee' and confidence >= 0.25:
                    refined_mask.append(True)
                else:
                    refined_mask.append(False)
            
            detection_supervision = detection_supervision[np.array(refined_mask)]

            # Track Objects
            detection_with_tracks = self.tracker.update_with_detections(detection_supervision)
            tracks.append({})

            for i, frame_detection in enumerate(detection_with_tracks):
                bbox = frame_detection[0].tolist()
                track_id = frame_detection[4]
                confidence = frame_detection[2]
                class_id = frame_detection[3]
                class_name = cls_names[class_id]
                tracks[frame_num][track_id] = {
                    "bbox": bbox, 
                    "confidence": float(confidence),
                    "class": class_name
                }
        
        save_stub(stub_path,tracks)
        return tracks
