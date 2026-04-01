# NetPulse Quick Deployment Script

Quick reference for deploying to Vercel + Railway:

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)

## 5-Minute Setup

### 1. Backend (Railway)
```bash
# Push code to GitHub first
git push

# Go to railway.app → New Project → Deploy GitHub repo
# Select your repository → Railway auto-deploys
# Copy your URL from dashboard
```

### 2. Frontend (Vercel)
```bash
# Go to vercel.com → Add New → Project
# Select repository
# Root Directory: client
# Wait for deploy
# Add Environment Variable: VITE_API_URL=YOUR_RAILWAY_URL
# Done! 🎉
```

### 3. Test
Visit your Vercel URL and test network speeds!

## Environment Variable Checklist

- [ ] Created `client/.env.local` (for local dev)
- [ ] Created `client/.env.production` (for Vercel)
- [ ] Added `VITE_API_URL` to Vercel dashboard
- [ ] Backend is running and accessible

## Files Created/Modified

✅ `client/.env.local` - Local development config
✅ `client/.env.production` - Production config  
✅ `vercel.json` - Vercel build config
✅ `client/src/hooks/useNetworkMonitor.js` - Updated to use API_URL
✅ `DEPLOYMENT_GUIDE.md` - Full deployment instructions

## Common Issues

**"Failed to connect to backend"**
- Verify `VITE_API_URL` env var is set in Vercel
- Test backend URL in browser: `https://your-url.com/ping`

**"WebSocket error"**
- Ensure backend has WebSocket support
- Railway & Render support it by default

**Need Help?**
See `DEPLOYMENT_GUIDE.md` for detailed instructions
