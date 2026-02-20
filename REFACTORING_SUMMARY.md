# Team Analysis Refactoring - Summary

## Overview
Refactored **main.py** to be the core analysis engine for both CLI and Web API usage.

## Key Changes

### 1. **main.py** (Core Analysis Engine)
- **New `run_team_analysis()` function** - The primary analysis function
  - Accepts parameters instead of just CLI args
  - Supports progress callbacks for web integration
  - Returns structured results dictionary
  - Handles all analysis logic: tracking, detection, drawing, saving

- **New `clear_stubs()` function** - Stub management
  - Safely removes cached detection files
  - Enables or disables fresh analysis

- **Refactored CLI** - Now wraps the core function
  - `parse_args()` - Command line argument parsing
  - `main()` - CLI entry point that calls `run_team_analysis()`

### 2. **analysis/team_analysis.py** (Web API Wrapper)
- **Completely refactored** to be a thin async wrapper
- **Imports and uses** `run_team_analysis` from main.py
- **No duplicate logic** - all analysis code is in main.py
- **Web-specific features**:
  - Async execution in thread pools
  - Database progress updates
  - Options parsing and validation

### 3. **Frontend (MatchUpload.jsx)**
- **Jersey color picker** - Visual selection instead of text inputs
- **Analysis options checkboxes**:
  - Clear cached data (default: ON)
  - Use cached detections (default: OFF)
- Passes options to backend API

## Benefits

✅ **Single source of truth** - All analysis logic in main.py  
✅ **No code duplication** - Web layer doesn't duplicate analysis code  
✅ **Better testability** - Core logic is testable independently  
✅ **Easier maintenance** - Changes to analysis affect both CLI and web  
✅ **Better performance** - Main.py logic optimized in one place  
✅ **Jersey customization** - Teams can select colors visually  
✅ **Auto stub clearing** - Fresh analysis by default, cached optional  

## File Structure

```
back-end/
├── main.py (Core analysis engine + CLI)
│   ├── run_team_analysis() [THE core logic]
│   ├── clear_stubs()
│   ├── parse_args()
│   └── main()
│
└── analysis/
    └── team_analysis.py (Web API wrapper)
        ├── run_team_analysis() [async wrapper]
        └── _run_analysis_in_thread() [thread pool runner]

front-end/
└── src/pages/team/MatchUpload.jsx
    ├── Jersey color picker UI
    └── Analysis options checkboxes
```

## Usage

### CLI (unchanged interface)
```bash
python main.py video.mp4 \
  --our_team_jersey "white jersey" \
  --opponent_jersey "dark blue jersey" \
  --our_team_id 1
```

### Web API
- Frontend sends analysis options with jersey colors
- API calls team_analysis.py which calls main.py's run_team_analysis()
- Results returned as structured JSON

## Migration Notes
- Old files backed up: `main_old.py`, `team_analysis_old.py`
- No breaking changes to API contracts
- Both CLI and Web API maintain same functionality
