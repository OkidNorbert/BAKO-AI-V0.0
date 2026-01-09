# 🏀 Shooting Categories Guide

**Detailed Basketball Shot Classification Based on Court Position**

Date: November 19, 2025

---

## 🎯 Why Separate Shooting Types?

### **The Problem:**
Different shots have different:
- Body mechanics
- Shooting angles
- Distance from hoop
- Difficulty levels

### **The Solution:**
**7 Action Categories** (instead of 5):
1. 🎯 Free Throw Shot
2. 🏀 2-Point Shot
3. 🚀 3-Point Shot
4. ⚽ Dribbling
5. 🤝 Passing
6. 🛡️ Defense
7. 🧍 Idle/Standing

### **Benefits:**
- ✅ More accurate AI classification
- ✅ Shot-specific form analysis
- ✅ Better performance metrics
- ✅ Position-based recommendations

---

## 📍 SHOOTING CATEGORIES EXPLAINED

### 1️⃣ Free Throw Shot (`free_throw_shot/`)

**What:**
- Shot taken from the free throw line
- 15 feet from basket
- No defenders, stationary

**When to Use:**
- Free throw practice
- Penalty shots
- Standing at free throw line

**Body Mechanics:**
- Bent knees
- Straight back
- High elbow (90°)
- Smooth release
- Follow-through

**Examples:**
```
free_throw_shot/
├── free_throw_player1_001.mp4  (player at line, shooting)
├── free_throw_player2_001.mp4  (practice free throw)
└── free_throw_team1_045.mp4    (game situation)
```

**Recording Tips:**
- Camera: Side view (45° angle)
- Show free throw line in frame
- Full body from head to toe
- Clear view of shooting form

---

### 2️⃣ 2-Point Shot (`2point_shot/`)

**What:**
- Shot taken INSIDE the 3-point line
- Includes: layups, mid-range jumpers, close shots
- 2-20 feet from basket

**When to Use:**
- Layups
- Mid-range jump shots
- Close-range shots
- Inside the key/paint

**Body Mechanics:**
- Jump height varies
- Closer shots = less arc
- More dynamic movement
- Release angle 40-50°

**Examples:**
```
2point_shot/
├── layup_player1_001.mp4        (close to basket)
├── midrange_player2_015.mp4     (15 feet out)
├── floater_player3_032.mp4      (in the paint)
└── elbow_jumper_player1_048.mp4 (from elbow area)
```

**Recording Tips:**
- Show court markings (helps AI)
- Film from court level
- Include basket in frame if possible
- Capture jump and release

---

### 3️⃣ 3-Point Shot (`3point_shot/`)

**What:**
- Shot taken OUTSIDE the 3-point line
- 22+ feet from basket (NBA: 23.75 ft)
- Long-range shooting

**When to Use:**
- Behind the arc
- Corner 3s
- Top of the key 3s
- Long-range shots

**Body Mechanics:**
- Higher arc (50-55°)
- More leg power
- Higher elbow
- Full body engagement
- Strong follow-through

**Examples:**
```
3point_shot/
├── corner_three_player1_001.mp4  (corner 3)
├── top_key_player2_018.mp4       (top of arc)
├── wing_three_player3_035.mp4    (wing position)
└── deep_three_player1_052.mp4    (well behind line)
```

**Recording Tips:**
- MUST show 3-point line in frame!
- This helps AI understand context
- Wider camera angle
- Show player's feet position
- Include arc/trajectory if possible

---

## 📐 COURT POSITION REFERENCE

```
Basketball Court (Half Court View)

                    BASKET
                      🏀
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    │   2-POINT AREA  │                 │
    │   ╔═════════════╗                 │
    │   ║   PAINT     ║                 │
    │   ║             ║                 │
    │   ║      X ← FREE THROW LINE      │
    │   ║   (15 ft)   ║                 │
    │   ╚═════════════╝                 │
    │                 │                 │
    │  2PT  │  2PT    │    2PT  │  2PT  │
    │       │         │         │       │
    └───────┴─────────┴─────────┴───────┘  ← 3-POINT LINE
          │           │           │
         3PT         3PT         3PT
      (corner)    (top key)   (corner)
      (22 ft)     (23.75 ft)   (22 ft)


LEGEND:
🎯 Free Throw = At "X" (15 ft)
🏀 2-Point = Inside arc
🚀 3-Point = Outside arc
```

---

## 🎬 RECORDING GUIDELINES BY SHOT TYPE

### Free Throw Shots (Target: 100 videos)

**Setup:**
- Player at free throw line
- No defenders
- Stationary shot

**Camera Position:**
- Side view (45° angle)
- 10-15 feet away
- Chest height

**What to Capture:**
- Pre-shot routine (dribbles, breathing)
- Shot execution
- Follow-through
- Ball trajectory (if possible)

