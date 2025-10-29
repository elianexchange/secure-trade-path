const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = createServer(app);
const PORT = 4000;

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:8080',
      'http://localhost:8081'
    ],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081'
  ],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    websocketConnections: io.engine.clientsCount
  });
});

// Mock auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received');
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  // Mock user
  const user = {
    id: 'cmf8yt4fh0000bzfc2wysdivx',
    email: email,
    firstName: 'Test',
    lastName: 'User',
    role: 'BUYER'
  };

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    'tranzio-super-secret-jwt-key-2024-development',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    user,
    token
  });
});

// Mock transactions endpoint
app.get('/api/transactions/my-transactions', (req, res) => {
  console.log('My transactions request received');
  res.json({
    success: true,
    transactions: []
  });
});

// Mock notifications endpoint
app.get('/api/notifications', (req, res) => {
  console.log('Notifications request received');
  res.json({
    success: true,
    notifications: []
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);
  
  // Handle authentication
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, 'tranzio-super-secret-jwt-key-2024-development');
      socket.data.userId = decoded.userId;
      socket.join(`user_${decoded.userId}`);
      console.log(`✅ User ${decoded.userId} authenticated via WebSocket`);
      
      socket.emit('authenticated', { success: true, userId: decoded.userId });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.emit('authentication_error', { error: 'Invalid token' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});
