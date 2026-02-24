# Web Frontend ↔ Backend Analysis Synchronization

## Current Issues Identified

### 1. **Web Display Issues**
- Analyzed video not prominently displayed
- Analysis results not fully shown
- Team colors selected in form but not visually reinforced in results
- Missing stats comparison (speed, distance, possession)

### 2. **Backend → Web Integration Gap**
- Backend generates annotated video with team colors (main.py)
- Backend returns detailed analysis results (players, possession, passes, shots, speeds)
- Web receives these but doesn't prominently display video or full results

### 3. **Team Color System**
- **Backend (main.py):** Sets up team colors based on our_team_id:
  ```python
  if our_team_id == 1:
      our_color = [0, 120, 255]    # Cyan/Blue
      opp_color = [0, 0, 200]      # Dark Blue/Purple
  else:
      our_color = [0, 0, 200]      # Dark Blue/Purple
      opp_color = [0, 120, 255]    # Cyan/Blue
  ```
- **Frontend:** Needs to display actual RGB colors and ensure consistency

## Solution Implementation Plan

### Frontend Changes Needed

1. **Improve Results Display in CoachMatchAnalysis.jsx**
   - Show team colors with selected jerseys before analysis
   - Display full analysis results after completion
   - Prominently show annotated video
   - Add comprehensive stats grid

2. **Key Stats to Display from Backend**
   - Match Dynamics: Players detected, possession percentages
   - Offensive: Total passes, shooting percentage, shots made/missed
   - Defensive: Interceptions, defensive rating
   - Movement: Total distance, average speed, max speed
   - Events: Passes, interceptions, shots, tactical events

3. **Color System Integration**
   - Map jersey descriptions to actual colors
   - Display team colors in results
   - Show color coding in stats grid

### Backend → Database Flow
1. Web sends: our_team_jersey, opponent_jersey, our_team_id, match_date
2. Backend processes with main.py using these parameters
3. Backend returns: 
   - Annotated video (with team colors baked in)
   - Full analysis results
   - Detection data (for overlay)
4. Web displays all of above

## Status
- Backend system: ✓ WORKING (generates annotated video + full stats)
- Web form: ✓ WORKING (collects team colors)
- Web display: ✗ NEEDS ENHANCEMENT (show video + expand stats)
- Color synchronization: ✓ BACKEND, ✗ FRONTEND visualization
