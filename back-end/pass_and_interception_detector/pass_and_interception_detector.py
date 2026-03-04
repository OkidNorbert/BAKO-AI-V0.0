from copy import deepcopy
import sys
import os

# Robust pass detection parameters
MIN_AIR_TIME = 2
MIN_PASS_DISTANCE = 100 # pixels

# Add parent directory for utility imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.bbox_utils import measure_distance, get_center_of_bbox

class PassAndInterceptionDetector():
    """
    A class that detects passes between teammates and interceptions by opposing teams.
    """
    def __init__(self):
        pass 

    def detect_passes(self, ball_acquisition, player_assignment, player_tracks=None):
        """
        Detects successful passes between players of the same team with noise filtering.
        """
        passes = [-1] * len(ball_acquisition)
        prev_holder = -1
        previous_frame = -1

        for frame in range(1, len(ball_acquisition)):
            # Track the last known holder
            if ball_acquisition[frame - 1] != -1:
                prev_holder = ball_acquisition[frame - 1]
                previous_frame = frame - 1
            
            current_holder = ball_acquisition[frame]
            
            # Change in possession between different players
            if prev_holder != -1 and current_holder != -1 and prev_holder != current_holder:
                prev_team = player_assignment[previous_frame].get(prev_holder, -1)
                current_team = player_assignment[frame].get(current_holder, -1)

                # Same team -> Potential pass
                if prev_team == current_team and prev_team != -1:
                    is_valid_pass = False
                    air_time = frame - previous_frame
                    
                    # 1. Check if the ball was "free" for a minimum duration
                    if air_time >= MIN_AIR_TIME:
                        is_valid_pass = True
                    
                    # 2. Or check if the players are far enough apart (spatial validation)
                    if not is_valid_pass and player_tracks is not None:
                        p1_bbox = player_tracks[previous_frame].get(prev_holder, {}).get('bbox')
                        p2_bbox = player_tracks[frame].get(current_holder, {}).get('bbox')
                        
                        if p1_bbox and p2_bbox:
                            p1_center = get_center_of_bbox(p1_bbox)
                            p2_center = get_center_of_bbox(p2_bbox)
                            if measure_distance(p1_center, p2_center) > MIN_PASS_DISTANCE:
                                is_valid_pass = True
                    
                    if is_valid_pass:
                        passes[frame] = prev_team
                        # Reset state to prevent multiple detections of the same transition
                        prev_holder = -1
                        previous_frame = -1

        return passes

    def detect_interceptions(self, ball_acquisition, player_assignment):
        """
        Detects interceptions where ball possession changes between opposing teams.
        Includes state reset to prevent double-counting during rapid flips.
        """
        interceptions = [-1] * len(ball_acquisition)
        prev_holder = -1
        previous_frame = -1
        
        for frame in range(1, len(ball_acquisition)):
            if ball_acquisition[frame - 1] != -1:
                prev_holder = ball_acquisition[frame - 1]
                previous_frame = frame - 1

            current_holder = ball_acquisition[frame]
            
            if prev_holder != -1 and current_holder != -1 and prev_holder != current_holder:
                prev_team = player_assignment[previous_frame].get(prev_holder, -1)
                current_team = player_assignment[frame].get(current_holder, -1)
                
                if prev_team != current_team and prev_team != -1 and current_team != -1:
                    interceptions[frame] = current_team
                    # Reset state to prevent double counting
                    prev_holder = -1
                    previous_frame = -1
        
        return interceptions