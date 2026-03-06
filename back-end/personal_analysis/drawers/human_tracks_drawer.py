import cv2
import numpy as np
import os


class HumanTracksDrawer:
    """
    Draw YOLOv8 Results on frames (bboxes, labels, scores, keypoints + skeleton).
    Works with Ultralytics Results list aligned to frames: detections[i] corresponds to video_frames[i].
    """

    # COCO-17 keypoint skeleton (Ultralytics default order)
    # (index pairs to connect with lines)
    COCO_SKELETON = [
        (5, 7), (7, 9),        # left arm: L-shoulder->L-elbow->L-wrist
        (6, 8), (8,10),        # right arm: R-shoulder->R-elbow->R-wrist
        (11,13), (13,15),      # left leg: L-hip->L-knee->L-ankle
        (12,14), (14,16),      # right leg: R-hip->R-knee->R-ankle
        (5,6), (11,12),        # shoulders, hips
        (5,11), (6,12),        # torso diagonals
        (0,1), (1,2), (2,3), (3,4), (0,5), (0,6)  # head/neck connections
    ]
    COCO_SKELETON_Names = [
        "Nose", 
        "Left Eye", 
        "Right Eye", 
        "Left Ear", 
        "Right Ear", 
        "Left Shoulder", 
        "Right Shoulder", 
        "Left Elbow", 
        "Right Elbow", 
        "Left Wrist", 
        "Right Wrist", 
        "Left Hip", 
        "Right Hip", 
        "Left Knee", 
        "Right Knee", 
        "Left Ankle", 
        "Right Ankle"
    ]

    def __init__(
        self,
        box_color=(0, 255, 0),
        kp_color=(255, 0, 0),
        skeleton_color=(0, 255, 255),
        skeleton_color_rhs=(255,0,0),
        text_color=(255, 255, 255),
        box_thickness=2,
        kp_radius=3,
        sk_thickness=2,
        font=cv2.FONT_HERSHEY_SIMPLEX,
        font_scale=0.5,
    ):
        self.box_color = box_color
        self.kp_color = kp_color
        self.skeleton_color = skeleton_color
        self.skeleton_color_rhs = skeleton_color_rhs        
        self.text_color = text_color
        self.box_thickness = box_thickness
        self.kp_radius = kp_radius
        self.sk_thickness = sk_thickness
        self.font = font
        self.font_scale = font_scale

    def _put_label(self, img, label, x1, y1):
        (tw, th), _ = cv2.getTextSize(label, self.font, self.font_scale, 1)
        cv2.rectangle(img, (x1, max(0, y1 - th - 6)), (x1 + tw + 4, y1), self.box_color, -1)
        cv2.putText(img, label, (x1 + 2, y1 - 4), self.font, self.font_scale, self.text_color, 1, cv2.LINE_AA)

    def _draw_box(self, img, box, label=None):
        x1, y1, x2, y2 = map(int, box)
        cv2.rectangle(img, (x1, y1), (x2, y2), self.box_color, self.box_thickness)
        if label:
            self._put_label(img, label, x1, y1)

    def _draw_keypoints(self, img, kps_xy, kps_conf=None, conf_thr=0.2):
        """
        kps_xy: (K,2) ndarray or list of (x,y)
        kps_conf: (K,) confidences or None
        """
        K = len(kps_xy)
        # draw joints
        for i in range(K):
            x, y = kps_xy[i]
            if x is None or y is None:
                continue
            # Skip invalid_grp coordinates (0,0) or very close to origin
            if abs(x) < 1 and abs(y) < 1:
                continue
            if kps_conf is not None and kps_conf[i] is not None and kps_conf[i] < conf_thr:
                continue
            # cv2.circle(img, (int(x), int(y)), self.kp_radius, self.kp_color, -1)

        # draw skeleton
        for a, b in self.COCO_SKELETON:
            if a >= K or b >= K:
                continue
            xa, ya = kps_xy[a]
            xb, yb = kps_xy[b]
            if None in (xa, ya, xb, yb):
                continue
            # Skip invalid_grp coordinates (0,0) or very close to origin
            if (abs(xa) < 1 and abs(ya) < 1) or (abs(xb) < 1 and abs(yb) < 1):
                continue
            if kps_conf is not None:
                ca = kps_conf[a] if kps_conf[a] is not None else 1.0
                cb = kps_conf[b] if kps_conf[b] is not None else 1.0
                if ca < conf_thr or cb < conf_thr:
                    continue
            if ((a,b) == (6, 8) or (a,b) == (8,10) or (a,b) == (6,12)):
                cv2.line(img, (int(xa), int(ya)), (int(xb), int(yb)), self.skeleton_color_rhs, self.sk_thickness)
                if ((a,b) == (6, 8)):
                    cv2.line(img, (int(xa), int(ya)), (int(xa), int(ya+25)), self.skeleton_color, self.sk_thickness)
            else:
                # cv2.line(img, (int(xa), int(ya)), (int(xb), int(yb)), self.skeleton_color, self.sk_thickness)
                pass
            
    def write_coords(self, img, kps_xy, kps_conf=None, conf_thr=0.2):
        parts_oi = [6,8,10,12] #right arm stuff

        # for parts in range(len(kps_xy)):
        #     coord = kps_xy[parts]
        #     part = self.COCO_SKELETON_Names[parts]
        #     cv2.putText(img, f"{part} coords: {coord}", (10, 90+parts*30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        offset = 0
        for parts in parts_oi:
            offset += 30
            coord = kps_xy[parts]
            part = self.COCO_SKELETON_Names[parts]
            
            # Check if coordinate is valid_grp
            if coord[0] is None or coord[1] is None:
                cv2.putText(img, f"{part} coords: N/A", (10, 60+offset), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                continue
                
            # Check confidence threshold
            if kps_conf is not None and parts < len(kps_conf):
                if kps_conf[parts] is not None and kps_conf[parts] < conf_thr:
                    cv2.putText(img, f"{part} coords: Low confidence", (10, 60+offset), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                    continue
            
            x = round(coord[0],4)
            y = round(coord[1],4)
            coord = (x,y)
            cv2.putText(img, f"{part} coords: {coord}", (10, 60+offset), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        

    def write_angles(self, img, angle_sew, angle_esh):
        if angle_sew is None:
            cv2.putText(img, "Right S-E-W angle: N/A", (10, 210), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        else:
            angle_sew = round(angle_sew, 4)
            cv2.putText(img, f"Right S-E-W angle: {angle_sew} deg", (10, 210), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        if angle_esh is None:
            cv2.putText(img, "Right E-S-H angle: N/A", (10, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        else:
            angle_esh = round(angle_esh, 4)
            cv2.putText(img, f"Right E-S-H angle: {angle_esh} deg", (10, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            

    def draw(
        self,
        video_frames,
        detections,
        angles,
        shooting_arm: str = "right",
        draw_boxes=True,
        draw_keypoints=True,
        draw_labels=True,
        score_thr=0.25,
        kpt_thr=0.2,
        class_names=None
    ):
        """
        Args:
            video_frames: list[np.ndarray] BGR frames
            detections: list[ultralytics.engine.results.Results]
            shooting_arm: 'left' or 'right'
        Returns:
            list[np.ndarray]: frames with overlays
        """
        out_frames = []
        
        # Decide which specific skeleton parts to highlight based on shooting_arm
        if shooting_arm.lower() == "left":
            highlight_lines = {(5, 7), (7, 9), (5, 11)}
        else:
            highlight_lines = {(6, 8), (8, 10), (6, 12)}

        for i, frame in enumerate(video_frames):
            res = detections[i]
            img = frame
            
            # --- Keypoints ---
            kps = getattr(res, "keypoints", None)
            if draw_keypoints and (kps is not None) and (len(kps) > 0):
                try:
                    kps_xy = kps.xy.cpu().numpy()  
                except:
                    data = kps.data
                    if data is None or len(data) == 0: kps_xy = None
                    else: kps_xy = data[..., :2].cpu().numpy()

                kps_cf = kps.conf.cpu().numpy() if hasattr(kps, "conf") and kps.conf is not None else None

                if kps_xy is not None:
                    N = kps_xy.shape[0]
                    for n in range(N):
                        joints = [(float(x), float(y)) for x, y in kps_xy[n]]
                        confs = [float(c) if c is not None else 1.0 for c in kps_cf[n]] if kps_cf is not None else [1.0]*len(joints)
                        K = len(joints)

                        # Draw skeleton
                        for a, b in self.COCO_SKELETON:
                            if a >= K or b >= K: continue
                            xa, ya = joints[a]; xb, yb = joints[b]
                            if None in (xa, ya, xb, yb) or (abs(xa)<1 and abs(ya)<1) or (abs(xb)<1 and abs(yb)<1): continue
                            
                            if (a, b) in highlight_lines:
                                cv2.line(img, (int(xa), int(ya)), (int(xb), int(yb)), self.skeleton_color_rhs, self.sk_thickness)
                                if (a, b) == (5, 7) or (a, b) == (6, 8):
                                     cv2.line(img, (int(xa), int(ya)), (int(xa), int(ya+25)), self.skeleton_color, self.sk_thickness)

            out_frames.append(img)
        return out_frames

    def analysis(self, frames, angles, leave_frames, shot_starts, report_path, shot_distances=None, shooting_arm: str = "right"):
        out_dir = os.path.dirname(report_path)
        if out_dir and not os.path.exists(out_dir):
            os.makedirs(out_dir, exist_ok=True)

        with open(report_path, "w") as f: f.write("")

        arm_label = shooting_arm.capitalize()
        # shoulder-elbow-wrist
        sew_min_thresh, sew_max_thresh = 65, 75
        # elbow-shoulder-hip
        esh_min_thresh, esh_max_thresh = 120, 135

        sew_list, esh_list = angles

        for shot_num, frame_num in enumerate(leave_frames):
            if shot_num >= len(shot_starts): continue
            start, end = shot_starts[shot_num], frame_num
            sew_valid_grp = [a for a in sew_list[start:end+1] if a is not None]
            esh_valid_grp = [a for a in esh_list[start:end+1] if a is not None]

            if sew_valid_grp:
                sew_min = round(min(sew_valid_grp), 4)
            else: sew_min = None

            if esh_valid_grp:
                esh_max = round(max(esh_valid_grp), 4)
            else: esh_max = None

            issues = []
            if sew_min is not None:
                if sew_min <= sew_min_thresh:
                    issues.append(f"Your {arm_label} SEW angle ({sew_min} deg) is too low. Open your elbows!")
                elif sew_min >= sew_max_thresh:
                    issues.append(f"Your {arm_label} SEW angle ({sew_min} deg) is too high. Close your elbow!")
                else: issues.append(f"No issues with {arm_label} SEW")
            else: issues.append("missing arm angles")

            if esh_max is not None:
                if esh_max <= esh_min_thresh:
                    issues.append(f"Your {arm_label} ESH angle ({esh_max} deg) is too low. Shoot with more arc!")
                elif esh_max >= esh_max_thresh:
                    issues.append(f"Your {arm_label} ESH angle ({esh_max} deg) is too high. Shoot with less arc!")
                else: issues.append(f"No issue with {arm_label} ESH")
            else: issues.append("missing torso angles")

            if shot_distances and shot_num < len(shot_distances):
                dist = shot_distances[shot_num]
                if dist is not None: issues.append(f"Shot distance: {dist}m")

            if len(issues) == 2: verdict = ["GOOD FORM"]
            else: verdict = [f"shot {shot_num+1}"] + ["NEEDS WORK: "] + issues

            with open(report_path, "a") as f:
                for item in verdict:
                    f.write(str(item) + "\n")
                f.write("\n")

            # Draw a premium overlay box for the feedback
            linger = 90
            for k in range(0, linger):
                draw_frame_index = frame_num + k
                if draw_frame_index >= len(frames): break
                frame = frames[draw_frame_index]
                
                overlay = frame.copy()
                h, w = frame.shape[:2]
                
                # Panel size and position (bottom left area)
                box_w = 600
                box_h = 40 + (len(verdict) * 30)
                x1, y1 = 30, h - box_h - 30
                x2, y2 = x1 + box_w, y1 + box_h
                
                # Draw dark bg and border
                cv2.rectangle(overlay, (x1, y1), (x2, y2), (20, 17, 15), -1) 
                
                # Border color: Green for GOOD FORM, Orange for NEEDS WORK
                border_col = (0, 220, 0) if "GOOD FORM" in verdict else (22, 115, 249)
                cv2.rectangle(overlay, (x1, y1), (x2, y2), border_col, 2) 
                
                # Blend
                alpha = 0.85
                frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
                
                # Header
                header_txt = "FORM ANALYSIS - " + verdict[0].upper()
                cv2.putText(frame, header_txt, (x1 + 20, y1 + 30), cv2.FONT_HERSHEY_DUPLEX, 0.6, border_col, 2, cv2.LINE_AA)
                
                # Bullet points
                offset = 60
                for txt in verdict[1:]:
                    if txt.strip() == "GOOD FORM":
                        continue
                    # Clean up the NEEDS WORK prefix if it exists to just bullet point it
                    clean_txt = txt.replace("NEEDS WORK: ", "")
                    cv2.putText(frame, f"~ {clean_txt}", (x1 + 20, y1 + offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (230, 230, 230), 1, cv2.LINE_AA)
                    offset += 30
                    
                frames[draw_frame_index] = frame

        return frames

        