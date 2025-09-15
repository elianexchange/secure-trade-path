import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:8080',
      'http://localhost:8081', 
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://localhost:8085'
    ],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081', 
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    websocketConnections: io.engine.clientsCount
  });
});

// Import transaction routes
import transactionRoutes from './routes/transactions';
import notificationRoutes from './routes/notifications';

// API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Mock user for now
    const user = {
      id: 'user_123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'BUYER'
    };

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      'tranzio-super-secret-jwt-key-2024-development',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      user,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Mock user creation
    const user = {
      id: 'user_' + Date.now(),
      email,
      firstName,
      lastName,
      role: 'BUYER'
    };

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      'tranzio-super-secret-jwt-key-2024-development',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);

  // Handle authentication
  socket.on('authenticate', (token: string) => {
    try {
      const decoded = jwt.verify(token, 'tranzio-super-secret-jwt-key-2024-development') as any;
      socket.data.userId = decoded.userId;
      socket.join(`user_${decoded.userId}`);
      console.log(`✅ User ${decoded.userId} authenticated via WebSocket`);
      
      socket.emit('authenticated', { success: true, userId: decoded.userId });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.emit('authentication_error', { error: 'Invalid token' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// WebSocket service for sending messages to users
const wsService = {
  sendToUser: (userId: string, event: string, data: any) => {
    io.to(`user_${userId}`).emit(event, data);
    console.log(`📤 Sent ${event} to user ${userId}:`, data);
  },
  
  sendToAll: (event: string, data: any) => {
    io.emit(event, data);
    console.log(`📤 Sent ${event} to all users:`, data);
  }
};

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
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Starting server...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export WebSocket service for use in other modules
export { wsService };
