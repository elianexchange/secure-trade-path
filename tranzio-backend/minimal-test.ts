import express from 'express';

const app = express();
const PORT = 4000;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal server running' });
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});

