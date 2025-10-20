import { io } from 'socket.io-client';

console.log('🔌 Testing integrated WebSocket connection...');

// Test WebSocket connection with real token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWY4Z2RsaWwwMDA5bXczdnF2ajQzb3FxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkJVWUVSIiwiaWF0IjoxNzU3OTM1MzE4LCJleHAiOjE3NTg1NDAxMTh9.17y2R9fpJtYIA96dH4Od1wSGozZyC9Ano1YM_d6waRA';

const socket = io('http://localhost:4000', {
  auth: {
    token: token
  },
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // Test authentication
  socket.emit('authenticate', token);
});

socket.on('authenticated', (data) => {
  console.log('✅ Authentication successful:', data);
  
  // Test joining user room
  socket.emit('join_user_room', { userId: 'cmf8gdlil0009mw3vqvj43oqq' });
  
  // Test joining transaction room
  socket.emit('join_transaction_room', { transactionId: 'cmf9c2v1c0001eo1h0eby07fv' });
  
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Connection test timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);


















