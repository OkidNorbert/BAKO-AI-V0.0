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
- Git

### Automated Setup (Recommended)

Use our automated setup script for the fastest setup:

```bash
# Clone the repository
git clone <your-repo-url>
cd "Final Year Project"

# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Check and install Docker if needed
- ✅ Create environment configuration files
- ✅ Start all services automatically
- ✅ Run health checks
- ✅ Display access URLs and credentials

### Manual Docker Setup

1. **Install Docker (if not already installed):**
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect

# On Kali Linux
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

2. **Start the application:**
```bash
# For development environment
sudo docker-compose -f infra/docker-compose.yml up --build -d

# For production environment (recommended)
sudo docker-compose --env-file .env -f infra/docker-compose.prod.yml up -d
```

3. **Access the application:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **AI Service:** http://localhost:8001
- **MinIO Console:** http://localhost:9001
- **Grafana (Production):** http://localhost:3001
- **Prometheus (Production):** http://localhost:9090

### Docker Commands

```bash
# Start all services (development)
sudo docker-compose -f infra/docker-compose.yml up --build -d

# Start all services (production)
sudo docker-compose --env-file .env -f infra/docker-compose.prod.yml up -d

# Stop all services
sudo docker-compose -f infra/docker-compose.yml down
sudo docker-compose -f infra/docker-compose.prod.yml down

# View service logs
sudo docker-compose -f infra/docker-compose.yml logs [service-name]
sudo docker-compose -f infra/docker-compose.prod.yml logs [service-name]

# Check service status
sudo docker-compose -f infra/docker-compose.yml ps
sudo docker-compose -f infra/docker-compose.prod.yml ps

# Rebuild specific service
sudo docker-compose -f infra/docker-compose.yml up --build -d [service-name]

# Access service shell
sudo docker-compose -f infra/docker-compose.yml exec [service-name] /bin/bash
```

### Health Checks

```bash
# Test Backend Health
curl http://localhost:8000/health

# Test Frontend
curl http://localhost:3000

# Test AI Service
curl http://localhost:8001/health

