# 🏀 AI Basketball Performance Analysis System

**The ChatGPT of Basketball Analysis** - Upload a video, get instant AI-powered insights.

> *Making elite-level sports analytics accessible to African players*

---

## 🚀 Tech Stack (2025 LATEST)

### Frontend (Modern React)
- ⚛️ **React 18.3+** with TypeScript
- ⚡ **Vite 5.4+** (lightning-fast build)
- 🎨 **TailwindCSS 3.4+** (modern styling)
- 📊 **Recharts** (beautiful charts)
- 🎬 **React Player** (video playback)
- 🔥 **Framer Motion** (smooth animations)

### Backend (FastAPI)
- 🐍 **Python 3.11+**
- ⚡ **FastAPI 0.115+** (async API)
- 🔥 **PyTorch 2.5+** (latest deep learning)

### AI/ML (State-of-the-Art)
- 🤖 **YOLOv11** (just released! better than YOLOv8)
- 🧠 **Transformers** (Hugging Face SOTA models)
- 💪 **MediaPipe 0.10.9** (latest pose estimation)
- 🎯 **Vision Transformers** (for action classification)

---

## 📁 Project Structure

```
Basketball-AI-System/
│
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Pages
│   │   ├── services/          # API calls
│   │   ├── hooks/             # Custom hooks
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # FastAPI
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── models/            # AI models
│   │   └── main.py
│   └── requirements.txt
│
├── ai_models/                  # AI/ML Core
│   ├── pose_extraction/       # MediaPipe + YOLOv11
│   ├── action_classifier/     # Transformer model
│   └── metrics_engine/        # Performance analytics
│
└── dataset/                    # Your videos
    ├── raw_videos/
    └── keypoints/
```

---

## 🎯 What You'll Build

### 1. **Modern React Dashboard**
- Beautiful UI with TailwindCSS
- Real-time video upload with progress
- Interactive charts (Recharts)
- Smooth animations (Framer Motion)
- Dark/Light mode
- Mobile responsive

### 2. **FastAPI Backend**
- Async video processing
- WebSocket for real-time updates
- RESTful API
- File upload handling

### 3. **AI Engine**
- YOLOv11 for player detection
- MediaPipe for pose extraction
- Vision Transformer for action classification
- Performance metrics calculator

---

## 🚀 Quick Start

### Step 1: Setup Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run backend
python -m uvicorn app.main:app --reload --port 8000
```

### Step 2: Setup Frontend

```bash
cd frontend
npm install

# Run development server
npm run dev
```

**Open:** http://localhost:5173

---

## 🎨 Frontend Features

### Modern React Components:
- **VideoUpload**: Drag & drop with preview
- **ActionClassification**: Real-time results
- **MetricsDisplay**: Interactive charts
- **PerformanceRadar**: Radar chart
- **RecommendationCards**: AI suggestions
- **ProgressTracker**: Historical data

### Tech Details:
- TypeScript for type safety
- Zustand for state management (lighter than Redux)
- React Query for API calls
- React Hook Form for forms
- Zod for validation

---

## 🧠 AI Models (SOTA)

### 1. Action Classification
**Model:** Vision Transformer (ViT) or TimeSformer
- Better than LSTM for video understanding
- Attention mechanism captures long-range dependencies
- Pre-trained on Kinetics-400

### 2. Pose Estimation
**Model:** MediaPipe Pose + YOLOv11
- 33 keypoints (2D + 3D)
- Multi-person tracking
- Real-time performance

### 3. Performance Metrics
- Jump height detection
- Movement speed tracking
- Shot form analysis
- Reaction time measurement

---

## 📊 Target Metrics

- **Accuracy:** ≥85% (with Vision Transformer)
- **Inference:** <100ms per video
- **Detection Rate:** ≥90%
- **API Response:** <500ms

---

## 🎓 Why This Tech Stack?

### React + Vite vs Streamlit
| Feature | React + Vite | Streamlit |
|---------|-------------|-----------|
| Performance | ⚡ Instant | 🐢 Slow |
| UI/UX | 🎨 Professional | 📝 Basic |
| Customization | ♾️ Unlimited | ⚠️ Limited |
| Mobile | ✅ Responsive | ❌ Desktop only |
| Production | ✅ Ready | ⚠️ Prototype |
| Your Skills | ✅ You know it! | ❌ Need to learn |

### Vision Transformer vs LSTM
| Feature | ViT/TimeSformer | LSTM |
|---------|----------------|------|
| Accuracy | 85-90% | 75-80% |
| Training Speed | Faster | Slower |
| SOTA | ✅ 2024-2025 | ⚠️ 2015-2020 |
| Pre-training | ✅ Available | ❌ Train from scratch |

---

## 🎯 Your Action Plan

### Phase 1: Frontend Setup (You're expert here!)
```bash
# Create React + Vite + TypeScript project
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System
npm create vite@latest frontend -- --template react-ts

cd frontend
npm install

# Install additional packages
npm install \
  tailwindcss postcss autoprefixer \
  recharts \
  framer-motion \
  react-player \
  axios \
  zustand \
  @tanstack/react-query \
  react-hook-form \
  zod
```

### Phase 2: Backend Setup
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Phase 3: Record Dataset (Most Important!)
- 700+ video clips
- 5-10 seconds each
- Actions: shooting, dribbling, passing, defense, idle

---

## 📱 Dashboard Preview

```
┌─────────────────────────────────────────────────┐
│  🏀 Basketball AI Performance Analysis          │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────┐  ┌──────────────────────┐  │
│  │ Video Upload   │  │  Action: SHOOTING    │  │
│  │ Drag & Drop    │  │  Confidence: 94.2%   │  │
│  └────────────────┘  └──────────────────────┘  │
│                                                  │
│  📊 Performance Metrics                         │
│  ┌──────────┬──────────┬──────────┬─────────┐  │
│  │Jump: 0.72m│Speed: 6.5m/s│Form: 0.89│Time: 0.21s│
│  └──────────┴──────────┴──────────┴─────────┘  │
│                                                  │
│  📈 Radar Chart        📉 Progress Chart        │
│                                                  │
│  💡 AI Recommendations                          │
│  • Excellent shooting form! (89/100)            │
│  • Work on jump height consistency               │
│  • Elbow angle perfect at 92°                   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Next Steps

I'll create for you:

1. ✅ **Complete React + Vite frontend** (you'll customize)
2. ✅ **FastAPI backend** with async processing
3. ✅ **Modern pose extraction** (MediaPipe + YOLOv11)
4. ✅ **Vision Transformer classifier** (SOTA)
5. ✅ **Performance metrics engine**
6. ✅ **Complete API documentation**

---

**Ready to build the BEST basketball AI system with React? Let's go! 🚀**
