# 🚀 Quick Start Guide

**Get your Basketball AI system running in 15 minutes!**

---

## ⚡ Prerequisites Check

```bash
# Check Python version (need 3.11+)
python3.11 --version

# Check Node.js (need 18+)
node --version

# Check npm
npm --version

# Check Git
git --version
```

**Don't have them?**
```bash
# Install Python 3.11
sudo apt update && sudo apt install python3.11 python3.11-venv

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 🎯 Step 1: Backend Setup (5 minutes)

```bash
# Navigate to backend
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (takes 3-5 minutes)
pip install --upgrade pip
pip install -r requirements.txt

# DONE! Backend installed ✅
```

---

## 🎯 Step 2: Run Backend (1 minute)

```bash
# Make sure you're in backend folder with venv activated
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/backend
source venv/bin/activate

# Run the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**✅ You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     🚀 Starting Basketball AI Backend...
INFO:        GPU Available: False  (or True if you have GPU)
INFO:     ✅ Video processor ready!
```

**Test it:** Open http://localhost:8000 in browser
- Should see: `{"message": "Basketball AI Performance Analysis API", ...}`

**API Docs:** http://localhost:8000/docs

---

## 🎯 Step 3: Frontend Setup (5 minutes)

**Open a NEW terminal** (keep backend running!)

```bash
# Navigate to frontend
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/frontend

# Install dependencies (takes 2-3 minutes)
npm install

# DONE! Frontend installed ✅
```

---

## 🎯 Step 4: Run Frontend (1 minute)

```bash
# Make sure you're in frontend folder
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/frontend

# Run development server
npm run dev
```

**✅ You should see:**
```
  VITE v5.4.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

**Open:** http://localhost:5173

---

## 🎬 Step 5: Test the System!

1. **Open Dashboard:** http://localhost:5173
2. **You should see:**
   - 🏀 Basketball AI Performance Analysis header
   - Upload video section
   - Dashboard interface

3. **Test Upload:**
   - Drag and drop a short basketball video (5-10 seconds)
   - Or click to browse
   - Click "Analyze"

4. **See Results:**
   - Action classification
   - Performance metrics
   - AI recommendations

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `python3.11: command not found`
```bash
# Solution: Install Python 3.11
sudo apt install python3.11 python3.11-venv
```

**Problem:** `pip install` fails
```bash
# Solution 1: Upgrade pip
pip install --upgrade pip

# Solution 2: Install system dependencies
sudo apt install python3.11-dev build-essential

# Solution 3: Install one by one
pip install fastapi uvicorn python-multipart pydantic
```

**Problem:** Backend starts but crashes
```bash
# Check logs for errors
# Usually missing dependencies

# Reinstall dependencies
pip install -r requirements.txt --no-cache-dir
```

### Frontend Issues

**Problem:** `npm: command not found`
```bash
# Solution: Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Problem:** `npm install` fails
```bash
# Solution 1: Clear cache
npm cache clean --force
npm install

# Solution 2: Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Port 5173 already in use
```bash
# Solution: Kill existing process
kill -9 $(lsof -t -i:5173)

# Or use different port
npm run dev -- --port 5174
```

### Connection Issues

**Problem:** Frontend can't reach backend
```bash
# Check backend is running
curl http://localhost:8000/api/health

# Should return: {"status":"healthy",...}

# Check CORS settings in backend/app/main.py
# Should allow http://localhost:5173
```

---

## ✅ Success Checklist

- [ ] Backend installed (venv created, packages installed)
- [ ] Backend running (http://localhost:8000 works)
- [ ] API docs accessible (http://localhost:8000/docs)
- [ ] Frontend installed (node_modules created)
- [ ] Frontend running (http://localhost:5173 works)
- [ ] Dashboard loads (see Basketball AI header)
- [ ] Can upload video
- [ ] Can see analysis results

---

## 🎯 Next Steps

### 1. Test with Sample Video
- Record a 5-10 second basketball video with your phone
- Upload and test the analysis
- Verify you get results

### 2. Start Dataset Recording
```bash
# Create dataset folders
mkdir -p dataset/raw_videos/{shooting,dribbling,passing,defense,idle}

# Start recording 700+ videos (this is YOUR PRIORITY!)
```

### 3. Customize Frontend
- Edit `frontend/src/pages/Dashboard.tsx`
- Changes appear instantly with hot reload
- Make it yours!

---

## 🚀 Daily Development Workflow

**Terminal 1: Backend**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

**Now code!** Changes appear instantly!

---

## 📞 Need Help?

- **Can't start backend?** Check Python version, install dependencies
- **Can't start frontend?** Check Node version, clear npm cache
- **Other issues?** Check TROUBLESHOOTING.md
- **Still stuck?** Open GitHub issue

---

## 🎉 You're Ready!

Your Basketball AI system is now running! 

**Next priority:** Record 700+ basketball videos (this is 50% of project success!)

---

**Time to build something AMAZING! 🏀🚀**


