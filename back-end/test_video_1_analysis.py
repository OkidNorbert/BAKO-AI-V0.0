#!/usr/bin/env python3
"""
Test advanced analytics with video_1.mp4

This script runs team analysis with advanced analytics enabled
and displays the results.
"""
import sys
import os
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analysis.team_analysis import run_team_analysis


async def run_test():
    video_path = "input_videos/video_1.mp4"
    
    if not os.path.exists(video_path):
        print(f"❌ Video not found: {video_path}")
        return 1
    
    print("=" * 80)
    print("  Testing Advanced Analytics with video_1.mp4")
    print("=" * 80)
    print()
    
    # Options to enable advanced analytics
    options = {
        "enable_advanced_analytics": True,
        "detections_stride": 5,  # Sample every 5th frame for detections
        "max_detections": 50000   # Limit detections to avoid memory issues
    }
    
    print(f"📹 Video: {video_path}")
    print(f"⚙️  Options: {options}")
    print()
    print("🚀 Starting analysis...")
    print()
    
    try:
        # Run team analysis
        result = await run_team_analysis(video_path, options=options)
        
        print("\n" + "=" * 80)
        print("  Analysis Complete!")
        print("=" * 80)
        print()
        
        # Display basic results
        print("📊 Basic Metrics:")
        print(f"   Total frames: {result.get('total_frames', 0)}")
        print(f"   Duration: {result.get('duration_seconds', 0):.1f}s")
        print(f"   Players detected: {result.get('players_detected', 0)}")
        print(f"   Total passes: {result.get('total_passes', 0)}")
        print(f"   Total shots: {result.get('total_shot_attempts', 0)}")
        print()
        
        # Display advanced analytics results
        if "advanced_analytics" in result:
            adv = result["advanced_analytics"]
            
            print("🎯 Advanced Analytics:")
            print(f"   Modules executed: {len(adv.get('modules_executed', []))}")
            print(f"   Modules failed: {len(adv.get('modules_failed', []))}")
            print()
            
            if adv.get("modules_executed"):
                print("   ✅ Successful modules:")
                for module in adv["modules_executed"]:
                    print(f"      - {module}")
                print()
            
            if adv.get("modules_failed"):
                print("   ❌ Failed modules:")
                for module in adv["modules_failed"]:
                    print(f"      - {module}")
                print()
            
            # Spacing summary
            if "spacing" in adv and adv["spacing"].get("status") == "success":
                spacing = adv["spacing"]["summary"]
                print("   📏 Spacing Analysis:")
                print(f"      Frames analyzed: {spacing.get('total_frames_analyzed', 0)}")
                print(f"      Good spacing: {spacing.get('good_spacing_pct', 0):.1f}%")
                print(f"      Poor spacing: {spacing.get('poor_spacing_pct', 0):.1f}%")
                print(f"      Avg distance: {spacing.get('avg_distance_overall', 0):.2f}m")
                print()
            
            # Defensive reactions summary
            if "defensive_reactions" in adv and adv["defensive_reactions"].get("status") == "success":
                defense = adv["defensive_reactions"]["summary"]
                print("   🛡️  Defensive Reactions:")
                print(f"      Total events: {defense.get('total_defensive_events', 0)}")
                print(f"      Late closeouts: {defense.get('late_closeouts', 0)}")
                print(f"      Late closeout rate: {defense.get('late_closeout_rate', 0):.1f}%")
                if defense.get('avg_reaction_delay_ms'):
                    print(f"      Avg reaction delay: {defense['avg_reaction_delay_ms']:.0f}ms")
                print()
            
            # Transition effort summary
            if "transition_effort" in adv and adv["transition_effort"].get("status") == "success":
                transition = adv["transition_effort"]["summary"]
                print("   🏃 Transition Effort:")
                print(f"      Total transitions: {transition.get('total_transition_events', 0)}")
                print(f"      Sprints: {transition.get('sprint_count', 0)}")
                print(f"      Sprint rate: {transition.get('sprint_rate', 0):.1f}%")
                print(f"      Avg effort score: {transition.get('avg_effort_score', 0):.1f}")
                print()
            
            # Decision quality summary
            if "decision_quality" in adv and adv["decision_quality"].get("status") == "success":
                decision = adv["decision_quality"]["summary"]
                print("   🎯 Decision Quality:")
                print(f"      Shots analyzed: {decision.get('total_shots_analyzed', 0)}")
                print(f"      High EV shots: {decision.get('high_ev_shots', 0)}")
                print(f"      Low EV shots: {decision.get('low_ev_shots', 0)}")
                print(f"      Low EV rate: {decision.get('low_ev_rate', 0):.1f}%")
                print()
            
            # Lineup impact summary
            if "lineup_impact" in adv and adv["lineup_impact"].get("status") == "success":
                lineup = adv["lineup_impact"]["summary"]
                print("   👥 Lineup Impact:")
                print(f"      Total lineups: {lineup.get('total_lineups', 0)}")
                if lineup.get('best_lineup_net_rating') is not None:
                    print(f"      Best net rating: {lineup['best_lineup_net_rating']:.1f}")
                if lineup.get('worst_lineup_net_rating') is not None:
                    print(f"      Worst net rating: {lineup['worst_lineup_net_rating']:.1f}")
                print()
            
            # Fatigue summary
            if "fatigue" in adv and adv["fatigue"].get("status") == "success":
                fatigue = adv["fatigue"]["summary"]
                print("   😓 Fatigue Tracking:")
                print(f"      Measurements: {fatigue.get('total_measurements', 0)}")
                print(f"      High fatigue instances: {fatigue.get('high_fatigue_instances', 0)}")
                print(f"      Avg speed drop: {fatigue.get('avg_speed_drop_pct', 0):.1f}%")
                print()
            
            # Clips summary
            if "clips" in adv and adv["clips"].get("status") == "success":
                clips = adv["clips"]["summary"]
                print("   🎬 Auto-Generated Clips:")
                print(f"      Total clips: {clips.get('total_clips_generated', 0)}")
                if clips.get('clips_by_type'):
                    print(f"      By type: {clips['clips_by_type']}")
                if clips.get('output_directory'):
                    print(f"      Output: {clips['output_directory']}")
                print()
        else:
            print("⚠️  No advanced analytics results found")
            print("   Make sure enable_advanced_analytics=True in options")
        
        print("=" * 80)
        print("✅ Test completed successfully!")
        print("=" * 80)
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
        return 1


def main():
    """Main entry point."""
    return asyncio.run(run_test())


if __name__ == "__main__":
    sys.exit(main())
