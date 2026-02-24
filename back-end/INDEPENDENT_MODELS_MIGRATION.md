# Independent Models Migration

**Date:** February 24, 2026

## Summary
The system has been updated to use independently trained YOLOv5 models for player and ball detection instead of the combined models.

## Changes Made

### 1. Config Files Updated
- **`back-end/configs/configs.py`**
  - `PLAYER_DETECTOR_PATH`: Changed from `TEAM_MODEL_PATH` → `models/player_detector_v1.pt`
  - `BALL_DETECTOR_PATH`: Changed from `TEAM_MODEL_PATH` → `models/ball_detector_v1.pt`

- **`back-end/app/config.py`**
  - `player_detector_path`: Updated from `"models/nbl_v3_combined.pt"` → `"models/player_detector_v1.pt"`
  - `ball_detector_path`: Updated from `"models/nbl_v3_combined.pt"` → `"models/ball_detector_v1.pt"`
  - `team_model_path`: Now uses `"models/nbl_v4_combined.pt"` (for team analysis)
  - `personal_model_path`: Still uses `"models/nbl_v2_combined.pt"` (for personal analysis)

- **`back-end/test_system.py`**
  - Model loader updated to use new independent model paths

### 2. Model Files in Production
```
back-end/models/
├── player_detector_v1.pt      (165 MB) - trained Feb 24 16:23
├── ball_detector_v1.pt        (165 MB) - trained Feb 24 17:10
├── court_keypoint_detector.pt (399 MB) - existing
├── nbl_v3_combined.pt         (165 MB) - kept for reference
└── nbl_v4_combined.pt         (5.3 MB) - for team analysis
```

### 3. Training Metrics

#### Player Detector (train5)
- Model: YOLOv5l6u
- Epochs: 100
- mAP50: 0.745
- mAP50-95: 0.381
- Per-class performance:
  - player: 0.851 (mAP50)
  - hoop: 0.836
  - referee: 0.802
  - basketball: 0.744
  - shot-clock: 0.518

#### Ball Detector (train6)
- Model: YOLOv5l6u
- Epochs: 100
- mAP50: 0.731
- mAP50-95: 0.403
- Per-class performance:
  - player: 0.865 (mAP50)
  - hoop: 0.909
  - referee: 0.780
  - basketball: 0.646
  - shot-clock: 0.454

### 4. System Components Affected
The following components now use independent models:
- `trackers/player_tracker.py` - loads `player_detector_v1.pt`
- `trackers/ball_tracker.py` - loads `ball_detector_v1.pt`
- All video analysis pipelines pass the correct model paths via config

### 5. Backward Compatibility
- Combined models are still available in `models/` for reference
- `team_analysis.py` still uses team-oriented combined models for compatibility
- `personal_analysis.py` still uses personal analysis combined models

## Benefits
1. **Specialized Training**: Each detector trained specifically for its object class
2. **Better Performance**: Dedicated models allow for task-specific optimization
3. **Modular Architecture**: Easier to update individual detectors without affecting others
4. **Production Ready**: Both models trained on identical NBL-6 dataset for consistency

## Rollback Instructions
If needed, to revert to combined models:
```python
# In back-end/configs/configs.py
PLAYER_DETECTOR_PATH = TEAM_MODEL_PATH  # = 'models/nbl_v4_combined.pt'
BALL_DETECTOR_PATH = TEAM_MODEL_PATH     # = 'models/nbl_v4_combined.pt'
```

## Verification
All imports verified working:
```python
from configs import PLAYER_DETECTOR_PATH, BALL_DETECTOR_PATH
# PLAYER_DETECTOR_PATH = 'models/player_detector_v1.pt' ✓
# BALL_DETECTOR_PATH = 'models/ball_detector_v1.pt' ✓
```
