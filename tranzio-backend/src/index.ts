import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
// Initialize WebSocket service
import WebSocketService from './services/websocket';
import { setWebSocketService } from './controllers/messageController';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import transactionsRoutes from './routes/transactions';
import notificationsRoutes from './routes/notifications';
import messageRoutes from './routes/messageRoutes';
// import verificationRoutes from './routes/verification';
// import paymentConditionsRoutes from './routes/paymentConditions';
import emailRoutes from './routes/email';
// import escrowCalculatorRoutes from './routes/escrowCalculator';
// import disputesRoutes from './routes/disputes';
// import chatbotRoutes from './routes/chatbot';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize WebSocket service
const wsService = new WebSocketService(server);
setWebSocketService(wsService);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:8080',
    'http://localhost:8080',
    'http://localhost:8081', 
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://192.168.63.1:8080',
    'http://192.168.63.1:8081',
    'http://192.168.63.1:8082',
    'http://192.168.63.1:8083',
    'http://192.168.63.1:8084',
    'http://192.168.63.1:8085'
  ],
  credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    websocketConnections: 0 // Will be updated by WebSocket service
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/messages', messageRoutes);
// app.use('/api/verification', verificationRoutes);
// app.use('/api/payment-conditions', paymentConditionsRoutes);
// app.use('/api/escrow-calculator', escrowCalculatorRoutes);
// app.use('/api/disputes', disputesRoutes);
// app.use('/api/chatbot', chatbotRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  console.log('🔄 Starting server...');
  console.log('📋 Environment variables:');
  console.log('  - PORT:', process.env.PORT);
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  
  try {
    console.log('🔌 Testing database connection...');
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('🚀 Starting HTTP server on port', PORT);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Google OAuth: http://localhost:${PORT}/api/auth/google`);
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

// Export WebSocket service for use in other modules
// export { wsService };
