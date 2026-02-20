import os
import argparse
import cv2
from utils import read_video, save_video
from trackers import PlayerTracker, BallTracker
from team_assigner import TeamAssigner
from court_keypoint_detector import CourtKeypointDetector
from ball_aquisition import BallAquisitionDetector
from pass_and_interception_detector import PassAndInterceptionDetector
from tactical_view_converter import TacticalViewConverter
from speed_and_distance_calculator import SpeedAndDistanceCalculator
from shot_detector import ShotDetector
from drawers import (
    PlayerTracksDrawer, 
    BallTracksDrawer,
    CourtKeypointDrawer,
    TeamBallControlDrawer,
    FrameNumberDrawer,
    PassInterceptionDrawer,
    TacticalViewDrawer,
    SpeedAndDistanceDrawer,
    ShotDrawer
)
from configs import(
    STUBS_DEFAULT_PATH,
    PLAYER_DETECTOR_PATH,
    BALL_DETECTOR_PATH,
    TEAM_MODEL_PATH,
    COURT_KEYPOINT_DETECTOR_PATH,
    OUTPUT_VIDEO_PATH
)

def parse_args():
    parser = argparse.ArgumentParser(description='Basketball Video Analysis')
    parser.add_argument('input_video', type=str, help='Path to input video file')
    parser.add_argument('--output_video', type=str, default=OUTPUT_VIDEO_PATH, 
                        help='Path to output video file')
    parser.add_argument('--stub_path', type=str, default=STUBS_DEFAULT_PATH,
                        help='Path to stub directory')
    # ── Team Identity ──────────────────────────────────────────────────────────
    # The team that OWNS the account / uploaded the video is "our team".
    # Describe their jersey so the AI can identify them.
    # Example: --our_team_jersey "white jersey" --opponent_jersey "red jersey"
    parser.add_argument('--our_team_jersey', type=str, default='white jersey',
                        help='Description of the home/our team jersey color (e.g. "white jersey")')
    parser.add_argument('--opponent_jersey', type=str, default='red jersey',
                        help='Description of the opponent team jersey color (e.g. "red jersey")')
    # Which team number (1 or 2) is "our team" — used for focus highlighting
    parser.add_argument('--our_team_id', type=int, default=1, choices=[1, 2],
                        help='Which team ID (1 or 2) is the team being analysed')
    return parser.parse_args()

