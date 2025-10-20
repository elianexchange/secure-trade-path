const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

console.log('🔄 Starting simple message server...');

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

const PORT = 4000;

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

// Health endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

console.log('✅ Health endpoint configured');

// Simple message routes for testing
app.get('/api/messages/conversations', async (req, res) => {
  try {
    console.log('Getting conversations');
    // Mock data for now
    res.json([]);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log('Getting messages for transaction:', transactionId);
    // Mock data for now
    res.json([]);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { transactionId, content } = req.body;
    console.log('Sending message:', { transactionId, content });
    
    // Create a mock message
    const message = {
      id: `msg_${Date.now()}`,
      transactionId,
      content,
      senderId: 'user123', // Mock user ID
      timestamp: new Date().toISOString(),
      isRead: false,
      messageType: 'TEXT'
    };
    
    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log('Marking message as read:', messageId);
    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('✅ Message routes configured');

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    
    // Mock authentication - in production, this would validate against database
    if (email && password) {
      const mockUser = {
        id: 'user123',
        email: email,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      };
      
      const mockToken = 'mock_jwt_token_' + Date.now();
      
      res.json({
        success: true,
        user: mockUser,
        token: mockToken
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Auth check with token:', token ? 'present' : 'missing');
    
    if (token && token.startsWith('mock_jwt_token_')) {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      };
      
      res.json({
        success: true,
        user: mockUser
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid or missing token'
      });
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    console.log('Registration attempt:', { email, firstName, lastName });
    
    // Mock registration
    const mockUser = {
      id: 'user_' + Date.now(),
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: 'USER'
    };
    
    const mockToken = 'mock_jwt_token_' + Date.now();
    
    res.json({
      success: true,
      user: mockUser,
      token: mockToken
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    console.log('Logout request');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('✅ Authentication routes configured');

// Transaction routes
app.get('/api/transactions', async (req, res) => {
  try {
    console.log('Getting transactions');
    // Mock transaction data
    const mockTransactions = [
      {
        id: 'txn_123',
        title: 'Test Transaction',
        description: 'A test transaction for messaging',
        amount: 1000,
        status: 'ACTIVE',
        creatorId: 'user123',
        counterpartyId: 'user456',
        createdAt: new Date().toISOString()
      }
    ];
    res.json(mockTransactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Getting transaction:', id);
    
    // Mock transaction data
    const mockTransaction = {
      id: id,
      title: 'Test Transaction',
      description: 'A test transaction for messaging',
      amount: 1000,
      status: 'ACTIVE',
      creatorId: 'user123',
      counterpartyId: 'user456',
      creatorName: 'Test User',
      counterpartyName: 'Counterparty User',
      createdAt: new Date().toISOString()
    };
    
    res.json(mockTransaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('✅ Transaction routes configured');

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Handle joining transaction room
  socket.on('join_transaction_room', (data) => {
    const { transactionId } = data;
    socket.join(`transaction_${transactionId}`);
    console.log(`Client ${socket.id} joined transaction room: ${transactionId}`);
  });
  
  // Handle leaving transaction room
  socket.on('leave_transaction_room', (data) => {
    const { transactionId } = data;
    socket.leave(`transaction_${transactionId}`);
    console.log(`Client ${socket.id} left transaction room: ${transactionId}`);
  });
  
  // Handle new message
  socket.on('new_message', (data) => {
    const { transactionId, message } = data;
    // Broadcast to all clients in the transaction room
    io.to(`transaction_${transactionId}`).emit('new_message', {
      transactionId,
      message
    });
    console.log(`Broadcasting message to transaction room: ${transactionId}`);
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { transactionId, userId } = data;
    socket.to(`transaction_${transactionId}`).emit('typing_start', {
      transactionId,
      userId
    });
  });
  
  socket.on('typing_stop', (data) => {
    const { transactionId, userId } = data;
    socket.to(`transaction_${transactionId}`).emit('typing_stop', {
      transactionId,
      userId
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
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

// Start server
console.log('🚀 Starting HTTP server on port', PORT);
server.listen(PORT, () => {
  console.log('✅ FULL STACK SERVER WITH WEBSOCKET STARTED SUCCESSFULLY');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
  console.log(`💼 Transaction endpoints: http://localhost:${PORT}/api/transactions/`);
  console.log(`💬 Message endpoints: http://localhost:${PORT}/api/messages/`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('');
  console.log('🎯 Ready for testing! You can now:');
  console.log('   - Login with any email/password');
  console.log('   - View transactions');
  console.log('   - Use the chat functionality');
});
