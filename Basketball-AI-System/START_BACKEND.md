# 🚀 How to Start the Backend

## **Quick Start:**

### **1. Start Backend Server:**

```bash
cd Basketball-AI-System/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
✅ Video processor ready!
```

### **2. Verify Backend is Running:**

Open in browser: `http://localhost:8000/docs`

You should see the FastAPI documentation page.

### **3. Test Health Endpoint:**

```bash
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_loaded": true,
  "gpu_available": true
}
```

---

## **Troubleshooting:**

### **Error: "Failed to initialize video processor"**

This means the models failed to load. Check:
1. ✅ Model files exist: `models/best_model/` or `models/best_model.pth`
2. ✅ GPU drivers installed: `nvidia-smi`
3. ✅ Dependencies installed: `pip install -r requirements.txt`

### **Error: "ERR_CONNECTION_REFUSED" (Frontend)**

**Causes:**
1. ❌ Backend not running
2. ❌ Backend crashed during startup
3. ❌ Wrong port (frontend expects port 8000)

**Solution:**
1. Check if backend is running: `ps aux | grep uvicorn`
2. Start backend (see Quick Start above)
3. Verify: `curl http://localhost:8000/api/health`

### **Error: "Path variable not associated"**

**Fixed!** This was a scoping issue in `action_classifier.py` - already resolved.

---

## **Starting Both Services:**

### **Terminal 1 - Backend:**
```bash
cd Basketball-AI-System/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Terminal 2 - Frontend:**
```bash
cd Basketball-AI-System/frontend
npm install  # First time only
npm run dev
```

**Frontend will run on:** `http://localhost:5173` (or similar)

---

## **✅ Success Indicators:**

### **Backend Running:**
- ✅ `INFO: Uvicorn running on http://0.0.0.0:8000`
- ✅ `✅ Video processor ready!`
- ✅ `✅ All models loaded successfully!`
- ✅ Health check returns `{"status": "healthy"}`

### **Frontend Connected:**
- ✅ No `ERR_CONNECTION_REFUSED` errors
- ✅ Video upload works
- ✅ Analysis results appear

---

## **Common Issues:**

### **1. Port Already in Use:**
```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

### **2. Models Not Loading:**
- Check `models/best_model/` exists
- If not, use pre-trained VideoMAE (automatic fallback)

### **3. CORS Errors:**
- Backend CORS is configured for `localhost:5173`
- If using different port, update `backend/app/core/config.py`

---

## **Quick Test:**

```bash
# Test backend
curl http://localhost:8000/api/health

# Test frontend (in browser)
http://localhost:5173
```

**Both should work!** ✅

