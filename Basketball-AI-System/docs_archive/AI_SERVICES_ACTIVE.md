# 🤖 Active AI Services in Basketball AI System

## **Current AI Services Overview:**

Your system uses **multiple AI models** working together to analyze basketball videos:

---

## **1. 🎯 Player Detection - YOLOv11**
**Status:** ✅ **ACTIVE**
- **Model:** YOLOv11 (nano version - `yolo11n.pt`)
- **Purpose:** Detects and tracks basketball players in video frames
- **Technology:** Ultralytics YOLOv11 (latest version)
- **Location:** `backend/app/models/yolo_detector.py`
- **GPU Support:** ✅ Yes (CUDA)
- **Cost:** FREE (open-source)

---

## **2. 🦴 Pose Estimation - MediaPipe Pose**
**Status:** ✅ **ACTIVE**
- **Model:** MediaPipe Pose (Heavy model - best accuracy)
- **Purpose:** Extracts 33 body keypoints (x, y, z coordinates) per frame
- **Technology:** Google MediaPipe
- **Location:** `backend/app/models/pose_extractor.py`
- **GPU Support:** ✅ Yes (via TensorFlow Lite)
- **Cost:** FREE (open-source)

---

## **3. 🎬 Action Classification - VideoMAE**
**Status:** ✅ **ACTIVE**
- **Model:** VideoMAE (Vision Transformer for video)
- **Base Model:** `MCG-NJU/videomae-base-finetuned-kinetics`
- **Trained Model:** `models/best_model/` (if available)
- **Purpose:** Classifies basketball actions (shooting, dribbling, passing, etc.)
- **Technology:** Hugging Face Transformers
- **Location:** `backend/app/models/action_classifier.py`
- **Classes:** 7 actions (free_throw_shot, 2point_shot, 3point_shot, dribbling, passing, defense, idle)
- **GPU Support:** ✅ Yes (CUDA)
- **Cost:** FREE (open-source)

---

## **4. 📊 Performance Metrics Engine**
**Status:** ✅ **ACTIVE**
- **Type:** Rule-based AI (algorithmic analysis)
- **Purpose:** Calculates performance metrics from pose data:
  - Jump height
  - Movement speed
  - Form score
  - Reaction time
  - Pose stability
  - Energy efficiency
- **Location:** `backend/app/models/metrics_engine.py`
- **Cost:** FREE (no external API)

---

## **5. 🎯 Shot Outcome Detection**
**Status:** ✅ **ACTIVE**
- **Type:** Hybrid AI (form-based prediction + reaction analysis)
- **Purpose:** Detects if a shot was made or missed
- **Methods:**
  1. Form-based prediction (statistical)
  2. Player reaction analysis (body language)
  3. Ball trajectory (placeholder - requires ball detection)
- **Location:** `backend/app/models/shot_outcome_detector.py`
- **Cost:** FREE (no external API)

---

## **6. 🤖 AI Coach (LLM for Recommendations)**
**Status:** ✅ **ACTIVE** (with fallback chain)

### **Priority Order (Automatic Selection):**

#### **Option 1: LLaMA 3.1** ⭐ **BEST!**
- **Status:** Tries first (if Hugging Face authenticated)
- **Models:**
  - **LLaMA 3.1 70B** (if VRAM ≥ 40GB)
  - **LLaMA 3.1 8B** (if VRAM < 40GB or CPU)
- **Technology:** Meta LLaMA 3.1 (via Hugging Face Transformers)
- **Cost:** ✅ **100% FREE** (open-source, runs offline)
- **Privacy:** ✅ **100% Private** (no data sent to external servers)
- **Requirements:** Hugging Face account + model access approval

#### **Option 2: DeepSeek API**
- **Status:** Tries if LLaMA not available
- **Model:** `deepseek-chat`
- **Technology:** DeepSeek API
- **Cost:** 💰 **FREE/Cheap** (generous free tier)
- **Requirements:** `DEEPSEEK_API_KEY` environment variable

