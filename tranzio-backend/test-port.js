const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4001; // Different port

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running on port 4001',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/login', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Login endpoint working on port 4001',
    timestamp: new Date().toISOString()
  });
});

console.log('Starting server on port', PORT);
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