def main():
    args = parse_args()
    
    print(f"\n{'='*60}")
    print(f"  Basketball Analysis System")
    print(f"{'='*60}")
    print(f"  Video      : {args.input_video}")
    print(f"  Our Team   : {args.our_team_jersey} (Team {args.our_team_id})")
    print(f"  Opponent   : {args.opponent_jersey}")
    print(f"{'='*60}\n")

    # ── Read Video ─────────────────────────────────────────────────────────────
    video_frames = read_video(args.input_video)
    cap = cv2.VideoCapture(args.input_video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.release()

    # ── Initialise Trackers & Detectors ────────────────────────────────────────
    player_tracker = PlayerTracker(PLAYER_DETECTOR_PATH)
    ball_tracker   = BallTracker(BALL_DETECTOR_PATH)
    court_keypoint_detector = CourtKeypointDetector(COURT_KEYPOINT_DETECTOR_PATH)

    # ── Run Detection / Load from Stubs ────────────────────────────────────────
    player_tracks = player_tracker.get_object_tracks(
        video_frames,
        read_from_stub=True,
        stub_path=os.path.join(args.stub_path, 'player_track_stubs.pkl')
    )
    
    ball_tracks = ball_tracker.get_object_tracks(
        video_frames,
        read_from_stub=True,
        stub_path=os.path.join(args.stub_path, 'ball_track_stubs.pkl')
    )

    court_keypoints_per_frame = court_keypoint_detector.get_court_keypoints(
        video_frames,
        read_from_stub=True,
        stub_path=os.path.join(args.stub_path, 'court_key_points_stub.pkl')
    )

    # ── Ball Cleaning ──────────────────────────────────────────────────────────
    ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
    ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)

    # ── Team Assignment ────────────────────────────────────────────────────────
    # Use the jersey descriptions provided by the team account
    team_assigner = TeamAssigner(
        team_1_class_name=args.our_team_jersey,
        team_2_class_name=args.opponent_jersey
    )
    player_assignment = team_assigner.get_player_teams_across_frames(
        video_frames,
        player_tracks,
        read_from_stub=True,
        stub_path=os.path.join(args.stub_path, 'player_assignment_stub.pkl')
    )

    # ── Ball Possession & Passes ───────────────────────────────────────────────
    ball_aquisition_detector = BallAquisitionDetector()
    ball_aquisition = ball_aquisition_detector.detect_ball_possession(player_tracks, ball_tracks)

    pass_and_interception_detector = PassAndInterceptionDetector()
    passes       = pass_and_interception_detector.detect_passes(ball_aquisition, player_assignment)
    interceptions = pass_and_interception_detector.detect_interceptions(ball_aquisition, player_assignment)

    # ── Tactical View ──────────────────────────────────────────────────────────
    tactical_view_converter = TacticalViewConverter(
        court_image_path="./images/basketball_court.png"
    )
    court_keypoints_per_frame = tactical_view_converter.validate_keypoints(court_keypoints_per_frame)
    tactical_player_positions = tactical_view_converter.transform_players_to_tactical_view(
        court_keypoints_per_frame, player_tracks
    )

    # ── Speed & Distance ───────────────────────────────────────────────────────
    speed_and_distance_calculator = SpeedAndDistanceCalculator(
        tactical_view_converter.width,
        tactical_view_converter.height,
        tactical_view_converter.actual_width_in_meters,
        tactical_view_converter.actual_height_in_meters
    )
    player_distances_per_frame = speed_and_distance_calculator.calculate_distance(tactical_player_positions)
    player_speed_per_frame     = speed_and_distance_calculator.calculate_speed(player_distances_per_frame)

    # ── Shot Detection ─────────────────────────────────────────────────────────
    shot_detector  = ShotDetector(hoop_detection_model_path=TEAM_MODEL_PATH)
    hoop_detections = shot_detector.detect_hoop_locations(
        video_frames,
        read_from_stub=True,
        stub_path=os.path.join(args.stub_path, 'hoop_detections_stub.pkl')
    )
    shots = shot_detector.detect_shots(
        ball_tracks, 
        hoop_detections, 
        player_tracks=player_tracks,
        player_assignment=player_assignment,
        ball_possession=ball_aquisition,
        fps=fps,
        court_keypoints=court_keypoints_per_frame
    )

    # ── Drawing ────────────────────────────────────────────────────────────────
    # Team colours: our_team = Team 1 (blue highlight), opponent = Team 2 (red)
    # The 'our_team_id' arg controls which team gets the "focus" colour
    if args.our_team_id == 1:
        our_color  = [0, 120, 255]   # Blue for our team
        opp_color  = [0, 0, 200]     # Dark red for opponent
    else:
        our_color  = [0, 0, 200]
        opp_color  = [0, 120, 255]

    player_tracks_drawer       = PlayerTracksDrawer(team_1_color=our_color, team_2_color=opp_color)
    ball_tracks_drawer         = BallTracksDrawer()
    court_keypoint_drawer      = CourtKeypointDrawer()
    team_ball_control_drawer   = TeamBallControlDrawer()
    frame_number_drawer        = FrameNumberDrawer()
    pass_and_interceptions_drawer = PassInterceptionDrawer()
    tactical_view_drawer       = TacticalViewDrawer()
    speed_and_distance_drawer  = SpeedAndDistanceDrawer()
    shot_drawer                = ShotDrawer()

    # Draw player ellipses + ball-possession triangle
    output_video_frames = player_tracks_drawer.draw(
        video_frames, player_tracks, player_assignment, ball_aquisition
    )
    # Draw ball dot
    output_video_frames = ball_tracks_drawer.draw(output_video_frames, ball_tracks)

    # Draw frame counter (bottom-left)
    output_video_frames = frame_number_drawer.draw(output_video_frames)

    # Draw team ball-control bar
    output_video_frames = team_ball_control_drawer.draw(
        output_video_frames, player_assignment, ball_aquisition
    )

    # Draw passes / interceptions
    output_video_frames = pass_and_interceptions_drawer.draw(
        output_video_frames, passes, interceptions
    )

    # Draw shot scoreboard + MADE/MISSED/TRACKING LOST overlays
    output_video_frames = shot_drawer.draw(
        output_video_frames, shots, hoop_detections=hoop_detections
    )

    # Draw speed & distance labels
    output_video_frames = speed_and_distance_drawer.draw(
        output_video_frames, player_tracks, player_distances_per_frame, player_speed_per_frame
    )

    # Draw tactical mini-map (bottom-right)
    output_video_frames = tactical_view_drawer.draw(
        output_video_frames,
        tactical_view_converter.court_image_path,
        tactical_view_converter.width,
        tactical_view_converter.height,
        tactical_view_converter.key_points,
        tactical_player_positions,
        player_assignment,
        ball_aquisition,
    )

    # ── Save ───────────────────────────────────────────────────────────────────
    save_video(output_video_frames, args.output_video)

if __name__ == '__main__':
    main()