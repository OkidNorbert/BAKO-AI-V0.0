import cv2

class SpeedAndDistanceDrawer():
    def __init__(self, team_1_color=[0, 120, 255], team_2_color=[0, 0, 200]):
        """
        Initialize with team colors for speed visualization.
        
        Args:
            team_1_color: RGB color for Team 1 speed text
            team_2_color: RGB color for Team 2 speed text
        """
        self.team_1_color = tuple(team_1_color)
        self.team_2_color = tuple(team_2_color)
    
    def draw(self, video_frames, player_tracks, player_distances_per_frame, player_speed_per_frame, player_assignment=None):
        """
        Draw speed and distance on frames with team color differentiation.
        
        Args:
            video_frames: List of frames
            player_tracks: Player tracking data per frame
            player_distances_per_frame: Distance data per frame
            player_speed_per_frame: Speed data per frame
            player_assignment: Optional team assignment per frame for color differentiation
        """
        output_video_frames = []
        total_distances = {}

        for frame_num, (frame, player_track_dict, player_distance, player_speed) in enumerate(
            zip(video_frames, player_tracks, player_distances_per_frame, player_speed_per_frame)
        ):            
            output_frame = frame.copy()

            # Get Total Distance
            for player_id, distance in player_distance.items():
                if player_id not in total_distances:
                    total_distances[player_id] = 0
                total_distances[player_id] += distance

            # Get player team assignments for this frame
            team_assignment = player_assignment[frame_num] if player_assignment else {}
            
            for player_id, bbox in player_track_dict.items():
                x1, y1, x2, y2 = bbox['bbox']
                position = [int((x1+x2)/2 - 30), min(int(y2 + 20), output_frame.shape[0] - 10)]

                # Determine team color
                team_id = team_assignment.get(player_id, 1)
                team_color = self.team_1_color if team_id == 1 else self.team_2_color

                distance = total_distances.get(player_id, None)
                speed = player_speed.get(player_id, None)
                
                if speed is not None:
                    # Draw speed with team color (with background for readability)
                    speed_text = f"{speed:.2f} km/h"
                    cv2.rectangle(output_frame, 
                                (position[0]-5, position[1]-15), 
                                (position[0]+120, position[1]+5), 
                                (0, 0, 0), -1)
                    cv2.putText(output_frame, speed_text, position, 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, team_color, 2)
                
                if distance is not None:
                    # Draw distance
                    dist_text = f"{distance:.2f} m"
                    dist_pos = (position[0], position[1] + 20)
                    cv2.rectangle(output_frame, 
                                (dist_pos[0]-5, dist_pos[1]-15), 
                                (dist_pos[0]+100, dist_pos[1]+5), 
                                (0, 0, 0), -1)
                    cv2.putText(output_frame, dist_text, dist_pos, 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 0), 2)

            output_video_frames.append(output_frame)

        return output_video_frames