import cv2 

class TacticalViewDrawer:
    def __init__(self, team_1_color=[255, 245, 238], team_2_color=[128, 0, 0]):
        self.start_x = 20
        self.start_y = 40
        self.team_1_color = team_1_color
        self.team_2_color = team_2_color

    def draw(self, 
             video_frames, 
             court_image_path, 
             width,
             height,
             tactical_court_keypoints,
             tactical_player_positions=None,
             tactical_ball_positions=None,
             player_assignment=None,
             ball_acquisition=None):
        """
        Draw tactical view with court keypoints and player positions.
        
        Args:
            video_frames (list): List of video frames to draw on.
            court_image_path (str): Path to the court image.
            width (int): Width of the tactical view.
            height (int): Height of the tactical view.
            tactical_court_keypoints (list): List of court keypoints in tactical view.
            tactical_player_positions (list, optional): List of dictionaries mapping player IDs to 
                their positions in tactical view coordinates.
            tactical_ball_positions (list, optional): List of dictionaries mapping ball IDs to 
                their positions in tactical view coordinates.
            player_assignment (list, optional): List of dictionaries mapping player IDs to team assignments.
            ball_acquisition (list, optional): List indicating which player has the ball in each frame.
            
        Returns:
            list: List of frames with tactical view drawn on them.
        """
        # Load court image with alpha channel if possible, or just standard
        court_image = cv2.imread(court_image_path)
        court_image = cv2.resize(court_image, (width, height))

        output_video_frames = []
        for frame_idx, frame in enumerate(video_frames):
            frame = frame.copy()

            # Panel positioning
            p_x, p_y = self.start_x, self.start_y
            p_w, p_h = width, height
            
            # Draw a dark background panel first for contrast
            from .utils import draw_glass_panel, draw_text_with_shadow
            draw_glass_panel(frame, (p_x-10, p_y-30, p_w+20, p_h+40), alpha=0.8, radius=15)
            
            # Header with glow effect
            cv2.rectangle(frame, (p_x-10, p_y-30), (p_x+p_w+10, p_y-5), (20, 20, 20), -1)
            cv2.rectangle(frame, (p_x-10, p_y-30), (p_x+p_w+10, p_y-5), (0, 255, 255), 1)
            
            draw_text_with_shadow(frame, "REAL-TIME TACTICAL BOARD", (p_x + 10, p_y - 12), font_scale=0.35, color=(0, 255, 255), thickness=1)
            
            # Blend court image
            alpha = 0.4
            roi = frame[p_y:p_y+p_h, p_x:p_x+p_w]
            cv2.addWeighted(court_image, alpha, roi, 1 - alpha, 0, roi)

            # Draw subtle grid
            grid_color = (100, 100, 100)
            for gx in range(0, p_w, 20):
                cv2.line(frame, (p_x + gx, p_y), (p_x + gx, p_y + p_h), grid_color, 1)
            for gy in range(0, p_h, 20):
                cv2.line(frame, (p_x, p_y + gy), (p_x + p_w, p_y + gy), grid_color, 1)

            # Scanning line effect
            scan_y = (frame_idx * 5) % p_h
            cv2.line(frame, (p_x, p_y + scan_y), (p_x + p_w, p_y + scan_y), (0, 255, 255), 1)
            # Add a faint glow below scan line
            if scan_y < p_h - 2:
                overlay = frame.copy()
                cv2.rectangle(overlay, (p_x, p_y + scan_y), (p_x + p_w, p_y + scan_y + 10), (0, 255, 255), -1)
                cv2.addWeighted(overlay, 0.1, frame, 0.9, 0, frame)
            
            # --- Draw Ball ---
            if tactical_ball_positions and frame_idx < len(tactical_ball_positions):
                frame_ball_pos = tactical_ball_positions[frame_idx]
                for ball_id, position in frame_ball_pos.items():
                    bx, by = int(position[0]) + p_x, int(position[1]) + p_y
                    # Draw ball with glow
                    cv2.circle(frame, (bx, by), 5, (0, 140, 255), -1)
                    cv2.circle(frame, (bx, by), 5, (255, 255, 255), 1)
            
            # Draw player positions in tactical view
            if tactical_player_positions and player_assignment and frame_idx < len(tactical_player_positions):
                frame_positions = tactical_player_positions[frame_idx]
                frame_assignments = player_assignment[frame_idx] if frame_idx < len(player_assignment) else {}
                player_with_ball = ball_acquisition[frame_idx] if ball_acquisition and frame_idx < len(ball_acquisition) else -1
                
                for player_id, position in frame_positions.items():
                    team_id = frame_assignments.get(player_id, 1)
                    color = self.team_1_color if team_id == 1 else self.team_2_color
                    
                    x, y = int(position[0]) + p_x, int(position[1]) + p_y
                    
                    # Draw player marker with border
                    r = 6
                    cv2.circle(frame, (x, y), r+1, (255, 255, 255), -1) # White border
                    cv2.circle(frame, (x, y), r, color, -1)
                    
                    # If has ball, draw an outer glow
                    if player_id == player_with_ball:
                        cv2.circle(frame, (x, y), r+4, (0, 255, 255), 2) # Cyan highlight
                        # Draw ball icon near player
                        cv2.circle(frame, (x+r+2, y-r-2), 3, (0, 140, 255), -1)
                        cv2.circle(frame, (x+r+2, y-r-2), 3, (255, 255, 255), 1)

            # Footer for Tactical Feed
            cv2.rectangle(frame, (p_x-10, p_y+p_h+5), (p_x+p_w+10, p_y+p_h+30), (20, 20, 20), -1)
            draw_text_with_shadow(frame, "TELEMETRY: ACTIVE", (p_x + 10, p_y + p_h + 22), font_scale=0.3, color=(0, 255, 0), thickness=1)
            
            # Small blinking 'REC' or 'LIVE' dot
            if (frame_idx // 10) % 2 == 0:
                cv2.circle(frame, (p_x + width - 20, p_y - 17), 4, (0, 0, 255), -1)
            draw_text_with_shadow(frame, "LIVE", (p_x + width - 45, p_y - 12), font_scale=0.3, color=(255, 255, 255), thickness=1)
            
            output_video_frames.append(frame)

        return output_video_frames
