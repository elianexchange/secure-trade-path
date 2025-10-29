#!/bin/bash

# Tranzio Backend Deployment Script for Heroku
# This script helps deploy the backend to Heroku

echo "🚀 Starting Tranzio backend deployment to Heroku..."

# Check if we're in the backend directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: Please run this script from the tranzio-backend directory"
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Error: Heroku CLI is not installed."
    echo "📦 Please install Heroku CLI first:"
    echo "   macOS: brew tap heroku/brew && brew install heroku"
    echo "   Or download from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please login to Heroku first:"
    heroku login
fi

# Get app name or create new one
read -p "Enter Heroku app name (or press Enter to create new): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "📱 Creating new Heroku app..."
    APP_NAME=$(heroku create --json | jq -r '.name')
    echo "✅ Created app: $APP_NAME"
else
    echo "📱 Using existing app: $APP_NAME"
fi

# Set up buildpacks
echo "🔧 Setting up buildpacks..."
heroku buildpacks:clear -a $APP_NAME
heroku buildpacks:add heroku/nodejs -a $APP_NAME

# Add PostgreSQL addon
echo "🗄️ Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:mini -a $APP_NAME

# Get database URL
echo "📊 Getting database URL..."
DB_URL=$(heroku config:get DATABASE_URL -a $APP_NAME)
echo "Database URL: $DB_URL"

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set NODE_ENV=production -a $APP_NAME
heroku config:set JWT_SECRET="$(openssl rand -base64 32)" -a $APP_NAME
heroku config:set CORS_ORIGIN="https://your-netlify-site.netlify.app" -a $APP_NAME
heroku config:set FRONTEND_URL="https://your-netlify-site.netlify.app" -a $APP_NAME
heroku config:set DEFAULT_CURRENCY="NGN" -a $APP_NAME
heroku config:set SUPPORTED_CURRENCIES="NGN,GHS,KES,ZAR,USD,EUR" -a $APP_NAME
heroku config:set BCRYPT_ROUNDS="12" -a $APP_NAME

echo "📝 Please update the CORS_ORIGIN and FRONTEND_URL with your actual Netlify URL"
echo "   Current CORS_ORIGIN: https://your-netlify-site.netlify.app"
echo "   Update with: heroku config:set CORS_ORIGIN='https://your-actual-site.netlify.app' -a $APP_NAME"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku" || echo "No changes to commit"
git push heroku main

# Run database migrations
echo "🗄️ Running database migrations..."
heroku run npx prisma migrate deploy -a $APP_NAME

# Get the app URL
APP_URL=$(heroku apps:info -a $APP_NAME --json | jq -r '.app.web_url')
echo "🎉 Deployment successful!"
echo "🌐 Your backend is now live at: $APP_URL"
echo "📊 API endpoint: $APP_URL/api"
echo "🔌 WebSocket endpoint: $APP_URL/socket.io"

echo ""
echo "📋 Next steps:"
echo "1. Update your frontend .env.production with:"
echo "   VITE_API_BASE_URL=$APP_URL"
echo "   VITE_WS_URL=$APP_URL"
echo "2. Deploy your frontend to Netlify"
echo "3. Update CORS_ORIGIN with your Netlify URL"
