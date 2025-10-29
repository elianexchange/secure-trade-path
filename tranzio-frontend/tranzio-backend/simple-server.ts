import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple server running' });
});

// Test message endpoint
app.get('/api/messages/test', (req, res) => {
  res.json({ message: 'Message API is working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`💬 Test: http://localhost:${PORT}/api/messages/test`);
});
