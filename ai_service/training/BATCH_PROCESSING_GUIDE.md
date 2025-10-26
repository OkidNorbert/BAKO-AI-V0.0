# 🎬 Batch Video Processing Guide

## Overview

Process multiple basketball videos simultaneously for YOLOv8 training dataset creation!

---

## 🚀 Quick Start

### **Process Multiple Videos from a Directory:**

```bash
# Process all videos in a directory
python training/batch_video_processing.py --input-dir /path/to/videos/ --strategy uniform --parallel

# Process specific videos
python training/batch_video_processing.py --videos video1.mp4 video2.mp4 video3.mp4 --strategy all

# Process videos in parallel with custom worker count
python training/batch_video_processing.py --input-dir videos/ --parallel --max-workers 4
```

---

## 📋 Usage Examples

### **1. Sequential Processing (One at a time)**

```bash
# Process 3 videos one after another
python training/batch_video_processing.py \
  --videos video1.mp4 video2.mp4 video3.mp4 \
  --strategy uniform \
  --interval 30
```

**Output:**
```
🎬 Processing 3 videos sequentially...
Processing video 1/3: video1.mp4
✅ Completed: video1 (150 frames)
Processing video 2/3: video2.mp4
✅ Completed: video2 (200 frames)
Processing video 3/3: video3.mp4
✅ Completed: video3 (180 frames)
📊 Total: 530 frames extracted
```

---

### **2. Parallel Processing (Simultaneous)**

```bash
# Process all videos at the same time
python training/batch_video_processing.py \
  --input-dir videos/ \
  --strategy all \
  --parallel \
  --max-workers 4
```

**Output:**
```
🎬 Processing 8 videos in parallel using 4 workers...
🎬 Processing: video1.mp4
🎬 Processing: video2.mp4
🎬 Processing: video3.mp4
🎬 Processing: video4.mp4
✅ Completed: video1 (150 frames)
✅ Completed: video2 (200 frames)
...
📊 Total: 1,200 frames extracted
```

**Benefits:**
- ✅ Faster processing (processes multiple videos at once)
- ✅ Better CPU utilization
- ✅ Progress tracking for each video

---

### **3. Directory-Based Processing**

```bash
# Process all videos in a directory
python training/batch_video_processing.py \
  --input-dir /path/to/basketball/videos/ \
  --strategy motion \
  --motion-threshold 0.15 \
  --parallel
```

**Automatic file discovery:**
- Finds all `.mp4`, `.avi`, `.mov`, `.mkv`, `.flv`, `.wmv` files
- Processes them in batch

---

### **4. Advanced: All Extraction Strategies**

```bash
# Extract using all strategies (uniform + temporal + motion + key_moments)
python training/batch_video_processing.py \
  --input-dir videos/ \
  --strategy all \
  --interval 30 \
  --num-frames 100 \
  --motion-threshold 0.1 \
  --parallel
```

**Result:** Maximum frame coverage from all videos

---

## ⚙️ Command-Line Options

### **Required (choose one):**
- `--videos VIDEO1 VIDEO2 ...` - Specify video files
- `--input-dir PATH` - Process all videos in directory

### **Processing Options:**
- `--strategy {uniform,temporal,motion,key_moments,all}` - Extraction strategy
- `--parallel` - Process videos simultaneously
- `--max-workers N` - Number of parallel workers (default: CPU count)

### **Frame Extraction Parameters:**
- `--interval N` - Extract every Nth frame (default: 30)
- `--num-frames N` - Total frames for temporal extraction (default: 100)
- `--motion-threshold FLOAT` - Motion detection threshold (default: 0.1)

### **Output Options:**
- `--output PATH` - Output directory (default: `training/datasets/basketball/batch_frames`)

---

## 📁 Output Structure

After processing, your files will be organized like this:

```
training/datasets/basketball/batch_frames/
├── video1/
│   ├── frame_000030.jpg
│   ├── frame_000060.jpg
│   └── ...
├── video2/
│   ├── temporal_0000_frame_000120.jpg
│   ├── temporal_0001_frame_000240.jpg
│   └── ...
├── video3/
│   ├── motion_0120_score_0.145.jpg
│   ├── motion_0240_score_0.168.jpg
│   └── ...
├── ../labels/
│   ├── video1/
│   │   ├── frame_000030.txt
│   │   └── ...
│   └── video3/
│       └── ...
└── batch_report.json
```

**Each video gets its own subdirectory!**

---

## 📊 Batch Processing Report

After processing, a detailed report is generated:

