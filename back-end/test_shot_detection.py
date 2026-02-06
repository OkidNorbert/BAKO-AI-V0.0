"""
Test script for shot success rate detection.

This script demonstrates the shot detection functionality for both
personal and team analysis modes.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analysis.personal_analysis import run_personal_analysis
from analysis.team_analysis import run_team_analysis


async def test_personal_shot_detection(video_path: str):
    """Test shot detection in personal analysis mode."""
    print("\n" + "="*60)
    print("TESTING PERSONAL ANALYSIS - SHOT DETECTION")
    print("="*60 + "\n")
    
    print(f"Analyzing video: {video_path}")
    print("Running analysis...\n")
    
    results = await run_personal_analysis(video_path, options={'detect_shots': True})
    
    # Save output video
    from utils import read_video, save_video
    from drawers import PlayerTracksDrawer, BallTracksDrawer, TeamBallControlDrawer
    import numpy as np
    
    print("Generating output video...")
    frames = read_video(video_path)
    player_drawer = PlayerTracksDrawer()
    ball_drawer = BallTracksDrawer()
    
    # Process detections for drawing
    player_tracks = [{} for _ in range(len(frames))]
    ball_tracks = [{} for _ in range(len(frames))]
    hoop_tracks = [{} for _ in range(len(frames))]
    
    for det in results.get('detections', []):
        f = det['frame']
        if f < len(player_tracks):
            if det['object_type'] == 'player':
                player_tracks[f][det['track_id']] = {'bbox': det['bbox']}
            elif det['object_type'] == 'ball':
                ball_tracks[f][det['track_id']] = {'bbox': det['bbox']}
            elif det['object_type'] == 'hoop':
                hoop_tracks[f][det['track_id']] = {'bbox': det['bbox']}
    
    output_frames = frames.copy()
    
    # Create empty assignments for every frame to avoid KeyErrors
    player_assignment = {i: {} for i in range(len(frames))}
    team_stats = {i: {} for i in range(len(frames))}
    
    # Process for drawer
    output_frames = player_drawer.draw(output_frames, player_tracks, player_assignment, team_stats)
    output_frames = ball_drawer.draw(output_frames, ball_tracks)
    
    # Draw hoops manually (simple boxes)
    import cv2
    for f in range(len(frames)):
        for h_id, h_track in hoop_tracks[f].items():
            bbox = h_track['bbox']
            cv2.rectangle(output_frames[f], (int(bbox[0]), int(bbox[1])), (int(bbox[2]), int(bbox[3])), (255, 255, 0), 2)
            cv2.putText(output_frames[f], "HOOP", (int(bbox[0]), int(bbox[1]) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
    
    # Draw shot markers
    import cv2
    for shot in results.get('shot_details', []):
        f = int(shot.get('outcome_frame', 0))
        if f < len(output_frames):
            color = (0, 255, 0) if shot['outcome'] == 'made' else (0, 0, 255)
            pos = shot.get('peak_position', [0, 0])
            cv2.putText(output_frames[f], f"SHOT {shot['outcome'].upper()}", 
                        (int(pos[0]), int(pos[1]) - 20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    
    output_path = "output_videos/personal_analysis_test.mp4"
    save_video(output_frames, output_path)
    print(f"Video saved to: {output_path}")
    
    print("\nRESULTS:")

    print("-" * 60)
    print(f"Duration: {results.get('duration_seconds', 0):.1f} seconds")
    print(f"Total Frames: {results.get('total_frames', 0)}")
    print()
    
    print("SHOOTING STATISTICS:")
    print("-" * 60)
    print(f"  Shot Attempts: {results.get('shot_attempts', 0)}")
    print(f"  Shots Made: {results.get('shots_made', 0)}")
    print(f"  Shots Missed: {results.get('shots_missed', 0)}")
    print(f"  Success Rate: {results.get('shot_success_rate', 0):.1f}%")
    print(f"  Form Consistency: {results.get('shot_form_consistency', 0):.1f}/100")
    print()
    
    # Shot breakdown by type
    shot_breakdown = results.get('shot_breakdown_by_type', {})
    if shot_breakdown:
        print("SHOT BREAKDOWN BY TYPE:")
        print("-" * 60)
        for shot_type, stats in shot_breakdown.items():
            print(f"  {shot_type.upper()}:")
            print(f"    Attempts: {stats['attempts']}")
            print(f"    Made: {stats['made']}")
            print(f"    Missed: {stats['missed']}")
            print(f"    Percentage: {stats['percentage']:.1f}%")
            print()
    
    # Shot details
    shot_details = results.get('shot_details', [])
    if shot_details:
        print(f"SHOT DETAILS ({len(shot_details)} shots):")
        print("-" * 60)
        for i, shot in enumerate(shot_details[:5], 1):  # Show first 5
            print(f"  Shot {i}:")
            print(f"    Time: {shot['timestamp_seconds']:.1f}s")
            print(f"    Outcome: {shot['outcome']}")
            print(f"    Type: {shot.get('shot_type', 'unknown')}")
            print(f"    Confidence: {shot['confidence']:.2f}")
            print()
    
    print("OTHER METRICS:")
    print("-" * 60)
    print(f"  Dribbles: {results.get('dribble_count', 0)}")
    print(f"  Distance: {results.get('total_distance_meters', 0):.1f}m")
    print(f"  Avg Speed: {results.get('avg_speed_kmh', 0):.1f} km/h")
    print(f"  Training Load: {results.get('training_load_score', 0):.1f}/100")
    print()
    
    return results


async def test_team_shot_detection(video_path: str):
    """Test shot detection in team analysis mode."""
    print("\n" + "="*60)
    print("TESTING TEAM ANALYSIS - SHOT DETECTION")
    print("="*60 + "\n")
    
    print(f"Analyzing video: {video_path}")
    print("Running analysis...\n")
    
    results = await run_team_analysis(video_path)
    
    print("RESULTS:")
    print("-" * 60)
    print(f"Duration: {results.get('duration_seconds', 0):.1f} seconds")
    print(f"Total Frames: {results.get('total_frames', 0)}")
    print(f"Players Detected: {results.get('players_detected', 0)}")
    print()
    
    print("OVERALL SHOOTING STATISTICS:")
    print("-" * 60)
    print(f"  Total Shot Attempts: {results.get('total_shot_attempts', 0)}")
    print(f"  Total Shots Made: {results.get('total_shots_made', 0)}")
    print(f"  Total Shots Missed: {results.get('total_shots_missed', 0)}")
    print(f"  Overall Shooting %: {results.get('overall_shooting_percentage', 0):.1f}%")
    print()
    
    print("TEAM 1 SHOOTING:")
    print("-" * 60)
    print(f"  Attempts: {results.get('team_1_shot_attempts', 0)}")
    print(f"  Made: {results.get('team_1_shots_made', 0)}")
    print(f"  Percentage: {results.get('team_1_shooting_percentage', 0):.1f}%")
    
    team_1_breakdown = results.get('team_1_shot_breakdown', {})
    if team_1_breakdown:
        print("  Breakdown:")
        for shot_type, stats in team_1_breakdown.items():
            print(f"    {shot_type}: {stats['made']}/{stats['attempts']} ({stats['percentage']:.1f}%)")
    print()
    
    print("TEAM 2 SHOOTING:")
    print("-" * 60)
    print(f"  Attempts: {results.get('team_2_shot_attempts', 0)}")
    print(f"  Made: {results.get('team_2_shots_made', 0)}")
    print(f"  Percentage: {results.get('team_2_shooting_percentage', 0):.1f}%")
    
    team_2_breakdown = results.get('team_2_shot_breakdown', {})
    if team_2_breakdown:
        print("  Breakdown:")
        for shot_type, stats in team_2_breakdown.items():
            print(f"    {shot_type}: {stats['made']}/{stats['attempts']} ({stats['percentage']:.1f}%)")
    print()
    
    print("OTHER TEAM METRICS:")
    print("-" * 60)
    print(f"  Team 1 Possession: {results.get('team_1_possession_percent', 0):.1f}%")
    print(f"  Team 2 Possession: {results.get('team_2_possession_percent', 0):.1f}%")
    print(f"  Total Passes: {results.get('total_passes', 0)}")
    print(f"  Total Interceptions: {results.get('total_interceptions', 0)}")
    print()
    
    return results


async def main():
    """Main test function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test shot detection functionality')
    parser.add_argument('video_path', help='Path to input video file')
    parser.add_argument('--mode', choices=['personal', 'team', 'both'], 
                       default='personal', help='Analysis mode to test')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.video_path):
        print(f"Error: Video file not found: {args.video_path}")
        return
    
    try:
        if args.mode in ['personal', 'both']:
            await test_personal_shot_detection(args.video_path)
        
        if args.mode in ['team', 'both']:
            await test_team_shot_detection(args.video_path)
        
        print("\n" + "="*60)
        print("TEST COMPLETED SUCCESSFULLY")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\nError during testing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
