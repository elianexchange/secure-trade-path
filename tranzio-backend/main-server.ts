import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

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

// Initialize Prisma client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS configuration - must be before rate limiting
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
      // Mobile app origins (for PWA)
      'https://tranzzio.netlify.app',
      'https://www.tranzzio.com',
      'https://tranzzio.com',
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    // Also check environment variable for additional origins
    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }

    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for origin:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    console.log('❌ Allowed origins:', allowedOrigins);
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

// Rate limiting - more generous for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 2000 : 1000, // Increased limit for production
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain endpoints
  skip: (req) => {
    // Skip rate limiting for health checks, static assets, and OPTIONS requests
    return req.path === '/health' || 
           req.path.startsWith('/static/') || 
           req.method === 'OPTIONS';
  }
});

app.use(limiter);

// More generous rate limiting for message endpoints
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 3000 : 2000, // More generous for messaging
  message: {
    success: false,
    error: 'Too many message requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for OPTIONS requests
  skip: (req) => {
    return req.method === 'OPTIONS';
  }
});

// Apply message-specific rate limiting to message routes
app.use('/api/messages', messageLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

console.log('✅ Middleware configured');

// Health endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      cors_origin: process.env.CORS_ORIGIN || 'Not set'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
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

// Import and use Google auth routes
import googleAuthRoutes from './src/routes/googleAuth';
app.use('/api/google', googleAuthRoutes);

// Import and use dispute routes
import disputeRoutes from './src/routes/disputes';
app.use('/api/disputes', disputeRoutes);

// Lemu routes removed - file doesn't exist

console.log('✅ Auth, transaction, message, notification, Google auth, and dispute routes configured');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
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

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close HTTP server
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Close database connection
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();

