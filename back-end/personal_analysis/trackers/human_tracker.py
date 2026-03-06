from ultralytics import YOLO
import supervision as sv
import torch
import pandas as pd
import numpy as np

class HumanTracker:

    def __init__(self, model_path: str):
        self.model = YOLO(model_path, )
        self.tracker = sv.ByteTrack()
        
    def detect_frame(self, frame):
        batch_size = 20
        detections = []
        print("is cuda available?", torch.cuda.is_available())
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        for i in range(0, len(frame), batch_size):
            batch = frame[i:i + batch_size]
            
            results = self.model.predict(batch, conf=0.25, device=device) 
            detections += results
            
            # with open("detections.txt", "w") as f:
            #     f.write(str(results))
        return detections
    
    def angle_bw_points(self, a, b, c):
        """
        Computes the angle ABC (at point B)
        a, b, c are (x, y) tuples.
        """
        # Create vectors BA and BC
        ba = (a[0] - b[0], a[1] - b[1])
        bc = (c[0] - b[0], c[1] - b[1])

        # Dot product and magnitudes
        dot = ba[0] * bc[0] + ba[1] * bc[1]
        mag_ba = np.sqrt(ba[0]**2 + ba[1]**2)
        mag_bc = np.sqrt(bc[0]**2 + bc[1]**2)

        # Avoid division by zero
        if mag_ba == 0 or mag_bc == 0:
            return None

        # Compute angle in radians
        cos_angle = dot / (mag_ba * mag_bc)

        # Clamp to avoid numerical errors
        cos_angle = max(min(cos_angle, 1), -1)

        angle_rad = np.acos(cos_angle)

        # Convert to degrees
        return np.degrees(angle_rad)

    def calc_angles(
        self,
        video_frames,
        detections,
        shooting_arm: str = "right"
    ):
        angles: tuple[list[float | None], list[float | None]] = ([], [])  # [0] = shoulder-elbow-wrist, [1] = elbow-shoulder-hip

        # Side indices (COCO default)
        if shooting_arm.lower() == "left":
            s_idx, e_idx, w_idx, h_idx = 5, 7, 9, 11
        else:
            s_idx, e_idx, w_idx, h_idx = 6, 8, 10, 12

        for i, frame in enumerate(video_frames):
            res = detections[i]

            # --- Keypoints object (may be None) ---
            kps = getattr(res, "keypoints", None)

            # If no keypoints at all for this frame
            if kps is None or getattr(kps, "xy", None) is None:
                angles[0].append(None)
                angles[1].append(None)
                continue

            # Convert to numpy
            kps_xy = kps.xy.cpu().numpy()  # shape: [N, K, 2] (N = num people)
            N = kps_xy.shape[0]

            # If no people detected
            if N == 0:
                angles[0].append(None)
                angles[1].append(None)
                continue

            person_idx = 0
            joints = [(float(x), float(y)) for x, y in kps_xy[person_idx]]

            # Dynamics indices based on shooting_arm
            shoulder = joints[s_idx]
            elbow = joints[e_idx]
            wrist = joints[w_idx]
            hip = joints[h_idx]

            # Helper to check if a point is invalid (None or near-origin)
            def invalid_point(p):
                if p is None:
                    return True
                x, y = p
                if x is None or y is None:
                    return True
                return (abs(x) < 1 and abs(y) < 1)

            # Skip if any of the keypoints we need is invalid
            if (invalid_point(shoulder) or
                invalid_point(elbow) or
                invalid_point(wrist) or
                invalid_point(hip)):
                angles[0].append(None)
                angles[1].append(None)
                continue

            angle_sew = self.angle_bw_points(shoulder, elbow, wrist)
            angle_esh = self.angle_bw_points(elbow, shoulder, hip)

            angles[0].append(angle_sew)
            angles[1].append(angle_esh)

        return angles

    def get_points(
        self,
        video_frames,
        detections
    ):
        all_points = []

        for i, frame in enumerate(video_frames):
            res = detections[i]

            # --- Keypoints object (may be None) ---
            kps = getattr(res, "keypoints", None)

            # If no keypoints at all for this frame
            if kps is None or getattr(kps, "xy", None) is None:
                all_points.append(None)
                continue

            # Convert to numpy
            kps_xy = kps.xy.cpu().numpy()  # shape: [N, K, 2] (N = num people)
            kps_cf = getattr(kps, "conf", None)
            if kps_cf is not None:
                kps_cf = kps_cf.cpu().numpy()

            N = kps_xy.shape[0]

            # If no people detected
            if N == 0:
                all_points.append(None)
                continue

            person_idx = 0  

            joints = [(float(x), float(y)) for x, y in kps_xy[person_idx]]
            all_points.append(joints)

        return all_points
