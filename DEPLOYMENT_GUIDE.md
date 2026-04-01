# Vercel Deployment Guide

This guide explains how to deploy NetPulse on Vercel (frontend) + separate backend.

## Architecture

- **Frontend**: Deployed on Vercel (React + Vite)
- **Backend**: Deployed separately on Railway, Render, or Fly.io (Express.js + WebSocket)

## Step 1: Prepare Your Project

### 1.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: NetPulse network monitor"
```

### 1.2 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/netpulse-react.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend (Choose One)

### Option A: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set environment variables (if needed)
6. Railway will auto-detect Node.js and start your server
7. Copy your backend URL (e.g., `https://netpulse-backend.railway.app`)

### Option B: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Create "New" → "Web Service"
4. Connect your GitHub account
5. Select repository and set:
   - **Start Command**: `npm start`
   - **Region**: Choose closest to you
6. Deploy and copy your URL (e.g., `https://netpulse-backend.onrender.com`)

### Option C: Deploy to Fly.io

1. Install [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/)
2. Run: `fly auth login`
3. Run: `fly launch` in your project directory
4. Configure and deploy
5. Copy your URL

## Step 3: Update Environment Variable

After deploying backend, update the production environment variable:

### Edit `client/.env.production`
```
VITE_API_URL=https://your-backend-url.com
```

Replace `your-backend-url.com` with your actual backend URL from Step 2.

## Step 4: Deploy Frontend to Vercel

### 4.1 Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 4.2 Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Select your repository
5. **Configure:**
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. **Add Environment Variable:**
   - Click "Environment Variables"
   - Add `VITE_API_URL` with your backend URL value
   - Apply to "Production"

7. Click "Deploy"

### 4.3 Via Vercel CLI (Alternative)
```bash
vercel
# Follow prompts to link to your GitHub repo
# Then setup env vars in dashboard
```

## Step 5: Verify Deployment

1. Visit your Vercel frontend URL
2. Check browser console (F12) for errors
3. Run a test - it should connect to your backend
4. Verify speeds are measured correctly

## Environment Variable Reference

| Variable | Local | Production |
|----------|-------|-----------|
| `VITE_API_URL` | `http://localhost:3001` | `https://your-backend-url.com` |

The frontend automatically uses `VITE_API_URL` for all API calls:
- `/ping`
- `/test-file`
- `/upload-test`
- `/ws` (WebSocket)

## Troubleshooting

### "Cannot connect to backend"
- Verify `VITE_API_URL` is set in Vercel environment variables
- Check backend is running and accessible
- Verify no CORS issues (backend should have `Access-Control-Allow-Origin: *` or your frontend URL)

### WebSocket connection fails
- Ensure backend platform supports WebSocket (Railway, Render, Fly.io all do)
- Check `VITE_API_URL` is correct (should use `wss://` for WSS)

### Fast refresh not working
- This is expected in production. Restart the app to see changes.

## Local Development

For local development, the app is configured to use `http://localhost:3001`:

```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend (from root)
npm install:all
npm run dev
```

Then visit `http://localhost:5173`

## Updating Code

To deploy updates:

1. Make changes locally
2. Test with `npm run dev`
3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```
4. Both Vercel and your backend platform will auto-redeploy

## Cost Considerations

- **Vercel**: Free tier includes generous limits (500MB, 100 GB bandwidth/month)
- **Railway**: Free tier includes $5/month credit
- **Render**: Spins down free tier after 15 min inactivity
- **Fly.io**: Free tier includes 3 shared-cpu-1x 256MB VMs

## Next Steps

- Monitor logs in respective dashboards
- Set up error tracking (Sentry, LogRocket)
- Configure custom domain
- Set up CI/CD for automated testing before deploy
