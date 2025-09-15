const express = require('express');
const cors = require('cors');

console.log('Starting minimal server...');

const app = express();
const PORT = 4000;

console.log('Setting up middleware...');
app.use(cors());
app.use(express.json());

console.log('Setting up routes...');
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Minimal server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/login', (req, res) => {
  console.log('Login endpoint hit');
  res.json({ 
    success: true, 
    message: 'Login endpoint working',
    timestamp: new Date().toISOString()
  });
});

console.log('Starting server on port', PORT);
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login test: http://localhost:${PORT}/api/auth/login`);
});