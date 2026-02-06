# Shot Success Rate Detection

## Overview

The shot success rate detection feature adds comprehensive shooting analytics to both **Personal** and **Team** analysis modes. This critical basketball metric tracks not only shot attempts but also whether shots are made or missed, providing essential performance insights.

## Features

### 🎯 Shot Detection Capabilities

1. **Shot Attempt Detection**
   - Automatically identifies shooting motions by analyzing ball trajectory
   - Detects upward arc patterns characteristic of basketball shots
   - Filters out non-shot ball movements

2. **Shot Outcome Detection**
   - Determines if shots are **made** (ball goes through hoop)
   - Identifies **missed** shots (ball does not pass through hoop region)
   - Provides confidence scores for each outcome determination

3. **Shot Type Classification**
   - **Layup**: Close-range shots with low arc
   - **Mid-range**: Medium-distance jump shots
   - **Three-pointer**: Long-range shots beyond the arc
   - Automatic classification based on distance and trajectory

4. **Statistical Analysis**
   - Overall shooting percentage
   - Breakdown by shot type (layup %, mid-range %, 3PT %)
   - Made/missed shot counts
   - Shot locations and timing

## How It Works

### Detection Algorithm

The shot detector uses a multi-stage approach:

1. **Ball Trajectory Analysis**
   - Tracks ball position across frames
   - Calculates velocity and direction
   - Identifies upward arcs indicating shot attempts

2. **Hoop Detection**
   - Uses YOLO model to detect basketball hoop location
   - Falls back to heuristic methods if hoop model unavailable
   - Maintains stable hoop position across frames

3. **Outcome Determination**
   - Checks if ball passes through hoop region
   - Verifies ball is descending (downward trajectory)
   - Measures proximity to rim/backboard
   - Assigns confidence score based on trajectory clarity

4. **Shot Type Classification**
   - Calculates horizontal distance from shooter to hoop
   - Analyzes shot arc height
   - Classifies based on basketball shot type definitions

### Key Parameters

```python
ShotDetector(
    min_shot_arc_height=50,          # Minimum pixels for valid shot arc
    hoop_proximity_threshold=100,     # Max distance to count as "made"
    trajectory_window=30,             # Frames to analyze trajectory
    success_time_window=15            # Frames after peak to check outcome
)
```

## Usage

### Personal Analysis Mode

```python
from analysis.personal_analysis import run_personal_analysis

# Run analysis with shot detection (enabled by default)
results = await run_personal_analysis(
    video_path="training_session.mp4",
    options={'detect_shots': True}
)

# Access shooting statistics
print(f"Shot Attempts: {results['shot_attempts']}")
print(f"Shots Made: {results['shots_made']}")
print(f"Success Rate: {results['shot_success_rate']}%")
print(f"Shot Breakdown: {results['shot_breakdown_by_type']}")
```

### Team Analysis Mode

```python
from analysis.team_analysis import run_team_analysis

# Run team analysis (shot detection automatic)
results = await run_team_analysis(video_path="game_footage.mp4")

# Access team shooting stats
print(f"Team 1 Shooting: {results['team_1_shooting_percentage']}%")
print(f"Team 2 Shooting: {results['team_2_shooting_percentage']}%")
print(f"Overall: {results['overall_shooting_percentage']}%")
```

### Testing

Use the included test script to verify shot detection:

```bash
# Test personal analysis
python test_shot_detection.py input_videos/training.mp4 --mode personal

# Test team analysis
python test_shot_detection.py input_videos/game.mp4 --mode team

# Test both modes
python test_shot_detection.py input_videos/video.mp4 --mode both
```

## Output Data Structure

### Personal Analysis

```json
{
  "shot_attempts": 15,
  "shots_made": 9,
  "shots_missed": 6,
  "shot_success_rate": 60.0,
  "shot_form_consistency": 75.3,
  "shot_breakdown_by_type": {
    "layup": {
      "attempts": 5,
      "made": 4,
      "missed": 1,
      "percentage": 80.0
    },
    "mid-range": {
      "attempts": 7,
      "made": 3,
      "missed": 4,
      "percentage": 42.9
    },
    "three-pointer": {
      "attempts": 3,
      "made": 2,
      "missed": 1,
      "percentage": 66.7
    }
  },
  "shot_details": [
    {
      "start_frame": 245,
      "outcome": "made",
      "shot_type": "mid-range",
      "timestamp_seconds": 8.2,
      "confidence": 0.85,
      "arc_height_pixels": 120.5
    }
  ]
}
```

