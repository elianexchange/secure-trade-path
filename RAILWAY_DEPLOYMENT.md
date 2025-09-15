# 🚀 Railway Deployment Guide for Tranzio Backend

## Why Railway?
- ✅ **Free tier** with $5 monthly credit
- ✅ **PostgreSQL database** included
- ✅ **Automatic deployments** from GitHub
- ✅ **Easy environment variables** management
- ✅ **Great for Node.js/Express** applications

## Step-by-Step Deployment

### 1. Sign Up
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Authorize Railway to access your repositories

### 2. Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `elianexchange/secure-trade-path`
4. Select the **`tranzio-backend`** folder

### 3. Configure Database
1. In your project dashboard, click **"New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. Note the connection details

### 4. Set Environment Variables
In your backend service, add these environment variables:

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

### 5. Deploy
1. Railway will automatically detect your `package.json`
2. It will run `npm install` and `npm start`
3. Your backend will be live at: `https://your-app-name.railway.app`

### 6. Run Database Migrations
1. Go to your backend service
2. Click on the service
3. Go to **"Deployments"** tab
4. Click **"View Logs"**
5. Run: `npx prisma migrate deploy`

## Update Frontend Environment Variables

After deployment, update your Netlify environment variables:

```
VITE_API_BASE_URL=https://your-app-name.railway.app
VITE_WS_URL=https://your-app-name.railway.app
```

## Cost
- **Free tier:** $5 monthly credit
- **Backend + Database:** Usually under $5/month
- **Scales automatically** as you grow

## Benefits
- ✅ **Zero configuration** needed
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **Easy scaling**
- ✅ **Great monitoring**

---

**Railway is perfect for your Tranzio backend!** 🎉
