from ultralytics import YOLO
import supervision as sv
import numpy as np
import sys 
sys.path.append('../')
from utils import read_stub, save_stub

# Maximum players on a basketball court at any one time (5 per team)
MAX_PLAYERS_ON_COURT = 10

class PlayerTracker:
    """
    Handles player and referee detection and tracking using YOLO + ByteTrack.
    Enforces the basketball rule of max 10 players on court at a time.
    """
    def __init__(self, model_path):
        self.model = YOLO(model_path) 
        # ByteTrack: 
        # - track_activation_threshold=0.3: require moderate confidence to start a new track
        # - lost_track_buffer=60: remember occluded players for ~2 seconds at 30fps
        self.tracker = sv.ByteTrack(track_activation_threshold=0.3, lost_track_buffer=60)

    def detect_frames(self, frames):
        batch_size = 10
        detections = [] 
        for i in range(0, len(frames), batch_size):
            detections_batch = self.model.predict(
                frames[i:i+batch_size], 
                conf=0.3,   # Firm confidence - avoids ghost detections
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

            detection_supervision = sv.Detections.from_ultralytics(detection)
            
            # Separate players and referees by confidence
            player_detections = []
            referee_detections = []

            for j in range(len(detection_supervision)):
                class_id = detection_supervision.class_id[j]
                confidence = detection_supervision.confidence[j]
                bbox = detection_supervision.xyxy[j]
                class_name = cls_names[class_id].lower()

                if class_name == 'player' and confidence >= 0.3:
                    player_detections.append((bbox, confidence, class_id))
                elif class_name == 'referee' and confidence >= 0.3:
                    referee_detections.append((bbox, confidence, class_id))

            # ENFORCE MAX 10 PLAYERS: Keep only top-10 by confidence
            player_detections.sort(key=lambda x: x[1], reverse=True)
            player_detections = player_detections[:MAX_PLAYERS_ON_COURT]

            # Combine back into a supervision Detections object for tracking
            all_bboxes = [d[0] for d in player_detections + referee_detections]
            all_confs  = [d[1] for d in player_detections + referee_detections]
            all_cls    = [d[2] for d in player_detections + referee_detections]

            if len(all_bboxes) > 0:
                filtered_det = sv.Detections(
                    xyxy=np.array(all_bboxes),
                    confidence=np.array(all_confs),
                    class_id=np.array(all_cls)
                )
            else:
                filtered_det = sv.Detections.empty()

            # Track Objects
            detection_with_tracks = self.tracker.update_with_detections(filtered_det)
            tracks.append({})

            for frame_detection in detection_with_tracks:
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
        
        save_stub(stub_path, tracks)
        return tracks