### Team Analysis

```json
{
  "total_shot_attempts": 42,
  "total_shots_made": 24,
  "total_shots_missed": 18,
  "overall_shooting_percentage": 57.1,
  
  "team_1_shot_attempts": 23,
  "team_1_shots_made": 14,
  "team_1_shooting_percentage": 60.9,
  "team_1_shot_breakdown": {
    "layup": {"attempts": 8, "made": 6, "percentage": 75.0},
    "mid-range": {"attempts": 10, "made": 5, "percentage": 50.0},
    "three-pointer": {"attempts": 5, "made": 3, "percentage": 60.0}
  },
  
  "team_2_shot_attempts": 19,
  "team_2_shots_made": 10,
  "team_2_shooting_percentage": 52.6,
  "team_2_shot_breakdown": {
    "layup": {"attempts": 6, "made": 4, "percentage": 66.7},
    "mid-range": {"attempts": 9, "made": 4, "percentage": 44.4},
    "three-pointer": {"attempts": 4, "made": 2, "percentage": 50.0}
  }
}
```

## API Integration

### Updated Analytics Models

**PlayerAnalyticsSummary** now includes:
- `total_shot_attempts`
- `total_shots_made`
- `total_shots_missed`
- `shot_success_rate`

**TeamAnalyticsSummary** now includes:
- `total_shot_attempts`
- `total_shots_made`
- `team_shooting_percentage`

### Database Storage

Shot statistics are automatically saved to the `analytics` table with the following metric types:

- `shot_attempt` - Total attempts (count)
- `shot_made` - Successful shots (count)
- `shot_missed` - Missed shots (count)
- `shot_percentage` - Success rate (0-100)
- `layup_percentage` - Layup success rate
- `midrange_percentage` - Mid-range success rate
- `three_point_percentage` - Three-point success rate

## Performance Considerations

### Accuracy Factors

Shot detection accuracy depends on:

1. **Video Quality**: Higher resolution improves detection
2. **Camera Angle**: Side or elevated views work best
3. **Hoop Visibility**: Hoop must be visible in frame
4. **Ball Tracking**: Clear ball visibility throughout trajectory
5. **Frame Rate**: Higher FPS (30+) improves trajectory analysis

### Optimization

- Ball tracking uses interpolation for smoother trajectories
- Hoop detection caches stable positions
- Trajectory analysis uses sliding windows for efficiency
- Batch processing for multiple frames

## Limitations & Future Enhancements

### Current Limitations

1. Requires hoop to be visible in frame
2. May struggle with extreme camera angles
3. Blocked shots may be misclassified
4. Requires clear ball visibility

### Planned Enhancements

1. **Machine Learning Enhancement**
   - Train ML model specifically for shot outcome
   - Learn from labeled shooting data
   - Improve classification accuracy

2. **Advanced Metrics**
   - Shot charts (visual heat maps)
   - Shooting zones analysis
   - Shot quality assessment
   - Contested vs. uncontested shots

3. **3D Trajectory Analysis**
   - Account for camera perspective
   - More accurate distance calculations
   - Better arc analysis

4. **Free Throw Detection**
   - Specific free throw line detection
   - Free throw percentage tracking

## Troubleshooting

### Common Issues

**Issue**: No shots detected
- **Solution**: Ensure ball is visible and video contains shooting actions
- Check that `detect_shots=True` in options
- Verify video contains full shot arcs (not cut off)

**Issue**: Low accuracy (many "unknown" outcomes)
- **Solution**: Ensure hoop is visible in frame
- Check video quality and resolution
- Consider using hoop detection model

**Issue**: Wrong shot type classification
- **Solution**: May need to calibrate distance thresholds
- Ensure court keypoints are detected for better spatial understanding

**Issue**: Performance is slow
- **Solution**: Process shorter video clips
- Reduce trajectory window size
- Use lower resolution for testing

## Examples

See `test_shot_detection.py` for complete examples of:
- Personal training session analysis
- Team game footage analysis
- Accessing and displaying shot statistics
- Interpreting shot details

## Contributing

To improve shot detection:

1. Test with diverse video footage
2. Report accuracy issues with specific videos
3. Suggest parameter tuning for different scenarios
4. Contribute labeled shot data for validation

## Related Documentation

- [Personal Analysis Pipeline](./analysis/personal_analysis.py)
- [Team Analysis Pipeline](./analysis/team_analysis.py)
- [Analytics API](./app/api/analytics.py)
- [Analytics Models](./app/models/analytics.py)
