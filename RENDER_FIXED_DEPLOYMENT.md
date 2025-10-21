# 🚀 Fixed Render Deployment Guide for Tranzio Backend

## ✅ Issues Fixed

I've identified and fixed the following critical issues with your Render deployment:

1. **✅ Database Configuration**: Changed from SQLite to PostgreSQL
2. **✅ Package.json Scripts**: Updated for proper production builds
3. **✅ Environment Variables**: Configured for Render production
4. **✅ CORS Configuration**: Fixed to allow your Netlify frontend
5. **✅ Build Process**: Proper TypeScript compilation and Prisma setup

## 🚀 Step-by-Step Render Deployment

### 1. Create PostgreSQL Database on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"PostgreSQL"**
3. Configure your database:
   ```
   Name: tranzio-db
   Database: tranzio
   User: tranzio_user
   Region: Choose closest to your users
   PostgreSQL Version: 15
   ```
4. Click **"Create Database"**
5. **IMPORTANT**: Copy the **External Database URL** - you'll need this!

### 2. Create Web Service on Render

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `elianexchange/secure-trade-path`
3. Configure the service:
   ```
   Name: tranzio-backend
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```
4. **CRITICAL**: Set the **Root Directory** to `tranzio-backend`

### 3. Set Environment Variables

In your web service, add these environment variables:

```
DATABASE_URL=postgresql://tranzio_user:password@host:port/tranzio
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
CORS_ORIGIN=https://tranzzio.netlify.app
FRONTEND_URL=https://tranzzio.netlify.app
DEFAULT_CURRENCY=NGN
SUPPORTED_CURRENCIES=NGN,GHS,KES,ZAR,USD,EUR
BCRYPT_ROUNDS=12
PORT=10000
```

**Important Notes:**
- Replace `DATABASE_URL` with the actual URL from step 1
- Generate a strong `JWT_SECRET` (32+ characters)
- `PORT` should be `10000` for Render (they set this automatically)

### 4. Deploy and Run Migrations

1. Click **"Create Web Service"**
2. Wait for the build to complete
3. Once deployed, go to your service dashboard
4. Click **"Shell"** tab
5. Run the database migrations:
   ```bash
   npx prisma migrate deploy
   ```

### 5. Test Your Deployment

Your backend will be available at: `https://tranzio-backend.onrender.com`

Test endpoints:
- Health check: `https://tranzio-backend.onrender.com/health`
- Auth: `https://tranzio-backend.onrender.com/api/auth/`
- Transactions: `https://tranzio-backend.onrender.com/api/transactions/`

### 6. Update Frontend Environment Variables

Update your Netlify environment variables:

```
VITE_API_BASE_URL=https://tranzio-backend.onrender.com
VITE_WS_URL=https://tranzio-backend.onrender.com
```

## 🔧 Configuration Files Updated

### 1. Prisma Schema (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc && prisma generate",
    "start": "node dist/main-server.js",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy"
  }
}
```

### 3. CORS Configuration
Updated to allow your Netlify frontend and environment-based origins.

## 🚨 Common Issues & Solutions

### Issue 1: Build Fails
**Error**: `Cannot find module 'prisma/client'`
**Solution**: The `postinstall` script will generate Prisma client automatically.

### Issue 2: Database Connection Fails
**Error**: `Can't reach database server`
**Solution**: 
1. Check your `DATABASE_URL` format
2. Ensure PostgreSQL service is running on Render
3. Verify network connectivity

### Issue 3: CORS Errors
**Error**: `Access to fetch at '...' has been blocked by CORS policy`
**Solution**: 
1. Check `CORS_ORIGIN` environment variable
2. Ensure your frontend URL is in the allowed origins
3. Verify HTTPS URLs (no HTTP in production)

### Issue 4: Migration Fails
**Error**: `Migration failed`
**Solution**:
1. Check database permissions
2. Ensure `DATABASE_URL` is correct
3. Run migrations manually in Render shell

## 📊 Render Free Tier Limits

- **750 hours/month** - Usually enough for small apps
- **Sleeps after 15 minutes** of inactivity
- **512MB RAM** - Should be sufficient for your app
- **Database**: Free tier available

## 🚀 Performance Tips

1. **Enable Auto-Deploy**: Connect to GitHub for automatic deployments
2. **Monitor Logs**: Check Render logs for errors
3. **Health Checks**: Use the `/health` endpoint for monitoring
4. **Environment Variables**: Keep secrets secure

## 🔍 Debugging Commands

```bash
# Check service logs
# Go to Render dashboard → Your service → Logs

# Run shell commands
# Go to Render dashboard → Your service → Shell

# Test database connection
npx prisma db pull

# Check migrations
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

## 🎉 Success Checklist

- [ ] PostgreSQL database created on Render
- [ ] Web service deployed successfully
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Health endpoint responding
- [ ] Frontend can connect to backend
- [ ] CORS errors resolved
- [ ] Authentication working
- [ ] WebSocket connections working

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test database connectivity
4. Check CORS configuration
5. Ensure all dependencies are installed

---

**Your backend should now be properly configured for Render! 🎉**

The main issues were:
- SQLite → PostgreSQL migration
- Missing production build scripts
- Incorrect CORS configuration
- Missing environment variables

All of these have been fixed in your codebase.

