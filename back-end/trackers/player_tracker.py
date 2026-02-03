from ultralytics import YOLO
import supervision as sv
import sys 
sys.path.append('../')
from utils import read_stub, save_stub

class PlayerTracker:
    """
    A class that handles player detection and tracking using YOLO and ByteTrack.
    """
    def __init__(self, model_path):
        self.model = YOLO(model_path) 
        self.tracker = sv.ByteTrack()

    def detect_frames(self, frames):
        batch_size=10 # Smaller batch for higher resolution
        detections = [] 
        for i in range(0,len(frames),batch_size):
            # HIGHER RESOLUTION (imgsz=1080) and LOWER CONFIDENCE
            detections_batch = self.model.predict(
                frames[i:i+batch_size], 
                conf=0.15, 
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
            
            # Robustly find 'player' class
            player_cls_id = None
            for idx, name in cls_names.items():
                if name.lower() == 'player':
                    player_cls_id = idx
                    break

            detection_supervision = sv.Detections.from_ultralytics(detection)
            
            # Filter detections to only include players before tracking
            if player_cls_id is not None:
                mask = detection_supervision.class_id == player_cls_id
                detection_supervision = detection_supervision[mask]

            # Track Objects
            detection_with_tracks = self.tracker.update_with_detections(detection_supervision)
            tracks.append({})

            for frame_detection in detection_with_tracks:
                bbox = frame_detection[0].tolist()
                track_id = frame_detection[4]
                confidence = frame_detection[2]
                tracks[frame_num][track_id] = {"bbox": bbox, "confidence": float(confidence)}
        
        save_stub(stub_path,tracks)
        return tracks
