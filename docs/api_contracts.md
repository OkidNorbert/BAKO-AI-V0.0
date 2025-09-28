# Basketball Performance System - API Contracts

## Base URL
- **Backend API**: `http://localhost:8000/api/v1`
- **AI Service**: `http://localhost:8001/api/v1`

## Authentication

### Sign Up
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123!",
  "role": "player"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "player"
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "player"
}
```

## Players

### Get Player Profile
```http
GET /api/v1/players/{player_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "height_cm": 185.0,
  "weight_kg": 80.0,
  "position": "PG",
  "team_id": 1
}
```

### Get Player Metrics
```http
GET /api/v1/players/{player_id}/metrics?start=2023-12-01&end=2023-12-31
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "shooting_accuracy": 0.75,
  "jump_height_avg": 0.8,
  "sprint_speed_avg": 4.2,
  "workload_score": 85.5,
  "sessions_count": 12
}
```

### Get Training Recommendations
```http
POST /api/v1/players/{player_id}/recommendations
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "lookback_days": 14
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": 1,
      "type": "shooting",
      "title": "Corner 3-Point Practice",
      "description": "30 reps at game-speed, 3x/week",
      "priority": "high",
      "rationale": "Your corner 3 accuracy is 25% below team average"
    },
    {
      "id": 2,
      "type": "conditioning",
      "title": "Sprint Intervals",
      "description": "10x 40-yard dashes with 2min rest",
      "priority": "medium",
      "rationale": "Sprint speed has decreased 0.3s over 2 weeks"
    }
  ]
}
```

## Videos

### Upload Video Metadata
```http
POST /api/v1/videos/upload-metadata
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "session_id": 1,
  "filename": "training_session_20231215.mp4",
  "size": 104857600
}
```

**Response:**
```json
{
  "video_id": 1,
  "upload_url": "http://minio:9000/basketball-videos/1/training_session_20231215.mp4",
  "expires_in": 3600
}
```

### Confirm Video Upload
```http
POST /api/v1/videos/{video_id}/confirm-upload
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "Video upload confirmed, processing started"
}
```

### Get Video Analysis
```http
GET /api/v1/videos/{video_id}/analysis
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "video_id": 1,
  "status": "completed",
  "keypoints": [
    {
      "time": 2.1,
      "players": [
        {
          "id": "player_1",
          "keypoints": {
            "0": [100, 150],
            "11": [120, 140],
            "12": [80, 140]
          }
        }
      ]
    }
  ],
  "detections": [
    {
      "time": 2.1,
      "objects": [
        {
          "label": "ball",
          "bbox": [200, 100, 50, 50],
          "confidence": 0.92
        }
      ]
    }
  ],
  "events": [
    {
      "time": 2.12,
      "type": "shot_attempt",
      "confidence": 0.78,
      "meta": {
        "player": "player_1",
        "shot_prob": 0.78
      }
    }
  ]
}
```

## Events

### Create Event
```http
POST /api/v1/events
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "player_id": "player_1",
  "session_id": 1,
  "timestamp": 1690000000.12,
  "type": "shot_attempt",
  "meta": {
    "shot_prob": 0.84,
    "x": 14.2,
    "y": 5.3
  }
}
```

**Response:**
```json
{
  "id": 1,
  "player_id": "player_1",
  "session_id": 1,
  "timestamp": 1690000000.12,
  "type": "shot_attempt",
  "meta": {
    "shot_prob": 0.84,
    "x": 14.2,
    "y": 5.3
  }
}
```

### Get Player Events
```http
GET /api/v1/events/player/{player_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "player_id": "player_1",
    "session_id": 1,
    "timestamp": 1690000000.12,
    "type": "shot_attempt",
    "meta": {
      "shot_prob": 0.84,
      "x": 14.2,
      "y": 5.3
    }
  }
]
```

## AI Service

### Analyze Video
```http
POST /api/v1/analyze
Content-Type: application/json

{
  "video_url": "http://minio:9000/basketball-videos/1/training_session.mp4",
  "session_id": 1,
  "video_id": 1,
  "fps": 10
}
```

**Response:**
```json
{
  "video_id": 1,
  "session_id": 1,
  "keypoints": [
    {
      "time": 2.1,
      "players": [
        {
          "id": "player_1",
          "keypoints": {
            "0": [100, 150],
            "11": [120, 140],
            "12": [80, 140]
          }
        }
      ]
    }
  ],
  "detections": [
    {
      "time": 2.1,
      "objects": [
        {
          "label": "ball",
          "bbox": [200, 100, 50, 50],
          "confidence": 0.92
        }
      ]
    }
  ],
  "events": [
    {
      "time": 2.12,
      "type": "shot_attempt",
      "confidence": 0.78,
      "meta": {
        "player": "player_1"
      }
    }
  ],
  "status": "completed"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## WebSocket Events (Future)

### Real-time Event Stream
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/events');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time event:', data);
};
```

**Event Types:**
- `shot_detected` - Shot attempt detected
- `jump_detected` - Jump detected
- `sprint_detected` - Sprint detected
- `fatigue_warning` - Fatigue level warning
- `form_correction` - Form correction suggestion

## Rate Limiting

- **API Calls**: 1000 requests per hour per user
- **Video Uploads**: 10 uploads per hour per user
- **Analysis Requests**: 5 concurrent analyses per user

## Pagination

### List Endpoints
```http
GET /api/v1/events/player/{player_id}?page=1&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```
