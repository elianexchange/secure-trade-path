# 🚀 Railway Quick Start for Tranzio

## Step-by-Step Setup

### 1. Railway Account Setup
- Go to [railway.app](https://railway.app)
- Sign up with GitHub
- Authorize Railway access

### 2. Deploy Backend
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose: `elianexchange/secure-trade-path`
- Select: `tranzio-backend` folder
- Railway auto-detects Node.js

### 3. Add Database
- Click "New" → "Database" → "PostgreSQL"
- Railway creates database automatically
- Note the DATABASE_URL

### 4. Environment Variables
Add these in your backend service:

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

### 5. Run Migrations
- Go to backend service → Deployments → View Logs
- Run: `npx prisma migrate deploy`

### 6. Get Backend URL
- Your backend URL: `https://tranzio-backend-production.up.railway.app`
- Copy this URL for frontend configuration

### 7. Update Frontend (Netlify)
Add these environment variables in Netlify:

```
VITE_API_BASE_URL=https://your-railway-backend-url.up.railway.app
VITE_WS_URL=https://your-railway-backend-url.up.railway.app
VITE_APP_NAME=Tranzio
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### 8. Redeploy Frontend
- Trigger new deployment in Netlify
- Wait for build to complete
- Test your full-stack app!

## 🎯 Expected Results

- ✅ Backend running on Railway
- ✅ Database connected and migrated
- ✅ Frontend connecting to backend
- ✅ Full-stack application working

## 🔍 Troubleshooting

### Backend Issues
- Check Railway logs for errors
- Verify environment variables
- Ensure database is connected

### Frontend Issues
- Check Netlify environment variables
- Verify backend URL is correct
- Check browser console for errors

## 📞 Support

If you encounter issues:
1. Check Railway logs
2. Check Netlify build logs
3. Verify environment variables
4. Test API endpoints directly

---

**Your Tranzio app will be live and fully functional!** 🎉
