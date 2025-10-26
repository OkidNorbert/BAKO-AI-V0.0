# 📹 How to Upload Multiple Videos for Batch Processing

## ✅ The Code is Fixed!

The UI now supports multiple video uploads. Here's how to use it:

---

## 🎯 Step-by-Step Instructions

### **1. Make Sure UI is Running**
```bash
cd /home/okidi6/Documents/Final-Year-Project/ai_service
source venv/bin/activate
python training/yolo_training_ui.py
```

### **2. Open Browser**
- Go to: `http://localhost:8002`
- Open the **🎬 Frame Extraction** tab (should be first tab)

### **3. Upload Multiple Videos**

#### **Method 1: Using Ctrl Key (Recommended)**
1. Click **"📹 Click to upload basketball video(s)"** button
2. The file browser dialog will open
3. **Click on the FIRST video file** (single click, don't double-click)
4. **Hold down the Ctrl key** (or Cmd on Mac)
5. **While holding Ctrl**, click on additional video files one by one
6. You should see multiple files highlighted/selected in the dialog
7. Click **"Open"** button

#### **Method 2: Using Shift Key**
1. Open the file dialog
2. Click on the **first** video file
3. **Hold down the Shift key**
4. Click on the **last** video file
5. This will select all files between the first and last
6. Click **"Open"** button

#### **Method 3: Select All**
1. Open the file dialog
2. Press **Ctrl+A** to select all files
3. Click **"Open"** button

---

## 🔍 What Should Happen

### **After Selecting Multiple Videos:**
You should see:
```
✓ 3 videos selected for batch processing

Selected Videos:
1. video1.mp4 (5.23 MB)
2. video2.mp4 (4.56 MB)
3. video3.mp4 (6.12 MB)
```

### **If You See Only 1 Video:**
```
❌ Video selected: video1.mp4
(No list shown)
```

This means you didn't select multiple files in the dialog.

---

## 🐛 Troubleshooting

### **Issue 1: Only One Video Selected**
**Problem:** The file dialog only lets you select one file

**Solution:** 
- Make sure you're holding **Ctrl** (or **Cmd** on Mac) while clicking
- Don't double-click (this opens the file)
- Single click, hold Ctrl, single click other files

### **Issue 2: File Dialog Closes Immediately**
**Problem:** Double-clicking opens the file instead of selecting it

**Solution:**
- Only use **single clicks**
- First click to select
- Hold Ctrl
- Additional single clicks to add more files

### **Issue 3: Can't See If Multiple Files Are Selected**
**Problem:** Can't tell if multiple files are highlighted

**Solution:**
- In the file dialog, selected files should be highlighted/colored
- Multiple selected files should all show as highlighted
- Before clicking "Open", you should see 3+ files highlighted

---

## 🧪 Test It Now

1. **Restart the UI** (to load the updated code):
```bash
# Stop current instance (Ctrl+C)
cd /home/okidi6/Documents/Final-Year-Project/ai_service
source venv/bin/activate
python training/yolo_training_ui.py
```

2. **Open browser:** http://localhost:8002

3. **Click "Upload Video(s)"**

4. **In the file dialog:**
   - Click video file #1
   - Hold **Ctrl**
   - Click video file #2 (should also highlight)
   - Click video file #3 (should also highlight)
   - You should see 3 files highlighted before clicking "Open"

5. **Click "Open"**

6. **You should see:**
   - "3 videos selected for batch processing"
   - List of all 3 videos with file sizes

---

## ✅ Success Indicators

**If it works, you'll see:**
```
✓ 3 videos selected for batch processing

Selected Videos:
1. video1.mp4 (5.23 MB)
2. video2.mp4 (4.56 MB)
3. video3.mp4 (6.12 MB)
```

Then when you click **"Extract Frames"**:
- It will say: "Processing 3 videos in batch..."
- Then show results for all 3 videos

---

## 🎉 That's It!

The key is holding **Ctrl** while clicking multiple files in the file browser dialog!

