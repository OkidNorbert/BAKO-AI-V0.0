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
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- SQLite (included with Python)

### Development Setup

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd "Final Year Project"
```

2. **Start Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. **Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Backend Health: http://localhost:8000/health

### Development Commands

```bash
# Start Backend (in backend directory)
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Frontend (in frontend directory)
npm run dev

# Install Backend Dependencies
cd backend && pip install -r requirements.txt

# Install Frontend Dependencies
cd frontend && npm install

# Test Backend Health
curl http://localhost:8000/health

# Test Frontend
curl http://localhost:3000
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
│   └── venv/                  # Python virtual environment
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   ├── contexts/          # React contexts
│   │   └── App.tsx            # Main application
│   ├── package.json
│   └── node_modules/          # Node.js dependencies
├── infra/                   # Infrastructure and deployment
│   └── docker-compose.yml
└── README.md
```

## 🛠 Technology Stack

- **Backend:** FastAPI + SQLite + SQLAlchemy
- **Frontend:** React + Vite + TailwindCSS + TypeScript
- **Authentication:** JWT tokens with role-based access
- **Database:** SQLite with automatic table creation
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
- **Database Connection:** Switched from PostgreSQL to SQLite for easier setup
- **Dependencies:** Installed all required Python packages
- **SQL Compatibility:** Fixed SQLite-specific query issues
- **Storage Manager:** Implemented lazy initialization to prevent startup errors
- **Login Issues:** Resolved authentication and session management
- **CORS Issues:** Fixed cross-origin requests between frontend and backend

### 🚀 **Currently Working**
- **Frontend:** http://localhost:3000 (Vite development server)
- **Backend:** http://localhost:8000 (FastAPI server)
- **Database:** SQLite with all tables created automatically
- **Authentication:** Login/register system fully functional
- **Role-based Access:** Player and coach dashboards working

### ⚠️ **Known Issues & Limitations**
- **SQLite Compatibility:** Some complex SQL queries may need optimization for SQLite
- **Mock Data Removed:** All mock data has been removed - features show empty states when no real data exists
- **AI Service:** Video analysis features are not yet connected to AI services
- **Wearable Integration:** Wearable device integration is not yet implemented
- **File Uploads:** Video upload functionality needs MinIO or alternative storage setup

### 🔄 **In Progress**
- Optimizing SQLite queries for better performance
- Implementing proper error handling for empty data states
- Adding more comprehensive team management features
- Improving responsive design for mobile devices

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

### First Time Setup
1. **Clone the repository**
2. **Start the backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
3. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Open your browser** and go to `http://localhost:3000`

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

### Common Issues
- **Backend won't start:** Make sure all dependencies are installed with `pip install -r requirements.txt`
- **Frontend won't start:** Run `npm install` in the frontend directory
- **Database errors:** The SQLite database is created automatically on first run
- **CORS errors:** The backend is configured to allow requests from the frontend

### Getting Help
- Check the terminal output for error messages
- Ensure both backend (port 8000) and frontend (port 3000) are running
- Test the backend health endpoint: `curl http://localhost:8000/health`

## 📄 License

This project is licensed under the MIT License.
