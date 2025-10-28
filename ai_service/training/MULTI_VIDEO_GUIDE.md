# 🎬 Multi-Video Frame Extraction Guide

## ✅ **New Feature Added: Multiple Video Upload**

### **🎯 What's New:**
- **Multiple Video Selection** - Upload multiple basketball videos at once
- **Batch Processing** - Extract frames from all videos in one operation
- **Area-Specific Extraction** - Same 4 basketball areas for all videos
- **Detailed Results** - See results per video and total summary

---

## 🚀 **How to Use Multi-Video Extraction:**

### **Step 1: Select Multiple Videos**
1. **Click "Upload Basketball Video(s)"**
2. **Hold Ctrl (Windows/Linux) or Cmd (Mac)**
3. **Click multiple video files** to select them
4. **Click "Open"** to confirm selection

### **Step 2: Choose Basketball Areas**
- ✅ **🏀 Ball** - Extract basketball objects
- ✅ **👤 Player** - Extract players
- ✅ **📏 Court Lines** - Extract court boundaries
- ✅ **🏀 Hoop** - Extract hoops

### **Step 3: Set Parameters**
- **Max Frames per Area**: 10-200 (default: 50)
- This applies to EACH video, so total frames = videos × areas × max_frames

### **Step 4: Extract Frames**
- **Click "🎯 Extract Frames"**
- System processes all videos sequentially
- Shows progress and results

---

## 📊 **Expected Results:**

### **Single Video Example:**
```
✅ Successfully extracted 200 frames
📊 Results:
• Total Videos: 1
• Successful: 1
• Total Frames: 200

🎯 Area Breakdown:
• ball: 50 frames
• player: 50 frames
• court_lines: 50 frames
• hoop: 50 frames
```

### **Multiple Videos Example:**
```
✅ Successfully processed 3/3 videos, extracted 600 total frames
📊 Results:
• Total Videos: 3
• Successful: 3
• Total Frames: 600

🎯 Area Breakdown:
• ball: 150 frames
• player: 150 frames
• court_lines: 150 frames
• hoop: 150 frames

📹 Per-Video Results:
• video1.mp4: 200 frames
• video2.mp4: 200 frames
• video3.mp4: 200 frames
```

---

## 🎯 **Benefits of Multi-Video Extraction:**

### **✅ More Training Data:**
- **Diverse Scenarios** - Different courts, lighting, angles
- **Balanced Dataset** - More examples of each basketball area
- **Better Model Performance** - More data = better training

### **✅ Efficient Workflow:**
- **One Operation** - Process all videos at once
- **Consistent Settings** - Same areas and parameters for all
- **Detailed Tracking** - See results per video

### **✅ Quality Control:**
- **Per-Video Results** - Identify which videos work best
- **Error Handling** - Continue processing even if some videos fail
- **Progress Tracking** - See which video is being processed

---

## 🏀 **Perfect for Your Basketball AI Project:**

### **✅ Diverse Training Data:**
- **Multiple Games** - Different basketball games
- **Various Courts** - Indoor/outdoor, different lighting
- **Different Players** - Various playing styles
- **Various Situations** - Different game scenarios

### **✅ Balanced Dataset:**
- **Equal Representation** - All 4 areas in all videos
- **Consistent Quality** - Same extraction parameters
- **Large Dataset** - More frames for better training

### **✅ Easy Management:**
- **Simple Upload** - Just select multiple files
- **Clear Results** - See exactly what was extracted
- **Error Recovery** - Continue even if some videos fail

---

## 💡 **Pro Tips:**

### **For Best Results:**
1. **Use Similar Videos** - Same resolution and quality
2. **Include Variety** - Different courts, lighting, players
3. **Check Results** - Review per-video results
4. **Adjust Settings** - Increase max_frames if needed

### **File Management:**
1. **Organize Videos** - Keep videos in same folder
2. **Name Consistently** - Use clear naming convention
3. **Check Formats** - Use MP4, AVI, or MOV
4. **Size Consideration** - Larger videos = more processing time

### **Extraction Strategy:**
1. **Start Small** - Test with 2-3 videos first
2. **Monitor Progress** - Watch the extraction process
3. **Check Results** - Verify frame quality
4. **Scale Up** - Add more videos once working

---

## 🎉 **Ready to Use!**

**The multi-video extraction feature is now live in your simplified UI!**

- **URL**: `http://localhost:8003`
- **Feature**: Multiple video upload with Ctrl/Cmd + Click
- **Result**: Balanced dataset from multiple basketball videos

**🏀 Perfect for building a comprehensive basketball AI training dataset!**
