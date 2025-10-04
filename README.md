# Basketball Performance Analysis System

A comprehensive AI-powered basketball performance tracking and analysis platform that combines real-time video analysis, wearable data integration, and personalized training recommendations.

## 🏀 Project Overview

This system democratizes elite-level sports analytics by making advanced performance tracking accessible to youth academies, schools, and individual players. It combines:

- **Real-time Video Analysis** - Computer vision for pose detection and movement tracking
- **Wearable Integration** - Apple Watch/HealthKit data for physiological metrics  
- **AI-Powered Analytics** - Performance tracking and weakness detection
- **Recommendation Engine** - Personalized training programs
- **Interactive Dashboards** - For coaches and players

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd basketball-performance-system
cp .env.example .env
```

2. **Start all services:**
```bash
make up
```

3. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- AI Service: http://localhost:8001
- MinIO Console: http://localhost:9001

### Development Commands

```bash
# Start all services
make up

# Stop all services  
make down

# Run tests
make test

# View logs
make logs

# Clean up
make clean
```

## 📁 Project Structure

```
basketball-performance-system/
├── backend/                 # FastAPI backend service
│   ├── app/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
├── ai_service/              # AI/ML microservice for video analysis
│   ├── service/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
├── frontend/                # React frontend application
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── tests/
├── infra/                   # Infrastructure and deployment
│   ├── docker-compose.yml
│   └── k8s/
├── docs/                    # Documentation
│   ├── architecture.md
│   └── api_contracts.md
├── ci/                      # CI/CD workflows
│   └── .github/workflows/
├── Makefile
├── .env.example
└── README.md
```

## 🛠 Technology Stack

- **Backend:** FastAPI + PostgreSQL + Redis
- **AI/ML:** MediaPipe, YOLOv8, PyTorch/TensorFlow
- **Frontend:** React + Vite + TailwindCSS
- **Infrastructure:** Docker + Kubernetes
- **Wearables:** Apple HealthKit, Google Fit, BLE

## 📋 Development Phases

- **Phase 0:** Project scaffold and dev environment ✅
- **Phase 1:** Backend API with authentication and models ✅
- **Phase 2:** Video upload and background processing ✅
- **Phase 3:** AI video analysis microservice ✅
- **Phase 4:** Wearable data integration ✅
- **Phase 5:** Analytics and recommendation engine ✅
- **Phase 6:** Frontend dashboard and visualization ✅
- **Phase 7:** Real-time streaming capabilities ✅
- **Phase 8:** Model training and improvement pipeline ✅
- **Phase 9:** Production deployment and CI/CD ✅
- **Phase 10:** Pilot program and validation ✅

**🎉 ALL PHASES 100% COMPLETE - PRODUCTION READY!**

## ✨ Key Features

### **🎬 AI-Powered Video Analysis**
- MediaPipe pose detection with 33 keypoint tracking
- YOLOv8 object detection for basketball, players, and court elements
- Automated event detection (shots, jumps, sprints, dribbles)
- Form analysis and technique evaluation
- Performance metrics calculation from video

### **⌚ Multi-Device Wearable Integration**
- Apple HealthKit API integration
- Google Fit API support
- BLE heart rate monitor connectivity
- Real-time physiological data collection
- Sleep and recovery tracking
- Heart rate zones analysis

### **📊 Advanced Analytics Engine**
- Comprehensive performance metrics
- Shooting accuracy by zone
- Jump height and vertical tracking
- Sprint speed and agility metrics
- Workload and fatigue monitoring
- Progress tracking over time
- Comparative analysis with benchmarks

### **💡 Personalized Training Recommendations**
- AI-driven training plan generation
- Weakness identification and targeting
- Position-specific drill recommendations
- Age-appropriate training programs
- Weekly workout scheduling
- Expected improvement predictions

### **📡 Real-time Streaming**
- WebSocket-based live monitoring
- Real-time heart rate display
- Live performance scoring
- Instant coach feedback
- Multi-player tracking
- Session recording and playback

### **🤖 Automated Model Training**
- Continuous model improvement pipeline
- Automated daily training (2 AM)
- Weekly full retraining (Sunday 3 AM)
- Model evaluation every 6 hours
- Data quality checks every 4 hours
- Performance metrics tracking
- Model deployment and versioning

### **🏭 Production Infrastructure**
- Docker containerization for all services
- Kubernetes deployment manifests
- Horizontal pod autoscaling (3-10 replicas)
- CI/CD pipeline with GitHub Actions
- Prometheus + Grafana monitoring
- Security headers and HTTPS
- Secrets management
- Automated backups

### **👥 User Features**
- Multi-role support (Player, Coach, Admin)
- User authentication with JWT
- Profile management
- Team collaboration
- Progress sharing
- Export data and reports
- Mobile responsive design

### **📱 Cross-Platform**
- Web application (React)
- iOS companion app (SwiftUI + HealthKit)
- BLE reader for Linux
- API for third-party integrations

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
POSTGRES_DB=basketball_performance
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256

# API URLs
BACKEND_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:8001
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run specific service tests
make test-backend
make test-ai-service
make test-frontend

# Run with coverage
make test-coverage
```

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api_contracts.md)
- [Development Guide](docs/development.md)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests
3. Run tests: `make test`
4. Commit: `git commit -m "feat: add your feature"`
5. Push and create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
