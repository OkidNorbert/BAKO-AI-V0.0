# 🌐 Cloudflare Tunnel Setup - Complete Guide

## Step-by-Step Domain Setup

### Prerequisites
- Cloudflare account (free): https://dash.cloudflare.com/sign-up
- A domain (optional - you can use Cloudflare's free subdomain)

---

## Option 1: Using Your Own Domain (Recommended)

### Step 1: Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click **"Add a Site"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Select **Free Plan**
5. Cloudflare will scan your DNS records
6. Update your domain's nameservers at your registrar to Cloudflare's nameservers
   - Example: `alice.ns.cloudflare.com` and `bob.ns.cloudflare.com`
7. Wait for DNS propagation (5-30 minutes)

### Step 2: Authenticate Cloudflare Tunnel

```bash
# This will open a browser window
cloudflared tunnel login

# Select your domain from the list
# Example: yourdomain.com
```

This creates the origin certificate at: `~/.cloudflared/cert.pem`

### Step 3: Create Tunnel

```bash
# Now create the tunnel (this will work after authentication)
cloudflared tunnel create basketball-ai

# Output will show:
# Created tunnel basketball-ai with id abc123def456...
# Save this tunnel ID!
```

### Step 4: Create DNS Record

```bash
# Create a DNS record pointing to your tunnel
cloudflared tunnel route dns basketball-ai api.yourdomain.com

# This creates: api.yourdomain.com → your tunnel
```

### Step 5: Configure Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>  # Replace with actual tunnel ID from Step 3
credentials-file: /home/student/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Backend API
  - hostname: api.yourdomain.com
    service: http://localhost:8000
  
  # Catch-all rule (must be last)
  - service: http_status:404
```

**Replace:**
- `<YOUR_TUNNEL_ID>` with the ID from Step 3 (e.g., `abc123def456...`)
- `<TUNNEL_ID>` in credentials-file path with the same ID

### Step 6: Run Tunnel

```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run basketball-ai
```

Your backend will be accessible at: `https://api.yourdomain.com`

---

## Option 2: Using Cloudflare's Free Subdomain (No Domain Needed)

### Step 1: Authenticate (No Domain Required)

```bash
# This will give you a random subdomain
cloudflared tunnel login
```

When prompted, you can skip domain selection or use a random subdomain.

### Step 2: Create Tunnel

```bash
cloudflared tunnel create basketball-ai
```

### Step 3: Get Quick Tunnel URL (Temporary)

For quick testing, you can use:

```bash
# This gives you a temporary URL (changes each time)
cloudflared tunnel --url http://localhost:8000

# Output: https://random-name.trycloudflare.com
# Use this URL for testing
```

### Step 4: Configure for Permanent Setup

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/student/.cloudflared/<TUNNEL_ID>.json

ingress:
  - service: http://localhost:8000
```

### Step 5: Run Tunnel

```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run basketball-ai
```

---

## Complete Configuration Example

Here's a complete example with all fields filled in:

### Example: Using Domain `basketball-ai.com`

**Step 1: After authentication and tunnel creation, you get:**
```
Tunnel ID: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Step 2: Create DNS record:**
```bash
cloudflared tunnel route dns basketball-ai api.basketball-ai.com
```

**Step 3: Create `~/.cloudflared/config.yml`:**
```yaml
tunnel: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
credentials-file: /home/student/.cloudflared/abc123def456ghi789jkl012mno345pqr678stu901vwx234yz.json

ingress:
  - hostname: api.basketball-ai.com
    service: http://localhost:8000
  - service: http_status:404
```

**Step 4: Your API URL will be:**
```
https://api.basketball-ai.com
```

---

## Troubleshooting

### Error: "Cannot determine default origin certificate path"

**Solution:** You need to authenticate first:
```bash
cloudflared tunnel login
```

### Error: "Tunnel not found"

**Solution:** List your tunnels:
```bash
cloudflared tunnel list
```

### Error: "Permission denied" on config file

**Solution:** Check file permissions:
```bash
chmod 600 ~/.cloudflared/config.yml
```

### Finding Your Tunnel ID

```bash
# List all tunnels
cloudflared tunnel list

# Output:
# ID                                    NAME           CREATED
# abc123...                            basketball-ai  2025-11-24T18:00:00Z
```

### Finding Your Credentials File

After creating a tunnel, the credentials file is at:
```
~/.cloudflared/<TUNNEL_ID>.json
```

Example:
```
~/.cloudflared/abc123def456ghi789jkl012mno345pqr678stu901vwx234yz.json
```

---

## Quick Reference: All Required Inputs

### For Domain Setup:
1. **Domain name**: `yourdomain.com` (or use Cloudflare subdomain)
2. **Subdomain**: `api` (for `api.yourdomain.com`)
3. **Tunnel name**: `basketball-ai`
4. **Tunnel ID**: Generated after `cloudflared tunnel create`
5. **Credentials file path**: `~/.cloudflared/<TUNNEL_ID>.json`
6. **Backend URL**: `http://localhost:8000`

### For Vercel Environment Variables:
1. **VITE_API_URL**: `https://api.yourdomain.com` (or your Cloudflare tunnel URL)
2. **VITE_SUPABASE_URL**: `https://qpvkuhcmhntsamgabovo.supabase.co`
3. **VITE_SUPABASE_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Verification

### Test Backend via Tunnel
```bash
# Replace with your actual URL
curl https://api.yourdomain.com/api/health

# Should return:
# {"status":"healthy","version":"1.0.0","models_loaded":true,"gpu_available":true}
```

### Check Tunnel Status
```bash
cloudflared tunnel info basketball-ai
```

---

## Next Steps

After tunnel is running:
1. ✅ Backend accessible via tunnel URL
2. ✅ Update Vercel environment variable `VITE_API_URL`
3. ✅ Deploy frontend to Vercel
4. ✅ Test end-to-end video analysis

---

**Need Help?** Check `DEPLOYMENT.md` for full deployment guide.