# Test MinIO
curl http://localhost:9001
```

## 📁 Project Structure

```
Final Year Project/
├── backend/                 # FastAPI backend service
│   ├── app/
│   │   ├── api/v1/endpoints/  # API endpoints
│   │   ├── core/              # Core functionality (database, config)
│   │   ├── models/            # SQLAlchemy models
│   │   └── main.py            # FastAPI application
│   ├── requirements.txt
│   └── Dockerfile            # Backend Docker configuration
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   ├── contexts/          # React contexts
│   │   └── App.tsx            # Main application
│   ├── package.json
│   └── Dockerfile            # Frontend Docker configuration
├── ai_service/              # AI/ML service for video analysis
│   ├── service/
│   ├── requirements.txt
│   └── Dockerfile            # AI service Docker configuration
├── infra/                   # Infrastructure and deployment
│   ├── docker-compose.yml    # Development environment
│   ├── docker-compose.prod.yml # Production environment
│   └── nginx.conf           # Nginx configuration
├── setup.sh                 # Automated setup script
├── .env                     # Environment variables
└── README.md
```

## 🛠 Technology Stack

- **Backend:** FastAPI + PostgreSQL + SQLAlchemy
- **Frontend:** React + Vite + TailwindCSS + TypeScript
- **AI Service:** Python + MediaPipe + OpenCV
- **Database:** PostgreSQL (production) / SQLite (development)
- **Authentication:** JWT tokens with role-based access
- **Storage:** MinIO for file storage
- **Queue:** Redis + Celery for background tasks
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx (production)
- **Monitoring:** Grafana + Prometheus (production)
- **API:** RESTful API with comprehensive endpoints
- **UI/UX:** Responsive design with dark/light mode support

## 📋 Current Status

### ✅ **Completed Features**
- **Backend API:** FastAPI server with authentication and database models
- **Database:** SQLite with automatic table creation and migrations
- **Authentication:** JWT-based login/register with role-based access (Player/Coach)
- **Frontend:** React application with responsive design and dark/light mode
- **User Management:** Player and coach dashboards with different functionalities
- **Team Management:** Coach can add, edit, and manage team players
- **Real-time Updates:** Auto-refresh functionality for live data
- **API Integration:** Comprehensive REST API with error handling

### 🔧 **Recently Fixed Issues**
- **Docker Setup:** Implemented complete Docker containerization for all services
- **Frontend 404 Issues:** Fixed frontend serving with proper Nginx configuration
- **Dependency Conflicts:** Resolved Python 3.13 compatibility issues with Docker
- **Port Conflicts:** Implemented production-ready service orchestration
- **Database Connection:** Switched to PostgreSQL for production with SQLite fallback
- **Storage Integration:** Added MinIO for file storage and video uploads
- **AI Service:** Integrated MediaPipe and OpenCV for video analysis
- **Monitoring:** Added Grafana and Prometheus for production monitoring

### 🚀 **Currently Working**
- **Frontend:** http://localhost:3000 (Nginx-served production build)
- **Backend:** http://localhost:8000 (FastAPI server with PostgreSQL)
- **AI Service:** http://localhost:8001 (Video analysis with MediaPipe)
- **MinIO Console:** http://localhost:9001 (File storage management)
- **Database:** PostgreSQL with automatic table creation and migrations
- **Authentication:** JWT-based login/register system fully functional
- **Role-based Access:** Player and coach dashboards working
- **Monitoring:** Grafana (http://localhost:3001) and Prometheus (http://localhost:9090)

### ⚠️ **Known Issues & Limitations**
- **Mock Data Removed:** All mock data has been removed - features show empty states when no real data exists
- **Wearable Integration:** Wearable device integration is not yet implemented
- **AI Model Training:** Pre-trained models need to be downloaded on first AI service startup
- **Production Secrets:** Default credentials should be changed for production deployment
- **Resource Requirements:** Docker setup requires sufficient system resources (4GB+ RAM recommended)

### 🔄 **In Progress**
- Optimizing PostgreSQL queries for better performance
- Implementing proper error handling for empty data states
- Adding more comprehensive team management features
- Improving responsive design for mobile devices
- Enhancing AI video analysis accuracy
- Implementing real-time WebSocket connections

## ✨ Key Features

### **🔐 Authentication & User Management**
- JWT-based authentication system
- Role-based access control (Player/Coach)
- Secure login and registration
- User profile management
- Session management with auto-refresh

### **👥 Player Dashboard**
- Personal performance metrics
- Training recommendations
- Video upload and analysis
- Wearable data integration
- Progress tracking over time
- Dark/light mode support

### **🏀 Coach Dashboard**
- Team management interface
- Player roster management
- Team analytics and statistics
- Training plan creation and management
- Session scheduling and monitoring
- Communication tools (announcements, messages)
- Event scheduling and calendar

### **📊 Analytics & Reporting**
- Real-time performance metrics
- Team statistics and comparisons
- Player progress tracking
- Training effectiveness analysis
- Export capabilities for reports

### **🔄 Real-time Features**
- Auto-refresh functionality
- Live data updates
- Real-time notifications
- Smart refresh indicators
- Responsive design for all devices

### **🎨 User Interface**
- Modern, responsive design
- Dark and light mode themes
- Mobile-friendly interface
- Intuitive navigation
- Role-based menu systems
- Loading states and error handling

### **🔧 Technical Features**
- RESTful API architecture
- SQLite database with automatic migrations
- Comprehensive error handling
- CORS support for cross-origin requests
- TypeScript for type safety
- TailwindCSS for styling

## 🔧 Configuration

### Backend Configuration
The backend uses SQLite database with automatic table creation. No additional configuration is required for basic setup.

### Frontend Configuration
The frontend automatically detects the backend URL based on the current host:
- Local development: `http://localhost:8000`
- Network access: `http://10.7.11.79:8000` (or your network IP)

### Environment Variables (Optional)
Create a `.env` file in the frontend directory if you need custom configuration:

```bash
# Frontend .env
VITE_BACKEND_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
source venv/bin/activate
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Manual Testing
```bash
# Test backend health
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Test frontend
curl http://localhost:3000
```

## 🚀 Getting Started

### First Time Setup (Docker - Recommended)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "Final Year Project"
   ```

2. **Run the automated setup:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Or manually start the services:**
   ```bash
   # For production (recommended)
   sudo docker-compose --env-file .env -f infra/docker-compose.prod.yml up -d
   
   # For development
   sudo docker-compose -f infra/docker-compose.yml up --build -d
   ```

4. **Open your browser** and go to `http://localhost:3000`

