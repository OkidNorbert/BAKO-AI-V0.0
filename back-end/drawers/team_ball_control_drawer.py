import cv2 
import numpy as np

class TeamBallControlDrawer:
    """
    A class responsible for calculating and drawing team ball control statistics on video frames.
    """
    def __init__(self):
        pass

    def get_team_ball_control(self,player_assignment,ball_aquisition):
        """
        Calculate which team has ball control for each frame.

        Args:
            player_assignment (list): A list of dictionaries indicating team assignments for each player
                in the corresponding frame.
            ball_aquisition (list): A list indicating which player has possession of the ball in each frame.

        Returns:
            numpy.ndarray: An array indicating which team has ball control for each frame
                (1 for Team 1, 2 for Team 2, -1 for no control).
        """

        team_ball_control = []
        for player_assignment_frame,ball_aquisition_frame in zip(player_assignment,ball_aquisition):
            if ball_aquisition_frame == -1:
                team_ball_control.append(-1)
                continue
            if ball_aquisition_frame not in player_assignment_frame:
                team_ball_control.append(-1)
                continue
            if player_assignment_frame[ball_aquisition_frame] == 1:
                team_ball_control.append(1)
            else:
                team_ball_control.append(2)

        team_ball_control= np.array(team_ball_control) 
        return team_ball_control

    def draw(self,video_frames,player_assignment,ball_aquisition):
        """
        Draw team ball control statistics on a list of video frames.

        Args:
            video_frames (list): A list of frames (as NumPy arrays or image objects) on which to draw.
            player_assignment (list): A list of dictionaries indicating team assignments for each player
                in the corresponding frame.
            ball_aquisition (list): A list indicating which player has possession of the ball in each frame.

        Returns:
            list: A list of frames with team ball control statistics drawn on them.
        """
        
        team_ball_control = self.get_team_ball_control(player_assignment,ball_aquisition)

        output_video_frames= []
        for frame_num, frame in enumerate(video_frames):
            if frame_num == 0:
                continue

            frame_drawn = self.draw_frame(frame,frame_num,team_ball_control)
            output_video_frames.append(frame_drawn)
        return output_video_frames
    
    def draw_frame(self, frame, frame_num, team_ball_control):
        """
        Draw a semi-transparent overlay of team ball control percentages on a single frame.
        """
        # HUD Design Constants
        frame_height, frame_width = frame.shape[:2]
        panel_w = int(frame_width * 0.28)
        panel_h = int(frame_height * 0.12)
        panel_x = int(frame_width * 0.68)
        panel_y = int(frame_height * 0.05) # Move to Top Right
        
        # Draw Glass Panel
        from .utils import draw_glass_panel, draw_text_with_shadow
        draw_glass_panel(frame, (panel_x, panel_y, panel_w, panel_h), alpha=0.8, radius=15)

        # Header with neon line
        cv2.line(frame, (panel_x + 15, panel_y + 35), (panel_x + panel_w - 15, panel_y + 35), (100, 100, 100), 1)
        draw_text_with_shadow(frame, "MATCH POSSESSION", (panel_x + 15, panel_y + 25), font_scale=0.45, color=(0, 255, 255), thickness=1)

        team_ball_control_till_frame = team_ball_control[:frame_num+1]
        team_1_num_frames = team_ball_control_till_frame[team_ball_control_till_frame==1].shape[0]
        team_2_num_frames = team_ball_control_till_frame[team_ball_control_till_frame==2].shape[0]
        total_controlled = max(1, team_1_num_frames + team_2_num_frames)
        team_1_pct = team_1_num_frames / total_controlled
        team_2_pct = team_2_num_frames / total_controlled

        # Multi-color Progress Bar
        bar_x = panel_x + 20
        bar_y = panel_y + 75
        bar_w = panel_w - 40
        bar_h = 10
        
        # Team 1 part (Blue)
        t1_w = int(bar_w * team_1_pct)
        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + t1_w, bar_y + bar_h), (255, 120, 0), -1)
        # Team 2 part (Red)
        cv2.rectangle(frame, (bar_x + t1_w, bar_y), (bar_x + bar_w, bar_y + bar_h), (0, 0, 200), -1)
        # Border
        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (255, 255, 255), 1)

        # Percentage Labels
        draw_text_with_shadow(frame, f"HOME {team_1_pct*100:.0f}%", (bar_x, bar_y - 10), font_scale=0.4, color=(255, 255, 255), thickness=1)
        draw_text_with_shadow(frame, f"AWAY {team_2_pct*100:.0f}%", (bar_x + bar_w - 60, bar_y - 10), font_scale=0.4, color=(255, 255, 255), thickness=1)

        return frame