"""
Core Team Analysis Engine for Basketball Video Analysis

This module provides the core analysis logic used by both:
- CLI interface (main.py)
- Web API (team_analysis.py)

The run_team_analysis() function is the primary entry point for all analysis.
"""

import os
import argparse
import cv2
import shutil
import time
from typing import Dict, Any, Optional, Callable
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


def clear_stubs(stub_path: str) -> bool:
    """Clear stub files for fresh analysis."""
    try:
        if os.path.exists(stub_path):
            shutil.rmtree(stub_path)
            os.makedirs(stub_path, exist_ok=True)
            return True
    except Exception as e:
        print(f"⚠️  Warning: Could not clear stubs at {stub_path}: {e}")
        return False
    return True


def run_team_analysis(
    video_path: str,
    output_path: str = OUTPUT_VIDEO_PATH,
    stub_path: str = STUBS_DEFAULT_PATH,
    our_team_jersey: str = "white jersey",
    opponent_jersey: str = "dark blue jersey",
    our_team_id: int = 1,
    read_from_stub: bool = False,
    clear_stubs_after: bool = True,
    save_annotated_video: bool = True,
    progress_callback: Optional[Callable[[str, int], None]] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Core team analysis function (used by both CLI and Web API).
    
    Args:
        video_path: Path to input video
        output_path: Path to save annotated video
        stub_path: Path to store/load detection stubs
        our_team_jersey: Jersey description for our team
        opponent_jersey: Jersey description for opponent
        our_team_id: Which team ID (1 or 2) is ours
        read_from_stub: Whether to use cached detections
        clear_stubs_after: Whether to clear stubs after analysis
        save_annotated_video: Whether to save the annotated video
        progress_callback: Optional callback for progress updates
        
    Returns:
        Dictionary with analysis results and metadata
    """
    def notify_progress(step: str, percent: int):
        """Call progress callback if provided."""
        if progress_callback:
            progress_callback(step, percent)
        else:
            print(f"[{percent}%] {step}")
    
    try:
        start_time = time.time()
        notify_progress("Reading video", 5)
        video_frames = read_video(video_path)
        total_frames = len(video_frames)
        
        if total_frames == 0:
            return {"error": "Could not read video frames", "total_frames": 0}
        
        # Get video FPS
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        cap.release()
        duration_seconds = total_frames / fps
        
        # Create stub directory
        os.makedirs(stub_path, exist_ok=True)
        
        # ── Initialise Trackers & Detectors ────────────────────────────────────
        notify_progress("Initializing models", 10)
        player_tracker = PlayerTracker(PLAYER_DETECTOR_PATH)
        ball_tracker = BallTracker(BALL_DETECTOR_PATH)
        court_keypoint_detector = CourtKeypointDetector(COURT_KEYPOINT_DETECTOR_PATH)
        
        # ── Run Detection / Load from Stubs ────────────────────────────────────
        notify_progress("Tracking players", 20)
        player_tracks = player_tracker.get_object_tracks(
            video_frames,
            read_from_stub=read_from_stub,
            stub_path=os.path.join(stub_path, 'player_track_stubs.pkl')
        )
        
        notify_progress("Tracking ball", 30)
        ball_tracks = ball_tracker.get_object_tracks(
            video_frames,
            read_from_stub=read_from_stub,
            stub_path=os.path.join(stub_path, 'ball_track_stubs.pkl')
        )
        
        notify_progress("Detecting court keypoints", 40)
        court_keypoints_per_frame = court_keypoint_detector.get_court_keypoints(
            video_frames,
            read_from_stub=read_from_stub,
            stub_path=os.path.join(stub_path, 'court_key_points_stub.pkl')
        )
        
        # ── Ball Cleaning ──────────────────────────────────────────────────────
        ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
        ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)
        
        # ── Team Assignment ────────────────────────────────────────────────────
        notify_progress("Assigning players to teams", 50)
        team_assigner = TeamAssigner(
            team_1_class_name=our_team_jersey,
            team_2_class_name=opponent_jersey
        )
        player_assignment = team_assigner.get_player_teams_across_frames(
            video_frames,
            player_tracks,
            read_from_stub=read_from_stub,
            stub_path=os.path.join(stub_path, 'player_assignment_stub.pkl')
        )
        
        # ── Ball Possession & Passes ───────────────────────────────────────────
        notify_progress("Detecting ball possession", 60)
        ball_aquisition_detector = BallAquisitionDetector()
        ball_aquisition = ball_aquisition_detector.detect_ball_possession(player_tracks, ball_tracks)
        
        notify_progress("Detecting passes and interceptions", 65)
        pass_and_interception_detector = PassAndInterceptionDetector()
        passes = pass_and_interception_detector.detect_passes(ball_aquisition, player_assignment)
        interceptions = pass_and_interception_detector.detect_interceptions(ball_aquisition, player_assignment)
        
        # ── Tactical View ──────────────────────────────────────────────────────
        notify_progress("Converting to tactical view", 70)
        tactical_view_converter = TacticalViewConverter(
            court_image_path="./images/basketball_court.png"
        )
        court_keypoints_per_frame = tactical_view_converter.validate_keypoints(court_keypoints_per_frame)
        tactical_player_positions = tactical_view_converter.transform_players_to_tactical_view(
            court_keypoints_per_frame, player_tracks
        )
        tactical_ball_positions = tactical_view_converter.transform_balls_to_tactical_view(
            court_keypoints_per_frame, ball_tracks
        )
        
        # ── Speed & Distance ───────────────────────────────────────────────────
        notify_progress("Calculating speed and distance", 75)
        speed_and_distance_calculator = SpeedAndDistanceCalculator(
            tactical_view_converter.width,
            tactical_view_converter.height,
            tactical_view_converter.actual_width_in_meters,
            tactical_view_converter.actual_height_in_meters
        )
        player_distances_per_frame = speed_and_distance_calculator.calculate_distance(tactical_player_positions)
        player_speed_per_frame = speed_and_distance_calculator.calculate_speed(player_distances_per_frame)
        
        # ── Shot Detection ─────────────────────────────────────────────────────
        notify_progress("Detecting shots", 80)
        shot_detector = ShotDetector(hoop_detection_model_path=TEAM_MODEL_PATH)
        hoop_detections = shot_detector.detect_hoop_locations(
            video_frames,
            read_from_stub=read_from_stub,
            stub_path=os.path.join(stub_path, 'hoop_detections_stub.pkl')
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
        
        # ── Drawing & Video Rendering ─────────────────────────────────────────
        output_video_frames = None
        if save_annotated_video:
            notify_progress("Rendering annotated video", 85)
            
            # Team colours based on our_team_id
            if our_team_id == 1:
                our_color = [0, 120, 255]   # Blue for our team
                opp_color = [0, 0, 200]     # Dark red for opponent
            else:
                our_color = [0, 0, 200]
                opp_color = [0, 120, 255]
            
            # Initialize Drawers
            player_tracks_drawer = PlayerTracksDrawer(team_1_color=our_color, team_2_color=opp_color)
            ball_tracks_drawer = BallTracksDrawer()
            court_keypoint_drawer = CourtKeypointDrawer()
            team_ball_control_drawer = TeamBallControlDrawer()
            frame_number_drawer = FrameNumberDrawer()
            pass_and_interceptions_drawer = PassInterceptionDrawer()
            tactical_view_drawer = TacticalViewDrawer()
            speed_and_distance_drawer = SpeedAndDistanceDrawer(team_1_color=our_color, team_2_color=opp_color)
            shot_drawer = ShotDrawer()
            
            # Draw all overlays
            output_video_frames = player_tracks_drawer.draw(
                video_frames, player_tracks, player_assignment, ball_aquisition
            )
            output_video_frames = ball_tracks_drawer.draw(output_video_frames, ball_tracks)
            output_video_frames = court_keypoint_drawer.draw(output_video_frames, court_keypoints_per_frame)
            output_video_frames = frame_number_drawer.draw(output_video_frames)
            output_video_frames = team_ball_control_drawer.draw(
                output_video_frames, player_assignment, ball_aquisition
            )
            output_video_frames = pass_and_interceptions_drawer.draw(
                output_video_frames, passes, interceptions
            )
            output_video_frames = speed_and_distance_drawer.draw(
                output_video_frames, player_tracks, player_distances_per_frame, player_speed_per_frame, player_assignment
            )
            output_video_frames = shot_drawer.draw(
                output_video_frames, shots, hoop_detections=hoop_detections
            )
            output_video_frames = tactical_view_drawer.draw(
                output_video_frames,
                tactical_view_converter.court_image_path,
                tactical_view_converter.width,
                tactical_view_converter.height,
                tactical_view_converter.key_points,
                tactical_player_positions,
                tactical_ball_positions,
                player_assignment,
                ball_aquisition,
            )
            
            # Save annotated video
            notify_progress("Saving annotated video", 90)
            # Ensure output directory exists
            output_dir = os.path.dirname(output_path)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
            save_video(output_video_frames, output_path)
            
            # Verify file was saved
            if not os.path.exists(output_path):
                print(f"⚠️  Video file not created at: {output_path}")
        
        # ── Cleanup ────────────────────────────────────────────────────────────
        if clear_stubs_after:
            notify_progress("Cleaning up cached data", 95)
            clear_stubs(stub_path)
        
        # ── Build Detections with Tactical Coordinates ────────────────────────────────────
        # Prepare detections list for frontend with tactical coordinates included
        notify_progress("Building tactical detections", 92)
        detections_with_tactical = []
        
        # 1. Add Players
        for frame_idx, (frame_tracks, frame_assignment) in enumerate(zip(player_tracks, player_assignment)):
            if frame_tracks is None:
                continue
            
            frame_tactical_positions = tactical_player_positions[frame_idx] if frame_idx < len(tactical_player_positions) else {}
            
            for player_id, player_data in frame_tracks.items():
                bbox = player_data.get("bbox", [])
                if not bbox or len(bbox) != 4:
                    continue
                
                tactical_pos = frame_tactical_positions.get(player_id)
                
                det_entry = {
                    "frame": frame_idx,
                    "track_id": str(player_id),
                    "object_type": "player",
                    "bbox": bbox,
                    "confidence": 1.0,
                    "team_id": frame_assignment.get(player_id, 0),
                    "has_ball": player_id == ball_aquisition[frame_idx] if frame_idx < len(ball_aquisition) else False,
                }
                
                if tactical_pos:
                    det_entry["tactical_x"] = float(tactical_pos[0])
                    det_entry["tactical_y"] = float(tactical_pos[1])
                
                detections_with_tactical.append(det_entry)

        # 2. Add Ball (basketball) - already transformed to tactical above
        for frame_idx, frame_ball_tracks in enumerate(ball_tracks):
            if frame_ball_tracks is None:
                continue
            
            frame_tactical_ball = tactical_ball_positions[frame_idx] if frame_idx < len(tactical_ball_positions) else {}
            
            for ball_id, ball_data in frame_ball_tracks.items():
                bbox = ball_data.get("bbox", [])
                if not bbox or len(bbox) != 4:
                    continue
                
                tactical_pos = frame_tactical_ball.get(ball_id)
                
                det_entry = {
                    "frame": frame_idx,
                    "track_id": str(ball_id),
                    "object_type": "basketball",
                    "bbox": bbox,
                    "confidence": 1.0,
                }
                
                if tactical_pos:
                    det_entry["tactical_x"] = float(tactical_pos[0])
                    det_entry["tactical_y"] = float(tactical_pos[1])
                
                detections_with_tactical.append(det_entry)
        
        # ── Build Results ──────────────────────────────────────────────────────────
        notify_progress("Calculating match statistics", 94)
        
        # Count unique players
        unique_players = set()
        for frame_tracks in player_tracks:
            unique_players.update((frame_tracks or {}).keys())
        
        # Calculate possession percentages
        team_1_possession = 0
        team_2_possession = 0
        for frame_idx, (possession, assignment) in enumerate(zip(ball_aquisition, player_assignment)):
            if possession != -1 and possession in assignment:
                team = assignment[possession]
                if team == 1:
                    team_1_possession += 1
                elif team == 2:
                    team_2_possession += 1
        
        total_possession = team_1_possession + team_2_possession
        team_1_pct = (team_1_possession / total_possession * 100) if total_possession > 0 else 50
        team_2_pct = (team_2_possession / total_possession * 100) if total_possession > 0 else 50
        
        # Shot statistics
        notify_progress("Analyzing shot performance", 96)
        shot_stats = shot_detector.calculate_shot_statistics(shots)
        
        # Calculate aggregated speed & distance
        total_distance = 0
        all_speeds = []
        for frame_distances in player_distances_per_frame:
            total_distance += sum(frame_distances.values())
        
        for frame_speeds in player_speed_per_frame:
            for speed in frame_speeds.values():
                if speed > 0:
                    all_speeds.append(speed)
        
        avg_speed = sum(all_speeds) / len(all_speeds) if all_speeds else 0
        max_speed = max(all_speeds) if all_speeds else 0
        
        # Calculate defensive actions (interceptions + estimated rebounds/blocks from tracks)
        # For now, base it on interceptions and number of defensive assignments
        defensive_actions = len([i for i in interceptions if i != -1])
        
        # Calculate total processing time
        notify_progress("Preparing final report", 98)
        processing_time = time.time() - start_time
        
        result = {
            "status": "completed",
            "total_frames": int(total_frames),
            "duration_seconds": float(duration_seconds),
            "processing_time_seconds": float(round(processing_time, 2)),
            "fps": float(fps),
            "players_detected": int(len(unique_players)),
            "team_1_possession_percent": float(round(team_1_pct, 1)),
            "team_2_possession_percent": float(round(team_2_pct, 1)),
            "total_passes": int(len([p for p in passes if p != -1])),
            "team_1_passes": int(len([frame_idx for frame_idx, p in enumerate(passes) if p != -1 and player_assignment[frame_idx].get(p) == 1])),
            "team_2_passes": int(len([frame_idx for frame_idx, p in enumerate(passes) if p != -1 and player_assignment[frame_idx].get(p) == 2])),
            "total_interceptions": int(len([i for i in interceptions if i != -1])),
            "team_1_interceptions": int(len([frame_idx for frame_idx, i in enumerate(interceptions) if i != -1 and player_assignment[frame_idx].get(i) == 1])),
            "team_2_interceptions": int(len([frame_idx for frame_idx, i in enumerate(interceptions) if i != -1 and player_assignment[frame_idx].get(i) == 2])),
            "defensive_actions": int(defensive_actions),
            "shot_attempts": int(shot_stats['total_attempts']),
            "shots_made": int(shot_stats['total_made']),
            "shots_missed": int(shot_stats['total_missed']),
            "overall_shooting_percentage": float(shot_stats['overall_percentage']),
            "total_distance_meters": float(round(total_distance, 1)),
            "avg_speed_kmh": float(round(avg_speed, 1)),
            "max_speed_kmh": float(round(max_speed, 1)),
            "annotated_video_path": output_path if save_annotated_video else None,
            "annotated_video_exists": save_annotated_video and os.path.exists(output_path),
            "detections": detections_with_tactical,
            "events": [], # To be populated below
        }

        # Populate events for the timeline
        events_list = []
        
        # Add shots
        for shot in shots:
            events_list.append({
                "event_type": "shot",
                "frame": shot["start_frame"],
                "timestamp_seconds": shot["start_frame"] / fps if fps > 0 else 0,
                "player_id": shot.get("player_id"),
                "details": {
                    "outcome": shot.get("outcome"),
                    "type": shot.get("shot_type") or shot.get("type", "unknown"),
                    "player": shot.get("player_id")
                }
            })
            
        # Add passes
        for frame_idx, receiver_id in enumerate(passes):
            if receiver_id != -1:
                events_list.append({
                    "event_type": "pass",
                    "frame": frame_idx,
                    "timestamp_seconds": frame_idx / fps if fps > 0 else 0,
                    "player_id": receiver_id,
                    "details": {"player": receiver_id}
                })
                
        # Add interceptions
        for frame_idx, interceptor_id in enumerate(interceptions):
            if interceptor_id != -1:
                events_list.append({
                    "event_type": "interception",
                    "frame": frame_idx,
                    "timestamp_seconds": frame_idx / fps if fps > 0 else 0,
                    "player_id": interceptor_id,
                    "details": {"player": interceptor_id}
                })
        
        # Sort events by frame
        events_list.sort(key=lambda x: x["frame"])
        result["events"] = events_list
        
        notify_progress("Analysis complete", 100)
        return result
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "failed",
            "error": str(e),
            "total_frames": 0,
            "duration_seconds": 0.0,
            "players_detected": 0,
            "team_1_possession_percent": 50.0,
            "team_2_possession_percent": 50.0,
            "total_passes": 0,
            "total_interceptions": 0,
        }


def parse_args():
    parser = argparse.ArgumentParser(description='Basketball Video Analysis')
    parser.add_argument('input_video', type=str, help='Path to input video file')
    parser.add_argument('--output_video', type=str, default=OUTPUT_VIDEO_PATH, 
                        help='Path to output video file')
    parser.add_argument('--stub_path', type=str, default=STUBS_DEFAULT_PATH,
                        help='Path to stub directory')
    parser.add_argument('--our_team_jersey', type=str, default='white jersey',
                        help='Description of the home/our team jersey color')
    parser.add_argument('--opponent_jersey', type=str, default='dark blue jersey',
                        help='Description of the opponent team jersey color')
    parser.add_argument('--our_team_id', type=int, default=1, choices=[1, 2],
                        help='Which team ID (1 or 2) is the team being analysed')
    parser.add_argument('--read_from_stub', action='store_true',
                        help='Use cached detections instead of fresh analysis')
    parser.add_argument('--keep_stubs', action='store_true',
                        help='Keep stub files after analysis')
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
    
    result = run_team_analysis(
        video_path=args.input_video,
        output_path=args.output_video,
        stub_path=args.stub_path,
        our_team_jersey=args.our_team_jersey,
        opponent_jersey=args.opponent_jersey,
        our_team_id=args.our_team_id,
        read_from_stub=args.read_from_stub,
        clear_stubs_after=not args.keep_stubs,
    )
    
    if result.get("status") == "completed":
        print(f"\n✅ Analysis Complete!")
        print(f"   Duration: {result['duration_seconds']:.1f}s")
        print(f"   Players Detected: {result['players_detected']}")
        print(f"   Team 1 Possession: {result['team_1_possession_percent']:.1f}%")
        print(f"   Team 2 Possession: {result['team_2_possession_percent']:.1f}%")
        print(f"   Total Passes: {result['total_passes']}")
        print(f"   Interceptions: {result['total_interceptions']}")
        print(f"   Shooting Percentage: {result['overall_shooting_percentage']:.1f}%")
        print(f"   Total Distance: {result['total_distance_meters']:.1f}m")
        print(f"   Avg Speed: {result['avg_speed_kmh']:.1f} km/h")
        print(f"   Processing Time: {result['processing_time_seconds']:.2f}s")
        print(f"   Output: {result['annotated_video_path']}")
    else:
        print(f"\n❌ Analysis Failed: {result.get('error')}")


if __name__ == '__main__':
    main()