### First Time Setup (Local Development - Alternative)

If you prefer to run services locally without Docker:

1. **Start the backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open your browser** and go to `http://localhost:3000`

### Creating Your First Account
1. Click "Sign Up" on the login page
2. Choose your role: "Player" or "Coach"
3. Fill in your details and create an account
4. Login and explore the dashboard

### For Coaches
- Access team management features
- Add and manage team players
- View team analytics and reports
- Create training plans and sessions
- Use communication tools

### For Players
- View personal performance metrics
- Access training recommendations
- Upload videos for analysis
- Track progress over time

## 🐛 Troubleshooting

### Docker Issues
- **Port conflicts:** If you get "port already allocated" errors, stop existing services:
  ```bash
  sudo docker-compose -f infra/docker-compose.yml down
  sudo docker-compose -f infra/docker-compose.prod.yml down
  ```
- **Permission denied:** Add your user to the docker group:
  ```bash
  sudo usermod -aG docker $USER
  # Log out and back in
  ```
- **Docker not running:** Start Docker service:
  ```bash
  sudo systemctl start docker
  sudo systemctl enable docker
  ```
- **Service won't start:** Check logs for specific errors:
  ```bash
  sudo docker-compose -f infra/docker-compose.yml logs [service-name]
  ```

### Common Issues
- **Backend won't start:** Check if all Docker services are running with `sudo docker-compose ps`
- **Frontend 404 errors:** Ensure the frontend service is healthy and the `dist` directory is built
- **Database connection errors:** Verify PostgreSQL container is running and healthy
- **CORS errors:** The backend is configured to allow requests from the frontend

### Getting Help
- Check Docker service status: `sudo docker-compose ps`
- View service logs: `sudo docker-compose logs [service-name]`
- Test service health endpoints:
  - Backend: `curl http://localhost:8000/health`
  - Frontend: `curl http://localhost:3000`
  - AI Service: `curl http://localhost:8001/health`

## 📄 License

This project is licensed under the MIT License.

## 📝 API Flow Diagrams

Here are some diagrams illustrating the key API interactions and data flows within the Basketball Performance System.

### 🔐 User Authentication Flow

```mermaid
graph TD
    subgraph "User Authentication Flow"
        A[Frontend] -->|1. POST /api/v1/auth/signup or login| B(Backend API)
        B -->|2. Validates credentials, generates JWT| C{Database (Users)}
        C -->|3. Stores/Retrieves User| B
        B -->|4. Returns JWT Token + User Info| A
        A -->|5. Stores JWT locally, Sets Auth Header| A
    end
```

### 🎬 Video Upload & Analysis Flow

```mermaid
graph TD
    subgraph "Video Upload & Analysis Flow"
        D[Frontend (VideoUpload)] -->|1. POST /api/v1/videos/upload-metadata| E(Backend API)
        E -->|2. Generates MinIO Presigned URL| F{MinIO (Object Storage)}
        F -->|3. Returns Presigned URL| E
        E -->|4. Returns Presigned URL + Video ID| D
        D -->|5. PUT Video File to Presigned URL| F
        F -->|6. Video Stored| F
        D -->|7. POST /api/v1/videos/{id}/confirm-upload| E
        E -->|8. Triggers Background AI Analysis Task| G(Celery/Redis Queue)
        G -->|9. AI Service Polls Queue| H[AI Service]
        H -->|10. GET Video from MinIO| F
        F -->|11. Returns Video Stream| H
        H -->|12. Performs Pose Detection, Object Detection, Event Classification| H
        H -->|13. POST Analysis Results to Backend| E
        E -->|14. Stores Analysis Results| C{Database}
        E -->|15. Notifies Frontend (via WebSocket/Polling)| D
        D -->|16. Displays Analysis Results| D
    end
```

### 📊 Player/Team Analytics Flow

```mermaid
graph TD
    subgraph "Player/Team Analytics Flow"
        I[Frontend (Dashboard)] -->|1. GET /api/v1/analytics/performance/{player_id}| J(Backend API)
        J -->|2. Queries Player Performance Data| C{Database}
        C -->|3. Returns Raw Data| J
        J -->|4. Processes Metrics & Generates Recommendations| J
        J -->|5. Returns Performance Metrics + Recommendations| I
        I -->|6. Displays Analytics| I
    end
```
