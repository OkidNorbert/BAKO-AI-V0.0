# 🎯 Action Filtering Guide

## Overview

The system now supports filtering actions based on training status. This ensures that only well-trained actions are detected, preventing false positives from actions with limited training data.

## Configuration

Edit `backend/app/core/config.py` to configure which actions are enabled:

```python
# Only detect actions that have been well-trained
ENABLED_ACTIONS: Dict[str, bool] = {
    "free_throw_shot": True,   # ✅ Well-trained
    "2point_shot": True,        # ✅ Well-trained
    "3point_shot": True,        # ✅ Well-trained
    "dribbling": True,          # ✅ Well-trained
    "passing": False,           # ❌ Not well-trained yet
    "defense": True,            # ✅ Well-trained
    "idle": True,               # ✅ Always enabled as fallback
}

# Per-action confidence thresholds (higher = more strict)
ACTION_CONFIDENCE_THRESHOLDS: Dict[str, float] = {
    "free_throw_shot": 0.4,  # Lower threshold for well-trained actions
    "2point_shot": 0.4,
    "3point_shot": 0.4,
    "dribbling": 0.4,
    "passing": 0.8,          # High threshold if enabled (not well-trained)
    "defense": 0.5,
    "idle": 0.3,             # Lower threshold for fallback
}

# Global minimum confidence
MIN_ACTION_CONFIDENCE: float = 0.3
```

## How It Works

1. **Action Classification**: The model predicts probabilities for all actions
2. **Filtering**: Only enabled actions that meet their confidence threshold are considered
3. **Selection**: The system selects the highest-confidence enabled action
4. **Fallback**: If no enabled action meets the threshold, "idle" is returned

## Example Scenarios

### Scenario 1: Passing Not Trained
```python
ENABLED_ACTIONS = {
    "passing": False,  # Disabled
    ...
}
```
- If model predicts "passing" with 0.9 confidence → **Ignored**
- System returns next best enabled action (e.g., "dribbling" with 0.6 confidence)

### Scenario 2: Passing Enabled but High Threshold
```python
ENABLED_ACTIONS = {
    "passing": True,  # Enabled but not well-trained
    ...
}
ACTION_CONFIDENCE_THRESHOLDS = {
    "passing": 0.8,  # High threshold
    ...
}
```
- If model predicts "passing" with 0.7 confidence → **Rejected** (below 0.8 threshold)
- System returns next best enabled action

### Scenario 3: Well-Trained Action
```python
ENABLED_ACTIONS = {
    "free_throw_shot": True,  # Well-trained
    ...
}
ACTION_CONFIDENCE_THRESHOLDS = {
    "free_throw_shot": 0.4,  # Lower threshold
    ...
}
```
- If model predicts "free_throw_shot" with 0.5 confidence → **Accepted** (meets 0.4 threshold)

## Best Practices

1. **Disable Untrained Actions**: Set `False` for actions with limited training data
2. **Higher Thresholds**: Use higher thresholds (0.7-0.9) for actions with limited data
3. **Lower Thresholds**: Use lower thresholds (0.3-0.5) for well-trained actions
4. **Always Enable "idle"**: Keep "idle" enabled as a fallback
5. **Gradual Enablement**: As you train more, gradually lower thresholds and enable actions

## Updating Configuration

1. Edit `backend/app/core/config.py`
2. Restart the backend server
3. The new configuration will be applied immediately

## Checking Current Configuration

Run the helper script:
```bash
cd backend
python3 configure_actions.py
```

This will show:
- Which actions are enabled/disabled
- Confidence thresholds for each action
- Global minimum confidence

## Troubleshooting

**Problem**: Actions not being detected
- **Solution**: Check if action is enabled in `ENABLED_ACTIONS`
- **Solution**: Lower the confidence threshold for that action

**Problem**: Too many false positives
- **Solution**: Increase the confidence threshold for that action
- **Solution**: Disable the action if not well-trained

**Problem**: Always getting "idle"
- **Solution**: Check if other actions are enabled
- **Solution**: Lower global `MIN_ACTION_CONFIDENCE`

