console.log('=== DEBUG SERVER STARTING ===');

const express = require('express');
console.log('Express loaded');

const app = express();
console.log('Express app created');

const PORT = 4000;
console.log('Port set to:', PORT);

// Basic middleware
app.use(express.json());
console.log('JSON middleware added');

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
console.log('CORS middleware added');

// Health endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Debug server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    success: true,
    message: 'Login endpoint working',
    data: {
      user: { id: 'test-user', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      token: 'test-token-123'
    }
  });
});

app.post('/api/auth/signup', (req, res) => {
  console.log('Signup request received:', req.body);
  res.json({
    success: true,
    message: 'Signup endpoint working',
    data: {
      user: { id: 'new-user', email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName },
      token: 'new-token-456'
    }
  });
});

console.log('Routes configured');

// Start server
console.log('About to start server on port', PORT);
app.listen(PORT, () => {
  console.log('✅ DEBUG SERVER STARTED SUCCESSFULLY');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Signup: http://localhost:${PORT}/api/auth/signup`);
});

console.log('Server listen called');

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});