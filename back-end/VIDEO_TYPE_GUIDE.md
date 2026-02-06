# ⚠️ **IMPORTANT: Personal vs Team Video Requirements**

## 🎯 **Understanding Video Types**

Your basketball analysis system has **TWO distinct modes** with different requirements:

### 📹 **PERSONAL Analysis Mode**
**For:** Individual training sessions
**Video Requirements:**
- ✅ **1 player** (the trainee)
- ✅ Optional: 1 coach/trainer
- ✅ **1-2 basketballs** max
- ✅ **1 hoop** visible
- ✅ Solo drills: shooting practice, dribbling, layups, free throws
- ❌ **NO team practices or scrimmages**

**Examples of GOOD personal videos:**
- Player alone shooting free throws
- One-on-one skill training with a coach
- Solo dribbling drills
- Individual shooting practice

### 🏀 **TEAM Analysis Mode**
**For:** Game footage or team practices
**Video Requirements:**
- ✅ **Multiple players** (5-20+)
- ✅ Full court or half court
- ✅ Team jerseys for identification
- ✅ Game situations or team scrimmages

**Examples of GOOD team videos:**
- Full game footage (5v5)
- Team practice/scrimmage
- Half-court 3v3 games

---

## 🔴 **Current Issue with Your Videos**

### ❌ **Problem: "personal_video_1.mp4" is NOT Actually Personal**

From the analysis output:
```
0: 640x1088 2 basketballs, 2 hoops, 5-10 players
```

This video shows:
- **5-10 players** detected
- **2 basketballs**
- **2 hoops**

**This is clearly a TEAM practice/scrimmage**, NOT a personal training session!

### ✅ **Solution: Use Correct Mode**

**Option 1: Use Team Mode** (Recommended for your current videos)
```bash
./venv/bin/python test_shot_detection.py input_videos/personal_video_1.mp4 --mode team
```

**Option 2: Get a True Personal Training Video**
- Record a video of ONE player practicing alone
- Solo shooting drills
- Individual skill work

---

## 📊 **What Each Mode Analyzes**

### Personal Mode Metrics:
- Individual shot success rate
- Personal shooting form consistency
- Movement patterns (speed, distance)
- Dribbling technique
- Joint angles (knees, elbows)
- Training load
- Personal improvement over time

### Team Mode Metrics:
- Team shooting percentages (Team 1 vs Team 2)
- Possession statistics
- Passing and interceptions
- Player positioning
- Team offensive/defensive efficiency
- Per-player statistics (when attributed)

---

## 🎬 **How to Create a Proper Personal Training Video**

### Setup:
1. **Single player** on court
2. **One camera** position (side or 45-degree angle works best)
3. **Visible hoop** in frame throughout
4. **Good lighting**

### Drills to Record:
- Free throw practice (10-20 shots)
- Spot shooting from different positions
- Layup drills
- Dribbling exercises
- Form shooting close to basket

### Video Length:
- **Minimum:** 30 seconds
- **Recommended:** 2-5 minutes
- **Maximum:** 10 minutes (for processing efficiency)

### Camera Tips:
- Keep camera stable (tripod recommended)
- Frame includes player and hoop
- Side angle or 45-degree angle ideal
- Avoid extreme close-ups or wide shots

---

## 🔧 **Testing Your Current Videos**

### Your Available Videos:
```
personal_video_1.mp4  (12MB) - ACTUALLY A TEAM VIDEO!
video_1.mp4           (4.3MB) - Team game
video_2.mp4           (6.7MB) - Team game
video_3.mp4           (9.1MB) - Team game
video_4.mp4           (6.6MB) - Team game
video_5.mp4           (28MB) - Team game
video_6.mp4           (12MB) - Team game
```

### Recommendation:
**All your videos appear to be team footage.** Use **team analysis mode** for accurate results:

```bash
# Test team analysis with proper mode
./venv/bin/python test_shot_detection.py input_videos/video_1.mp4 --mode team
```

---

## ✅ **After Fixing Mode Selection**

Once you use the correct mode, you should see:

### Team Mode Results:
```
TEAM 1 SHOOTING:
  Attempts: 15
  Made: 8
  Percentage: 53.3%

TEAM 2 SHOOTING:
  Attempts: 18
  Made: 10
  Percentage: 55.6%
```

### Personal Mode Results (with true personal video):
```
SHOOTING STATISTICS:
  Shot Attempts: 20
  Shots Made: 14
  Shots Missed: 6
  Success Rate: 70.0%
  
SHOT BREAKDOWN BY TYPE:
  LAYUP: 5/6 (83.3%)
  MID-RANGE: 6/10 (60.0%)
  THREE-POINTER: 3/4 (75.0%)
```

---

## 💡 **Summary**

1. **Your "personal_video_1.mp4" is mislabeled** - it's actually team footage
2. **Use `--mode team`** for all your current videos
3. **To test personal mode**, you need to record a true solo training video
4. **Shot detection now works properly** after the fixes applied

**Your system is working correctly - it was just being used with the wrong video type!** 🏀
