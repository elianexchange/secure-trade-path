const { io } = require('socket.io-client');

// Test WebSocket connection
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWY4Z2RsaWwwMDA5bXczdnF2ajQzb3FxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkJVWUVSIiwiaWF0IjoxNzU4NzU0MjY2LCJleHAiOjE3NTg4NDA2NjZ9.8AQBTcWrJGWDxd__do-hoRLpau3c_uEh_Ns9UQQemQo';

const socket = io('http://localhost:4000', {
  auth: {
    token: token
  }
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // Test joining a transaction room
  const transactionId = 'cmf9c2v1c0001eo1h0eby07fv'; // Use a real transaction ID
  socket.emit('join_transaction_room', { transactionId });
  console.log(`🔌 Joined transaction room: ${transactionId}`);
  
  // Test typing indicators
  setTimeout(() => {
    socket.emit('typing_start', { transactionId });
    console.log('⌨️  Started typing...');
  }, 2000);
  
  setTimeout(() => {
    socket.emit('typing_stop', { transactionId });
    console.log('⌨️  Stopped typing...');
  }, 4000);
  
  // Test online status
  setTimeout(() => {
    socket.emit('user_online', { transactionId });
    console.log('🟢 User online...');
  }, 6000);
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection error:', error.message);
});

// Listen for room events
socket.on('user_joined', (data) => {
  console.log('👤 User joined room:', data);
});

socket.on('user_left', (data) => {
  console.log('👤 User left room:', data);
});

socket.on('typing_start', (data) => {
  console.log('⌨️  Someone started typing:', data);
});

socket.on('typing_stop', (data) => {
  console.log('⌨️  Someone stopped typing:', data);
});

socket.on('user_online', (data) => {
  console.log('🟢 User came online:', data);
});

socket.on('user_offline', (data) => {
  console.log('🔴 User went offline:', data);
});

socket.on('new_message', (data) => {
  console.log('💬 New message received:', data);
});

socket.on('message_read', (data) => {
  console.log('✅ Message read:', data);
});

// Keep the connection alive for testing
setTimeout(() => {
  console.log('🔄 Closing connection...');
  socket.disconnect();
  process.exit(0);
}, 10000);


