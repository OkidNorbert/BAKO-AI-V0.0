# Basketball Analysis System - Quick Reference

## 🚀 Quick Start Commands

### Using the convenience script (Recommended):

```bash
# Check if system is ready
./run.sh --check

# Run analysis on a video
./run.sh input_videos/video_1.mp4

# Run full system test
./run.sh --test
```

### Using Python directly:

```bash
# Activate virtual environment first
source venv/bin/activate

# Check system
python test_system.py --check-only

# Analyze a video
python main.py input_videos/video_1.mp4

# With custom output
python main.py input_videos/video_1.mp4 --output_video output_videos/my_output.avi
```

---

## 📋 System Status

### ✅ Models Ready
All three pre-trained models from the basketball_analysis repository are installed:
- `player_detector.pt` - YOLO v11 player detection
- `ball_detector_model.pt` - YOLO v5 ball detection with motion blur handling
- `court_keypoint_detector.pt` - YOLO v8 court keypoint detection

### 📁 Directory Structure
```
back-end/
├── models/              # Pre-trained YOLO models ✓
├── input_videos/        # Place test videos here
├── output_videos/       # Analysis results saved here
├── stubs/              # Cached intermediate results (auto-created)
├── main.py             # Main analysis pipeline
├── test_system.py      # System testing script
├── run.sh              # Convenience script
└── TESTING_GUIDE.md    # Detailed testing guide
```

---

## 🎯 What Gets Analyzed

The system performs comprehensive basketball video analysis:

1. **Player Detection & Tracking** - Detects and tracks all players across frames
2. **Ball Detection & Tracking** - Tracks basketball with interpolation for smooth trajectories
3. **Court Keypoint Detection** - Identifies court lines, corners, and key zones
4. **Team Assignment** - Classifies players by jersey color using zero-shot classification
5. **Ball Possession** - Determines which player has the ball at each moment
6. **Pass Detection** - Identifies passes between players
7. **Interception Detection** - Detects when passes are intercepted
8. **Tactical View** - Creates top-down tactical visualization (mini-map)
9. **Speed & Distance Calculation** - Calculates player movement metrics

---

## 📊 Output Features

The analyzed video includes overlays for:
- ✓ Player bounding boxes (color-coded by team)
- ✓ Ball tracking visualization
- ✓ Court keypoint markers
- ✓ Team ball control statistics
- ✓ Pass and interception indicators
- ✓ Tactical view (top-down mini-map)
- ✓ Player speed and distance metrics
- ✓ Frame numbers

---

## ⚡ Performance Tips

### Speed Optimization
1. **Use GPU** - System automatically uses CUDA if available
2. **Use Stubs** - Cached results make re-runs much faster
3. **Start Small** - Test with short clips (10-30 seconds) first
4. **Resolution** - Lower resolution videos process faster

### Expected Processing Times
- **With GPU**: ~1-3 minutes per minute of video
- **CPU Only**: ~5-15 minutes per minute of video
- **First Run**: Slower (no cached stubs)
- **Subsequent Runs**: Much faster (uses cached stubs)

---

## 🎥 Video Requirements

### Recommended Video Characteristics
- **Format**: MP4 or AVI
- **Resolution**: 720p or 1080p
- **Frame Rate**: 30fps or higher
- **Content**: Clear view of basketball court
- **Lighting**: Good lighting conditions
- **Camera**: Stable camera angle (minimal movement)

### What Makes a Good Test Video
✓ Clear court view
✓ Multiple players visible
✓ Ball clearly visible
✓ Court lines visible
✓ Stable camera position

---

## 🔧 Troubleshooting

### Dependencies Not Installed
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### CUDA Out of Memory
The system will automatically fall back to CPU if GPU memory is insufficient.

### Slow Processing
- Use GPU if available
- Process shorter clips
- Enable stub caching (default)
- Reduce video resolution

### Poor Detection Quality
- Use higher quality videos
- Ensure good lighting
- Use clear court views
- Avoid extreme camera angles

---

## 📖 Documentation

- **TESTING_GUIDE.md** - Comprehensive testing guide with detailed instructions
- **test_system.py** - Automated system testing and validation
- **main.py** - Main analysis pipeline (see code for details)

---

## 🎬 Example Workflow

### First Time Setup
```bash
# 1. Check system is ready
./run.sh --check

# 2. Run test with sample video
./run.sh --test
```

### Analyzing Your Own Videos
```bash
# 1. Add your video to input_videos/
cp /path/to/your/video.mp4 input_videos/

# 2. Run analysis
./run.sh input_videos/your_video.mp4

# 3. Check output
ls -lh output_videos/analyzed_your_video.avi
```

### Iterating on Analysis
```bash
# First run (slower - creates stubs)
./run.sh input_videos/video_1.mp4

# Subsequent runs (faster - uses stubs)
./run.sh input_videos/video_1.mp4

# Force fresh analysis (delete stubs)
rm -rf stubs/
./run.sh input_videos/video_1.mp4
```

---

## 🔍 Verification Checklist

Before deploying or integrating:

- [ ] System check passes (`./run.sh --check`)
- [ ] Models load successfully
- [ ] Test video analyzes successfully
- [ ] Output video is created and viewable
- [ ] All analysis features visible in output:
  - [ ] Player detection
  - [ ] Ball tracking
  - [ ] Court keypoints
  - [ ] Team assignment
  - [ ] Ball possession
  - [ ] Passes/interceptions
  - [ ] Tactical view
  - [ ] Speed/distance metrics
- [ ] Stub caching works (second run faster)

---

## 📞 Need Help?

1. Check **TESTING_GUIDE.md** for detailed troubleshooting
2. Run `./run.sh --check` to diagnose issues
3. Verify all dependencies: `source venv/bin/activate && pip list`
4. Check error messages in console output
5. Test with provided sample videos first

---

**System Ready! 🏀**

Start with: `./run.sh --check`
