# 🦙 LLaMA 3.1 Setup Guide - Open-Source AI Coach

## ✅ **WHY LLaMA 3.1?**

**BEST CHOICE for your project:**
- ✅ **100% Open-source** - No proprietary restrictions
- ✅ **Completely FREE** - No API costs
- ✅ **Runs Offline** - No internet needed after download
- ✅ **Smart** - Comparable to GPT-3.5/4 quality
- ✅ **Privacy** - All data stays on your machine
- ✅ **No API Keys** - No payment required

---

## 📦 **INSTALLATION:**

### **Step 1: Install Dependencies**
```bash
cd backend
source venv/bin/activate  # or your virtual environment

# Install transformers and accelerate
pip install transformers torch accelerate bitsandbytes
```

### **Step 2: Choose Model Size**

**Option A: LLaMA 3.1 8B (Recommended for most users)**
- **Size:** ~16GB download
- **RAM:** 16GB+ recommended
- **VRAM:** 8GB+ GPU recommended (or use CPU)
- **Speed:** Fast inference
- **Quality:** Excellent

**Option B: LLaMA 3.1 70B (Best quality, needs more resources)**
- **Size:** ~140GB download
- **RAM:** 64GB+ recommended
- **VRAM:** 40GB+ GPU recommended
- **Speed:** Slower inference
- **Quality:** Outstanding (better than GPT-4 in some tasks)

### **Step 3: Get Hugging Face Access Token (Free)**

LLaMA models require access approval from Meta:

1. Go to: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct
2. Click "Agree and access repository"
3. Accept Meta's license
4. Create Hugging Face account (free)
5. Go to: https://huggingface.co/settings/tokens
6. Create a token (read access)
7. Set environment variable:
   ```bash
   export HF_TOKEN="your-huggingface-token"
   ```

### **Step 4: Login to Hugging Face**
```bash
huggingface-cli login
# Enter your token when prompted
```

---

## 🚀 **USAGE:**

### **Automatic (Recommended):**
The system will automatically try to load LLaMA 3.1 first!

```python
# In video_processor.py, it tries:
1. LLaMA 3.1 (if available)
2. DeepSeek API (if API key set)
3. OpenAI API (if API key set)
4. Fallback (rule-based, always works)
```

### **Manual Setup:**
```python
from app.models.ai_coach import AICoach

# Use 8B model (recommended)
coach = AICoach(
    model_type="llama",
    model_name="meta-llama/Meta-Llama-3.1-8B-Instruct"
)

# Or use 70B model (if you have enough RAM/VRAM)
coach = AICoach(
    model_type="llama",
    model_name="meta-llama/Meta-Llama-3.1-70B-Instruct"
)
```

---

## 💾 **STORAGE REQUIREMENTS:**

| Model | Download Size | RAM Needed | VRAM Needed (GPU) |
|-------|--------------|------------|-------------------|
| **8B** | ~16GB | 16GB+ | 8GB+ (or CPU) |
| **70B** | ~140GB | 64GB+ | 40GB+ |

**Your RTX 4080 (16GB VRAM):**
- ✅ Can run **8B model** easily
- ⚠️ Can run **70B model** with quantization (4-bit)

---

## ⚡ **PERFORMANCE:**

### **With GPU (RTX 4080):**
- **8B Model:** ~2-5 seconds per response
- **70B Model (quantized):** ~5-10 seconds per response

### **With CPU:**
- **8B Model:** ~10-30 seconds per response
- **70B Model:** Not recommended on CPU

---

## 🔧 **QUANTIZATION (For 70B on 16GB GPU):**

If you want to use 70B model on your RTX 4080:

```python
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3.1-70B-Instruct",
    quantization_config=quantization_config,
    device_map="auto"
)
```

This reduces VRAM usage from 140GB to ~40GB (fits on RTX 4080!)

---

## 📝 **MODEL NAMES:**

Available LLaMA 3.1 models:
- `meta-llama/Meta-Llama-3.1-8B-Instruct` ⭐ Recommended
- `meta-llama/Meta-Llama-3.1-70B-Instruct` (needs more resources)
- `meta-llama/Meta-Llama-3.1-8B` (base model, no instruction tuning)
- `meta-llama/Meta-Llama-3.1-70B` (base model)

**Use `-Instruct` versions** - they're better for chat/coaching!

---

## 🎯 **ADVANTAGES:**

### **vs OpenAI:**
- ✅ **FREE** (OpenAI costs money)
- ✅ **Offline** (no internet needed)
- ✅ **Privacy** (data stays local)
- ✅ **Open-source** (can modify)

### **vs DeepSeek:**
- ✅ **Offline** (DeepSeek needs internet)
- ✅ **No API limits** (DeepSeek has rate limits)
- ✅ **Privacy** (DeepSeek sends data to servers)

### **vs Local GPT-2:**
- ✅ **Much smarter** (LLaMA 3.1 is state-of-the-art)
- ✅ **Better conversations** (instruction-tuned)
- ✅ **More context** (handles longer conversations)

---

## 🐛 **TROUBLESHOOTING:**

### **Error: "Model not found"**
```bash
# Make sure you're logged in to Hugging Face
huggingface-cli login
```

### **Error: "Out of memory"**
- Use 8B model instead of 70B
- Enable quantization (4-bit)
- Close other applications

### **Error: "CUDA out of memory"**
- Use CPU mode: `device_map="cpu"`
- Or use smaller model (8B)
- Or enable quantization

### **Slow inference:**
- Use GPU if available
- Use 8B model instead of 70B
- Reduce `max_new_tokens` parameter

---

## ✅ **SUCCESS INDICATORS:**

When LLaMA 3.1 loads successfully, you'll see:
```
🚀 Loading LLaMA 3.1: meta-llama/Meta-Llama-3.1-8B-Instruct
   This may take a few minutes on first run...
✅ LLaMA 3.1 loaded successfully on cuda
   🎉 100% Open-source, runs offline, completely FREE!
```

---

## 🎉 **RESULT:**

Your AI Coach now uses **LLaMA 3.1** - the best open-source LLM available!

- ✅ **No API costs**
- ✅ **No internet needed**
- ✅ **Complete privacy**
- ✅ **Smart responses**
- ✅ **100% open-source**

**Perfect for your academic project!** 🎓

