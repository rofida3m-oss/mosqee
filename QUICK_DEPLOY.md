# Quick Deployment Steps for Render.com

## 1. Prepare Backend for Deployment

First, we need to create a few files in the server folder:

### Create `package.json` in server folder (if not exists)
```json
{
  "name": "mosqee-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "sqlite3": "^5.1.6",
    "socket.io": "^4.6.1"
  }
}
```

## 2. Deploy to Render.com

1. Go to https://render.com and sign up (free)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (or use "Public Git repository" if not on GitHub)
4. Fill in:
   - **Name**: mosqee-backend
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Click "Create Web Service"

6. Wait for deployment (2-3 minutes)

7. Copy your backend URL (e.g., `https://mosqee-backend.onrender.com`)

## 3. Configure Netlify

1. Go to Netlify Dashboard
2. Your Site → Site Settings → Environment Variables
3. Click "Add a variable"
4. Add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-render-url.onrender.com/api` (replace with your actual URL)
5. Go to "Deploys" tab
6. Click "Trigger deploy" → "Clear cache and deploy"

## 4. Test

Visit your Netlify site and try to login!

---

## Alternative: Quick Test Without Deployment

If you want to test locally first:

1. Make sure backend is running: `cd server && node index.js`
2. In another terminal: `npm run dev`
3. Open `http://localhost:3000` (NOT the Netlify URL)
4. Everything should work!

The Netlify deployment will only work after you deploy the backend and configure the environment variable.
