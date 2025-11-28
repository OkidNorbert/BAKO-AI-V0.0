# 🚀 Free Deployment Guide

## Architecture Overview

```
┌─────────────────┐
│   Vercel        │  ← Frontend (React)
│   (Free Tier)   │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼─────────────────────────┐
│   Cloudflare Tunnel              │  ← Secure tunnel
│   (Free)                         │
└────────┬─────────────────────────┘
         │
┌────────▼────────┐
│  Your PC        │  ← Backend (FastAPI)
│  Alienware GPU  │     + AI Models
│  localhost:8000 │
└─────────────────┘

┌─────────────────┐
│   Supabase      │  ← Database & Storage
│   (Free Tier)   │
└─────────────────┘
```

## Prerequisites

1. **Cloudflare Account** (free): https://dash.cloudflare.com/sign-up
2. **Vercel Account** (free): https://vercel.com/signup
3. **Supabase Account** (free): Already configured ✅
4. **Cloudflare Tunnel** (cloudflared): Install on your PC

## Step 1: Install Cloudflare Tunnel

### Linux (Your System)
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

### Windows (Alternative)
Download from: https://github.com/cloudflare/cloudflared/releases

## Step 2: Authenticate Cloudflare Tunnel

```bash
# Login to Cloudflare
cloudflared tunnel login

# This will open a browser window to authenticate
# Select your domain (or use a subdomain)
```

## Step 3: Create and Configure Tunnel

```bash
# Create a new tunnel
cloudflared tunnel create basketball-ai

# This will output a tunnel ID - save it!
# Example: abc123def456...

# Create config file
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Add this configuration:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/student/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Backend API
  - hostname: api.yourdomain.com  # Or use a random subdomain
    service: http://localhost:8000
  
  # Catch-all rule (must be last)
  - service: http_status:404
```

## Step 4: Run Tunnel

```bash
# Test the tunnel
cloudflared tunnel --config ~/.cloudflared/config.yml run basketball-ai

# Or run in background
nohup cloudflared tunnel --config ~/.cloudflared/config.yml run basketball-ai > cloudflared.log 2>&1 &
```

## Step 5: Update Backend CORS

Update `backend/app/core/config.py` to include your Vercel domain:

```python
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "https://your-app.vercel.app",  # Add your Vercel domain
    "https://*.vercel.app",  # Allow all Vercel preview deployments
]
```

## Step 6: Deploy Frontend to Vercel

### Option A: Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

### Option B: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `Basketball-AI-System/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://qpvkuhcmhntsamgabovo.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 7: Update Frontend API URL

Update `frontend/src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## Step 8: Start Backend on Your PC

```bash
cd Basketball-AI-System/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Step 9: Create Systemd Service (Optional - Auto-start)

Create `/etc/systemd/system/basketball-ai-backend.service`:

```ini
[Unit]
Description=Basketball AI Backend
After=network.target

[Service]
Type=simple
User=student
WorkingDirectory=/home/student/Documents/Final-Year-Project/Basketball-AI-System/backend
Environment="PATH=/home/student/Documents/Final-Year-Project/Basketball-AI-System/backend/venv/bin"
ExecStart=/home/student/Documents/Final-Year-Project/Basketball-AI-System/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable basketball-ai-backend
sudo systemctl start basketball-ai-backend
```

## Step 10: Create Cloudflare Tunnel Service

Create `/etc/systemd/system/cloudflared-tunnel.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=student
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/student/.cloudflared/config.yml run basketball-ai
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable cloudflared-tunnel
sudo systemctl start cloudflared-tunnel
```

## Testing

1. **Backend Health Check**: `curl https://api.yourdomain.com/api/health`
2. **Frontend**: Visit your Vercel URL
3. **Upload a video** and test the full pipeline

## Monitoring

### Check Backend Status
```bash
sudo systemctl status basketball-ai-backend
```

### Check Tunnel Status
```bash
sudo systemctl status cloudflared-tunnel
```

### View Logs
```bash
# Backend logs
journalctl -u basketball-ai-backend -f

# Tunnel logs
journalctl -u cloudflared-tunnel -f
```

## Troubleshooting

### Tunnel Not Connecting
- Check if backend is running: `curl http://localhost:8000/api/health`
- Verify tunnel config: `cloudflared tunnel info basketball-ai`
- Check tunnel logs: `journalctl -u cloudflared-tunnel -n 50`

### CORS Errors
- Ensure Vercel domain is in CORS_ORIGINS
- Restart backend after config changes

### GPU Not Detected
- Check CUDA: `nvidia-smi`
- Verify PyTorch GPU: `python -c "import torch; print(torch.cuda.is_available())"`

## Cost Breakdown

- **Cloudflare Tunnel**: FREE (unlimited bandwidth)
- **Vercel**: FREE (100GB bandwidth/month)
- **Supabase**: FREE (500MB database, 1GB storage)
- **Your PC/GPU**: Already owned ✅

**Total Monthly Cost: $0** 🎉

## Security Notes

1. **Cloudflare Tunnel** provides:
   - DDoS protection
   - SSL/TLS encryption
   - No open ports on your router

2. **Environment Variables**:
   - Never commit `.env` files
   - Use Vercel's environment variables
   - Keep Supabase keys secret

3. **Rate Limiting**:
   - Consider adding rate limits for public demos
   - Cloudflare provides basic DDoS protection

## Next Steps

1. Set up custom domain (optional)
2. Add monitoring/alerting
3. Set up automated backups
4. Consider adding a CDN for static assets

