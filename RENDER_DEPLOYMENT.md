# 🚀 Render Deployment Guide for Tranzio Backend

## Why Render?
- ✅ **Free tier** with 750 hours/month
- ✅ **PostgreSQL database** included
- ✅ **Automatic SSL** certificates
- ✅ **Easy GitHub integration**
- ✅ **Great for Node.js** applications

## Step-by-Step Deployment

### 1. Sign Up
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 2. Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository: `elianexchange/secure-trade-path`
4. Choose the **`tranzio-backend`** folder

### 3. Configure Service
```
Name: tranzio-backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 4. Add PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `tranzio-db`
3. Note the connection details

### 5. Set Environment Variables
In your web service, add these environment variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
CORS_ORIGIN=https://your-netlify-site.netlify.app
FRONTEND_URL=https://your-netlify-site.netlify.app
DEFAULT_CURRENCY=NGN
SUPPORTED_CURRENCIES=NGN,GHS,KES,ZAR,USD,EUR
BCRYPT_ROUNDS=12
```

### 6. Deploy
1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Your backend will be live at: `https://tranzio-backend.onrender.com`

### 7. Run Database Migrations
1. Go to your service dashboard
2. Click **"Shell"**
3. Run: `npx prisma migrate deploy`

## Update Frontend Environment Variables

After deployment, update your Netlify environment variables:

```
VITE_API_BASE_URL=https://tranzio-backend.onrender.com
VITE_WS_URL=https://tranzio-backend.onrender.com
```

## Cost
- **Free tier:** 750 hours/month
- **Database:** Free tier available
- **Sleeps after 15 minutes** of inactivity (free tier)

## Benefits
- ✅ **Completely free** for small apps
- ✅ **Automatic HTTPS**
- ✅ **Easy environment management**
- ✅ **Great for development**

---

**Render is perfect for getting started!** 🎉
