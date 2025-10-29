// WebSocket service for sending messages
// This will be initialized by the integrated server

let io: any = null;

export const initializeWebSocketService = (socketIO: any) => {
  io = socketIO;
};

export const sendToUser = (userId: string, event: string, data: any) => {
  if (!io) {
    console.error('WebSocket service not initialized');
    return;
  }
  io.to(`user_${userId}`).emit(event, data);
  console.log(`📤 Sent ${event} to user ${userId}`);
};

export const sendToTransaction = (transactionId: string, event: string, data: any) => {
  if (!io) {
    console.error('WebSocket service not initialized');
    return;
  }
  io.to(`transaction_${transactionId}`).emit(event, data);
  console.log(`📤 Sent ${event} to transaction room: transaction_${transactionId}`);
};

export const broadcastToAll = (event: string, data: any) => {
  if (!io) {
    console.error('WebSocket service not initialized');
    return;
  }
  io.emit(event, data);
  console.log(`📤 Broadcasted ${event} to all users`);
};


















