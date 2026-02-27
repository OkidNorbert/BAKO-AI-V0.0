import cv2
import numpy as np

class PassInterceptionDrawer:
    """
    A class responsible for calculating and drawing pass and interception statistics
    on a sequence of video frames.
    """
    def __init__(self):
        pass

    def get_stats(self, passes, interceptions):
        """
        Calculate the number of passes and interceptions for Team 1 and Team 2.

        Args:
            passes (list): A list of integers representing pass events at each frame.
                (1 represents a pass by Team 1, 2 represents a pass by Team 2, 0 represents no pass.)
            interceptions (list): A list of integers representing interception events at each frame.
                (1 represents an interception by Team 1, 2 represents an interception by Team 2, 0 represents no interception.)

        Returns:
            tuple: A tuple of four integers (team1_pass_total, team2_pass_total,
                team1_interception_total, team2_interception_total) indicating the total
                number of passes and interceptions for both teams.
        """
        team1_passes = []
        team2_passes = []
        team1_interceptions = []
        team2_interceptions = []

        for frame_num, (pass_frame, interception_frame) in enumerate(zip(passes, interceptions)):
            if pass_frame == 1:
                team1_passes.append(frame_num)
            elif pass_frame == 2:
                team2_passes.append(frame_num)
                
            if interception_frame == 1:
                team1_interceptions.append(frame_num)
            elif interception_frame == 2:
                team2_interceptions.append(frame_num)
                
        return len(team1_passes), len(team2_passes), len(team1_interceptions), len(team2_interceptions)

    def draw(self, video_frames, passes, interceptions):
        """
        Draw pass and interception statistics on a list of video frames.

        Args:
            video_frames (list): A list of frames (as NumPy arrays or image objects) on which to draw.
            passes (list): A list of integers representing pass events at each frame.
                (1 represents a pass by Team 1, 2 represents a pass by Team 2, 0 represents no pass.)
            interceptions (list): A list of integers representing interception events at each frame.
                (1 represents an interception by Team 1, 2 represents an interception by Team 2, 0 represents no interception.)

        Returns:
            list: A list of frames with pass and interception statistics drawn on them.
        """
        output_video_frames = []
        for frame_num, frame in enumerate(video_frames):
            if frame_num == 0:
                continue
            
            frame_drawn = self.draw_frame(frame, frame_num, passes, interceptions)
            output_video_frames.append(frame_drawn)
        return output_video_frames
    
    def draw_frame(self, frame, frame_num, passes, interceptions):
        """
        Draw a semi-transparent overlay of pass and interception counts on a single frame.
        """
        # HUD Design Constants
        frame_height, frame_width = frame.shape[:2]
        panel_w = int(frame_width * 0.35)
        panel_h = int(frame_height * 0.12)
        panel_x = int(frame_width * 0.05)
        panel_y = int(frame_height * 0.83) # Bottom Left
        
        # Draw Glass Panel
        from .utils import draw_glass_panel, draw_text_with_shadow
        draw_glass_panel(frame, (panel_x, panel_y, panel_w, panel_h), alpha=0.8, radius=15)

        # Header with neon line
        cv2.line(frame, (panel_x + 15, panel_y + 35), (panel_x + panel_w - 15, panel_y + 35), (100, 100, 100), 1)
        draw_text_with_shadow(frame, "MATCH PERFORMANCE DATA", (panel_x + 15, panel_y + 25), font_scale=0.45, color=(0, 255, 255), thickness=1)

        # Get stats until current frame
        passes_till_frame = passes[:frame_num+1]
        interceptions_till_frame = interceptions[:frame_num+1]
        
        team1_passes, team2_passes, team1_interceptions, team2_interceptions = self.get_stats(
            passes_till_frame, 
            interceptions_till_frame
        )

        # Stats Rows - Compact
        row_y1 = panel_y + 65
        row_y2 = panel_y + 95
        
        # Labels
        draw_text_with_shadow(frame, "TEAM", (panel_x + 20, row_y1 - 10), font_scale=0.3, color=(150, 150, 150), thickness=1)
        draw_text_with_shadow(frame, "PASSES", (panel_x + 120, row_y1 - 10), font_scale=0.3, color=(150, 150, 150), thickness=1)
        draw_text_with_shadow(frame, "INTERCEPTIONS", (panel_x + 220, row_y1 - 10), font_scale=0.3, color=(150, 150, 150), thickness=1)

        # Team 1 (Blue)
        cv2.circle(frame, (panel_x + 25, row_y1), 5, (255, 120, 0), -1)
        draw_text_with_shadow(frame, "HOME", (panel_x + 40, row_y1 + 5), font_scale=0.45, color=(255, 255, 255), thickness=1)
        draw_text_with_shadow(frame, str(team1_passes), (panel_x + 135, row_y1 + 5), font_scale=0.5, color=(255, 255, 255), thickness=1)
        draw_text_with_shadow(frame, str(team1_interceptions), (panel_x + 260, row_y1 + 5), font_scale=0.5, color=(100, 255, 100), thickness=1)

        # Team 2 (Red)
        cv2.circle(frame, (panel_x + 25, row_y2), 5, (0, 0, 200), -1)
        draw_text_with_shadow(frame, "AWAY", (panel_x + 40, row_y2 + 5), font_scale=0.45, color=(255, 255, 255), thickness=1)
        draw_text_with_shadow(frame, str(team2_passes), (panel_x + 135, row_y2 + 5), font_scale=0.5, color=(255, 255, 255), thickness=1)
        draw_text_with_shadow(frame, str(team2_interceptions), (panel_x + 260, row_y2 + 5), font_scale=0.5, color=(100, 255, 100), thickness=1)

        return frame