**Variations:**
- Different players
- Different hand positions
- Different pre-shot routines
- Practice vs game scenario

---

### 2-Point Shots (Target: 100 videos)

**Shot Types to Include:**
- Layups (20+ videos)
- Mid-range jumpers (30+ videos)
- Floaters (20+ videos)
- Close-range shots (30+ videos)

**Camera Position:**
- Court level
- 10-20 feet away
- Slightly side view

**What to Capture:**
- Approach to basket (for layups)
- Jump height
- Release point
- Full body motion

**Variations:**
- Different distances (2-20 feet)
- Different angles (baseline, elbow, top key)
- Off dribble vs catch-and-shoot
- Left hand vs right hand

---

### 3-Point Shots (Target: 100 videos)

**Shot Positions:**
- Corner 3s (30+ videos)
- Wing 3s (30+ videos)
- Top of key (30+ videos)
- Deep 3s (10+ videos)

**Camera Position:**
- Wider angle (capture 3-point line!)
- 15-20 feet away
- Show player's feet and line

**What to Capture:**
- Player behind 3-point line (IMPORTANT!)
- Jump and release
- Arc of shot
- Follow-through
- Landing

**Variations:**
- Catch-and-shoot
- Off dribble
- Pull-up 3s
- Spot-up 3s

---

## 📊 UPDATED DATASET REQUIREMENTS

### **New Target:** 700 Videos Total

| Category | Target | Purpose |
|----------|--------|---------|
| **Free Throw Shot** | 100 | Stationary, controlled shooting |
| **2-Point Shot** | 100 | Inside arc, varied distances |
| **3-Point Shot** | 100 | Outside arc, long range |
| **Dribbling** | 100 | Ball handling, movement |
| **Passing** | 100 | Ball distribution |
| **Defense** | 100 | Defensive movements |
| **Idle/Standing** | 100 | Rest position, baseline |
| **TOTAL** | **700** | Balanced dataset |

---

## 🎯 RECORDING STRATEGY

### **Week 1: Shooting Focus (300 videos)**
```
Day 1-2: Free Throw Shots (100 videos)
├─ 50 videos/day
├─ Various players
└─ Different routines

Day 3-4: 2-Point Shots (100 videos)
├─ Layups (25)
├─ Mid-range (40)
├─ Floaters (20)
└─ Close shots (15)

Day 5-7: 3-Point Shots (100 videos)
├─ Corner 3s (35)
├─ Wing 3s (35)
├─ Top key (25)
└─ Deep 3s (5)
```

### **Week 2: Other Actions (400 videos)**
```
Day 8-9: Dribbling (100 videos)
Day 10-11: Passing (100 videos)
Day 12-13: Defense (100 videos)
Day 14: Idle (100 videos)
```

---

## 📂 FOLDER STRUCTURE

```
Basketball-AI-System/dataset/raw_videos/
│
├── free_throw_shot/          # 100 videos
│   ├── free_throw_player1_001.mp4
│   ├── free_throw_player1_002.mp4
│   └── ... (98 more)
│
├── 2point_shot/              # 100 videos
│   ├── layup_player1_001.mp4
│   ├── midrange_player2_015.mp4
│   ├── floater_player3_032.mp4
│   └── ... (97 more)
│
├── 3point_shot/              # 100 videos
│   ├── corner3_player1_001.mp4
│   ├── wing3_player2_018.mp4
│   ├── topkey3_player3_035.mp4
│   └── ... (97 more)
│
├── dribbling/                # 100 videos
│   ├── crossover_player1_001.mp4
│   └── ... (99 more)
│
├── passing/                  # 100 videos
│   ├── chest_pass_player1_001.mp4
│   └── ... (99 more)
│
├── defense/                  # 100 videos
│   ├── defensive_stance_player1_001.mp4
│   └── ... (99 more)
│
└── idle/                     # 100 videos
    ├── standing_player1_001.mp4
    └── ... (99 more)
```

---

## 🎯 NAMING CONVENTION

### **Recommended Format:**
```
{shot_type}_{player}_{number}.mp4
```

### **Examples:**

**Free Throws:**
- `free_throw_john_001.mp4`
- `free_throw_mary_045.mp4`
- `free_throw_team1_089.mp4`

**2-Point Shots:**
- `layup_john_001.mp4`
- `midrange_mary_025.mp4`
- `floater_team2_048.mp4`
- `closeshot_player3_072.mp4`

**3-Point Shots:**
- `corner3_john_001.mp4`
- `wing3_mary_024.mp4`
- `topkey3_team1_048.mp4`
- `deep3_player2_089.mp4`

---

## 🎬 COURT POSITION CHEAT SHEET

### **Where to Stand for Each Shot:**

**Free Throw:**
```
Stand at: Free throw line (15 ft from basket)
Look for: Free throw line marking on court
Position: Center, facing basket
```

