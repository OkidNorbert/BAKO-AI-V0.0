"""
Analytics Coordinator - Orchestrates all analytics modules.

Runs all 7 analytics modules in the correct order and aggregates results.
"""
from typing import Dict, Any, List
import logging

from .spacing_engine import SpacingEngine
from .defensive_reaction import DefensiveReactionEngine
from .transition_effort import TransitionEffortEngine
from .decision_quality import DecisionQualityEngine
from .lineup_impact import LineupImpactEngine
from .fatigue_tracker import FatigueTracker
from .clip_generator import ClipGenerator

logger = logging.getLogger(__name__)


class AnalyticsCoordinator:
    """Coordinates execution of all advanced analytics modules."""
    
    def __init__(self):
        """Initialize all analytics modules."""
        self.spacing_engine = SpacingEngine()
        self.defensive_reaction = DefensiveReactionEngine()
        self.transition_effort = TransitionEffortEngine()
        self.decision_quality = DecisionQualityEngine()
        self.lineup_impact = LineupImpactEngine()
        self.fatigue_tracker = FatigueTracker()
        self.clip_generator = ClipGenerator()
    
    def process_all(
        self,
        video_frames: List[Any],
        player_tracks: List[Dict],
        ball_tracks: List[Dict],
        tactical_positions: List[Dict],
        player_assignment: List[Dict],
        ball_possession: List[int],
        events: List[Dict],
        shots: List[Dict],
        court_keypoints: List[Dict],
        speeds: List[Dict],
        video_path: str,
        fps: float
    ) -> Dict[str, Any]:
        """
        Run all analytics modules and aggregate results.
        
        Modules are executed in dependency order:
        1. Spacing Engine (independent)
        2. Defensive Reaction Engine (independent)
        3. Transition Effort Engine (independent)
        4. Decision Quality Engine (independent)
        5. Lineup Impact Engine (depends on spacing + defensive reactions)
        6. Fatigue Tracker (depends on defensive reactions)
        7. Clip Generator (depends on all previous modules)
        
        Args:
            video_frames: List of video frames
            player_tracks: Per-frame player tracking data
            ball_tracks: Per-frame ball tracking data
            tactical_positions: 2D court positions for players
            player_assignment: Per-frame team assignments
            ball_possession: Per-frame ball possession
            events: List of detected events
            shots: List of detected shots
            court_keypoints: Court boundary keypoints
            speeds: Per-frame player speeds
            video_path: Path to original video
            fps: Frames per second
        
        Returns:
            Aggregated analytics results from all modules
        """
        logger.info("Starting advanced analytics processing")
        
        results = {
            "modules_executed": [],
            "modules_failed": [],
        }
        
        # Module 1: Spacing Engine
        logger.info("Running Spacing Engine")
        spacing_result = self.spacing_engine.safe_process(
            video_frames=video_frames,
            player_tracks=player_tracks,
            ball_tracks=ball_tracks,
            tactical_positions=tactical_positions,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            events=events,
            shots=shots,
            court_keypoints=court_keypoints,
            speeds=speeds,
            video_path=video_path,
            fps=fps
        )
        
        if spacing_result.get("status") == "success":
            results["spacing"] = spacing_result
            results["modules_executed"].append("spacing_engine")
        else:
            results["modules_failed"].append("spacing_engine")
            logger.error(f"Spacing Engine failed: {spacing_result.get('error')}")
        
        # Module 2: Defensive Reaction Engine
        logger.info("Running Defensive Reaction Engine")
        defensive_result = self.defensive_reaction.safe_process(
            video_frames=video_frames,
            player_tracks=player_tracks,
            ball_tracks=ball_tracks,
            tactical_positions=tactical_positions,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            events=events,
            shots=shots,
            court_keypoints=court_keypoints,
            speeds=speeds,
            video_path=video_path,
            fps=fps
        )
        
        if defensive_result.get("status") == "success":
            results["defensive_reactions"] = defensive_result
            results["modules_executed"].append("defensive_reaction")
        else:
            results["modules_failed"].append("defensive_reaction")
            logger.error(f"Defensive Reaction Engine failed: {defensive_result.get('error')}")
        
        # Module 3: Transition Effort Engine
        logger.info("Running Transition Effort Engine")
        transition_result = self.transition_effort.safe_process(
            video_frames=video_frames,
            player_tracks=player_tracks,
            ball_tracks=ball_tracks,
            tactical_positions=tactical_positions,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            events=events,
            shots=shots,
            court_keypoints=court_keypoints,
            speeds=speeds,
            video_path=video_path,
            fps=fps
        )
        
        if transition_result.get("status") == "success":
            results["transition_effort"] = transition_result
            results["modules_executed"].append("transition_effort")
        else:
            results["modules_failed"].append("transition_effort")
            logger.error(f"Transition Effort Engine failed: {transition_result.get('error')}")
        
        # Module 4: Decision Quality Engine
        logger.info("Running Decision Quality Engine")
        decision_result = self.decision_quality.safe_process(
            video_frames=video_frames,
            player_tracks=player_tracks,
            ball_tracks=ball_tracks,
            tactical_positions=tactical_positions,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            events=events,
            shots=shots,
            court_keypoints=court_keypoints,
            speeds=speeds,
            video_path=video_path,
            fps=fps
        )
        
        if decision_result.get("status") == "success":
            results["decision_quality"] = decision_result
            results["modules_executed"].append("decision_quality")
        else:
            results["modules_failed"].append("decision_quality")
            logger.error(f"Decision Quality Engine failed: {decision_result.get('error')}")
        
        # Module 5: Lineup Impact Engine (depends on spacing + defensive reactions)
        logger.info("Running Lineup Impact Engine")
        lineup_result = self.lineup_impact.safe_process(
            video_frames=video_frames,
            player_tracks=player_tracks,
            ball_tracks=ball_tracks,
            tactical_positions=tactical_positions,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            events=events,
            shots=shots,
            court_keypoints=court_keypoints,
            speeds=speeds,
            video_path=video_path,
            fps=fps,
            spacing_metrics=spacing_result.get("spacing_metrics", []),
            defensive_reactions=defensive_result.get("defensive_reactions", [])
        )
        
        if lineup_result.get("status") == "success":
            results["lineup_impact"] = lineup_result
            results["modules_executed"].append("lineup_impact")
        else:
            results["modules_failed"].append("lineup_impact")
            logger.error(f"Lineup Impact Engine failed: {lineup_result.get('error')}")
        
        # Module 6: Fatigue Tracker (depends on defensive reactions)
        logger.info("Running Fatigue Tracker")
        fatigue_result = self.fatigue_tracker.safe_process(
            video_frames=video_frames,
            player_tracks=player_tracks,
            ball_tracks=ball_tracks,
            tactical_positions=tactical_positions,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            events=events,
            shots=shots,
            court_keypoints=court_keypoints,
            speeds=speeds,
            video_path=video_path,
            fps=fps,
            defensive_reactions=defensive_result.get("defensive_reactions", [])
        )
        
        if fatigue_result.get("status") == "success":
            results["fatigue"] = fatigue_result
            results["modules_executed"].append("fatigue_tracker")
        else:
            results["modules_failed"].append("fatigue_tracker")
            logger.error(f"Fatigue Tracker failed: {fatigue_result.get('error')}")
        
        # Module 7: Clip Generator (depends on all previous modules)
        logger.info("Running Clip Generator")
        clip_result = self.clip_generator.safe_process(
            video_frames=video_frames,
            player_tracks=player_tracks,
            ball_tracks=ball_tracks,
            tactical_positions=tactical_positions,
            player_assignment=player_assignment,
            ball_possession=ball_possession,
            events=events,
            shots=shots,
            court_keypoints=court_keypoints,
            speeds=speeds,
            video_path=video_path,
            fps=fps,
            spacing_metrics=spacing_result.get("spacing_metrics", []),
            defensive_reactions=defensive_result.get("defensive_reactions", []),
            transition_efforts=transition_result.get("transition_efforts", []),
            decision_analyses=decision_result.get("decision_analyses", [])
        )
        
        if clip_result.get("status") == "success":
            results["clips"] = clip_result
            results["modules_executed"].append("clip_generator")
        else:
            results["modules_failed"].append("clip_generator")
            logger.error(f"Clip Generator failed: {clip_result.get('error')}")
        
        logger.info(f"Advanced analytics complete. Executed: {len(results['modules_executed'])}, Failed: {len(results['modules_failed'])}")
        
        return results
