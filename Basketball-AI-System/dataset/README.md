# 🏀 Basketball Dataset Directory

This directory stores the video dataset and extracted pose data for the 🏀 **AI Shooting Analysis System**.

---

## 📂 Directory Structure

```
dataset/
├── raw_videos/           # 🎥 YOUR VIDEOS (Upload here)
│   ├── jump_shots/       # 150 videos (Mid-range, 3pts, Pull-ups)
│   ├── layups/           # 100 videos (Left & Right hand)
│   └── free_throws/      # 50 videos (15ft stationary)
│
├── keypoints/            # 🤖 AI-GENERATED DATA (Don't touch)
│   └── {category}/*.npz  # Extracted pose keypoints
│
├── legacy_data/          # 📦 ARCHIVED (Old non-shooting data)
└── README.md             # This file
```

---

## 📹 Recording Standards

To ensure the AI analyzes your form correctly, follow these rules for every video:

| Requirement | Specification |
|-------------|---------------|
| **Duration** | 5 - 10 seconds |
| **Orientation** | **Horizontal (Landscape)** 📱↔️ |
| **Resolution** | 1080p (Preferred) or 720p |
| **FPS** | 30 FPS or higher |
| **Framing** | **Full body visible** (Head to Shoes) |
| **Stability** | Use a **Tripod** (Essential!) |

---

## 📊 Dataset Targets (Total: 300)

| Category | Sub-Category | Target |
|----------|--------------|--------|
| **Jump Shots** | Mid-range, 3-Points, Pull-ups | **150** |
| **Layups** | Left-hand, Right-hand | **100** |
| **Free Throws**| Standard 15ft shots | **50** |

---

## 🚀 Recording Workflow

1.  **Record**: Capture your shot according to the standards above.
2.  **Rename**: Use a clear format: `shoot_made_01.mp4` or `layup_miss_05.mp4`.
3.  **Upload**: Move the video into the correct folder inside `dataset/raw_videos/`.
4.  **Validate**: Run `python3 validate_videos.py dataset/raw_videos/` to check quality.
5.  **Sanity Check**: Run `python3 sanity_check.py <path_to_video>` for real AI feedback.

---

## 🚨 What to Avoid
❌ **Vertical videos** (Data will be corrupted).
❌ **Partial body** (Cutting off feet or head causes pose errors).
❌ **Bad lighting** (AI cannot see your joints in the dark).
❌ **Multiple players** (The system might track the wrong person).

---

**START RECORDING! Your shooting analysis system is ready for the data.** 🏀🔥
