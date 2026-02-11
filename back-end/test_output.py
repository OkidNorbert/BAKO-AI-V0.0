import os
import cv2
import numpy as np
from utils import read_video, save_video
from trackers import PlayerTracker, BallTracker
from team_assigner import TeamAssigner
from ball_aquisition import BallAquisitionDetector
from pass_and_interception_detector import PassAndInterceptionDetector
from speed_and_distance_calculator import SpeedAndDistanceCalculator
from shot_detector import ShotDetector
from drawers import (
    PlayerTracksDrawer, 
    BallTracksDrawer,
    TeamBallControlDrawer,
    FrameNumberDrawer,
    PassInterceptionDrawer,
    ShotDrawer
)
from configs import(
    PLAYER_DETECTOR_PATH,
    BALL_DETECTOR_PATH,
    TEAM_MODEL_PATH
)

def main():
    input_video = "input_videos/video_1.mp4"
    output_video = "output_videos/quick_test_no_tactical.mp4"
    
    # Read Video
    print("Reading video...")
    video_frames = read_video(input_video)
    # Process 60 frames for a quick result (without slow keypoint detection)
    video_frames = video_frames[:60]
    print(f"Processing {len(video_frames)} frames...")
    
    ## Initialize Tracker
    player_tracker = PlayerTracker(PLAYER_DETECTOR_PATH)
    ball_tracker = BallTracker(BALL_DETECTOR_PATH)

    # Run Detectors
    print("Running player tracks...")
    player_tracks = player_tracker.get_object_tracks(video_frames, read_from_stub=False, stub_path=None)
    
    print("Running ball tracks...")
    ball_tracks = ball_tracker.get_object_tracks(video_frames, read_from_stub=False, stub_path=None)
    
    # Clean detections
    ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
    ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)

    # Assign Player Teams
    print("Assigning teams...")
    team_assigner = TeamAssigner()
    player_assignment = team_assigner.get_player_teams_across_frames(video_frames, player_tracks, read_from_stub=False, stub_path=None)

    # Ball Acquisition
    ball_aquisition_detector = BallAquisitionDetector()
    ball_aquisition = ball_aquisition_detector.detect_ball_possession(player_tracks, ball_tracks)

    # Detect Passes
    pass_and_interception_detector = PassAndInterceptionDetector()
    passes = pass_and_interception_detector.detect_passes(ball_aquisition, player_assignment)
    interceptions = pass_and_interception_detector.detect_interceptions(ball_aquisition, player_assignment)

    # Shot Analysis (minimal version without keypoints)
    shot_detector = ShotDetector(hoop_detection_model_path=PLAYER_DETECTOR_PATH)
    hoop_detections = shot_detector.detect_hoop_locations(video_frames, read_from_stub=False, stub_path=None)
    
    cap = cv2.VideoCapture(input_video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    cap.release()

    shots = shot_detector.detect_shots(
        ball_tracks, 
        hoop_detections, 
        player_tracks=player_tracks,
        player_assignment=player_assignment,
        ball_possession=ball_aquisition,
        fps=fps,
        court_keypoints=None # Skip keypoints
    )

    # Draw output   
    player_tracks_drawer = PlayerTracksDrawer()
    ball_tracks_drawer = BallTracksDrawer()
    team_ball_control_drawer = TeamBallControlDrawer()
    frame_number_drawer = FrameNumberDrawer()
    pass_and_interceptions_drawer = PassInterceptionDrawer()
    shot_drawer = ShotDrawer()

    print("Drawing frames...")
    output_video_frames = player_tracks_drawer.draw(video_frames, player_tracks, player_assignment, ball_aquisition)
    output_video_frames = ball_tracks_drawer.draw(output_video_frames, ball_tracks)
    output_video_frames = frame_number_drawer.draw(output_video_frames)
    output_video_frames = team_ball_control_drawer.draw(output_video_frames, player_assignment, ball_aquisition)
    output_video_frames = pass_and_interceptions_drawer.draw(output_video_frames, passes, interceptions)
    output_video_frames = shot_drawer.draw(output_video_frames, shots, hoop_detections=hoop_detections)

    # Save video
    print(f"Saving video to {output_video}...")
    save_video(output_video_frames, output_video)
    print("Done!")

if __name__ == "__main__":
    main()
