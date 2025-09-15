# 🚀 Fly.io Deployment Guide for Tranzio Backend

## Why Fly.io?
- ✅ **Free tier** with 3 shared-cpu-1x VMs
- ✅ **Global deployment** (edge locations)
- ✅ **PostgreSQL addon** available
- ✅ **Great performance**
- ✅ **Docker-based** deployment

## Step-by-Step Deployment

### 1. Install Fly CLI
```bash
# macOS
brew install flyctl

# Or download from https://fly.io/docs/hands-on/install-flyctl/
```

### 2. Sign Up
1. Go to [fly.io](https://fly.io)
2. Sign up for an account
3. Run: `fly auth login`

### 3. Initialize App
```bash
cd tranzio-backend
fly launch
```

### 4. Configure Database
```bash
# Add PostgreSQL
fly postgres create --name tranzio-db

# Connect to your app
fly postgres connect -a tranzio-db
```

### 5. Set Environment Variables
```bash
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your-super-secret-jwt-key-here"
fly secrets set NODE_ENV="production"
fly secrets set CORS_ORIGIN="https://your-netlify-site.netlify.app"
fly secrets set FRONTEND_URL="https://your-netlify-site.netlify.app"
fly secrets set DEFAULT_CURRENCY="NGN"
fly secrets set SUPPORTED_CURRENCIES="NGN,GHS,KES,ZAR,USD,EUR"
fly secrets set BCRYPT_ROUNDS="12"
```

### 6. Deploy
```bash
fly deploy
```

### 7. Run Database Migrations
```bash
fly ssh console
npx prisma migrate deploy
```

## Update Frontend Environment Variables

After deployment, update your Netlify environment variables:

```
VITE_API_BASE_URL=https://your-app-name.fly.dev
VITE_WS_URL=https://your-app-name.fly.dev
```

## Cost
- **Free tier:** 3 shared-cpu-1x VMs
- **PostgreSQL:** Separate pricing
- **Scales globally**

## Benefits
- ✅ **Global edge deployment**
- ✅ **High performance**
- ✅ **Docker-based**
- ✅ **Great for production**

---

**Fly.io is perfect for global scale!** 🌍
