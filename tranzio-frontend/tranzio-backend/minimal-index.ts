import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔄 Starting minimal server...');

const app = express();
const PORT = process.env.PORT || 4000;

console.log('📋 Environment variables:');
console.log('  - PORT:', PORT);
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

// Middleware
app.use(cors());
app.use(express.json());

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

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    success: true,
    message: 'Login successful',
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
    message: 'Signup successful',
    data: {
      user: { id: 'new-user', email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName },
      token: 'new-token-456'
    }
  });
});

console.log('✅ Auth endpoints configured');

// Start server
console.log('🚀 Starting server on port', PORT);
app.listen(PORT, () => {
  console.log('✅ MINIMAL SERVER STARTED SUCCESSFULLY');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Signup: http://localhost:${PORT}/api/auth/signup`);
});

console.log('Server listen called');

