# 🚀 Complete Setup Guide - Basketball AI System

**Modern Stack: React + Vite + FastAPI + YOLOv11 + Vision Transformers**

---

## 📋 Prerequisites

- ✅ Python 3.11+
- ✅ Node.js 20+ and npm
- ✅ NVIDIA GPU (optional, but recommended)
- ✅ 20GB free disk space

---

## 🎯 Step-by-Step Setup

### STEP 1: Create React Frontend (5 minutes)

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System

# Create React + Vite + TypeScript project
npm create vite@latest frontend -- --template react-ts

cd frontend
npm install

# Install all required packages
npm install \
  tailwindcss postcss autoprefixer \
  @tailwindcss/forms \
  recharts \
  framer-motion \
  react-player \
  axios \
  zustand \
  @tanstack/react-query \
  react-hook-form \
  zod \
  @hookform/resolvers \
  lucide-react \
  clsx \
  tailwind-merge

# Setup TailwindCSS
npx tailwindcss init -p
```

### STEP 2: Configure Tailwind

Create `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B00',
        secondary: '#2196F3',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

Add to `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### STEP 3: Setup Backend

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System

# Create backend directory structure
mkdir -p backend/app/{api,models,core,services}
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt
```

### STEP 4: Test Everything

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Open browser:** http://localhost:5173

---

## 📁 Project Structure (What I'll Create)

```
Basketball-AI-System/
│
├── frontend/                           # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoUpload.tsx        # Drag & drop upload
│   │   │   ├── ActionResult.tsx       # Classification result
│   │   │   ├── MetricsDisplay.tsx     # Performance metrics
│   │   │   ├── RadarChart.tsx         # Performance radar
│   │   │   ├── RecommendationCard.tsx # AI suggestions
│   │   │   └── ProgressChart.tsx      # Historical trends
│   │   ├── pages/
│   │   │   ├── Home.tsx               # Landing page
│   │   │   ├── Dashboard.tsx          # Main dashboard
│   │   │   └── Analysis.tsx           # Analysis page
│   │   ├── services/
│   │   │   └── api.ts                 # API client
│   │   ├── store/
│   │   │   └── useStore.ts            # Zustand store
│   │   ├── hooks/
│   │   │   └── useVideoAnalysis.ts    # Custom hooks
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript types
│   │   ├── utils/
│   │   │   └── cn.ts                  # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                            # FastAPI
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── api/
│   │   │   ├── routes.py              # API routes
│   │   │   └── websocket.py           # WebSocket
│   │   ├── models/
│   │   │   ├── pose_extractor.py      # MediaPipe + YOLO
│   │   │   ├── action_classifier.py   # Vision Transformer
│   │   │   └── metrics_calculator.py  # Performance metrics
│   │   ├── core/
│   │   │   ├── config.py              # Configuration
│   │   │   └── schemas.py             # Pydantic models
│   │   └── services/
│   │       └── video_processor.py     # Video processing
│   ├── requirements.txt
│   └── .env
│
├── ai_models/                          # Trained models
│   ├── pose_model/
│   ├── action_classifier/
│   └── yolov11n.pt
│
├── dataset/                            # Your videos
│   ├── raw_videos/
│   │   ├── shooting/
│   │   ├── dribbling/
│   │   ├── passing/
│   │   ├── defense/
│   │   └── idle/
│   ├── keypoints/
│   └── metadata.csv
│
├── requirements.txt                    # Python deps
└── README.md
```

---

## 🎨 Frontend Components I'll Create

### 1. **VideoUpload.tsx**
```typescript
- Drag & drop zone
- Video preview
- Upload progress bar
- File validation
```

### 2. **ActionResult.tsx**
```typescript
- Action label (SHOOTING, etc.)
- Confidence percentage
- Probability distribution chart
- Animation on result
```

### 3. **MetricsDisplay.tsx**
```typescript
- Metric cards (jump, speed, form, time)
- Color-coded values
- Icons for each metric
- Comparison indicators
```

### 4. **RadarChart.tsx**
```typescript
- Performance profile visualization
- 6 dimensions
- Animated transitions
- Interactive tooltips
```

### 5. **RecommendationCard.tsx**
```typescript
- AI-generated tips
- Priority indicators
- Action buttons
- Expandable details
```

---

## 🔥 Backend API Endpoints

```python
POST   /api/upload          # Upload video
POST   /api/analyze         # Analyze video
GET    /api/results/{id}    # Get results
GET    /api/history         # Get history
WS     /ws/analysis         # Real-time updates
```

---

## 🧠 AI Pipeline

```
Video Upload
    ↓
YOLOv11: Detect Player
    ↓
MediaPipe: Extract 33 Keypoints (2D + 3D)
    ↓
Vision Transformer: Classify Action
    ↓
Metrics Engine: Calculate Performance
    ↓
Return JSON Results
```

---

## 📊 Response Format

```json
{
  "video_id": "abc123",
  "action": {
    "label": "shooting",
    "confidence": 0.942,
    "probabilities": {
      "shooting": 0.942,
      "dribbling": 0.032,
      "passing": 0.015,
      "defense": 0.008,
      "idle": 0.003
    }
  },
  "metrics": {
    "jump_height": 0.72,
    "movement_speed": 6.5,
    "form_score": 0.89,
    "reaction_time": 0.21,
    "pose_stability": 0.85,
    "energy_efficiency": 0.78
  },
  "recommendations": [
    {
      "type": "improvement",
      "title": "Excellent Form",
      "message": "Your shooting form is excellent (89/100). Maintain this consistency!",
      "priority": "low"
    },
    {
      "type": "focus",
      "title": "Jump Height",
      "message": "Work on jump height consistency. Current: 0.72m. Target: 0.80m.",
      "priority": "medium"
    }
  ],
  "keypoints": [...],  // For visualization
  "timestamp": "2025-01-20T10:30:00Z"
}
```

---

## 🚀 What's Next?

Once you run the setup, I'll provide:

1. ✅ Complete React components (copy-paste ready)
2. ✅ FastAPI backend (fully functional)
3. ✅ AI models integration
4. ✅ TypeScript types
5. ✅ API documentation

---

## 💡 Why This Stack is Perfect

### React + Vite
- ⚡ **3x faster** than Create React App
- 🔥 **Hot Module Replacement** (instant updates)
- 📦 **Smaller bundle sizes**
- 🎯 **Production-ready**

### TypeScript
- 🛡️ **Type safety** (catch bugs early)
- 🧠 **Better IDE support**
- 📚 **Self-documenting code**
- ✅ **Industry standard**

### TailwindCSS
- 🎨 **Rapid styling**
- 📱 **Responsive by default**
- 🔧 **Highly customizable**
- 💪 **No CSS files to manage**

### FastAPI
- ⚡ **Async by default**
- 📝 **Auto-generated docs**
- 🔒 **Type validation**
- 🚀 **High performance**

---

## 🎯 Commands Reference

### Development
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload
```

### Build for Production
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && pip install gunicorn && gunicorn app.main:app
```

### Testing
```bash
# Frontend
cd frontend && npm run test

# Backend
cd backend && pytest
```

---

**Ready? Let's build the frontend and backend! 🚀**

