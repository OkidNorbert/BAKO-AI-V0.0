import cv2
import numpy as np

class ShotDrawer:
    def __init__(self):
        self.score_team_1 = 0
        self.score_team_2 = 0
        self.shot_results_processed = set() # Prevent double counting

    def draw(self, frames, shots, hoop_detections=None):
        output_frames = []
        
        # Sort shots by frame for easier processing
        processed_shots = sorted(shots, key=lambda x: x['start_frame'])
        
        for frame_num, frame in enumerate(frames):
            frame = frame.copy()
            
            # --- DEBUG: Draw Detected Hoop ---
            if hoop_detections and frame_num < len(hoop_detections):
                hoop = hoop_detections[frame_num]
                if hoop and 'bbox' in hoop:
                    x1_h, y1_h, x2_h, y2_h = map(int, hoop['bbox'])
                    # Draw dotted box for hoop
                    cv2.rectangle(frame, (x1_h, y1_h), (x2_h, y2_h), (255, 100, 0), 2)
                    cv2.putText(frame, "HOOP", (x1_h, y1_h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 100, 0), 1)
                    # Mark rim center
                    cx, cy = int(hoop['center'][0]), int(hoop['rim_y'])
                    cv2.circle(frame, (cx, cy), 5, (0, 255, 255), -1)

            
            # 1. Update Score and show "MADE/MISSED" notification
            for shot in processed_shots:
                # Outcome logic
                outcome_frame = shot.get('outcome_frame', shot['start_frame'] + 30)
                
                # Double-count protection
                shot_key = f"{shot['start_frame']}_{shot.get('player_id', 'unknown')}"
                if frame_num >= outcome_frame and shot_key not in self.shot_results_processed:
                    if shot['outcome'] == 'made':
                        points = 3 if shot.get('shot_type') == 'three-pointer' else 2
                        if shot.get('team_id') == 1:
                            self.score_team_1 += points
                        else:
                            self.score_team_2 += points
                    self.shot_results_processed.add(shot_key)

                # Show notification for 60 frames after outcome (approx 2 seconds)
                if outcome_frame <= frame_num < outcome_frame + 60:
                    if shot['outcome'] == 'unknown':
                        outcome_text = "TRACKING LOST"
                        color = (150, 150, 150) # Grey
                    else:
                        outcome_text = shot['outcome'].upper()
                        color = (0, 255, 0) if shot['outcome'] == 'made' else (0, 0, 255)
                    
                    # Position top center
                    cv2.putText(frame, outcome_text, (frame.shape[1]//2 - 120, 180), 
                                cv2.FONT_HERSHEY_DUPLEX, 2.5, color, 4)
                    
                    # Show tactical detail (Contestedness and Quality)
                    dist_text = ""
                    if 'shooter_distance_meters' in shot:
                        dist_text = f" | {shot['shooter_distance_meters']}m"
                    elif 'shooter_distance_px' in shot:
                        dist_text = f" | {shot['shooter_distance_px']}px"

                    detail = f"{shot.get('contestedness', 'Unknown')} | {shot.get('shot_quality', 'N/A')}{dist_text}"
                    
                    # Background for readable text
                    (w, h), _ = cv2.getTextSize(detail, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
                    cv2.rectangle(frame, (frame.shape[1]//2 - w//2 - 10, 210), (frame.shape[1]//2 + w//2 + 10, 245), (0,0,0), -1)
                    
                    cv2.putText(frame, detail, (frame.shape[1]//2 - w//2, 235),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            # 2. Draw Scoreboard (Persistent)
            self._draw_scoreboard(frame)
            
            output_frames.append(frame)
            
        return output_frames

    def _draw_scoreboard(self, frame):
        # Calculate right-side position
        frame_width = frame.shape[1]
        rect_width = 360
        rect_height = 100
        padding = 40
        
        x1 = frame_width - rect_width - padding
        y1 = padding
        x2 = frame_width - padding
        y2 = padding + rect_height

        # Stylish semi-transparent background
        overlay = frame.copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        
        # Border
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 255), 2)
        
        # Teams
        cv2.putText(frame, f"TEAM 1 (Grey): {self.score_team_1}", (x1 + 20, y1 + 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (220, 220, 220), 2)
        cv2.putText(frame, f"TEAM 2 (Red):  {self.score_team_2}", (x1 + 20, y1 + 80), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (80, 80, 255), 2)
