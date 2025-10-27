import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

console.log('🔄 Starting main server...');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

console.log('📋 Environment variables:');
console.log('  - PORT:', PORT);
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'https://tranzzio.netlify.app',
      'https://tranzzio.netlify.app/',
      'https://www.tranzzio.com',
      'https://www.tranzzio.com/',
      'https://tranzzio.com',
      'https://tranzzio.com/',
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    // Also check environment variable for additional origins
    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }

    console.log('CORS request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);

    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for origin:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

console.log('✅ Middleware configured');

// Health endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    cors_origin: process.env.CORS_ORIGIN || 'Not set'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint requested');
  res.json({
    success: true,
    message: 'Backend is working',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Health endpoint configured');

// Initialize WebSocket service
import WebSocketService from './src/services/websocket';
import { setWebSocketService } from './src/controllers/messageController';

// Initialize the main WebSocket service
try {
  const wsService = new WebSocketService(server);
  setWebSocketService(wsService);
  console.log('✅ WebSocket service initialized');
} catch (error) {
  console.error('❌ Failed to initialize WebSocket service:', error);
  if (error instanceof Error) {
    console.error('Error details:', error.message);
  }
}

console.log('✅ WebSocket services initialized');

// Import and use auth routes
import authRoutes from './src/routes/auth';
app.use('/api/auth', authRoutes);

// Import and use transaction routes
import transactionRoutes from './src/routes/transactions';
app.use('/api/transactions', transactionRoutes);

// Import and use message routes
import messageRoutes from './src/routes/messageRoutes';
app.use('/api/messages', messageRoutes);

// Import and use notification routes
import notificationRoutes from './src/routes/notifications';
app.use('/api/notifications', notificationRoutes);

// Lemu routes removed - file doesn't exist

console.log('✅ Auth, transaction, message, and notification routes configured');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('🚀 Starting HTTP server on port', PORT);
    server.listen(PORT, () => {
      console.log('✅ MAIN SERVER STARTED SUCCESSFULLY');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
      console.log(`💼 Transaction endpoints: http://localhost:${PORT}/api/transactions/`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

startServer();