**2-Point (Layup):**
```
Stand at: 2-5 feet from basket
Look for: Inside the paint/key area
Position: Approaching basket, any angle
```

**2-Point (Mid-range):**
```
Stand at: 10-18 feet from basket
Look for: Inside 3-point line, outside paint
Position: Elbow, baseline, or wing
```

**3-Point (Corner):**
```
Stand at: Corner, behind 3-point line
Look for: Corner 3-point line (22 ft)
Position: Baseline corner
```

**3-Point (Wing/Top):**
```
Stand at: Behind arc, wing or top
Look for: 3-point line at wing/top (23.75 ft)
Position: 45° or top of key
```

---

## 🎨 VISUAL RECORDING GUIDE

### **Free Throw Recording:**
```
Camera Position:        Player View:
                       
    [📱]               🧍 ← Player
     ↓                  ║
   (Side view         ═╬═ ← Free throw line
    45° angle)          ║
                       🏀 ← Basket (15 ft)
```

### **2-Point Recording:**
```
Camera Position:        Player View:
                       
    [📱]               🧍 ← Player (inside arc)
     ↓                  │
   (Court level)       ─┴─ ← 3-point line
                        │
                       🏀 ← Basket (5-18 ft)
```

### **3-Point Recording:**
```
Camera Position:        Player View:
                       
    [📱]                  🧍 ← Player (outside arc)
     ↓                     │
   (Wider angle)      ════╬════ ← 3-point line
   (Show line!)            │
                          🏀 ← Basket (22-24 ft)
```

---

## ✅ QUALITY CHECKLIST

### **For Free Throw Shots:**
- [ ] Player at free throw line
- [ ] Free throw line visible in frame
- [ ] Full body visible
- [ ] Shot execution clear
- [ ] 5-10 seconds duration

### **For 2-Point Shots:**
- [ ] Player INSIDE 3-point line
- [ ] Court markings visible
- [ ] Full approach captured (for layups)
- [ ] Jump and release visible
- [ ] Clear shot type (layup/mid-range/floater)

### **For 3-Point Shots:**
- [ ] Player OUTSIDE 3-point line
- [ ] **3-point line VISIBLE in frame** ⭐ CRITICAL!
- [ ] Player's feet behind line
- [ ] Full shot motion captured
- [ ] Arc/trajectory visible (if possible)

---

## 🎯 RECORDING TARGETS

### **Minimum (For Testing):**
| Category | Minimum | Good | Excellent |
|----------|---------|------|-----------|
| Free Throw | 30 | 70 | 100 |
| 2-Point | 30 | 70 | 100 |
| 3-Point | 30 | 70 | 100 |
| Dribbling | 30 | 70 | 100 |
| Passing | 30 | 70 | 100 |
| Defense | 30 | 70 | 100 |
| Idle | 30 | 70 | 100 |
| **TOTAL** | **210** | **490** | **700** |

### **Distribution Recommendation:**

**Option 1: Balanced (700 videos)**
- 100 videos per category
- Best for overall accuracy
- Recommended! ⭐

**Option 2: Shooting-Focused (700 videos)**
- 120 free throw
- 120 2-point
- 120 3-point
- 80 dribbling
- 80 passing
- 80 defense
- 100 idle

**Option 3: Quick Test (210 videos)**
- 30 videos per category
- Fast training (for testing only)
- Lower accuracy expected (70-75%)

---

## 🏀 SHOT IDENTIFICATION GUIDE

### **How to Know Which Category:**

**Is it from free throw line?**
- YES → `free_throw_shot/`

**Is player behind 3-point line?**
- YES → `3point_shot/`

**Is player inside 3-point line?**
- YES → `2point_shot/`

### **Visual Decision Tree:**
```
        Shot Taken
            │
    ┌───────┼───────┐
    │       │       │
Free Throw  │    Regular
  Line?     │     Shot?
    │       │       │
   YES     NO   ┌───┴───┐
    │           │       │
    ▼      Behind   Inside
FREE_THROW  Arc?     Arc?
              │       │
             YES     YES
              │       │
              ▼       ▼
          3POINT   2POINT
```

---

## 🎬 RECORDING SESSION EXAMPLE

### **Free Throw Session (1 hour = 50 videos)**

**Setup (5 min):**
- Find free throw line
- Position camera (side view)
- Test one shot (check framing)

**Recording (45 min):**
```
Player 1 → 10 free throws (5 min)
Player 2 → 10 free throws (5 min)
Player 3 → 10 free throws (5 min)
... (5 players × 10 shots = 50 videos)
```

**Organization (10 min):**
- Transfer videos to computer
- Name: `free_throw_player1_001.mp4`
- Move to: `dataset/raw_videos/free_throw_shot/`

---

