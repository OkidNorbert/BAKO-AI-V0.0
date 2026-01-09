# ⚡ Quick Deploy Guide

## 5-Minute Setup

### Option A: Interactive Setup (Recommended)
```bash
# Run the interactive setup script
./setup-cloudflare.sh

# This will guide you through:
# 1. Authentication
# 2. Tunnel creation
# 3. Domain setup
# 4. Configuration file creation
```

### Option B: Manual Setup

#### 1. Install Cloudflare Tunnel
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

#### 2. Authenticate (IMPORTANT - Do this first!)
```bash
# This will open a browser to authenticate with Cloudflare
cloudflared tunnel login

# Select your domain or use a random subdomain
# This creates the origin certificate automatically
```

#### 3. Create Tunnel (After authentication)
```bash
# Now you can create the tunnel
cloudflared tunnel create basketball-ai

# Save the tunnel ID that's displayed
# Example output: Created tunnel basketball-ai with id abc123def456...
```

#### 4. Configure Tunnel
```bash
mkdir -p ~/.cloudflared
# Edit config.yml (see cloudflared-config.yml.example)
# Or use the interactive script: ./setup-cloudflare.sh
nano ~/.cloudflared/config.yml
```

**See `CLOUDFLARE_SETUP.md` for detailed domain setup instructions.**

### 5. Start Backend
```bash
cd Basketball-AI-System/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

### 6. Start Tunnel
```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run basketball-ai &
```

### 7. Deploy Frontend to Vercel
```bash
cd Basketball-AI-System/frontend
npm install -g vercel
vercel login
vercel --prod
```

### 8. Set Environment Variables in Vercel
Go to Vercel Dashboard → Your Project → Settings → Environment Variables:
- `VITE_API_URL` = Your Cloudflare tunnel URL (e.g., `https://api-xxx.trycloudflare.com`)
- `VITE_SUPABASE_URL` = Already configured
- `VITE_SUPABASE_KEY` = Already configured

## That's it! 🎉

Your app is now live at your Vercel URL!

## Auto-Start on Boot (Optional)

See `DEPLOYMENT.md` for systemd service setup.

