# Basketball Analysis System - Testing Guide

## 🎯 Quick Start

Your system is now ready to test with the pre-trained models from the basketball_analysis repository!

### ✅ What's Already Set Up

1. **Models Downloaded** ✓
   - `player_detector.pt` (172.6 MB)
   - `ball_detector_model.pt` (172.7 MB)
   - `court_keypoint_detector.pt` (417.7 MB)

2. **System Structure** ✓
   - All trackers, drawers, and detectors are in place
   - Configuration files are set up
   - Sample videos available in `input_videos/`

3. **Dependencies** ✓
   - All required packages listed in `requirements.txt`

---

## 🚀 Testing the System

### Option 1: Automated Test Script (Recommended)

```bash
# 1. Check system setup (no analysis)
python test_system.py --check-only

# 2. Run full test with first available video
python test_system.py

# 3. Test with specific video
python test_system.py --video input_videos/video_1.mp4

# 4. Test with custom output path
python test_system.py --video input_videos/video_1.mp4 --output output_videos/my_analysis.avi
```

### Option 2: Direct Analysis with main.py

```bash
# Basic usage
python main.py input_videos/video_1.mp4

# With custom output
python main.py input_videos/video_1.mp4 --output_video output_videos/analyzed_video.avi

# With custom stub path (for caching intermediate results)
python main.py input_videos/video_1.mp4 --stub_path my_stubs
```

---

## 📁 Directory Structure

```
back-end/
├── models/                          # ✓ Pre-trained models
│   ├── player_detector.pt
│   ├── ball_detector_model.pt
│   └── court_keypoint_detector.pt
├── input_videos/                    # Place your test videos here
│   ├── video_1.mp4
│   ├── video_2.mp4
│   └── video_3.mp4
├── output_videos/                   # Analysis results will be saved here
├── stubs/                          # Cached intermediate results (auto-created)
├── images/                         # Court reference images
│   └── basketball_court.png
├── main.py                         # Main analysis pipeline
├── test_system.py                  # System testing script
└── requirements.txt                # Python dependencies
```

---

## 🎬 What the Analysis Does

The system performs comprehensive basketball video analysis:

1. **Player Detection & Tracking** - Identifies and tracks all players
2. **Ball Detection & Tracking** - Tracks the basketball with interpolation
3. **Court Keypoint Detection** - Identifies court lines and zones
4. **Team Assignment** - Classifies players by jersey color
5. **Ball Possession** - Determines which player has the ball
6. **Pass Detection** - Identifies passes between players
7. **Interception Detection** - Detects when passes are intercepted
8. **Tactical View** - Creates top-down tactical visualization
9. **Speed & Distance** - Calculates player movement metrics

### Output Features

The analyzed video includes:
- Player bounding boxes with team colors
- Ball tracking visualization
- Court keypoint overlays
- Team ball control statistics
- Pass and interception markers
- Tactical view (mini-map)
- Player speed and distance metrics
- Frame numbers

---

## 🔧 System Requirements

### Minimum Requirements
- Python 3.8+
- 8GB RAM
- CPU: Multi-core processor
- Storage: 2GB free space

### Recommended for Better Performance
- Python 3.10+
- 16GB+ RAM
- GPU: NVIDIA GPU with CUDA support
- Storage: 5GB+ free space

---

## 📊 Performance Expectations

### Processing Time (approximate)
- **CPU Only**: 5-15 minutes per minute of video
- **With GPU**: 1-3 minutes per minute of video

### First Run vs. Subsequent Runs
- **First Run**: Slower (no cached stubs)
- **Subsequent Runs**: Much faster (uses cached stubs)

The system uses "stubs" (cached intermediate results) to speed up repeated processing:
- `player_track_stubs.pkl` - Cached player detections
- `ball_track_stubs.pkl` - Cached ball detections
- `court_key_points_stub.pkl` - Cached court keypoints
- `player_assignment_stub.pkl` - Cached team assignments

To force fresh analysis, delete the `stubs/` directory.

---

## 🎥 Adding Your Own Test Videos

1. Place basketball video files in `input_videos/`
2. Supported formats: `.mp4`, `.avi`
3. Recommended: 
   - Resolution: 720p or 1080p
   - Frame rate: 30fps or higher
   - Clear view of the court
   - Good lighting conditions

### Good Test Videos Should Have:
✓ Clear view of basketball court
✓ Multiple players visible
✓ Ball clearly visible
✓ Court lines visible
✓ Stable camera angle (not too much movement)

---

## 🐛 Troubleshooting

### Issue: "Module not found" errors
**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: CUDA out of memory
**Solution**: Process smaller videos or use CPU
```bash
# The system will automatically fall back to CPU if GPU is unavailable
```

### Issue: Analysis is very slow
**Solutions**:
1. Use GPU if available
2. Process shorter video clips first
3. Reduce video resolution before processing
4. Use stub caching (enabled by default)

### Issue: Poor detection quality
**Possible causes**:
- Low video quality
- Poor lighting
- Obstructed view of court
- Non-standard camera angle

**Solutions**:
- Use higher quality source videos
- Ensure good lighting in videos
- Use videos with clear court view

### Issue: Output video not created
**Check**:
1. Disk space available
2. Write permissions for `output_videos/`
3. Check console for error messages

---

## 📈 Next Steps After Testing

Once you've verified the system works:

1. **Integrate with FastAPI Backend**
   - Add video upload endpoints
   - Process videos asynchronously
   - Store results in Supabase

2. **Optimize Performance**
   - Implement video preprocessing
   - Add progress tracking
   - Optimize for real-time processing

3. **Enhance Analysis**
   - Add shot detection
   - Implement player performance metrics
   - Add game statistics

4. **Frontend Integration**
   - Display analysis results
   - Show tactical view
   - Present player statistics

---

## 🔍 Verification Checklist

Before running analysis on your own videos:

- [ ] All dependencies installed (`test_system.py --check-only`)
- [ ] All models present and loading correctly
- [ ] Test video successfully analyzed
- [ ] Output video created and viewable
- [ ] All analysis features working (players, ball, court, etc.)
- [ ] Stub caching working (second run faster)

---

## 💡 Tips for Best Results

1. **Start Small**: Test with short clips (10-30 seconds) first
2. **Use Stubs**: Keep the stub cache for faster iterations
3. **Monitor Resources**: Watch CPU/GPU usage and memory
4. **Check Output**: Verify each analysis component in the output video
5. **Iterate**: Adjust video quality and length based on results

---

## 📞 Support

If you encounter issues:
1. Check error messages in console
2. Verify all dependencies are installed
3. Ensure models are correctly placed
4. Test with provided sample videos first
5. Check system resources (RAM, disk space)

---

## 🎉 Success Indicators

Your system is working correctly if:
✅ Test script completes without errors
✅ Output video is created
✅ Players are detected and tracked
✅ Ball is tracked with smooth interpolation
✅ Court keypoints are detected
✅ Teams are correctly assigned
✅ Tactical view is displayed
✅ Speed/distance metrics are shown

---

**Ready to test? Run:**
```bash
python test_system.py --check-only
```

Then when ready to analyze:
```bash
python test_system.py
```

Good luck! 🏀
