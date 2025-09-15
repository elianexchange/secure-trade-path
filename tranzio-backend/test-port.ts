import express from 'express';

const app = express();
const PORT = 4001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Port test server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Port test server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});
