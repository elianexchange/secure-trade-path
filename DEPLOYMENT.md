# 🚀 Tranzio Deployment Guide

This guide covers deploying your Tranzio secure trade path application to Netlify.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Netlify account (free tier available)
- Backend hosting solution (Heroku, Railway, or similar)

## 🎯 Deployment Options

### Option 1: Frontend on Netlify + Backend on Heroku (Recommended)

This is the most straightforward approach for production deployment.

#### Step 1: Deploy Backend to Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   cd tranzio-backend
   heroku create tranzio-backend-api
   ```

4. **Set Environment Variables**
   ```bash
   # Database (use Heroku Postgres)
   heroku addons:create heroku-postgresql:mini
   
   # Get database URL
   heroku config:get DATABASE_URL
   
   # Set other environment variables
   heroku config:set JWT_SECRET="your-super-secret-jwt-key-here"
   heroku config:set NODE_ENV="production"
   heroku config:set CORS_ORIGIN="https://your-netlify-site.netlify.app"
   heroku config:set FRONTEND_URL="https://your-netlify-site.netlify.app"
   heroku config:set DEFAULT_CURRENCY="NGN"
   heroku config:set SUPPORTED_CURRENCIES="NGN,GHS,KES,ZAR,USD,EUR"
   ```

5. **Deploy Backend**
   ```bash
   # Add buildpacks
   heroku buildpacks:add heroku/nodejs
   heroku buildpacks:add https://github.com/heroku/heroku-buildpack-apt
   
   # Deploy
   git add .
   git commit -m "Deploy backend to Heroku"
   git push heroku main
   
   # Run database migrations
   heroku run npx prisma migrate deploy
   ```

#### Step 2: Deploy Frontend to Netlify

1. **Prepare Environment Variables**
   ```bash
   # Create .env.production file
   cp env.production.example .env.production
   
   # Edit .env.production with your Heroku backend URL
   VITE_API_BASE_URL=https://tranzio-backend-api.herokuapp.com
   VITE_WS_URL=https://tranzio-backend-api.herokuapp.com
   VITE_APP_NAME=Tranzio
   VITE_APP_VERSION=1.0.0
   VITE_ENVIRONMENT=production
   ```

2. **Deploy via Netlify CLI**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   npm run deploy:netlify
   ```

3. **Deploy via Git (Recommended)**
   - Push your code to GitHub
   - Connect your GitHub repo to Netlify
   - Set build settings:
     - Build command: `npm run build:prod`
     - Publish directory: `dist`
     - Node version: `18`

4. **Set Environment Variables in Netlify**
   - Go to Site settings > Environment variables
   - Add:
     - `VITE_API_BASE_URL`: `https://tranzio-backend-api.herokuapp.com`
     - `VITE_WS_URL`: `https://tranzio-backend-api.herokuapp.com`
     - `VITE_APP_NAME`: `Tranzio`
     - `VITE_APP_VERSION`: `1.0.0`
     - `VITE_ENVIRONMENT`: `production`

### Option 2: Full-Stack on Netlify (Advanced)

This approach uses Netlify Functions for the backend.

#### Step 1: Convert Backend to Netlify Functions

1. **Install Dependencies**
   ```bash
   npm install @netlify/functions
   ```

2. **Create Functions Directory**
   ```bash
   mkdir -p netlify/functions
   ```

3. **Convert Express Routes to Functions**
   - Each API route becomes a separate function
   - Example: `netlify/functions/transactions.js`

#### Step 2: Deploy to Netlify

1. **Update netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     functions = "netlify/functions"
     publish = "dist"
   ```

2. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## 🔧 Configuration Files

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

### Environment Variables

#### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend-url.herokuapp.com
VITE_WS_URL=https://your-backend-url.herokuapp.com
VITE_APP_NAME=Tranzio
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

#### Backend (Heroku Config Vars)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
CORS_ORIGIN=https://your-netlify-site.netlify.app
FRONTEND_URL=https://your-netlify-site.netlify.app
DEFAULT_CURRENCY=NGN
SUPPORTED_CURRENCIES=NGN,GHS,KES,ZAR,USD,EUR
```

## 🚀 Backend Hosting Alternatives (Since Heroku Free Tier Discontinued)

### **1. Railway (Recommended)**
- ✅ **Free tier:** $5 credit monthly
- ✅ **PostgreSQL included**
- ✅ **Easy GitHub deployment**
- ✅ **Zero configuration**

**Deploy:** Connect GitHub → Select `tranzio-backend` folder → Deploy

### **2. Render (Free Option)**
- ✅ **Free tier:** 750 hours/month
- ✅ **PostgreSQL included**
- ✅ **Easy setup**

**Deploy:** Create Web Service → Connect GitHub → Deploy

### **3. Fly.io (High Performance)**
- ✅ **Free tier:** 3 VMs
- ✅ **Global deployment**
- ✅ **Docker-based**

**Deploy:** `fly launch` → `fly deploy`

See `BACKEND_HOSTING_COMPARISON.md` for detailed comparison.

## 🚀 Quick Deploy Commands

### Frontend Only
```bash
# Build and deploy to Netlify
npm run build:prod
netlify deploy --prod --dir=dist
```

### Full Stack (Railway + Netlify)
```bash
# Deploy backend to Railway
# 1. Go to railway.app
# 2. Connect GitHub repo
# 3. Select tranzio-backend folder
# 4. Add PostgreSQL database
# 5. Set environment variables

# Deploy frontend to Netlify
npm run build:prod
netlify deploy --prod --dir=dist
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` includes your Netlify URL
   - Check that your backend allows the frontend domain

2. **Environment Variables Not Loading**
   - Ensure variables start with `VITE_` for frontend
   - Check Netlify environment variables in dashboard

3. **Build Failures**
   - Check Node.js version (should be 18+)
   - Ensure all dependencies are in package.json
   - Check for TypeScript errors

4. **WebSocket Issues**
   - Verify WebSocket URL is correct
   - Check if your hosting provider supports WebSockets

### Debug Commands

```bash
# Check build locally
npm run build:prod
npm run preview

# Check Netlify CLI
netlify status
netlify logs

# Check Heroku logs
heroku logs --tail
```

## 📊 Monitoring & Analytics

### Netlify Analytics
- Enable in Netlify dashboard
- Monitor site performance and usage

### Heroku Monitoring
- Use Heroku metrics
- Set up error tracking (Sentry)

### Custom Analytics
- Add Google Analytics
- Implement custom event tracking

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets
   - Rotate secrets regularly

2. **CORS Configuration**
   - Only allow necessary origins
   - Use HTTPS in production

3. **Database Security**
   - Use connection pooling
   - Enable SSL connections
   - Regular backups

## 📈 Performance Optimization

1. **Frontend**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement lazy loading

2. **Backend**
   - Use database indexes
   - Implement caching
   - Optimize queries

## 🎉 Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] WebSocket connections work
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] SSL certificates active
- [ ] CORS configured correctly
- [ ] Error monitoring set up
- [ ] Analytics tracking active

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Netlify/Heroku logs
3. Test locally first
4. Check environment variables
5. Verify CORS settings

---

**Happy Deploying! 🚀**
