"""
Analytics engine for basketball performance analysis.
Computes metrics, identifies weaknesses, and generates recommendations.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import numpy as np
from dataclasses import dataclass

from app.models.wearable import WearableData, DataType, WearableSession
from app.models.event import Event
from app.models.video import Video
from app.models.player import PlayerProfile

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Player performance metrics."""
    player_id: int
    date_range: str
    total_sessions: int
    total_training_time: float  # hours
    
    # Shooting metrics
    shot_attempts: int
    shot_accuracy: float
    three_point_accuracy: float
    free_throw_accuracy: float
    
    # Physical metrics
    avg_heart_rate: float
    max_heart_rate: float
    avg_jump_height: float
    max_jump_height: float
    avg_sprint_speed: float
    total_distance: float
    
    # Workload metrics
    total_calories_burned: float
    avg_workload: float
    recovery_time: float
    
    # Weakness indicators
    weaknesses: List[str]
    improvement_areas: List[str]


@dataclass
class TrainingRecommendation:
    """Training recommendation."""
    title: str
    description: str
    category: str  # shooting, conditioning, strength, skill
    priority: int  # 1-5 (5 = highest)
    duration: str  # "15 min", "30 min", "1 hour"
    frequency: str  # "daily", "3x/week", "weekly"
    exercises: List[str]
    expected_improvement: str
    rationale: str


