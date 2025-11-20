# 🚨 START BACKEND NOW

## **The backend is NOT running!**

Your frontend is trying to connect to `http://localhost:8000` but getting `ERR_CONNECTION_REFUSED`.

---

## **✅ SOLUTION: Start the Backend**

### **Open a NEW terminal and run:**

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **OR use the startup script:**

```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/backend
./start_backend.sh
```

---

## **⏳ Wait for these messages:**

```
✅ Video processor ready!
✅ All models loaded successfully!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**This takes 10-30 seconds on first start.**

---

## **✅ Verify Backend is Running:**

### **In another terminal, test:**

```bash
curl http://localhost:8000/api/health
```

**You should see:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_loaded": true,
  "gpu_available": true
}
```

---

## **🔄 Then Refresh Your Frontend**

Once the backend is running:
1. Go back to your browser
2. Refresh the page (F5)
3. The connection errors should be gone!

---

## **📝 Keep the Backend Terminal Open**

**IMPORTANT:** The backend must stay running. Don't close the terminal where you started it!

- ✅ Keep backend terminal open
- ✅ Keep frontend terminal open
- ✅ Both should be running simultaneously

---

## **🔍 If Backend Won't Start:**

### **Check for errors in the terminal:**

1. **Missing dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Port already in use:**
   ```bash
   pkill -f uvicorn
   # Then start again
   ```

3. **Python version:**
   ```bash
   python3 --version  # Should be 3.10+
   ```

4. **Virtual environment:**
   ```bash
   source venv/bin/activate
   ```

---

## **✅ Success Checklist:**

- [ ] Backend terminal shows: `Uvicorn running on http://0.0.0.0:8000`
- [ ] Backend terminal shows: `✅ Video processor ready!`
- [ ] `curl http://localhost:8000/api/health` returns JSON
- [ ] Frontend can connect (no more ERR_CONNECTION_REFUSED)
- [ ] Frontend can load history (even if empty array)

---

**Once backend is running, refresh your frontend and it should work!** ✅