### **3-Point Session (1 hour = 50 videos)**

**Setup (5 min):**
- Position camera (show 3-point line!)
- Mark 5 spots on arc
- Test one shot

**Recording (45 min):**
```
Corner 3s → 15 videos (3 players × 5 shots)
Wing 3s → 15 videos
Top Key → 15 videos
Deep 3s → 5 videos
```

**Organization (10 min):**
- Name: `corner3_player1_001.mp4`
- Move to: `dataset/raw_videos/3point_shot/`

---

## 📊 GUI DISPLAY

### **Updated Training GUI Shows:**

```
📊 Dataset Status
─────────────────────────
Free Throw Shot:   45 🟡 [████████░░░░░░] 45%
2-Point Shot:      32 🔴 [███████░░░░░░░] 32%
3-Point Shot:      28 🔴 [██████░░░░░░░░] 28%
Dribbling:         38 🔴 [████████░░░░░░] 38%
Passing:           41 🔴 [████████░░░░░░] 41%
Defense:           45 🟡 [████████░░░░░░] 45%
Idle:              34 🔴 [███████░░░░░░░] 34%

Total: 263 / 700 videos 🟡

📍 Shooting types based on court position:
Free throw = from free throw line
2-point = inside 3-point arc
3-point = outside 3-point arc
```

---

## 🎯 TESTING DIFFERENT SHOT TYPES

### **In TEST Tab:**

**Test Free Throw:**
- Upload free throw video
- Should detect: "FREE THROW"
- Metrics: Form score, release angle

**Test 2-Point:**
- Upload layup or mid-range
- Should detect: "2-POINT SHOT"
- Metrics: Jump height, approach speed

**Test 3-Point:**
- Upload 3-point shot
- Should detect: "3-POINT SHOT"
- Metrics: Arc angle, distance estimation

---

## 💡 PRO TIPS

### **Tip 1: Court Markings Matter!**
- Include court lines in frame
- Helps AI understand context
- Better classification accuracy

### **Tip 2: Variety Within Category**
**2-Point Shots:**
- Mix layups, mid-range, floaters
- Different angles and distances
- Makes model robust

**3-Point Shots:**
- Mix corner, wing, top key
- Different depths behind line
- Better generalization

### **Tip 3: Common Mistakes to Avoid**
- ❌ Calling a long 2-pointer a "3-point"
- ❌ Not showing 3-point line in frame
- ❌ Ambiguous positions
- ✅ When in doubt, show court markings!

---

## 🚀 QUICK START

### **Create Folders:**
```bash
cd Basketball-AI-System/dataset/raw_videos

# Folders already created:
ls
# free_throw_shot/
# 2point_shot/
# 3point_shot/
# dribbling/
# passing/
# defense/
# idle/
```

### **Record First Videos:**
```bash
# 1. Record one of each shooting type
   - 1 free throw
   - 1 layup (2-point)
   - 1 three-pointer

# 2. Transfer to correct folders

# 3. Launch GUI
./START_TRAINING.sh

# 4. Click "🔄 Refresh Count"
   Should show 3 videos total!
```

---

## 🎓 ACADEMIC BENEFITS

### **Why This Is Better:**

**Before:** 5 categories (generic "shooting")
- Less accurate
- Can't distinguish shot types
- Limited analysis

**After:** 7 categories (specific shot types)
- ✅ More accurate classification
- ✅ Shot-specific analysis
- ✅ Position-aware recommendations
- ✅ Better performance metrics
- ✅ More sophisticated AI
- ✅ Higher grade potential!

### **Shows You Understand:**
- Basketball court geometry
- Shot mechanics differences
- Context-aware AI
- Real-world complexity

---

## 🎉 SUMMARY

### **Your AI Now Classifies:**
1. 🎯 **Free Throw Shot** - From free throw line
2. 🏀 **2-Point Shot** - Inside 3-point arc
3. 🚀 **3-Point Shot** - Outside 3-point arc
4. ⚽ **Dribbling** - Ball handling
5. 🤝 **Passing** - Ball distribution
6. 🛡️ **Defense** - Defensive movements
7. 🧍 **Idle** - Standing/resting

### **Total Categories:** 7 (was 5)
### **Total Videos Needed:** 700 (100 per category)
### **Result:** More sophisticated AI! 🤖

---

## 🚀 START RECORDING!

### **Today's Target:** 15 videos

```
Record:
- 5 free throw shots
- 5 2-point shots (mix layups and mid-range)
- 5 3-point shots (show the line!)

Then:
- Transfer to folders
- Open GUI
- Click "🔄 Refresh"
- See: 15/700 videos!
```

---

**Your Basketball AI just got SMARTER! 🧠**

**Now it can tell WHERE shots are taken from! 🎯**

**START RECORDING with these new categories! 🏀🎥**


