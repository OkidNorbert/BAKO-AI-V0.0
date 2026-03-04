import cv2 
import numpy as np
from utils.path_smoothing import smooth_trajectory

class TacticalViewDrawer:
    def __init__(self, team_1_color=[255, 245, 238], team_2_color=[128, 0, 0]):
        self.start_x = 20
        self.start_y = 40
        self.team_1_color = team_1_color
        self.team_2_color = team_2_color
        self.previous_smoothed_positions = {}
        self.last_valid_positions = None

    def _interpolate_missing_positions(self, tactical_player_positions):
        """
        Linearly interpolate missing player positions frame-by-frame.
        Fill gaps caused by occlusion or detection failure.
        """
        total_frames = len(tactical_player_positions)
        player_tracks = {}

        # Build player tracks from input frames
        for f_idx, frame_dict in enumerate(tactical_player_positions):
            if not frame_dict:
                continue
            for pid, pos in frame_dict.items():
                if pid not in player_tracks:
                    player_tracks[pid] = {}
                player_tracks[pid][f_idx] = np.array(pos)

        interpolated_positions = [{} for _ in range(total_frames)]

        for pid, frames in player_tracks.items():
            sorted_frames = sorted(frames.keys())
            if not sorted_frames:
                continue
                
            for i in range(total_frames):
                if i in frames:
                    interpolated_positions[i][pid] = frames[i]
                else:
                    # Find nearest previous and next frames with positions
                    prev = next((j for j in reversed(range(0, i)) if j in frames), None)
                    next_ = next((j for j in range(i + 1, total_frames) if j in frames), None)

                    if prev is not None and next_ is not None:
                        # Linear interpolation
                        alpha = (i - prev) / (next_ - prev)
                        interp_pos = (1 - alpha) * frames[prev] + alpha * frames[next_]
                        interpolated_positions[i][pid] = interp_pos
                    elif prev is not None:
                        # Forward fill
                        interpolated_positions[i][pid] = frames[prev]
                    elif next_ is not None:
                        # Backward fill
                        interpolated_positions[i][pid] = frames[next_]

        return interpolated_positions

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
        Draw professional tactical board with programmatic court lines and smooth trajectories.
        """
        # Create programmatic court instead of static image
        court_image = self._draw_programmatic_court(width, height)

        output_video_frames = []
        for frame_idx, frame in enumerate(video_frames):
            frame = frame.copy()
            p_x, p_y = self.start_x, self.start_y
            p_w, p_h = width, height
            
            # --- Draw Panel & Header ---
            from .utils import draw_glass_panel, draw_text_with_shadow
            draw_glass_panel(frame, (p_x-10, p_y-30, p_w+20, p_h+40), alpha=0.9, radius=15)
            cv2.rectangle(frame, (p_x-10, p_y-30), (p_x+p_w+10, p_y-5), (20, 20, 20), -1)
            cv2.rectangle(frame, (p_x-10, p_y-30), (p_x+p_w+10, p_y-5), (0, 255, 255), 1)
            draw_text_with_shadow(frame, "ADVANCED TACTICAL BOARD v2", (p_x + 10, p_y - 12), font_scale=0.35, color=(0, 255, 255), thickness=1)
            
            # Blend programmatic court
            roi = frame[p_y:p_y+p_h, p_x:p_x+p_w]
            cv2.addWeighted(court_image, 0.4, roi, 0.6, 0, roi)

            # --- Draw Smoothed Players ---
            if tactical_player_positions and player_assignment and frame_idx < len(tactical_player_positions):
                # Apply Interpolation and Savitzky-Golay once
                if not hasattr(self, '_smoothed_player_tracks'):
                    interpolated = self._interpolate_missing_positions(tactical_player_positions)
                    player_tracks = {}
                    for f_idx, f_dict in enumerate(interpolated):
                        for pid, pos in f_dict.items():
                            if pid not in player_tracks: player_tracks[pid] = []
                            player_tracks[pid].append((f_idx, pos))
                    
                    smoothed_tracks = [{} for _ in range(len(video_frames))]
                    for pid, pts in player_tracks.items():
                        coords = [p[1] for p in pts]
                        # Professional smoothing (window 11, poly 2)
                        s_coords = smooth_trajectory(coords, window=11, poly=2)
                        for (f_idx, _), s_pos in zip(pts, s_coords):
                            if f_idx < len(smoothed_tracks): smoothed_tracks[f_idx][pid] = s_pos
                    setattr(self, '_smoothed_player_tracks', smoothed_tracks)

                current_positions = getattr(self, '_smoothed_player_tracks')[frame_idx]
                frame_assignments = player_assignment[frame_idx] if frame_idx < len(player_assignment) else {}
                player_with_ball = ball_acquisition[frame_idx] if ball_acquisition and frame_idx < len(ball_acquisition) else -1
                
                for player_id, smooth_pos in current_positions.items():
                    team_id = frame_assignments.get(player_id, 1)
                    color = self.team_1_color if team_id == 1 else self.team_2_color
                    x, y = int(smooth_pos[0]) + p_x, int(smooth_pos[1]) + p_y
                    
                    cv2.circle(frame, (x, y), 7, (255, 255, 255), -1) # Border
                    cv2.circle(frame, (x, y), 6, color, -1)
                    if player_id == player_with_ball:
                        cv2.circle(frame, (x, y), 10, (0, 255, 255), 2) # Possession glow
            
            # --- Draw Footers ---
            if (frame_idx // 10) % 2 == 0:
                cv2.circle(frame, (p_x + width - 20, p_y - 17), 4, (0, 0, 255), -1)
            draw_text_with_shadow(frame, "PHYSICS-SMOOTHED TRAJECTORIES", (p_x + 10, p_y + p_h + 22), font_scale=0.3, color=(0, 255, 0), thickness=1)
            
            output_video_frames.append(frame)
        return output_video_frames

    def _draw_programmatic_court(self, w, h):
        """Draw a clean 2D NBA court diagram."""
        court = np.full((h, w, 3), (120, 100, 80), dtype=np.uint8) # Dark wood color
        c = (200, 200, 200) # Light grey lines
        t = 2
        
        # Boundary
        cv2.rectangle(court, (0, 0), (w-1, h-1), c, t)
        cv2.line(court, (w//2, 0), (w//2, h), c, t) # Half-court
        cv2.circle(court, (w//2, h//2), int(w*0.06), c, t) # Center circle
        
        # Free-throw areas
        # Left paint
        cv2.rectangle(court, (0, int(h*0.3)), (int(w*0.19), int(h*0.7)), c, t)
        cv2.ellipse(court, (int(w*0.19), h//2), (int(w*0.06), int(h*0.1)), 0, -90, 90, c, t)
        
        # Right paint
        cv2.rectangle(court, (int(w*0.81), int(h*0.3)), (w, int(h*0.7)), c, t)
        cv2.ellipse(court, (int(w*0.81), h//2), (int(w*0.06), int(h*0.1)), 0, 90, 270, c, t)
        
        # 3-Point Lines (simplified arcs)
        cv2.ellipse(court, (int(w*0.04), h//2), (int(w*0.22), int(h*0.4)), 0, -90, 90, c, t)
        cv2.ellipse(court, (int(w*0.96), h//2), (int(w*0.22), int(h*0.4)), 0, 90, 270, c, t)
        
        # Hoops
        cv2.circle(court, (int(w*0.04), h//2), 3, (0, 0, 255), -1)
        cv2.circle(court, (int(w*0.96), h//2), 3, (0, 0, 255), -1)
        
        return court
