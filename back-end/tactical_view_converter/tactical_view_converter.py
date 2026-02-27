import os
import sys
import pathlib
import numpy as np
import cv2
from copy import deepcopy
from .homography import Homography

folder_path = pathlib.Path(__file__).parent.resolve()
sys.path.append(os.path.join(folder_path,"../"))
from utils import get_foot_position,measure_distance

class TacticalViewConverter:
    def __init__(self, court_image_path):
        self.court_image_path = court_image_path
        self.width = 280
        self.height= 150

        self.actual_width_in_meters=28
        self.actual_height_in_meters=15 

        self.key_points = [
            # left edge
            (0,0),
            (0,int((0.91/self.actual_height_in_meters)*self.height)),
            (0,int((5.18/self.actual_height_in_meters)*self.height)),
            (0,int((10/self.actual_height_in_meters)*self.height)),
            (0,int((14.1/self.actual_height_in_meters)*self.height)),
            (0,int(self.height)),

            # Middle line
            (int(self.width/2),self.height),
            (int(self.width/2),0),
            
            # Left Free throw line
            (int((5.79/self.actual_width_in_meters)*self.width),int((5.18/self.actual_height_in_meters)*self.height)),
            (int((5.79/self.actual_width_in_meters)*self.width),int((10/self.actual_height_in_meters)*self.height)),

            # right edge
            (self.width,int(self.height)),
            (self.width,int((14.1/self.actual_height_in_meters)*self.height)),
            (self.width,int((10/self.actual_height_in_meters)*self.height)),
            (self.width,int((5.18/self.actual_height_in_meters)*self.height)),
            (self.width,int((0.91/self.actual_height_in_meters)*self.height)),
            (self.width,0),

            # Right Free throw line
            (int(((self.actual_width_in_meters-5.79)/self.actual_width_in_meters)*self.width),int((5.18/self.actual_height_in_meters)*self.height)),
            (int(((self.actual_width_in_meters-5.79)/self.actual_width_in_meters)*self.width),int((10/self.actual_height_in_meters)*self.height)),
        ]

    def validate_keypoints(self, keypoints_list):
        """
        Validates detected keypoints by comparing their proportional distances
        to the tactical view keypoints.
        
        Args:
            keypoints_list (List[List[Tuple[float, float]]]): A list containing keypoints for each frame.
                Each outer list represents a frame.
                Each inner list contains keypoints as (x, y) tuples.
                A keypoint of (0, 0) indicates that the keypoint is not detected for that frame.
        
        Returns:
            List[bool]: A list indicating whether each frame's keypoints are valid.
        """

        keypoints_list = deepcopy(keypoints_list)

        for frame_idx, frame_keypoints in enumerate(keypoints_list):
            if frame_keypoints is None or not hasattr(frame_keypoints, 'xy'):
                continue
                
            # Check if there are any detections in the frame
            kp_list = frame_keypoints.xy.tolist()
            if not kp_list:
                continue
            
            frame_keypoints = kp_list[0]
            
            # Get indices of detected keypoints (not (0, 0))
            detected_indices = [i for i, kp in enumerate(frame_keypoints) if kp[0] >0 and kp[1]>0]
            
            # Need at least 3 detected keypoints to validate proportions
            if len(detected_indices) < 3:
                continue
            
            invalid_keypoints = []
            # Validate each detected keypoint
            for i in detected_indices:
                # Skip if this is (0, 0)
                if frame_keypoints[i][0] == 0 and frame_keypoints[i][1] == 0:
                    continue

                # Choose two other random detected keypoints
                other_indices = [idx for idx in detected_indices if idx != i and idx not in invalid_keypoints]
                if len(other_indices) < 2:
                    continue

                # Take first two other indices for simplicity
                j, k = other_indices[0], other_indices[1]

                # Calculate distances between detected keypoints
                d_ij = measure_distance(frame_keypoints[i], frame_keypoints[j])
                d_ik = measure_distance(frame_keypoints[i], frame_keypoints[k])
                
                # Calculate distances between corresponding tactical keypoints
                t_ij = measure_distance(self.key_points[i], self.key_points[j])
                t_ik = measure_distance(self.key_points[i], self.key_points[k])

                # Calculate and compare proportions with 50% error margin
                if t_ij > 0 and t_ik > 0:
                    prop_detected = d_ij / d_ik if d_ik > 0 else float('inf')
                    prop_tactical = t_ij / t_ik if t_ik > 0 else float('inf')

                    error = (prop_detected - prop_tactical) / prop_tactical
                    error = abs(error)

                    if error >0.8:  # 80% error margin                        
                        keypoints_list[frame_idx].xy[0][i] *= 0
                        keypoints_list[frame_idx].xyn[0][i] *= 0
                        invalid_keypoints.append(i)
            
        return keypoints_list

    def transform_points_to_tactical(self, keypoints_list, detections_xy):
        """
        Transform any list of (x, y) points to tactical view.
        detections_xy: List[Dict[track_id, [x, y]]]
        """
        tactical_output = []
        last_homography = None
        
        for frame_idx, (frame_keypoints, frame_points) in enumerate(zip(keypoints_list, detections_xy)):
            tactical_positions = {}
            kp_list = frame_keypoints.xy.tolist() if hasattr(frame_keypoints, 'xy') else []
            current_homography = None

            if kp_list and len(kp_list) > 0:
                detected_keypoints = kp_list[0]
                valid_indices = [i for i, kp in enumerate(detected_keypoints) if kp[0] > 0 and kp[1] > 0]
                if len(valid_indices) >= 4:
                    source_points = np.array([detected_keypoints[i] for i in valid_indices], dtype=np.float32)
                    target_points = np.array([self.key_points[i] for i in valid_indices], dtype=np.float32)
                    try:
                        current_homography = Homography(source_points, target_points)
                        last_homography = current_homography
                    except: pass

            transformer = current_homography or last_homography
            if transformer:
                for obj_id, pos in frame_points.items():
                    obj_pos = np.array([pos])
                    tactical_pos = transformer.transform_points(obj_pos)
                    if -100 <= tactical_pos[0][0] <= self.width + 100 and -100 <= tactical_pos[0][1] <= self.height + 100:
                        tactical_positions[obj_id] = tactical_pos[0].tolist()
            
            tactical_output.append(tactical_positions)
        return tactical_output

    def transform_players_to_tactical_view(self, keypoints_list, player_tracks):
        """
        Extract foot positions and transform players.
        """
        player_points = []
        for frame_tracks in player_tracks:
            frame_points = {}
            for pid, pdata in frame_tracks.items():
                if pdata.get('class', '').lower() == 'referee': continue
                frame_points[pid] = get_foot_position(pdata["bbox"])
            player_points.append(frame_points)
            
        return self.transform_points_to_tactical(keypoints_list, player_points)
        
        return tactical_player_positions

    def transform_balls_to_tactical_view(self, keypoints_list, ball_tracks):
        """
        Extract ball center positions and transform.
        """
        ball_points = []
        for frame_tracks in ball_tracks:
            frame_points = {}
            if frame_tracks is not None:
                for bid, bdata in frame_tracks.items():
                    bbox = bdata.get("bbox")
                    if bbox and len(bbox) == 4:
                        # Ball uses center instead of feet
                        center_x = (bbox[0] + bbox[2]) / 2
                        center_y = (bbox[1] + bbox[3]) / 2
                        frame_points[bid] = (center_x, center_y)
            ball_points.append(frame_points)
            
        return self.transform_points_to_tactical(keypoints_list, ball_points)
