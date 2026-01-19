# 🏀 We present to you Bako

Personalised AI Basketball Skill Analysis System.

> Analyzing individual basketball skills and using ideal metrics to help improve players in Uganda, with UCU as our primary test point

here is the link to the hosted demo website 

https://frontend-smoky-eta-61.vercel.app/

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.5+-EE4C2C.svg?logo=pytorch)](https://pytorch.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [System Architecture](#-system-architecture)
- [Academic Alignment](#-academic-alignment)
- [Performance Metrics](#-performance-metrics)
- [Project Workplan](#-project-workplan)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This Final Year Project addresses the lack of accessible basketball skill analysis tools for Ugandan players by leveraging AI and computer vision to analyze individual basketball skills and provide personalized improvement recommendations.

### Historical Context

Basketball skill analysis has evolved from subjective coaching observations to objective, AI-driven skill assessment. Early biomechanical systems using markers and infrared cameras were expensive and confined to labs. The shift to computer vision enabled markerless motion analysis, and later, algorithms like MediaPipe democratized this further by operating on consumer hardware, making detailed skill assessment accessible.

The current frontier uses deep learning for personalized skill insights. This project builds on that progression, implementing a technical stack optimized for Ugandan basketball contexts. While developed using high-performance GPU hardware (NVIDIA RTX 4080 Super) for efficient training, the system is designed for flexible deployment across various hardware configurations. The goal is to establish ideal skill metrics from proficient players and use those benchmarks to help improve individual basketball skills for players at Uganda Christian University (UCU) and across Uganda.

### The Problem
- **Lack of Skill-Specific Analysis**: No accessible tools to analyze individual basketball skills (shooting, dribbling, passing, defense) in Uganda
- **No Baseline Metrics**: No established ideal metrics for good basketball skills in the Ugandan context
- **Subjective Coaching**: Manual coaching feedback is subjective and inconsistent
- **Limited Improvement Guidance**: Players lack data-driven strategies to improve specific skills
- **Commercial Systems Unsuitable**: Systems like Catapult, HomeCourt, and PlaySight are expensive and designed for professional indoor settings, not Ugandan outdoor courts
- **No Local Context**: Existing solutions don't account for Ugandan playing conditions, player physiques, and training environments

### Our Solution
An AI-powered **individual basketball skill analysis system** that:
1. **Analyzes Individual Skills**: Identifies and analyzes specific basketball skills (shooting, dribbling, passing, defense) from video recordings
2. **Establishes Ideal Metrics**: Learns ideal skill metrics from proficient players' videos using coach-validated benchmarks to create standards for good basketball skills
3. **Measures Skill Performance**: Calculates detailed metrics (jump height, form, speed, accuracy) for each individual skill
4. **Provides Personalized Improvement**: Compares individual player skills against ideal metrics and generates targeted, actionable improvement recommendations
5. **Uganda-Focused**: Designed specifically for Ugandan basketball contexts, with UCU as the primary test point and validation site
6. **Flexible Deployment**: Trained on high-performance hardware (NVIDIA GPU) but designed to run on both GPU and CPU systems, making it accessible for various deployment scenarios

### Impact
- **Individual Skill Analysis**: Analyze specific basketball skills for players at UCU and across Uganda
- **Ideal Metrics Database**: Establish baseline metrics for good basketball skills from proficient players, validated by UCU Cannons coaches
- **Personalized Improvement**: Help individual players improve by comparing their skills against ideal metrics with measurable outcomes
- **Fast Analysis**: Efficient processing time per video (optimized for both GPU and CPU deployment)
- **High Accuracy**: Target 96% accuracy in skill classification (VideoMAE, validated on local dataset)
- **Robust Detection**: 97%+ mAP in player detection (YOLOv11)
- **Accessible Design**: Optimized for various hardware configurations, from high-performance GPUs to standard university laboratory computers
- **Measurable Outcomes**: Track skill improvement over time with before/after comparisons

---

## ✨ Features

### 🤖 AI-Powered Skill Analysis
- **Individual Skill Classification**: Identify and classify specific basketball skills (shooting, dribbling, passing, defense) using VideoMAE vision transformer, fine-tuned on local Ugandan dataset
- **Pose Estimation**: Track **33 body keypoints** in real-time with MediaPipe to analyze skill form and technique (runs efficiently on both GPU and CPU)
- **Object Detection**: Detect players, basketball, and court elements with **97%+ mAP** using YOLOv11-nano
- **Skill Metrics Calculation**: Calculate detailed metrics for each skill (jump height, shooting form, dribbling speed, passing accuracy, defensive stance, release angle, follow-through)
- **Ideal Metrics Learning**: System learns ideal skill metrics from proficient players' videos, validated by UCU Cannons coaches, to establish evidence-based benchmarks
- **Personalized Skill Improvement**: Compare individual player skills against ideal metrics and provide targeted, actionable improvement recommendations with specific focus areas
- **Flexible Deployment**: Trained on high-performance hardware (NVIDIA RTX 4080 Super) but designed to run on various hardware configurations

### 📊 Interactive Dashboard
- **Video Upload**: Drag-and-drop interface with progress tracking
- **Real-time Skill Analysis**: Instant skill classification and confidence scores
- **Skill Metrics Visualization**: Interactive charts showing individual skill performance vs. ideal metrics
- **Personalized Recommendations**: AI-generated suggestions to improve specific skills based on comparison with ideal metrics
- **Progress Tracking**: Monitor skill improvement over time for individual players

### ⚡ Modern Technology
- **Lightning Fast**: Vite-powered React frontend
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: WebSocket support for live analysis
- **Professional UI**: TailwindCSS-based modern design

---

## 🛠 Tech Stack

### Frontend (30% of work)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3+ | UI framework |
| **Vite** | 5.4+ | Build tool |
| **TypeScript** | 5.2+ | Type safety |
| **TailwindCSS** | 3.4+ | Styling |
| **Recharts** | 2.8+ | Data visualization |
| **Framer Motion** | 10.16+ | Animations |

### Backend & AI (70% of work)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Programming language |
| **FastAPI** | 0.115+ | API framework |
| **PyTorch** | 2.5+ | Deep learning |
| **YOLOv11-nano** | Latest | Object detection (97%+ mAP, GPU-trained, CPU-capable) |
| **MediaPipe** | 0.10.9 | Pose estimation (33 keypoints, GPU/CPU compatible) |
| **VideoMAE** | Latest | Skill classification (GPU-trained, fine-tuned on local dataset) |
| **OpenCV** | 4.10+ | Video processing |

---

## 📁 Project Structure

```
Final-Year-Project/
│
├── Basketball-AI-System/           # Main project
│   │
│   ├── frontend/                   # React Dashboard (30%)
│   │   ├── src/
│   │   │   ├── components/        # UI components
│   │   │   ├── pages/             # Dashboard pages
│   │   │   ├── services/          # API integration
│   │   │   └── types/             # TypeScript types
│   │   └── package.json
│   │
│   ├── backend/                    # FastAPI Server (70%)
│   │   ├── app/
│   │   │   ├── api/               # API routes
│   │   │   ├── models/            # AI models
│   │   │   │   ├── pose_extractor.py      # MediaPipe
│   │   │   │   ├── yolo_detector.py       # YOLOv11
│   │   │   │   ├── action_classifier.py   # Transformer
│   │   │   │   └── metrics_engine.py      # Analytics
│   │   │   ├── services/          # Business logic
│   │   │   └── main.py            # FastAPI app
│   │   └── requirements.txt
│   │
│   ├── 2_pose_extraction/          # Pose extraction scripts
│   │   └── extract_keypoints_v2.py
│   │
│   ├── training/                   # Model training
│   │   └── train_videomae.py
│   │
│   └── dataset/                    # Training data
│       └── raw_videos/
│           ├── shooting/
│           ├── dribbling/
│           ├── passing/
│           ├── defense/
│           └── idle/
│
└── README.md                       # This file
```

---

## 🚀 Quick Start

### Prerequisites

**Development Environment:**
- **Python 3.11+**
- **Node.js 18+** and npm
- **Git**
- **NVIDIA GPU** with CUDA (recommended for model training and development)
  - System developed and trained on NVIDIA RTX 4080 Super
  - GPU significantly accelerates model training and inference

**Deployment Environment:**
- System designed to run on both GPU and CPU systems
- CPU-only deployment possible for inference (slower but functional)
- Minimum: Standard university laboratory computers
- Recommended: GPU-enabled systems for optimal performance

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/OkidNorbert/Personalised-AI-Basketball-Skill-Analysis-System.git
cd Personalised-AI-Basketball-Skill-Analysis-System
```

#### 2. Setup Backend
```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** http://localhost:8000

#### 3. Setup Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

**Frontend will be available at:** http://localhost:5173

### 🎬 Usage

1. **Open Dashboard**: Navigate to http://localhost:5173
2. **Upload Video**: Drag and drop or click to select a basketball skill video (5-10 seconds) - shooting, dribbling, passing, or defense
3. **Analyze Skill**: Click "Analyze" and wait for AI processing to identify and analyze the specific skill
4. **View Results**: See skill classification, detailed skill metrics, comparison with ideal metrics, and personalized improvement recommendations

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│          React Dashboard (TailwindCSS + Charts)             │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (Async)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Video Upload│  │ API Endpoints│  │ Response Handler│   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘   │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI PROCESSING LAYER                       │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │ YOLOv11      │  │ MediaPipe     │  │ Vision          │ │
│  │ Player       │→ │ Pose          │→ │ Transformer     │ │
│  │ Detection    │  │ Extraction    │  │ Classification  │ │
│  └──────────────┘  └───────────────┘  └─────────┬───────┘ │
└───────────────────────────────────────────────────┼─────────┘
                                                    ▼
                                          ┌─────────────────┐
                                          │ Metrics Engine  │
                                          │ • Jump Height   │
                                          │ • Speed         │
                                          │ • Form Score    │
                                          │ • Reaction Time │
                                          └─────────────────┘
```

### Processing Pipeline

1. **Video Upload** → User uploads video via React dashboard (720p-1080p, 30fps smartphone recordings from UCU training sessions)
2. **Object Detection** → YOLOv11-nano detects players and basketball (97%+ mAP, real-time performance)
3. **Pose Extraction** → MediaPipe extracts 33 body keypoints per frame (CPU-optimized, handles outdoor lighting)
4. **Skill Classification** → VideoMAE vision transformer identifies specific basketball skill type (shooting, dribbling, passing, defense) with 96% accuracy, fine-tuned on local Ugandan dataset
5. **Skill Metrics Calculation** → Analyze detailed metrics for the identified skill (jump height, form, speed, accuracy) from keypoints
6. **Ideal Metrics Comparison** → Compare individual player's skill metrics against established ideal metrics from proficient players
7. **Personalized Recommendations** → Generate targeted improvement suggestions based on skill-specific gaps
8. **Results Display** → Show interactive dashboard with skill analysis, comparison charts, and improvement recommendations

### Three-Stage AI Architecture

**Stage 1: Player Detection and Tracking (YOLOv11)**
- Real-time player detection and identity tracking across frames
- YOLOv11-nano variant for CPU-optimized performance
- Bounding box generation and preliminary localization

**Stage 2: Detailed Pose Estimation (MediaPipe)**
- Extraction of 33 body keypoints with 2D/3D coordinates
- Computation of biomechanical metrics: joint angles, limb velocities, and movement patterns
- Temporal smoothing for stable pose estimation across video frames
- Robust to outdoor lighting variations typical of Ugandan courts
- Efficient processing on both GPU and CPU hardware

**Stage 3: Skill Recognition and Analysis (VideoMAE)**
- Classification of individual basketball skills (shooting, dribbling, passing, defense) from pose sequence analysis
- Fine-tuning on local Ugandan dataset (UCU Cannons) using NVIDIA RTX 4080 Super for training
- Temporal pattern recognition for complex skill movement understanding
- Self-supervised pre-training for data efficiency
- **Ideal Metrics Learning**: System analyzes videos of proficient players (coach-validated) to extract biomechanical patterns, performance metrics, and form characteristics that define "good" execution of each skill
- Benchmarks established through statistical analysis of proficient player data, validated by UCU Cannons coaching staff

---

## 🎓 Academic Alignment

### Research Methodology

This study adopts a **design–build–evaluate** methodology to develop an AI-driven basketball skill analysis system. The design phase identifies functional requirements, data collection protocols, and selects appropriate machine learning models based on computational constraints. The build phase focuses on dataset development, model training, ideal metrics learning, and system integration. The evaluation phase employs both technical metrics and user feedback from UCU Cannons coaches to validate skill analysis accuracy and improvement recommendations.

### Data Collection and Preparation

Primary data collection involves smartphone recordings (720p-1080p at 30fps) of **UCU Cannons training sessions** conducted on outdoor courts in Uganda. The collection strategy captures:
- **Individual basketball skills**: shooting, dribbling, passing, and defensive movements
- **Proficient players**: Videos of skilled players to establish ideal skill metrics
- **Diverse environmental conditions**: Varying lighting (morning, afternoon, overcast) and camera angles typical of Ugandan outdoor courts
- **Individual player performances**: Personalized skill analysis for players at UCU and across Uganda

Collected videos undergo systematic annotation using Label Studio, with each clip labeled for:
- **Specific skill type** (shooting, dribbling, passing, defense)
- **Player identification** and skill proficiency level
- **Skill quality indicators** to identify ideal metrics

Preprocessing includes video stabilization, frame extraction, and data augmentation through rotation and brightness adjustments to enhance model generalization across different Ugandan court conditions.

### Training Protocol

Model development employs:
- **YOLOv11**: Pre-trained weights fine-tuned for basketball player detection in Ugandan outdoor courts
- **MediaPipe**: Off-the-shelf pose estimation with basketball skill-specific post-processing
- **VideoMAE**: Kinetics-400 pre-trained model adapted for local skill recognition using UCU Cannons dataset

**Training Hardware**: Models trained on NVIDIA RTX 4080 Super GPU for optimal performance and faster iteration cycles.

Training utilizes **70-15-15 data split** (training-validation-testing) with evaluation metrics including accuracy, precision, recall, F1-score, and computational efficiency measures.

### Ideal Metrics Methodology

**Ideal Metrics Learning Process**:
1. **Proficient Player Identification**: UCU Cannons coaches identify proficient players for each skill (shooting, dribbling, passing, defense)
2. **Data Collection**: Collect multiple video samples from proficient players performing each skill
3. **Metric Extraction**: System extracts biomechanical metrics (joint angles, velocities, timing, form characteristics) from proficient player videos
4. **Statistical Analysis**: Calculate mean, median, and optimal ranges for each metric to establish benchmarks
5. **Coach Validation**: UCU Cannons coaches review and validate the established ideal metrics
6. **Benchmark Database**: Create a database of ideal metrics for each skill that serves as the standard for comparison

**Application**: Individual player videos are analyzed and compared against these validated ideal metrics to identify specific areas for improvement, generating personalized, actionable recommendations.

### Final Year Project Requirements
- ✅ **70%+ AI/ML Focus**: Deep learning, computer vision, pose estimation for individual skill analysis
- ✅ **30% Visualization**: Modern React dashboard for skill metrics visualization
- ✅ **Real-world Impact**: Addresses accessibility gap in basketball skill analysis for Uganda
- ✅ **Innovation**: Combines multiple SOTA AI models (YOLOv11, MediaPipe, VideoMAE) for skill-specific analysis
- ✅ **Contextual Validation**: First validation on Ugandan players at UCU in outdoor environments
- ✅ **Skill Improvement Focus**: Establishes ideal metrics and provides personalized skill improvement recommendations

### UN Sustainable Development Goals (SDGs)
- **SDG 3 (Good Health)**: Injury prevention through form analysis
- **SDG 4 (Quality Education)**: Accessible sports training for youth
- **SDG 9 (Innovation)**: AI-powered sports technology

### Uganda Vision 2040
- Youth sports development
- Technology innovation in education
- Building local AI/ML expertise

### Contextual Perspective

The integrated application of YOLO, MediaPipe, and VideoMAE for **individual basketball skill analysis** in African contexts remains unexplored, with no existing validation on Ugandan players in outdoor environments. This system is specifically designed for **Uganda**, with **UCU (Uganda Christian University) as the primary test point** and validation site.

Current commercial systems like Catapult and HomeCourt are designed for general performance analysis in professional indoor settings with specialized equipment, making them unsuitable for:
- **Individual skill analysis** in Ugandan conditions
- **Establishing ideal skill metrics** from local proficient players
- **Personalized skill improvement** for players at UCU and across Uganda
- Smartphone recordings in outdoor courts with variable lighting

| System | Cost | Hardware Suitability | Status |
|--------|------|---------------------|--------|
| **Catapult** | Very High | Specialized sensors | Not suitable |
| **HomeCourt** | Subscription | iPhone only | Limited |
| **PlaySight** | Very High | Smart cameras | Not suitable |
| **Proposed System** | Low | Smartphone + Laptop | **Highly suitable** |

The technical stack addresses three key requirements:

1. **Computational Efficiency**: All three components were selected for efficient deployment. YOLO's efficient architecture provides real-time performance, MediaPipe works on both GPU and CPU, and VideoMAE's data efficiency reduces training requirements. While trained on high-performance GPU hardware, the system can run on various hardware configurations.

2. **Adaptability to Local Conditions**: Outdoor basketball courts in Uganda present unique challenges including variable lighting, diverse player physiques, and mobile phone video quality. MediaPipe's robustness to lighting variations, YOLO's strong generalization capabilities, and VideoMAE's ability to learn from limited local data make this stack particularly suitable for Ugandan conditions.

3. **Contextual Relevance**: The lack of contextually applicable basketball skill analysis tools for African environments highlights the need for localized AI-driven solutions tailored to Ugandan basketball skill development. The system is specifically designed and validated for Ugandan players, with UCU as the core test point and validation site.

---

## 📊 Performance Metrics

### Target Benchmarks
| Metric | Target | Status |
|--------|--------|--------|
| Skill Classification Accuracy | ≥96% | 🎯 (VideoMAE, validated on local dataset) |
| Player Detection mAP | ≥97% | 🎯 (YOLOv11) |
| Pose Detection Rate | ≥90% | 🎯 (MediaPipe) |
| Ideal Metrics Learning | Coach-validated benchmarks | 🎯 (From proficient players, validated by UCU coaches) |
| Inference Time (GPU) | <100ms | ⚡ (NVIDIA RTX 4080 Super) |
| Inference Time (CPU) | <500ms | ⚡ (Standard lab computers) |
| API Response Time | <1s | ⚡ (End-to-end processing) |
| Frontend Performance | 60 FPS | ⚡ |

### Evaluation Methodology

System validation incorporates both technical and user-centered approaches:

**Technical Evaluation:**
- Detection Performance: mAP@0.5 for player localization accuracy
- Pose Estimation: PCK@0.2 for keypoint detection quality
- Skill Recognition: Per-skill accuracy and F1-scores (shooting, dribbling, passing, defense)
- Ideal Metrics Validation: Accuracy of learned ideal skill metrics from proficient players
- Computational Efficiency: FPS and inference latency on CPU hardware

**User Evaluation:**
- Coach usability testing with UCU Cannons training staff
- **Measurable Skill Improvement**: Longitudinal studies tracking if recommendations based on ideal metrics lead to actual skill improvement over time
- **Before/After Analysis**: Compare player skill metrics before and after implementing recommendations
- Feedback sessions on skill analysis relevance, recommendation quality, and interface usability
- Comparative analysis against traditional coaching methods for skill development
- **Validation of Ideal Metrics**: Coach confirmation that established benchmarks accurately represent good skill execution

### Dataset Requirements
- **700+ video clips** (5-10 seconds each) from UCU Cannons training sessions
- **4 skill categories**: Shooting, Dribbling, Passing, Defense
- **Multiple players** including proficient players (for ideal metrics) and developing players (for improvement analysis)
- **Ugandan outdoor courts**: Various lighting conditions typical of Uganda (morning, afternoon, overcast)
- **UCU-focused**: Primary data collection and validation at Uganda Christian University

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍🎓 Author

**Okidi Norbert** 
**Anna Akumu**
**Nankya Zahra**

Bachelor of Science in Computer Science  
Uganda Christian University (UCU)  
2025

---

## 🙏 Acknowledgements

- **MediaPipe** by Google for pose detection
- **Ultralytics** for YOLOv11
- **Hugging Face** for Vision Transformers
- **FastAPI** team for excellent framework
- **React** and **Vite** communities
- Uganda Christian University for academic support

---

## 📧 Contact

- **Email**: oknorbert6@gmail.com
- **GitHub**: [@OkidNorbert](https://github.com/OkidNorbert)
- **Project Repository**: [Personalised-AI-Basketball-Skill-Analysis-System](https://github.com/OkidNorbert/Personalised-AI-Basketball-Skill-Analysis-System)

---

## 🌟 Show Your Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs or issues
- 💡 Suggesting new features
- 📖 Improving documentation

---

**Built with ❤️ for basketball skill development in Uganda, with UCU as our core test point** 🏀

---

## 📅 Project Workplan

The project follows a structured **16-week development timeline** designed to ensure comprehensive coverage of all critical phases, from initial planning through to final defense preparation in March 2026.

| Week | Milestone / Key Activities |
|------|---------------------------|
| **Weeks 1–2** | Proposal finalization, requirements gathering, stakeholder consultations, and seeking ethical approval for data collection |
| **Weeks 3–5** | Dataset recording at UCU and selected outdoor basketball courts across Uganda, focusing on individual skill analysis |
| **Weeks 6–8** | Video annotation, preprocessing, and structuring of the pose estimation dataset |
| **Weeks 9–11** | Training and testing of the AI models using NVIDIA RTX 4080 Super GPU (YOLOv11 for detection, MediaPipe for pose, VideoMAE for skill classification). Learning ideal skill metrics from proficient players' videos with coach validation. |
| **Weeks 12–13** | Backend (FastAPI) and frontend (React) development, followed by system integration |
| **Weeks 14–15** | Usability testing with UCU Cannons coaches and players; validation of skill analysis and improvement recommendations; system refinement based on feedback |
| **Week 16** | Final documentation, project submission, and preparation for the defense presentation |

### Ethical Considerations

The research adheres to ethical standards through:
- Informed consent from all participants (players and coaches)
- Data anonymization and privacy protection protocols
- Institutional approval from Uganda Christian University
- Transparent communication of system capabilities and limitations

### Deployment Considerations

**Development Environment:**
- System developed and trained using NVIDIA RTX 4080 Super GPU
- High-performance hardware enables faster model training and iteration
- GPU acceleration significantly reduces training time for VideoMAE fine-tuning

**Deployment Flexibility:**
- **GPU Deployment**: Optimal performance for real-time analysis (recommended for production)
- **CPU Deployment**: Functional for inference, suitable for resource-constrained environments
- System architecture designed to automatically detect and utilize available hardware
- Can be deployed on university laboratory computers, cloud services, or dedicated servers

**Commercial Use:**
- This is an academic research project developed as a Final Year Project
- Future commercial deployment and pricing models are not yet determined
- Current focus is on validation and proof-of-concept at UCU
- For inquiries about future deployment or commercial use, please contact the project team

## 📚 Additional Documentation

- [Frontend Setup Guide](Basketball-AI-System/frontend/README.md)
- [Backend API Documentation](Basketball-AI-System/SETUP_GUIDE.md)
- [Model Training Guide](Basketball-AI-System/training/README.md)
- [Dataset Preparation](Basketball-AI-System/DATASET_GUIDE.md)

---

![alt text](<Screenshot from 2025-11-20 11-55-20.png>) ![alt text](<Screenshot from 2025-11-20 19-00-48.png>) ![alt text](<Screenshot from 2025-11-20 19-27-28.png>) ![alt text](<Screenshot from 2025-11-20 20-04-10.png>) ![alt text](<Screenshot from 2025-11-20 20-16-43.png>)
![alt text](<Screenshot from 2025-11-20 11-55-20-1.png>) ![alt text](<Screenshot from 2025-11-20 19-00-48-1.png>) ![alt text](<Screenshot from 2025-11-20 19-27-28-1.png>) ![alt text](<Screenshot from 2025-11-20 20-04-10-1.png>) ![alt text](<Screenshot from 2025-11-20 20-16-43-1.png>) ![alt text](<Screenshot from 2025-11-24 13-24-49.png>) ![alt text](<Screenshot from 2025-11-24 13-33-13.png>) ![alt text](<Screenshot from 2025-11-24 18-33-22.png>) ![alt text](<Screenshot from 2025-11-24 18-33-39.png>) ![alt text](<Screenshot from 2025-11-24 18-33-51.png>) ![alt text](<Screenshot from 2025-11-24 18-33-57.png>) ![alt text](<Screenshot from 2025-11-24 18-34-03.png>) ![alt text](<Screenshot from 2025-11-24 18-36-54.png>)