#### **Option 3: OpenAI GPT**
- **Status:** Tries if LLaMA and DeepSeek not available
- **Model:** `gpt-4o-mini`
- **Technology:** OpenAI API
- **Cost:** 💰 **Paid** (~$0.15 per 1M tokens)
- **Requirements:** `OPENAI_API_KEY` environment variable

#### **Option 4: Rule-Based Fallback**
- **Status:** ✅ **ALWAYS AVAILABLE** (if all LLMs fail)
- **Type:** Algorithmic recommendations
- **Cost:** ✅ **FREE** (no API needed)
- **Quality:** Good, but less conversational than LLM

**Location:** `backend/app/models/ai_coach.py`

---

## **📋 Summary Table:**

| AI Service | Status | Technology | Cost | GPU Support |
|------------|--------|------------|------|-------------|
| **YOLOv11** | ✅ Active | Ultralytics | FREE | ✅ Yes |
| **MediaPipe Pose** | ✅ Active | Google | FREE | ✅ Yes |
| **VideoMAE** | ✅ Active | Hugging Face | FREE | ✅ Yes |
| **Metrics Engine** | ✅ Active | Algorithmic | FREE | N/A |
| **Shot Outcome** | ✅ Active | Hybrid AI | FREE | N/A |
| **AI Coach (LLaMA)** | 🔄 Auto-select | Meta LLaMA 3.1 | FREE | ✅ Yes |
| **AI Coach (DeepSeek)** | 🔄 Fallback | DeepSeek API | FREE/Cheap | N/A |
| **AI Coach (OpenAI)** | 🔄 Fallback | OpenAI API | Paid | N/A |
| **AI Coach (Fallback)** | ✅ Always | Rule-based | FREE | N/A |

---

## **🔍 How to Check Which AI Coach is Active:**

### **Method 1: Check Backend Logs**
When backend starts, look for:
```
✅ AI Coach initialized with llama:meta-llama/Meta-Llama-3.1-8B-Instruct
```
OR
```
✅ AI Coach initialized with deepseek:deepseek-chat
```
OR
```
✅ AI Coach initialized with openai:gpt-4o-mini
```
OR
```
✅ AI Coach initialized with fallback mode
```

### **Method 2: Check Environment Variables**
```bash
# Check if API keys are set
echo $DEEPSEEK_API_KEY
echo $OPENAI_API_KEY
echo $HF_TOKEN
```

### **Method 3: Test API Endpoint**
```bash
curl http://localhost:8000/api/health
```

---

## **💡 Current Configuration:**

Based on your setup, the system will:
1. ✅ **Try LLaMA 3.1 first** (if Hugging Face authenticated)
2. ✅ **Fall back to DeepSeek** (if `DEEPSEEK_API_KEY` set)
3. ✅ **Fall back to OpenAI** (if `OPENAI_API_KEY` set)
4. ✅ **Use rule-based** (always works, no API needed)

**Most likely active:** Rule-based fallback (unless you've set up API keys or Hugging Face authentication)

---

## **🚀 To Enable LLaMA 3.1 (Recommended):**

1. **Get Hugging Face account:** https://huggingface.co
2. **Request model access:** https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct
3. **Authenticate:**
   ```bash
   huggingface-cli login
   # OR
   export HF_TOKEN=your_token_here
   ```
4. **Restart backend** - LLaMA 3.1 will load automatically!

---

## **✅ All Core AI Services Are Active:**

- ✅ Player Detection (YOLOv11)
- ✅ Pose Estimation (MediaPipe)
- ✅ Action Classification (VideoMAE)
- ✅ Performance Metrics (Algorithmic)
- ✅ Shot Outcome Detection (Hybrid)
- ✅ AI Coach (LLM or Rule-based)

**Your system is fully functional!** 🎉

