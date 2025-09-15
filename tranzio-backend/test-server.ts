import express from 'express';
import messageRoutes from './src/routes/messageRoutes';

const app = express();
const PORT = 4001;

app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test server running' });
});

// Add message routes
app.use('/api/messages', messageRoutes);

app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/test`);
  console.log(`💬 Messages: http://localhost:${PORT}/api/messages/conversations`);
});
