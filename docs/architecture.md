# Basketball Performance System - Architecture

## System Overview

The AI Basketball Performance Analysis System is a comprehensive, full-stack platform that integrates real-time **pose detection**, **YOLOv3 object detection**, video analysis, and AI-based training recommendations with automated skill improvement suggestions via YouTube scraping. The system democratizes elite-level sports analytics by making advanced performance tracking accessible to youth academies, schools, and individual players.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Service    │
│   (React +      │◄──►│   (FastAPI +    │◄──►│   (TensorFlow + │
│   Vite +        │    │   PostgreSQL +   │    │   MediaPipe +    │
│   TailwindCSS)  │    │   MinIO)        │    │   YOLOv3 +      │
│   Port: 3000    │    │   Port: 8000    │    │   OpenCV)       │
└─────────────────┘    └─────────────────┘    │   Port: 8001    │
         │                       │              └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MinIO         │    │   PostgreSQL    │    │   Redis +       │
│   (Object       │    │   (Database)    │    │   Celery        │
│   Storage)      │    │   Port: 5432    │    │   (Cache/Queue) │
│   Port: 9000    │    └─────────────────┘    │   Port: 6379    │
└─────────────────┘                           └─────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────┐                           ┌─────────────────┐
│   YouTube       │                           │   Monitoring    │
│   Scraper/API   │                           │   (Grafana +    │
│   (Recommendation│                           │   Prometheus)   │
│   Engine)       │                           │   Port: 3001    │
└─────────────────┘                           └─────────────────┘
```

## Components

### 1. Frontend (React + Vite)
- **Technology**: React 18, TypeScript, TailwindCSS
- **Purpose**: User interface for players and coaches
- **Features**:
  - Dashboard with performance metrics
  - Video player with pose overlay
  - Training recommendations
  - Player profiles and analytics

### 2. Backend API (FastAPI)
- **Technology**: Python 3.11, FastAPI, SQLAlchemy
- **Purpose**: Core business logic and data management
- **Features**:
  - Authentication and authorization
  - Video upload and metadata management
  - Event ingestion and storage
  - Player and team management
  - Analytics and recommendations

### 3. AI Service (Enhanced Python)
- **Technology**: TensorFlow, MediaPipe, YOLOv3, OpenCV, BeautifulSoup
- **Purpose**: Advanced computer vision, machine learning, and recommendation engine
- **Features**:
  - **Pose Detection**: MediaPipe for real-time human pose estimation (33 joints)
  - **Object Detection**: YOLOv3 for basketball, hoop, court, and player detection
  - **Action Classification**: Custom trained models for basketball actions
  - **Performance Metrics**: Jump height, release speed, shot accuracy, ball trajectory
  - **Recommendation Engine**: YouTube scraping for personalized training videos
  - **Real-time Processing**: Live video analysis with immediate feedback

### 4. Database (PostgreSQL)
- **Purpose**: Persistent data storage
- **Tables**:
  - Users (authentication)
  - Player profiles
  - Teams and training sessions
  - Videos and events
  - Analytics and recommendations

### 5. Cache/Queue (Redis)
- **Purpose**: Caching and background job processing
- **Features**:
  - Session caching
  - Celery job queue
  - Real-time data streaming

### 6. Object Storage (MinIO)
- **Purpose**: Video file storage
- **Features**:
  - S3-compatible API
  - Video upload and retrieval
  - Presigned URLs for secure access

## Data Flow

### 1. Enhanced Video Analysis Pipeline
```
Video Upload → MinIO Storage → AI Service → Pose Detection (MediaPipe) + Object Detection (YOLOv3) → Event Classification → Performance Metrics → Database Storage
```

### 2. AI-Powered Recommendation Flow
```
Player Weakness Detection → AI Analysis → YouTube Scraper → Personalized Training Videos → Frontend Dashboard
```

### 3. Real-time Processing with YOLOv3
```
Camera Stream → AI Service → Pose Detection + Object Detection → Event Detection → Performance Metrics → Backend API → Frontend Dashboard
```

### 4. Model Training Pipeline
```
Dataset Collection → Frame Extraction → Pose Extraction → YOLOv3 Training → Model Evaluation → AI Service Integration
```

## Security

### Authentication
- JWT tokens for API access
- Role-based access control (Player, Coach, Admin)
- Secure password hashing with bcrypt

### Data Protection
- Encrypted video transport (WebRTC)
- Secure file storage (MinIO with encryption)
- GDPR compliance for user data

## Scalability

### Horizontal Scaling
- Stateless backend services
- Load balancer for multiple instances
- Database read replicas

### Performance Optimization
- Redis caching for frequent queries
- Background job processing with Celery
- CDN for video content delivery

## Deployment

### Development
- Docker Compose for local development
- Hot reload for all services
- Integrated testing environment

### Production
- Kubernetes for orchestration
- CI/CD with GitHub Actions
- Monitoring with Prometheus/Grafana
- Logging with ELK stack

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **Queue**: Celery with Redis broker

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts, Chart.js
- **Video**: Video.js

### AI/ML
- **Computer Vision**: MediaPipe, OpenCV
- **Object Detection**: YOLOv3 (basketball, hoop, court, players)
- **Pose Detection**: MediaPipe (33 joint tracking)
- **Deep Learning**: TensorFlow, PyTorch
- **Recommendation Engine**: BeautifulSoup, YouTube Data API
- **Edge Inference**: TensorFlow Lite, ONNX

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login

### Players
- `GET /api/v1/players/{id}` - Get player profile
- `GET /api/v1/players/{id}/metrics` - Get performance metrics
- `POST /api/v1/players/{id}/recommendations` - Get training recommendations

### Videos
- `POST /api/v1/videos/upload-metadata` - Create video record
- `POST /api/v1/videos/{id}/confirm-upload` - Confirm upload
- `GET /api/v1/videos/{id}/analysis` - Get analysis results

### Events
- `POST /api/v1/events` - Create event
- `GET /api/v1/events/player/{id}` - Get player events

### AI Service
- `POST /api/v1/analyze` - Analyze video (pose + object detection)
- `POST /api/v1/recommend` - Get YouTube training recommendations
- `GET /api/v1/health` - Check model status and GPU availability

## Future Enhancements

### Phase 7-10 Roadmap
1. **Real-time Streaming**: WebRTC integration for live analysis
2. **Edge Computing**: Jetson Nano support for on-device processing
3. **Model Training**: Automated ML pipeline with Label Studio
4. **Production Deployment**: Kubernetes with monitoring
5. **Pilot Program**: Real-world validation with basketball teams

### Advanced Features
- Multi-camera support
- Team analytics and comparisons
- Injury prevention algorithms
- Nutrition and recovery tracking
- Mobile app for players
