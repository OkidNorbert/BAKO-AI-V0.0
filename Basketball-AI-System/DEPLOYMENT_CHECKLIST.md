# ✅ Deployment Checklist

Use this checklist to ensure everything is set up correctly for your free deployment.

## Pre-Deployment

### Backend Setup
- [ ] Backend runs locally on `http://localhost:8000`
- [ ] Health check works: `curl http://localhost:8000/api/health`
- [ ] GPU is detected: `nvidia-smi` or `python -c "import torch; print(torch.cuda.is_available())"`
- [ ] Models are loaded correctly
- [ ] CORS settings updated in `backend/app/core/config.py`

### Frontend Setup
- [ ] Frontend builds successfully: `cd frontend && npm run build`
- [ ] Environment variables configured
- [ ] API URL points to Cloudflare tunnel (in production)

### Supabase Setup
- [ ] Supabase project created
- [ ] Database tables created (see `backend/supabase_setup.sql`)
- [ ] Storage bucket configured
- [ ] API keys saved securely

## Cloudflare Tunnel Setup

- [ ] Cloudflare account created
- [ ] `cloudflared` installed: `cloudflared --version`
- [ ] Authenticated: `cloudflared tunnel login`
- [ ] Tunnel created: `cloudflared tunnel create basketball-ai`
- [ ] Tunnel ID saved
- [ ] Config file created: `~/.cloudflared/config.yml`
- [ ] Tunnel tested: `cloudflared tunnel --config ~/.cloudflared/config.yml run basketball-ai`
- [ ] Tunnel URL noted (e.g., `https://api-xxx.trycloudflare.com`)

## Vercel Deployment

- [ ] Vercel account created
- [ ] Frontend code pushed to GitHub (optional but recommended)
- [ ] Vercel project created
- [ ] Environment variables set in Vercel:
  - [ ] `VITE_API_URL` = Your Cloudflare tunnel URL
  - [ ] `VITE_SUPABASE_URL` = Your Supabase URL
  - [ ] `VITE_SUPABASE_KEY` = Your Supabase key
- [ ] Frontend deployed successfully
- [ ] Vercel URL works and connects to backend

## Auto-Start Setup (Optional)

- [ ] Backend systemd service created
- [ ] Cloudflare tunnel systemd service created
- [ ] Services enabled: `sudo systemctl enable basketball-ai-backend cloudflared-tunnel`
- [ ] Services started: `sudo systemctl start basketball-ai-backend cloudflared-tunnel`
- [ ] Services tested after reboot

## Testing

### Backend Tests
- [ ] Health endpoint: `curl https://your-tunnel-url/api/health`
- [ ] CORS headers present
- [ ] Video upload works
- [ ] Analysis completes successfully
- [ ] WebSocket connections work (for real-time visualization)

### Frontend Tests
- [ ] Page loads without errors
- [ ] Can upload video
- [ ] Analysis results display correctly
- [ ] Charts render properly
- [ ] Real-time visualization works
- [ ] No console errors

### Integration Tests
- [ ] End-to-end video analysis works
- [ ] Results saved to Supabase
- [ ] Historical data loads
- [ ] AI recommendations display

## Monitoring

- [ ] Backend logs accessible: `journalctl -u basketball-ai-backend -f`
- [ ] Tunnel logs accessible: `journalctl -u cloudflared-tunnel -f`
- [ ] Vercel analytics enabled
- [ ] Error tracking set up (optional)

## Security

- [ ] Environment variables not committed to Git
- [ ] `.env` files in `.gitignore`
- [ ] Supabase keys kept secret
- [ ] CORS properly configured
- [ ] Rate limiting considered (for public demos)

## Documentation

- [ ] Deployment guide reviewed
- [ ] Team members have access to documentation
- [ ] Troubleshooting guide available
- [ ] Contact information updated

## Final Verification

- [ ] **Backend accessible via Cloudflare tunnel**
- [ ] **Frontend accessible via Vercel**
- [ ] **Full video analysis pipeline works**
- [ ] **System stable for 24+ hours**
- [ ] **GPU utilization acceptable**
- [ ] **No memory leaks or crashes**

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Backend not accessible | Check if running: `curl http://localhost:8000/api/health` |
| Tunnel not connecting | Verify config: `cloudflared tunnel info basketball-ai` |
| CORS errors | Check `CORS_ORIGINS` in backend config |
| Frontend can't connect | Verify `VITE_API_URL` in Vercel env vars |
| GPU not detected | Check CUDA: `nvidia-smi` |
| Services not starting | Check logs: `journalctl -u service-name -n 50` |

## Success Criteria

✅ **Deployment is successful when:**
- Frontend is live on Vercel
- Backend is accessible via Cloudflare tunnel
- Video analysis works end-to-end
- System runs stable for 24+ hours
- Zero cost (all free tiers)

---

**Last Updated:** $(date)
**Status:** Ready for deployment 🚀

