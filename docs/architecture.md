# Basketball Performance System - Architecture

## System Overview

The Basketball Performance System is a comprehensive AI-powered platform that combines real-time video analysis, wearable data integration, and performance analytics to provide personalized training recommendations for basketball players.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Service    │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MinIO         │    │   PostgreSQL    │    │   Redis         │
│   (Object       │    │   (Database)    │    │   (Cache/Queue) │
│   Storage)      │    │   Port: 5432    │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
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

### 3. AI Service (Python)
- **Technology**: MediaPipe, YOLOv8, OpenCV, PyTorch
- **Purpose**: Computer vision and machine learning
- **Features**:
  - Pose detection and tracking
  - Object detection (ball, hoop, players)
  - Event classification (shots, jumps, sprints)
  - Performance metrics extraction

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

### 1. Video Analysis Pipeline
```
Video Upload → MinIO Storage → AI Service → Pose Detection → Event Classification → Database Storage
```

### 2. Wearable Data Integration
```
Apple Watch/HealthKit → Backend API → Time-series Storage → Analytics Engine
```

### 3. Real-time Processing
```
Camera Stream → WebRTC → AI Service → Event Detection → Backend API → Frontend Dashboard
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
- **Object Detection**: YOLOv8
- **Deep Learning**: PyTorch, TensorFlow
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
- `POST /api/v1/analyze` - Analyze video
- `GET /api/v1/health/models` - Check model status

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
