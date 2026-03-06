import cv2
import numpy as np
import matplotlib.pyplot as plt
from personal_analysis.drawers.utils import get_center

class ShotTracker:
    def __init__(self):
        self.ball_tracks = {}  # Store ball centers by track_id
        self.shots = []  # Store shot events
        self.shot_zone_factor = 2  # Expand rim bbox for shot zone
        self.rim_overlap_threshold = 0.23  # Fraction of rim size for overlap
        self.look_ahead_frames = 2  # Frames to check for shot outcome
        self.max_trail_length = 30  # Match BallTracksDrawer
        self.min_frames_between_shots = 15  # Cooldown between shots
        self.last_shot_frame = -8  # Initialize to allow first shot
        self.trajectory_deviation_threshold = 5.0  # Pixel deviation for net interaction
        self.velocity_drop_threshold = 0.8  # Min velocity ratio for net interaction

    def detect_shot(self, video_frames, ball_tracks, rim_tracks):
        # iterate through each frame and then keep track of the ball and rim. keep track of the ball staying above or below the rim once the ball goes from below to above the room , save the latest point of the ball. Then check if the ball is in the shot zone of the rim. If it is, then put a pending flag. then check when the ball goes below the rim again and save that point.  Then using y = mx + c check if the ball is going in the rim or not. If it is, then save the shot event as a make. If it is not, then save the shot event as a miss.
        # also track the ball bounding box size so that ther eis a posssibility of false positive when ball is infront of the rim.
        #also add a buffer so that shots are not detected too close to each other
        min_frames_between_shots = 15
        pending_shot = False
        latest_ball_point = None
        ball_box_width = 0
        ball_box_height = 0
        last_shot_frame = -8
        last_known_rim_box = None
        
        for frame_num, frame in enumerate(video_frames):
            #  use min_frames_between_shots to avoid detecting shots too close to each other
            if frame_num - last_shot_frame < min_frames_between_shots:
                continue
            
            player_dict = ball_tracks[frame_num]
            rim_dict = rim_tracks[frame_num]
            
            # Update last known rim box if available in this frame
            for r_t in rim_dict.values():
                if r_t.get("bbox") is not None:
                    last_known_rim_box = r_t["bbox"]
                    break

            for track_id, track in player_dict.items():
                if track["bbox"] is None:
                    continue

                box = track["bbox"]
                label = track["class"]

                if label == "Basketball":
                    # Store ball center
                    center = get_center(box)
                    if track_id not in self.ball_tracks:
                        self.ball_tracks[track_id] = []
                    self.ball_tracks[track_id].append(center)

                   #check if there is a pending shot
                    if pending_shot:
                        # Use current rim or last known one
                        rim_box = None
                        if last_known_rim_box is not None:
                            rim_box = last_known_rim_box
                        
                        if rim_box is not None:
                            rim_center = get_center(rim_box)

                            # Check if ball crossed the rim line (downward)
                            if center[1] > rim_center[1] and latest_ball_point is not None and center[1] > latest_ball_point[1]:
                                shot_zone_box = [
                                                int(rim_box[0] - (rim_box[2] - rim_box[0]) * self.shot_zone_factor),
                                                int(rim_box[1] - (rim_box[3] - rim_box[1]) * self.shot_zone_factor),
                                                int(rim_box[2] + (rim_box[2] - rim_box[0]) * self.shot_zone_factor),
                                                int(rim_box[3] + (rim_box[3] - rim_box[1]) * self.shot_zone_factor)
                                                ]
                                outcome = self.check_shot_outcome(frame_num, latest_ball_point, center, rim_tracks, ball_tracks, shot_zone_box, rim_box_override=rim_box)
                                if outcome is not None:
                                    self.shots.append({
                                        "frame": frame_num,
                                        "outcome": outcome,
                                        "center": center
                                    })
                                    pending_shot = False
                                    last_shot_frame = frame_num
                                break
                            #  if ball is still above the rim then updated the latest ball point
                            elif center[1] <= rim_center[1]:
                                if center[1] < rim_box[1]:
                                    latest_ball_point = center
                                    frame = cv2.circle(frame, (int(center[0]), int(center[1])), 5, (0, 0,255), -1)
                                break
                            

                    else:
                        # Check if ball is above the rim to start a potential shot
                        rim_box = None
                        if last_known_rim_box is not None:
                            rim_box = last_known_rim_box
                            
                        if rim_box is not None:
                            rim_center = get_center(rim_box)
                            # check if ball center is above rim box top
                            if center[1] < rim_box[1]:
                                shot_zone_box = [
                                                int(rim_box[0] - (rim_box[2] - rim_box[0]) * self.shot_zone_factor),
                                                int(rim_box[1] - (rim_box[3] - rim_box[1]) * self.shot_zone_factor),
                                                int(rim_box[2] + (rim_box[2] - rim_box[0]) * self.shot_zone_factor),
                                                int(rim_box[3] + (rim_box[3] - rim_box[1]) * self.shot_zone_factor)
                                                ]
                                if self.is_in_shot_zone(center, shot_zone_box):
                                    pending_shot = True
                                    latest_ball_point = center
                                    # draw point at the latest ball point
                                    frame = cv2.circle(frame, (int(center[0]), int(center[1])), 5, (0,0, 255), -1)
                                    ball_box_width = box[2] - box[0]
                                    ball_box_height = box[3] - box[1]
                                    break

        
        
        
    
    def is_in_shot_zone(self, center, shot_zone_box):
        x = center[0]
        y = center[1]
        x1, y1, x2, y2 = shot_zone_box
        return x1 <= x <= x2 and y1 <= y <= y2
    
    def check_shot_outcome(self, frame_num, latest_ball_point, ball_point_below_rim, rim_track, ball_tracks, shot_zone_box, rim_box_override=None):
        # Calculate the line equation y = mx + c using the two ball points
        x1, y1 = latest_ball_point
        x2, y2 = ball_point_below_rim

        # Ensure downward movement
        if y2 <= y1:
            return None

        m = (y2 - y1) / (x2 - x1) if x2 != x1 else 0
        c = y1 - m * x1

        # Get rim center
        rim_box = rim_box_override
        if rim_box is None:
            for rim in rim_track[frame_num].values():
                if rim["bbox"] is not None:
                    rim_box = rim["bbox"]
                    break
        
        if rim_box is None:
            return None

        rim_center = get_center(rim_box)
        adjustment = (rim_box[2] - rim_box[0]) * self.rim_overlap_threshold
        y_rim = rim_center[1]
        # Solve for x when y = y_rim
        if m == 0:
            x_at_rim = x1
        else:
            x_at_rim = (y_rim - c) / m

        # Check if x_at_rim is inside the rim bounding box
        x1_rim, y1_rim, x2_rim, y2_rim = rim_box
        intersects_rim = (rim_box[0] + adjustment <= x_at_rim <= rim_box[2] - adjustment)

        # # Check trajectory variation
        # trajectory_points = []
        # start_frame = max(0, frame_num - self.look_ahead_frames)
        # for i in range(start_frame, min(frame_num + self.look_ahead_frames + 3, len(ball_tracks))):
        #     if 1 in ball_tracks[i] and ball_tracks[i][1].get("bbox") is not None:
        #         center = get_center(ball_tracks[i][1]["bbox"])
        #         if self.is_in_shot_zone(center, shot_zone_box):
        #             trajectory_points.append(center)

        # if len(trajectory_points) < 3:
        #     return "miss" if intersects_rim else None

        # # # Fit quadratic to points: y = ax^2 + bx + c
        # # x = np.array([p[0] for p in trajectory_points])
        # # y = np.array([p[1] for p in trajectory_points])
        # # try:
        # #     coeffs = np.polyfit(x, y, 2)
        # #     y_pred = np.polyval(coeffs, x)
        # #     deviations = np.abs(y - y_pred)
        # #     max_deviation = np.max(deviations)
        # # except np.linalg.LinAlgError:
        # #     max_deviation = 0

        # # Check velocity change
        # velocities = []
        # for i in range(1, len(trajectory_points)):
        #     dx = trajectory_points[i][0] - trajectory_points[i-1][0]
        #     dy = trajectory_points[i][1] - trajectory_points[i-1][1]
        #     v = np.sqrt(dx**2 + dy**2)
        #     velocities.append(v)
            
        # velocity_drop = min(velocities) / max(velocities) if velocities and max(velocities) > 0 else 1.0
        # print("Velocity drop: ", velocity_drop)

        # Determine outcome
        # if intersects_rim and max_deviation > self.trajectory_deviation_threshold and velocity_drop < self.velocity_drop_threshold:
        if intersects_rim:
            return "make"
        else:
            return "miss"
        
       
    
    def draw_shots(self, video_frames):

        if len(self.shots) == 0:
            for frame_num, frame in enumerate(video_frames):
                frame = frame.copy()
                cv2.putText(frame, "No shots detected", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                video_frames[frame_num] = frame
            return video_frames

        #  keep track of all shots made and missed. draw on top left of video of percentage of shots made and missed. draw on top right of video the number of shots made and missed
        output_video_frames = []
        print("Total shots: ", len(self.shots))
        print("Shots made: ", len([shot for shot in self.shots if shot["outcome"] == "make"]))
        print("Shots missed: ", len([shot for shot in self.shots if shot["outcome"] == "miss"]))



        total_shots = 0
        made_shots = 0
        missed_shots = 0
        made_percentage = 0
        first_shot_frame = self.shots[0]["frame"]
        last_shot_frame = self.shots[-1]["frame"]

        for frame_num, frame in enumerate(video_frames):
            # frame = frame.copy()
            if frame_num < first_shot_frame:
                frame = cv2.putText(frame, "No shots detected", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            elif frame_num > last_shot_frame:
                frame = cv2.putText(frame, f"{made_shots} / {total_shots}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                frame = cv2.putText(frame, f"Made Percentage: {made_percentage:.2f}%", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            else:
                if frame_num == self.shots[total_shots]["frame"]:
                    if self.shots[total_shots]["outcome"] == "make":
                        made_shots += 1
                    else:
                        missed_shots += 1
                    total_shots+= 1
                    made_percentage = (made_shots / total_shots) * 100
                frame = cv2.putText(frame, f"{made_shots} / {total_shots}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                frame = cv2.putText(frame, f"Made Percentage: {made_percentage:.2f}%", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                

            output_video_frames.append(frame)



        return output_video_frames

    

        
