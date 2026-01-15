# Production Deployment Guide

## Backend Deployment

Your backend (Node.js server) needs to be deployed separately. Options include:

### Option 1: Render.com (Recommended - Free Tier Available)
1. Create account at https://render.com
2. Create new "Web Service"
3. Connect your GitHub repository
4. Set:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`
   - Environment: Node
5. Add environment variable: `PORT=10000` (or Render's default)
6. Deploy!
7. Copy your backend URL (e.g., `https://your-app.onrender.com`)

### Option 2: Railway.app
1. Create account at https://railway.app
2. Create new project from GitHub
3. Set root directory to `server`
4. Deploy automatically
5. Copy your backend URL

### Option 3: Heroku
1. Create Heroku app
2. Deploy server folder
3. Copy your app URL

## Frontend Configuration (Netlify)

After deploying your backend, configure Netlify:

1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Add new variables:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.com/api` (replace with your actual backend URL from Render/Railway)
   
   Example: If your backend is at `https://mosqee-api.onrender.com`, set:
   - `VITE_API_URL=https://mosqee-api.onrender.com/api`

3. (Optional) Add Socket.IO URL if different:
   - **Key**: `VITE_SOCKET_URL`
   - **Value**: `https://your-backend-url.com` (without /api)

4. Redeploy your site (Netlify → Deploys → Trigger Deploy → Deploy Site)

## Local Development

For local development, the app automatically uses `http://localhost:5000/api` - no configuration needed!

## Testing Production

After deployment:
1. Visit your Netlify URL
2. Try to login/register
3. Check browser console for errors
4. Verify API calls go to your backend URL (not Netlify domain)

## Important Notes

- ⚠️ **Backend and Frontend must be deployed separately**
- ⚠️ **Netlify only hosts the React app (frontend)**
- ⚠️ **You need a separate service for the Node.js backend**
- ✅ **Free options available: Render.com, Railway.app**
