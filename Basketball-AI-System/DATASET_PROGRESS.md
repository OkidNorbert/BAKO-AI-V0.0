# 📊 Dataset Progress Tracker

**Last Updated:** January 9, 2026  
**Target:** 300 videos  
**Status:** Ready for recording

---

## 📹 Recording Progress

### Jump Shots (150 total)

#### Mid-Range (50 videos)
- [ ] Day 1: 0/25 recorded
- [ ] Day 2: 0/25 recorded
- **Total: 0/50** ✅ Directory ready

#### Three-Point (50 videos)
- [ ] Day 3: 0/25 recorded
- [ ] Day 4: 0/25 recorded
- **Total: 0/50** ✅ Directory ready

#### Pull-Up (50 videos)
- [ ] Day 5: 0/25 recorded
- [ ] Day 6: 0/25 recorded
- **Total: 0/50** ✅ Directory ready

### Layups (100 total)

#### Right-Hand (50 videos)
- [ ] Day 7: 0/50 recorded
- **Total: 0/50** ✅ Directory ready

#### Left-Hand (50 videos)
- [ ] Day 8: 0/50 recorded
- **Total: 0/50** ✅ Directory ready

### Free Throws (50 total)
- [ ] Day 9: 0/25 recorded
- [ ] Day 10: 0/25 recorded
- **Total: 0/50** ✅ Directory ready

---

## 📈 Overall Progress

**Total Videos: 0/300 (0%)**

```
Progress: [                                        ] 0%
```

**By Category:**
- Jump Shots: 0/150 (0%)
- Layups: 0/100 (0%)
- Free Throws: 0/50 (0%)

---

## ✅ Quick Check Commands

### Count Videos
```bash
cd /home/okidi6/Documents/Final-Year-Project/Basketball-AI-System

# Count all videos
find dataset/raw_videos/ -name "*.mp4" -o -name "*.mov" -o -name "*.avi" | wc -l

# Count by category
echo "Mid-Range: $(find dataset/raw_videos/jump_shots/mid_range/ -type f | wc -l)/50"
echo "Three-Point: $(find dataset/raw_videos/jump_shots/three_point/ -type f | wc -l)/50"
echo "Pull-Up: $(find dataset/raw_videos/jump_shots/pull_up/ -type f | wc -l)/50"
echo "Right Layups: $(find dataset/raw_videos/layups/right_hand/ -type f | wc -l)/50"
echo "Left Layups: $(find dataset/raw_videos/layups/left_hand/ -type f | wc -l)/50"
echo "Free Throws: $(find dataset/raw_videos/free_throws/ -type f | wc -l)/50"
```

### Validate Videos
```bash
# Validate all videos
python validate_videos.py dataset/raw_videos/

# Validate specific category
python validate_videos.py dataset/raw_videos/jump_shots/mid_range/
```

---

## 📝 Daily Log

### Day 1 - [Date]
- **Category:** 
- **Videos Recorded:** 
- **Made/Missed:** 
- **Quality Issues:** 
- **Notes:** 

### Day 2 - [Date]
- **Category:** 
- **Videos Recorded:** 
- **Made/Missed:** 
- **Quality Issues:** 
- **Notes:** 

---

## 🎯 Next Milestone

**Current:** Start recording  
**Next:** Complete 50 mid-range jump shots  
**Then:** Continue with three-point shots

---

**Update this file after each recording session!**
