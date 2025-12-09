# ✅ Backend Deployment - Ready!

## Live Analysis Confirmed ✅

The live analysis system is fully functional:

- **WebSocket Endpoint**: `/ws/analyze` ✅
- **Action Detection**: Fine-tuned model support ✅
- **Real-time Metrics**: Jump height, speed, form score, stability ✅
- **Annotated Frames**: Base64 encoded for live display ✅
- **Frame Processing**: 16-frame buffer with 10fps throttling ✅

## Quick Deploy

### Option 1: Development Mode (Recommended for Testing)

```bash
cd Basketball-AI-System/backend
./deploy.sh
```

This will:
- Activate virtual environment
- Install dependencies
- Verify components
- Start backend on `http://localhost:8000`

### Option 2: Production Mode (Systemd Service)

```bash
# Copy systemd service file
sudo cp Basketball-AI-System/backend/systemd/bako-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable bako-backend

# Start service
sudo systemctl start bako-backend

# Check status
sudo systemctl status bako-backend

# View logs
journalctl -u bako-backend -f
```

### Option 3: Manual Start

```bash
cd Basketball-AI-System/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Verify Deployment

### 1. Health Check
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_loaded": true,
  "gpu_available": true/false
}
```

### 2. WebSocket Test
```bash
# Test WebSocket connection (requires wscat or similar)
wscat -c ws://localhost:8000/ws/analyze
```

### 3. API Docs
Visit: `http://localhost:8000/docs`

## Live Analysis Endpoints

- **WebSocket**: `ws://localhost:8000/ws/analyze`
- **Health**: `http://localhost:8000/api/health`
- **API Docs**: `http://localhost:8000/docs`
- **Video Upload**: `POST http://localhost:8000/api/v1/analyze`

## Features Enabled

✅ **Fine-tuned Model Loading**
- Automatically detects and loads trained models
- Falls back to pre-trained if trained model not found
- Logs test accuracy from model_info.json

✅ **Action Filtering**
- Only detects enabled actions
- Confidence thresholds per action
- Free throw: 0.3 threshold (main training data)
- Dribbling: 0.5 threshold (reduces false positives)

✅ **Real-time Processing**
- 16-frame buffer for action classification
- 10fps frame throttling for performance
- Real-time metrics calculation
- Annotated frame generation

✅ **Skill-Based Analysis**
- Individual action analysis
- Form validation per action
- Skill level assessment
- Action-specific recommendations

## Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -i :8000

# Kill existing process
pkill -f "uvicorn app.main:app"

# Check logs
journalctl -u bako-backend -n 50
```

### Model not loading
```bash
# Check if model directory exists
ls -la Basketball-AI-System/models/best_model/

# Check backend logs for model loading messages
# Should see: "✅ Trained VideoMAE model loaded from ..."
```

### WebSocket connection fails
```bash
# Check if backend is running
curl http://localhost:8000/api/health

# Check CORS settings in backend/app/core/config.py
# Should allow your frontend origin
```

## Next Steps

1. **Start Backend**: Use one of the deployment options above
2. **Test Live Analysis**: Open frontend and test `/live` page
3. **Monitor Logs**: Watch for action detection and metrics
4. **Deploy Frontend**: Update `VITE_API_URL` to point to backend

## Production Deployment

For production with Cloudflare Tunnel:

1. **Start Backend** (using systemd service)
2. **Configure Cloudflare Tunnel** (see `DEPLOYMENT.md`)
3. **Update Frontend** `VITE_API_URL` to tunnel URL
4. **Deploy Frontend** to Vercel

---

**Status**: ✅ Ready for deployment
**Last Updated**: 2025-12-09