```json
{
  "batch_date": "2024-01-15T10:30:00",
  "total_videos": 5,
  "successful": 5,
  "failed": 0,
  "total_frames_extracted": 1250,
  "success_rate": 1.0,
  "video_results": [
    {
      "video": "video1",
      "status": "success",
      "frames_extracted": 250,
      "output_dir": "training/datasets/basketball/batch_frames/video1"
    },
    ...
  ]
}
```

---

## 🎯 Real-World Examples

### **Example 1: Process 10 basketball game videos**

```bash
python training/batch_video_processing.py \
  --input-dir ~/Videos/basketball_games/ \
  --strategy all \
  --parallel \
  --output training/datasets/basketball/game_frames
```

**Result:**
- Extracts frames from all 10 videos simultaneously
- Uses all extraction strategies for maximum coverage
- Saves to `game_frames` directory

---

### **Example 2: Quick frame extraction from training clips**

```bash
python training/batch_video_processing.py \
  --videos training_clip1.mp4 training_clip2.mp4 \
  --strategy uniform \
  --interval 15 \
  --parallel
```

**Result:**
- Every 15th frame extracted (more frequent sampling)
- Both videos processed simultaneously

---

### **Example 3: Motion-based extraction from highlight reels**

```bash
python training/batch_video_processing.py \
  --input-dir ~/Videos/highlights/ \
  --strategy motion \
  --motion-threshold 0.2 \
  --parallel \
  --max-workers 2
```

**Result:**
- Only frames with significant motion (>20% of frame)
- Perfect for highlight reels with lots of action

---

## 🔧 Processing Modes Comparison

| Mode | Speed | CPU Usage | Use Case |
|------|-------|-----------|----------|
| Sequential | Slower | Low | Small datasets, limited CPU |
| Parallel | Faster | High | Large datasets, multi-core CPU |

**Recommendation:** Use `--parallel` for 3+ videos

---

## 💡 Tips & Best Practices

### **1. For Best Results:**
```bash
# Use all strategies with parallel processing
python training/batch_video_processing.py \
  --input-dir videos/ \
  --strategy all \
  --parallel \
  --max-workers 4
```

### **2. For Speed:**
```bash
# Simple uniform extraction with parallel processing
python training/batch_video_processing.py \
  --input-dir videos/ \
  --strategy uniform \
  --interval 60 \
  --parallel
```

### **3. For Quality:**
```bash
# Motion-based extraction captures action-packed frames
python training/batch_video_processing.py \
  --input-dir videos/ \
  --strategy motion \
  --motion-threshold 0.1 \
  --parallel
```

---

## ⚡ Performance Guide

### **CPU Recommendations:**

| Videos | Workers | Estimated Time |
|--------|---------|----------------|
| 1-3 videos | 1-2 | 10-15 min |
| 4-8 videos | 2-4 | 15-30 min |
| 9+ videos | 4-8 | 30-60 min |

### **Memory Requirements:**
- ~500MB per video being processed simultaneously
- 4GB RAM recommended for 4 parallel workers
- 8GB+ RAM for 8+ parallel workers

---

## 🐛 Troubleshooting

### **Issue: "Out of memory" error**
```bash
# Solution: Reduce parallel workers
python training/batch_video_processing.py \
  --input-dir videos/ \
  --strategy uniform \
  --parallel \
  --max-workers 2  # Use fewer workers
```

### **Issue: Processing too slow**
```bash
# Solution: Use faster extraction strategy
python training/batch_video_processing.py \
  --input-dir videos/ \
  --strategy uniform \
  --interval 60 \  # Extract fewer frames
  --parallel
```

### **Issue: Not processing some videos**
```bash
# Solution: Check video file formats
# Supported: .mp4, .avi, .mov, .mkv, .flv, .wmv
```

---

## 📝 Next Steps After Processing

1. **Review Extracted Frames:**
   ```bash
   ls training/datasets/basketball/batch_frames/video1/
   ```

2. **Annotate Frames:**
   ```bash
   labelImg training/datasets/basketball/batch_frames/video1/images \
            training/datasets/basketball/batch_frames/video1/labels
   ```

3. **Organize into Training Dataset:**
   - Combine frames from all videos
   - Split into train/val/test sets
   - Update `basketball_dataset.yaml`

4. **Start Training:**
   ```bash
   python training/train_basketball_yolo.py
   ```

---

## 🎉 Success Indicators

**Good batch processing results:**
- ✅ 100-500 frames per video
- ✅ No failed videos in batch_report.json
- ✅ Output directories created for each video
- ✅ Annotation templates generated

**Expected output after processing 5 videos:**
```
🎬 Batch Video Processing Summary
============================================================
📹 Total Videos: 5
✅ Successful: 5
❌ Failed: 0
📊 Total Frames Extracted: 1,250
📈 Success Rate: 100.0%
```

---

**Happy Batch Processing! 🎬🏀**

