# 🧪 Testing Guide - Enhanced Coaching Pipeline

## 🚀 Services Running

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## ✅ What to Test

### 1. Real-Time Action Detection
**What to Look For**:
- Action labels appear on video frames during analysis
- Labels show: "Dribbling (85%)", "Shooting (92%)", etc.
- Color-coded by action type (red=shooting, green=dribbling, blue=passing)

**How to Test**:
1. Upload a video with multiple actions (dribbling → shooting → passing)
2. Watch the real-time visualization
3. Verify action labels appear on each frame
4. Check that labels update as actions change

---

### 2. Form Quality Indicators
**What to Look For**:
- Form quality badges: "✓ Excellent Form", "⚠ Needs Improvement", "✗ Poor Form"
- Top issue displayed: "Fix: Elbow Angle"
- Issues update in real-time

**How to Test**:
1. Upload a shooting video
2. Check top-left corner for form quality indicator
3. Verify specific issues are shown (e.g., "Fix: Elbow Alignment")
4. Check that issues match the action being performed

---

### 3. Enhanced Biomechanics Features
**What to Look For**:
- More detailed metrics in the results
- Joint angles (elbow, knee, shoulder)
- Release timing and angle
- Jump height calculation
- Movement speed and smoothness

**How to Test**:
1. Upload a video
2. After analysis, check the metrics section
3. Look for new metrics like:
   - `elbow_angle`
   - `release_angle`
   - `jump_height`
   - `smoothness_score`
   - `stability_score`

---

### 4. Rule-Based Form Evaluation
**What to Look For**:
- Specific form issues with measured values
- Actionable drill recommendations
- Severity levels (minor, moderate, major)

**How to Test**:
1. Upload a shooting video with poor form
2. Check recommendations section
3. Look for specific issues like:
   - "Elbow flaring by 15.3° (target: < 12°)"
   - "Low shooting arc (apex: 2.1m, target: 3+m)"
4. Verify drill recommendations are provided

---

### 5. Action-Specific Recommendations
**What to Look For**:
- Recommendations tailored to the action
- Shooting: Elbow alignment, arc, release timing
- Dribbling: Head position, ball control, body posture
- Passing: Arm extension, wrist snap

**How to Test**:
1. Upload different action types:
   - Shooting video → Check for shooting-specific feedback
   - Dribbling video → Check for dribbling-specific feedback
   - Passing video → Check for passing-specific feedback
2. Verify recommendations match the action type

---

### 6. Multiple Actions in Timeline
**What to Look For**:
- Timeline shows all actions in the video
- Each segment has its own form quality assessment
- Segments are properly merged (no duplicate adjacent segments)

**How to Test**:
1. Upload a training video with multiple actions
2. Check the timeline/results section
3. Verify:
   - Multiple segments are shown
   - Each segment has correct start/end times
   - Form quality is assessed per segment
   - No duplicate adjacent segments

---

## 🔍 Testing Checklist

### Backend API Tests
- [ ] Health check: `GET /api/health`
- [ ] Video upload: `POST /api/analyze`
- [ ] WebSocket connection: `ws://localhost:8000/ws/video-stream/{video_id}`
- [ ] Real-time frame streaming works

### Frontend Tests
- [ ] Video upload interface loads
- [ ] Real-time visualization displays
- [ ] Action labels appear on frames
- [ ] Form quality indicators show
- [ ] Results page displays metrics
- [ ] Recommendations are shown

### Feature Tests
- [ ] Action segmentation works (multiple actions detected)
- [ ] Pose normalization reduces jitter
- [ ] Biomechanics features are computed
- [ ] Rule-based checks identify form issues
- [ ] Recommendations are action-specific
- [ ] Timeline shows all segments

---

## 🐛 Common Issues & Solutions

### Issue: Backend not starting
**Solution**:
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: Import errors
**Solution**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Frontend not connecting to backend
**Solution**:
- Check `VITE_API_URL` in frontend `.env`
- Should be: `VITE_API_URL=http://localhost:8000`

### Issue: No action labels on video
**Solution**:
- Check WebSocket connection in browser console
- Verify video has detectable poses
- Check backend logs for errors

---

## 📊 Expected Output Examples

### Shooting Video Analysis
```json
{
  "action": {
    "label": "two_point_shot",
    "confidence": 0.88
  },
  "form_quality": {
    "overall_score": 0.65,
    "quality_rating": "needs_improvement",
    "issues": [
      {
        "issue_type": "elbow_alignment",
        "severity": "moderate",
        "description": "Elbow flaring by 15.3° (target: < 12°)",
        "current_value": 15.3,
        "optimal_value": "< 12°",
        "recommendation": "Wall elbow drill: Stand 1 foot from wall..."
      }
    ]
  },
  "recommendations": [
    {
      "type": "improvement",
      "title": "Fix Elbow Alignment",
      "message": "Elbow flaring by 15.3° (target: < 12°)...",
      "priority": "high"
    }
  ]
}
```

---

## 🎯 Test Videos

### Recommended Test Videos
1. **Shooting Video**: Single player shooting (free throw or jump shot)
2. **Dribbling Video**: Player dribbling with various moves
3. **Mixed Actions**: Video with dribbling → shooting → passing
4. **Poor Form**: Video with obvious form issues (for testing rule-based checks)

### What Makes a Good Test Video
- Clear view of player (full body visible)
- Good lighting
- Stable camera (minimal shake)
- Player performing clear actions
- 10-30 seconds duration

---

## 📝 Testing Log

**Date**: [Current Date]
**Tester**: [Your Name]

### Test Results
- [ ] Real-time action detection: ✅ / ❌
- [ ] Form quality indicators: ✅ / ❌
- [ ] Biomechanics features: ✅ / ❌
- [ ] Rule-based evaluation: ✅ / ❌
- [ ] Action-specific recommendations: ✅ / ❌
- [ ] Timeline segmentation: ✅ / ❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]

---

**Happy Testing!** 🏀

