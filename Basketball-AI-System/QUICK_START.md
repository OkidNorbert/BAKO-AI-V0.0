# 🚀 Quick Start Guide

## **Start Backend:**

### **Option 1: Using the startup script (Recommended)**
```bash
cd Basketball-AI-System/backend
./start_backend.sh
```

### **Option 2: Manual start**
```bash
cd Basketball-AI-System/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Wait for:**
```
✅ Video processor ready!
INFO:     Application startup complete.
```

---

## **Start Frontend:**

```bash
cd Basketball-AI-System/frontend
npm install  # First time only
npm run dev
```

**Frontend will run on:** `http://localhost:5173`

---

## **✅ Verify Everything Works:**

### **1. Test Backend:**
```bash
curl http://localhost:8000/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_loaded": true,
  "gpu_available": true
}
```

### **2. Test Frontend:**
- Open: `http://localhost:5173`
- Upload a video
- Should see analysis results

---

## **🔧 Troubleshooting:**

### **Backend won't start:**
1. Check virtual environment: `source venv/bin/activate`
2. Install dependencies: `pip install -r requirements.txt`
3. Check Python version: `python3 --version` (should be 3.10+)

### **Frontend can't connect:**
1. Verify backend is running: `curl http://localhost:8000/api/health`
2. Check backend terminal for errors
3. Verify CORS settings in `backend/app/core/config.py`

### **Port 8000 already in use:**
```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>
```

---

## **📝 Notes:**

- Backend must be running before frontend can work
- Backend takes ~10-30 seconds to load models on first start
- GPU is optional (will use CPU if GPU not available)
- Models will auto-download on first use if not present

---

**Need help?** Check `FRONTEND_BACKEND_CONNECTION.md` for detailed troubleshooting.
