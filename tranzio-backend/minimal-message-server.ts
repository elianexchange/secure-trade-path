import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

console.log('🔄 Starting minimal message server...');

const app = express();
const server = createServer(app);
const PORT = 4000;

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
    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('✅ Message routes configured');

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
      console.log('✅ MINIMAL MESSAGE SERVER STARTED SUCCESSFULLY');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`💬 Message endpoints: http://localhost:${PORT}/api/messages/`);
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
