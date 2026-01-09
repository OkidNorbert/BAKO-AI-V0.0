# 🚀 Quick Deployment Reference

## Current Deployment Status

✅ **Backend**: Running on `http://localhost:8000`  
✅ **Tunnel**: `https://pickup-studying-tells-cattle.trycloudflare.com`  
✅ **GPU**: NVIDIA GeForce RTX 4080 SUPER  

---

## Start Services

**Terminal 1 - Backend:**
```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System
./scripts/start-backend.sh
```

**Terminal 2 - Tunnel:**
```bash
cd /home/student/Documents/Final-Year-Project/Basketball-AI-System
./scripts/start-tunnel-quick.sh
```

---

## Vercel Environment Variables

Add to your Vercel project:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://pickup-studying-tells-cattle.trycloudflare.com` |
| `VITE_SUPABASE_URL` | `https://qpvkuhcmhntsamgabovo.supabase.co` |
| `VITE_SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (see config.py) |

---

## Health Check

```bash
# Local
curl http://localhost:8000/api/health

# Via Tunnel
curl https://pickup-studying-tells-cattle.trycloudflare.com/api/health
```

---

## ⚠️ Important Notes

- **Temporary URL**: The tunnel URL changes each restart
- **Keep Running**: Both services must stay running
- **For Production**: Use permanent tunnel setup (see CLOUDFLARE_SETUP.md)

---

See [walkthrough.md](file:///home/student/.gemini/antigravity/brain/f3d5682a-b497-490c-ac77-82369d0e30d6/walkthrough.md) for full deployment details.