class BasketballAnalytics:
    """Main analytics engine for basketball performance."""
    
    def __init__(self, db: Session):
        self.db = db
        self.drills_database = self._load_drills_database()
    
    def analyze_player_performance(self, player_id: int, days: int = 30) -> PerformanceMetrics:
        """Analyze player performance over specified period."""
        logger.info(f"📊 Analyzing performance for player {player_id} over {days} days")
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get training sessions
        sessions = self._get_training_sessions(player_id, start_date, end_date)
        
        # Get wearable data
        wearable_data = self._get_wearable_data(player_id, start_date, end_date)
        
        # Get video events
        events = self._get_video_events(player_id, start_date, end_date)
        
        # Calculate metrics
        metrics = self._calculate_performance_metrics(
            player_id, sessions, wearable_data, events, start_date, end_date
        )
        
        # Identify weaknesses
        metrics.weaknesses = self._identify_weaknesses(metrics)
        metrics.improvement_areas = self._identify_improvement_areas(metrics)
        
        return metrics
    
    def generate_recommendations(self, metrics: PerformanceMetrics) -> List[TrainingRecommendation]:
        """Generate personalized training recommendations."""
        logger.info(f"💡 Generating recommendations for player {metrics.player_id}")
        
        recommendations = []
        
        # Analyze weaknesses and generate recommendations
        for weakness in metrics.weaknesses:
            recs = self._get_recommendations_for_weakness(weakness, metrics)
            recommendations.extend(recs)
        
        # Sort by priority
        recommendations.sort(key=lambda x: x.priority, reverse=True)
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def _get_training_sessions(self, player_id: int, start_date: datetime, end_date: datetime):
        """Get training sessions for player."""
        # TODO: Implement when training sessions are available
        return []
    
    def _get_wearable_data(self, player_id: int, start_date: datetime, end_date: datetime) -> Dict[str, List]:
        """Get wearable data for player."""
        data = self.db.query(WearableData).filter(
            and_(
                WearableData.player_id == player_id,
                WearableData.timestamp >= start_date,
                WearableData.timestamp <= end_date
            )
        ).all()
        
        # Group by data type
        grouped_data = {}
        for point in data:
            data_type = point.data_type.value
            if data_type not in grouped_data:
                grouped_data[data_type] = []
            grouped_data[data_type].append(point)
        
        return grouped_data
    
    def _get_video_events(self, player_id: int, start_date: datetime, end_date: datetime):
        """Get video analysis events for player."""
        events = self.db.query(Event).filter(
            and_(
                Event.player_id == str(player_id),
                Event.timestamp >= start_date.timestamp(),
                Event.timestamp <= end_date.timestamp()
            )
        ).all()
        
        return events
    
    def _calculate_performance_metrics(self, player_id: int, sessions, wearable_data: Dict, events, start_date: datetime, end_date: datetime) -> PerformanceMetrics:
        """Calculate comprehensive performance metrics."""
        
        # Basic metrics
        total_sessions = len(sessions)
        total_training_time = sum(session.duration for session in sessions) if sessions else 0
        
        # Shooting metrics from video events
        shot_events = [e for e in events if e.type == "shot_attempt"]
        shot_attempts = len(shot_events)
        shot_accuracy = self._calculate_shot_accuracy(shot_events)
        
        # Physical metrics from wearable data
        heart_rate_data = wearable_data.get('heart_rate', [])
        avg_heart_rate = np.mean([d.value for d in heart_rate_data]) if heart_rate_data else 0
        max_heart_rate = max([d.value for d in heart_rate_data]) if heart_rate_data else 0
        
        # Jump metrics from video events
        jump_events = [e for e in events if e.type == "jump"]
        jump_heights = [self._extract_jump_height(e) for e in jump_events]
        avg_jump_height = np.mean(jump_heights) if jump_heights else 0
        max_jump_height = max(jump_heights) if jump_heights else 0
        
        # Sprint metrics
        sprint_events = [e for e in events if e.type == "sprint"]
        sprint_speeds = [self._extract_sprint_speed(e) for e in sprint_events]
        avg_sprint_speed = np.mean(sprint_speeds) if sprint_speeds else 0
        
        # Distance and calories from wearable data
        steps_data = wearable_data.get('steps', [])
        total_distance = sum([d.value for d in steps_data]) * 0.0008  # Approximate km per step
        
        calories_data = wearable_data.get('calories', [])
        total_calories_burned = sum([d.value for d in calories_data])
        
        return PerformanceMetrics(
            player_id=player_id,
            date_range=f"{start_date.date()} to {end_date.date()}",
            total_sessions=total_sessions,
            total_training_time=total_training_time,
            shot_attempts=shot_attempts,
            shot_accuracy=shot_accuracy,
            three_point_accuracy=0.0,  # TODO: Calculate from shot zones
            free_throw_accuracy=0.0,   # TODO: Calculate from shot zones
            avg_heart_rate=avg_heart_rate,
            max_heart_rate=max_heart_rate,
            avg_jump_height=avg_jump_height,
            max_jump_height=max_jump_height,
            avg_sprint_speed=avg_sprint_speed,
            total_distance=total_distance,
            total_calories_burned=total_calories_burned,
            avg_workload=avg_heart_rate * total_training_time / 60,  # Simple workload calculation
            recovery_time=0.0,  # TODO: Calculate from HRV data
            weaknesses=[],  # Will be filled by weakness analysis
            improvement_areas=[]  # Will be filled by improvement analysis
        )
    
    def _calculate_shot_accuracy(self, shot_events: List[Event]) -> float:
        """Calculate shooting accuracy from shot events."""
        if not shot_events:
            return 0.0
        
        # TODO: Implement shot outcome detection
        # For now, return a placeholder based on confidence
        total_shots = len(shot_events)
        made_shots = sum(1 for shot in shot_events if shot.meta.get('confidence', 0) > 0.7)
        
        return (made_shots / total_shots) * 100 if total_shots > 0 else 0.0
    
    def _extract_jump_height(self, jump_event: Event) -> float:
        """Extract jump height from jump event."""
        return jump_event.meta.get('jump_height', 0.0)
    
    def _extract_sprint_speed(self, sprint_event: Event) -> float:
        """Extract sprint speed from sprint event."""
        return sprint_event.meta.get('speed', 0.0)
    
    def _identify_weaknesses(self, metrics: PerformanceMetrics) -> List[str]:
        """Identify player weaknesses based on metrics."""
        weaknesses = []
        
        # Shooting weaknesses
        if metrics.shot_accuracy < 40:
            weaknesses.append("shooting_accuracy")
        if metrics.three_point_accuracy < 30:
            weaknesses.append("three_point_shooting")
        if metrics.free_throw_accuracy < 70:
            weaknesses.append("free_throw_shooting")
        
        # Physical weaknesses
        if metrics.avg_jump_height < 20:  # inches
            weaknesses.append("vertical_jump")
        if metrics.avg_sprint_speed < 3.0:  # m/s
            weaknesses.append("sprint_speed")
        if metrics.avg_heart_rate > 180:  # High heart rate indicates poor conditioning
            weaknesses.append("cardiovascular_fitness")
        
        # Consistency weaknesses
        if metrics.total_sessions < 3:  # per week
            weaknesses.append("training_consistency")
        
        return weaknesses
    
    def _identify_improvement_areas(self, metrics: PerformanceMetrics) -> List[str]:
        """Identify areas for improvement."""
        improvement_areas = []
        
        # Based on performance gaps
        if metrics.shot_accuracy < 50:
            improvement_areas.append("shooting_mechanics")
        if metrics.avg_jump_height < 25:
            improvement_areas.append("explosive_power")
        if metrics.avg_heart_rate > 160:
            improvement_areas.append("endurance")
        
        return improvement_areas
    
    def _get_recommendations_for_weakness(self, weakness: str, metrics: PerformanceMetrics) -> List[TrainingRecommendation]:
        """Get specific recommendations for a weakness."""
        recommendations = []
        
        if weakness == "shooting_accuracy":
            recommendations.append(TrainingRecommendation(
                title="Shooting Form Improvement",
                description="Focus on shooting mechanics and form",
                category="shooting",
                priority=5,
                duration="30 min",
                frequency="daily",
                exercises=[
                    "Form shooting from close range",
                    "Elbow alignment drills",
                    "Follow-through practice",
                    "Free throw routine"
                ],
                expected_improvement="5-10% accuracy increase",
                rationale=f"Current accuracy: {metrics.shot_accuracy:.1f}% - needs improvement"
            ))
        
        elif weakness == "vertical_jump":
            recommendations.append(TrainingRecommendation(
                title="Jump Training Program",
                description="Plyometric exercises to increase vertical jump",
                category="strength",
                priority=4,
                duration="45 min",
                frequency="3x/week",
                exercises=[
                    "Box jumps",
                    "Jump squats",
                    "Calf raises",
                    "Single-leg hops"
                ],
                expected_improvement="2-4 inch increase",
                rationale=f"Current jump height: {metrics.avg_jump_height:.1f} inches"
            ))
        
        elif weakness == "cardiovascular_fitness":
            recommendations.append(TrainingRecommendation(
                title="Cardio Conditioning",
                description="Improve cardiovascular endurance",
                category="conditioning",
                priority=3,
                duration="30 min",
                frequency="4x/week",
                exercises=[
                    "Interval running",
                    "Basketball sprints",
                    "Suicide drills",
                    "Conditioning games"
                ],
                expected_improvement="Lower resting heart rate",
                rationale=f"Current avg HR: {metrics.avg_heart_rate:.0f} bpm - too high"
            ))
        
        return recommendations
    
    def _load_drills_database(self) -> Dict[str, Any]:
        """Load basketball drills database."""
        return {
            "shooting": [
                {
                    "name": "Form Shooting",
                    "description": "Practice shooting form from close range",
                    "duration": "15 min",
                    "difficulty": "beginner"
                },
                {
                    "name": "Spot Shooting",
                    "description": "Shoot from different spots on the court",
                    "duration": "20 min",
                    "difficulty": "intermediate"
                }
            ],
            "conditioning": [
                {
                    "name": "Suicide Drills",
                    "description": "Full court sprint conditioning",
                    "duration": "10 min",
                    "difficulty": "advanced"
                }
            ],
            "strength": [
                {
                    "name": "Plyometric Training",
                    "description": "Jump training for explosive power",
                    "duration": "30 min",
                    "difficulty": "intermediate"
                }
            ]
        }
