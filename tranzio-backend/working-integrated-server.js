const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Socket.IO with proper CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081'
    ],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    websocketConnections: io.engine.clientsCount
  });
});

// Mock authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tranzio-super-secret-jwt-key-2024-development');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login request received for:', email);

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'tranzio-super-secret-jwt-key-2024-development',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status
        },
        token
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Transaction routes
app.get('/api/transactions/my-transactions', authenticateToken, async (req, res) => {
  try {
    console.log('My transactions request received');
    const userId = req.user.userId;

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        counterparty: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        disputes: true,
        notifications: true,
        messages: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      transactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get individual transaction
app.get('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Individual transaction request received for:', req.params.id);
    const userId = req.user.userId;
    const transactionId = req.params.id;

    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        counterparty: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        disputes: true,
        notifications: true,
        messages: true,
        paymentConditions: true
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    return res.json({
      success: true,
      transaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction activities
app.get('/api/transactions/:id/activities', authenticateToken, async (req, res) => {
  try {
    console.log('Transaction activities request received for:', req.params.id);
    const userId = req.user.userId;
    const transactionId = req.params.id;

    // Check if user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Get activities (messages, notifications, etc.)
    const activities = await prisma.message.findMany({
      where: { transactionId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      activities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching transaction activities:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get payment conditions for transaction
app.get('/api/payment-conditions/transaction/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Payment conditions request received for transaction:', req.params.id);
    const userId = req.user.userId;
    const transactionId = req.params.id;

    // Check if user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const paymentConditions = await prisma.paymentCondition.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      paymentConditions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching payment conditions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create payment condition
app.post('/api/payment-conditions/create', authenticateToken, async (req, res) => {
  try {
    console.log('Create payment condition request received');
    const userId = req.user.userId;
    const { transactionId, conditionType, conditionValue } = req.body;

    // Check if user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const paymentCondition = await prisma.paymentCondition.create({
      data: {
        transactionId,
        conditionType,
        conditionValue: JSON.stringify(conditionValue)
      }
    });

    return res.json({
      success: true,
      paymentCondition,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating payment condition:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction by invite code
app.get('/api/transactions/invite/:inviteCode', async (req, res) => {
  try {
    console.log('Transaction invite request received for:', req.params.inviteCode);
    const inviteCode = req.params.inviteCode;

    // Find invitation by invite code
    const invitation = await prisma.transactionInvitation.findFirst({
      where: {
        inviteCode: inviteCode,
        status: 'ACTIVE'
      },
      include: {
        transaction: {
          include: {
            creator: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            counterparty: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            disputes: true,
            notifications: true,
            messages: true,
            paymentConditions: true
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or invite code is invalid'
      });
    }

    // Check if invite is expired
    const now = new Date();
    const inviteExpiry = new Date(invitation.expiresAt);
    
    if (now > inviteExpiry) {
      return res.status(400).json({
        success: false,
        error: 'Invite code has expired'
      });
    }

    // Calculate expiry time
    const expiresAt = invitation.expiresAt.toISOString();

    return res.json({
      success: true,
      invitation: {
        code: inviteCode,
        expiresAt: expiresAt,
        transaction: invitation.transaction
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching transaction by invite:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Join transaction with invite code
app.post('/api/transactions/join', authenticateToken, async (req, res) => {
  try {
    console.log('Join transaction request received');
    const userId = req.user.userId;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        error: 'Invite code is required'
      });
    }

    // Find invitation by invite code
    const invitation = await prisma.transactionInvitation.findFirst({
      where: {
        inviteCode: inviteCode,
        status: 'ACTIVE'
      },
      include: {
        transaction: {
          include: {
            creator: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            counterparty: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or invite code is invalid'
      });
    }

    const transaction = invitation.transaction;

    // Check if invite is expired
    const now = new Date();
    const inviteExpiry = new Date(invitation.expiresAt);
    
    if (now > inviteExpiry) {
      return res.status(400).json({
        success: false,
        error: 'Invite code has expired'
      });
    }

    // Check if user is already part of the transaction
    if (transaction.creatorId === userId || transaction.counterpartyId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You are already part of this transaction'
      });
    }

    // Check if transaction already has a counterparty
    if (transaction.counterpartyId) {
      return res.status(400).json({
        success: false,
        error: 'This transaction already has a counterparty'
      });
    }

    // Update transaction with counterparty
    const updatedTransaction = await prisma.escrowTransaction.update({
      where: { id: transaction.id },
      data: {
        counterpartyId: userId,
        status: 'ACTIVE'
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        counterparty: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        disputes: true,
        notifications: true,
        messages: true,
        paymentConditions: true
      }
    });

    // Mark invitation as used
    await prisma.transactionInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        usedBy: userId
      }
    });

    // Create notification for creator
    await prisma.notification.create({
      data: {
        userId: transaction.creatorId,
        transactionId: transaction.id,
        type: 'TRANSACTION_JOINED',
        title: 'Transaction Joined',
        message: `A counterparty has joined your transaction: ${transaction.description}`,
        isRead: false
      }
    });

    // Send WebSocket notification to creator
    sendToUser(transaction.creatorId, 'transaction_updated', {
      transaction: updatedTransaction,
      message: 'A counterparty has joined your transaction'
    });

    return res.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Successfully joined the transaction'
    });
  } catch (error) {
    console.error('Error joining transaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new transaction
app.post('/api/transactions/create', authenticateToken, async (req, res) => {
  try {
    console.log('Create transaction request received');
    const userId = req.user.userId;
    const transactionData = req.body;

    // Generate invite code
    const inviteCode = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Set expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create transaction
    const transaction = await prisma.escrowTransaction.create({
      data: {
        description: transactionData.description,
        currency: transactionData.currency || 'NGN',
        price: parseFloat(transactionData.price),
        fee: parseFloat(transactionData.fee || 0),
        total: parseFloat(transactionData.total),
        useCourier: transactionData.useCourier || false,
        creatorId: userId,
        creatorRole: transactionData.creatorRole || 'BUYER',
        status: 'PENDING'
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        counterparty: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        disputes: true,
        notifications: true,
        messages: true,
        paymentConditions: true
      }
    });

    // Create invitation
    const invitation = await prisma.transactionInvitation.create({
      data: {
        transactionId: transaction.id,
        inviteCode: inviteCode,
        expiresAt: expiresAt,
        status: 'ACTIVE'
      }
    });

    return res.json({
      success: true,
      transaction: transaction,
      invitation: {
        code: inviteCode,
        expiresAt: expiresAt.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    console.log('User profile request received');
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isVerified: true,
        verificationLevel: true,
        trustScore: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Notification routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    console.log('Notifications request received');
    const userId = req.user.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      notifications,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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
  socket.on('authenticate', async (token) => {
    try {
      console.log('🔐 WebSocket authentication attempt with token:', token.substring(0, 20) + '...');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tranzio-super-secret-jwt-key-2024-development');
      console.log('🔐 Token decoded successfully for user:', decoded.userId);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, status: true, firstName: true, lastName: true }
      });

      if (!user || user.status !== 'ACTIVE') {
        console.log('❌ User not found or inactive:', decoded.userId);
        socket.emit('authentication_error', { error: 'User not found or inactive' });
        return;
      }

      socket.data.userId = user.id;
      socket.data.user = user;
      socket.join(`user_${user.id}`);
      
      console.log(`✅ User ${user.id} authenticated via WebSocket`);
      socket.emit('authenticated', { success: true, userId: user.id });
      
    } catch (error) {
      console.error('❌ WebSocket authentication error:', error);
      socket.emit('authentication_error', { error: 'Invalid token' });
    }
  });

  // Handle joining user room
  socket.on('join_user_room', (data) => {
    const { userId } = data;
    socket.join(`user_${userId}`);
    console.log(`User ${socket.data.userId} joined user room: user_${userId}`);
  });

  // Handle joining transaction room
  socket.on('join_transaction_room', (data) => {
    const { transactionId } = data;
    socket.join(`transaction_${transactionId}`);
    console.log(`User ${socket.data.userId} joined transaction room: transaction_${transactionId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// WebSocket service functions for use in routes
const sendToUser = (userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
  console.log(`📤 Sent ${event} to user ${userId}`);
};

const sendToTransaction = (transactionId, event, data) => {
  io.to(`transaction_${transactionId}`).emit(event, data);
  console.log(`📤 Sent ${event} to transaction room: transaction_${transactionId}`);
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
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
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
  console.log('🔄 Starting working integrated server...');
  console.log('📋 Environment variables:');
  console.log('  - PORT:', process.env.PORT);
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  
  try {
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('🚀 Starting HTTP server on port', PORT);
    server.listen(PORT, () => {
      console.log('✅ WORKING INTEGRATED SERVER STARTED SUCCESSFULLY');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
      console.log(`💼 Transaction endpoints: http://localhost:${PORT}/api/transactions/`);
      console.log(`🔔 Notification endpoints: http://localhost:${PORT}/api/notifications/`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
