# 🚀 Quick Netlify Deployment Guide

## Step-by-Step Instructions

### 1. Go to Netlify
- Visit [netlify.com](https://netlify.com)
- Sign up/Login with GitHub

### 2. Create New Site
- Click **"New site from Git"**
- Choose **"GitHub"**
- Select repository: **`elianexchange/secure-trade-path`**

### 3. Build Settings
```
Build command: npm run build:prod
Publish directory: dist
Node version: 18
```

### 4. Environment Variables
Add these in the "Environment variables" section:
```
VITE_API_BASE_URL=https://your-backend-url.herokuapp.com
VITE_WS_URL=https://your-backend-url.herokuapp.com
VITE_APP_NAME=Tranzio
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### 5. Deploy
- Click **"Deploy site"**
- Wait for build to complete
- Your site will be live!

## 🔧 After Deployment

### Update Backend CORS
Once you have your Netlify URL, update your backend CORS settings:

```bash
# If using Heroku for backend
heroku config:set CORS_ORIGIN="https://your-netlify-site.netlify.app" -a your-app-name
```

### Test Your Site
1. Visit your Netlify URL
2. Test all features:
   - User registration/login
   - Transaction creation
   - Messaging
   - All other features

## 📱 Your Live URLs
- **Frontend:** `https://your-site-name.netlify.app`
- **Backend:** `https://your-backend.herokuapp.com` (if using Heroku)

## 🎉 Success!
Your Tranzio app is now live and accessible worldwide!
