# 🔌 Frontend-Backend Connection Guide

## **Problem: `ERR_CONNECTION_REFUSED`**

This error means the frontend cannot connect to the backend API.

---

## **✅ Quick Fix:**

### **Step 1: Check if Backend is Running**

```bash
# Check if backend process is running
ps aux | grep uvicorn

# Check if port 8000 is listening
netstat -tlnp | grep 8000
# OR
ss -tlnp | grep 8000
```

### **Step 2: Test Backend Health**

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

### **Step 3: If Backend is NOT Running, Start It:**

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

## **🔍 Troubleshooting:**

### **1. Backend Crashed During Startup**

**Symptoms:**
- Process exists but not responding
- Error in terminal: "Failed to initialize video processor"

**Solution:**
1. Stop the backend: `Ctrl+C` or `kill <PID>`
2. Check logs for errors
3. Restart backend
4. If models fail to load, it will use pre-trained VideoMAE (automatic fallback)

### **2. Port Already in Use**

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000
# OR
fuser 8000/tcp

# Kill it
kill -9 <PID>
```

### **3. Backend Running but Not Responding**

**Check:**
```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test docs
curl http://localhost:8000/docs
```

**If not responding:**
- Backend may have crashed silently
- Restart backend
- Check backend terminal for errors

### **4. CORS Errors**

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
- Backend CORS is configured for `localhost:5173`
- If frontend runs on different port, update `backend/app/core/config.py`:
  ```python
  CORS_ORIGINS: List[str] = [
      "http://localhost:3000",
      "http://localhost:5173",  # Vite default
      "http://localhost:8080",
      "http://localhost:<YOUR_PORT>",  # Add your port
  ]
  ```

### **5. Wrong API URL in Frontend**

**Check:** `frontend/src/services/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

**If backend runs on different port:**
- Set environment variable: `VITE_API_URL=http://localhost:8000`
- Or update the default in `api.ts`

---

## **✅ Verification Checklist:**

- [ ] Backend process is running (`ps aux | grep uvicorn`)
- [ ] Port 8000 is listening (`netstat -tlnp | grep 8000`)
- [ ] Health endpoint responds (`curl http://localhost:8000/api/health`)
- [ ] Docs page loads (`http://localhost:8000/docs`)
- [ ] Frontend API URL is correct (`http://localhost:8000`)
- [ ] CORS allows frontend origin
- [ ] No firewall blocking port 8000

---

## **🚀 Starting Both Services:**

### **Terminal 1 - Backend:**
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

### **Terminal 2 - Frontend:**
```bash
cd Basketball-AI-System/frontend
npm run dev
```

**Frontend will run on:** `http://localhost:5173`

---

## **🔧 Quick Test:**

```bash
# Test backend
curl http://localhost:8000/api/health

# Test from frontend (in browser console)
fetch('http://localhost:8000/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Both should return:** `{"status": "healthy", ...}`

---

## **📝 Common Issues:**

### **Issue: Backend starts but crashes immediately**

**Check:**
1. Model files exist: `ls models/best_model/`
2. GPU available: `nvidia-smi`
3. Dependencies: `pip install -r requirements.txt`
4. Python version: `python3 --version` (should be 3.10+)

### **Issue: Frontend shows connection refused but backend is running**

**Check:**
1. Backend is listening on `0.0.0.0:8000` (not just `127.0.0.1`)
2. Firewall allows port 8000
3. Frontend API URL is correct
4. Browser console for CORS errors

---

## **✅ Success Indicators:**

### **Backend:**
- ✅ `INFO: Uvicorn running on http://0.0.0.0:8000`
- ✅ `✅ Video processor ready!`
- ✅ `✅ All models loaded successfully!`
- ✅ Health check returns JSON

### **Frontend:**
- ✅ No `ERR_CONNECTION_REFUSED` errors
- ✅ Video upload works
- ✅ Analysis results appear
- ✅ No CORS errors in console

---

**If still having issues, check backend terminal logs for specific errors!**

