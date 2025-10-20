const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

console.log('🔄 Starting production server...');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081'
    ],
    credentials: true
  }
});

const PORT = process.env.PORT || 4000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

console.log('✅ Middleware configured');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    websocketConnections: io.engine.clientsCount
  });
});

console.log('✅ Health endpoint configured');

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    console.log('Registration attempt:', { email, firstName, lastName });

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  try {
    console.log('Logout request for user:', req.user.userId);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Authentication routes configured');

// Transaction routes
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting transactions for user:', userId);

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.get('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    console.log('Getting transaction:', id, 'for user:', userId);

    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Handle my-transactions route
app.get('/api/transactions/my-transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting my transactions for user:', userId);

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error getting my transactions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Transaction routes configured');

// Message routes
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting conversations for user:', userId);

    // Get all transactions where user is involved
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterparty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Convert to conversation format
    const conversations = transactions.map(transaction => {
      const isCreator = transaction.creatorId === userId;
      const counterparty = isCreator ? transaction.counterparty : transaction.creator;
      
      return {
        id: `conv_${transaction.id}`,
        transactionId: transaction.id,
        participants: [transaction.creatorId, transaction.counterpartyId],
        lastMessage: transaction.messages[0] || null,
        unreadCount: 0, // TODO: Calculate actual unread count
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        participantDetails: [
          {
            userId: transaction.creator.id,
            name: `${transaction.creator.firstName} ${transaction.creator.lastName}`,
            email: transaction.creator.email
          },
          {
            userId: transaction.counterparty?.id || '',
            name: transaction.counterparty ? `${transaction.counterparty.firstName} ${transaction.counterparty.lastName}` : 'Unknown',
            email: transaction.counterparty?.email || ''
          }
        ]
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.get('/api/messages/transactions/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;
    console.log('Getting messages for transaction:', transactionId, 'user:', userId);

    // Verify user has access to this transaction
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
        error: 'Transaction not found or access denied'
      });
    }

    // Get messages for this transaction
    const messages = await prisma.message.findMany({
      where: {
        transactionId: transactionId
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { transactionId, content } = req.body;
    const userId = req.user.userId;
    console.log('Sending message:', { transactionId, content, userId });

    if (!transactionId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and content are required'
      });
    }

    // Verify user has access to this transaction
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
        error: 'Transaction not found or access denied'
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        transactionId,
        senderId: userId,
        content,
        messageType: 'TEXT',
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      }
    });

    // Update transaction updatedAt
    await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: { updatedAt: new Date() }
    });

    // Emit to WebSocket clients in this transaction room
    io.to(`transaction_${transactionId}`).emit('new_message', {
      transactionId,
      message
    });

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.put('/api/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    console.log('Marking message as read:', messageId, 'user:', userId);

    // Update message as read
    await prisma.message.updateMany({
      where: {
        id: messageId,
        transactionId: {
          in: await prisma.escrowTransaction.findMany({
            where: {
              OR: [
                { creatorId: userId },
                { counterpartyId: userId }
              ]
            },
            select: { id: true }
          }).then(txs => txs.map(tx => tx.id))
        }
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Message routes configured');

// Notifications route (basic implementation)
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting notifications for user:', userId);

    // Return empty array for now - can be implemented later
    res.json([]);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

console.log('✅ Notifications route configured');

// WebSocket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    socket.userId = decoded.userId;
    next();
  });
});

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id, 'User:', socket.userId);
  
  // Handle joining transaction room
  socket.on('join_transaction_room', (data) => {
    const { transactionId } = data;
    socket.join(`transaction_${transactionId}`);
    console.log(`User ${socket.userId} joined transaction room: ${transactionId}`);
  });
  
  // Handle leaving transaction room
  socket.on('leave_transaction_room', (data) => {
    const { transactionId } = data;
    socket.leave(`transaction_${transactionId}`);
    console.log(`User ${socket.userId} left transaction room: ${transactionId}`);
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { transactionId } = data;
    socket.to(`transaction_${transactionId}`).emit('typing_start', {
      transactionId,
      userId: socket.userId
    });
  });
  
  socket.on('typing_stop', (data) => {
    const { transactionId } = data;
    socket.to(`transaction_${transactionId}`).emit('typing_stop', {
      transactionId,
      userId: socket.userId
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id, 'User:', socket.userId);
  });
});

console.log('✅ WebSocket handlers configured');

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
      console.log('✅ PRODUCTION SERVER WITH REAL DATABASE STARTED SUCCESSFULLY');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
      console.log(`💼 Transaction endpoints: http://localhost:${PORT}/api/transactions/`);
      console.log(`💬 Message endpoints: http://localhost:${PORT}/api/messages/`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log('');
      console.log('🎯 Production ready! Features:');
      console.log('   - Real database with Prisma');
      console.log('   - JWT authentication');
      console.log('   - Real-time messaging');
      console.log('   - Transaction management');
      console.log('   - User management');
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

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);


