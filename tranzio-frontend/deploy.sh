#!/bin/bash

# Tranzio Deployment Script
# This script helps deploy the frontend to Netlify

echo "🚀 Starting Tranzio deployment to Netlify..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ first"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found. Creating from template..."
    cp env.production.example .env.production
    echo "📝 Please edit .env.production with your production backend URL"
    echo "   Current backend URL: https://your-backend-url.herokuapp.com"
    echo "   Update VITE_API_BASE_URL and VITE_WS_URL with your actual backend URL"
    read -p "Press Enter to continue after updating .env.production..."
fi

# Build the project
echo "🔨 Building project for production..."
npm run build:prod

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "🌐 Your app is now live on Netlify!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
