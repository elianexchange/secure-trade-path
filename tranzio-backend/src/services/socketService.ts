import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export let io: SocketIOServer;

// Store user socket mappings
const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
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
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET!) as any;
      if (!decoded) {
        return next(new Error('Authentication error'));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, status: true, firstName: true, lastName: true }
      });

      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('Authentication error'));
      }

      // Attach user info to socket
      socket.data.userId = user.id;
      socket.data.user = user;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Store socket mappings
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);

    // Update user's online status
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date()
      }
    });

    // Join user to their transaction rooms
    await joinTransactionRooms(socket, userId);

    // Handle private messages
    socket.on('send_message', async (data) => {
      try {
        const { message, transactionId, receiverId } = data;
        
        // Join transaction room if not already joined
        socket.join(transactionId.toString());
        
        // Emit to all users in the transaction room
        io.to(transactionId.toString()).emit('new_message', {
          message,
          transactionId,
          receiverId
        });
        
        // Update user's last seen
        await prisma.user.update({
          where: { id: userId },
          data: {
            lastSeen: new Date()
          }
        });
        
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId } = data;
        
        // Emit to all users in the transaction room
        socket.broadcast.emit('message_read', {
          messageId,
          readBy: userId
        });
        
        // Update user's last seen
        await prisma.user.update({
          where: { id: userId },
          data: {
            lastSeen: new Date()
          }
        });
        
      } catch (error) {
        console.error('Error handling mark_message_read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Handle user typing
    socket.on('typing_start', (data) => {
      const { transactionId } = data;
      socket.to(transactionId.toString()).emit('user_typing', {
        userId,
        transactionId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { transactionId } = data;
      socket.to(transactionId.toString()).emit('user_typing', {
        userId,
        transactionId,
        isTyping: false
      });
    });

    // Handle user presence
    socket.on('presence_update', async (data) => {
      try {
        const { status, customStatus } = data;
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            lastSeen: new Date()
          }
        });

        // Broadcast presence update to all connected users
        socket.broadcast.emit('user_presence_update', {
          userId,
          status,
          customStatus,
          lastSeen: new Date()
        });
        
      } catch (error) {
        console.error('Error handling presence_update:', error);
      }
    });

    // Handle room events
    socket.on('join_user_room', (data) => {
      const { userId: roomUserId } = data;
      socket.join(`user_${roomUserId}`);
      console.log(`User ${userId} joined user room: user_${roomUserId}`);
    });

    socket.on('join_transaction_room', (data) => {
      const { transactionId } = data;
      socket.join(`transaction_${transactionId}`);
      console.log(`User ${userId} joined transaction room: transaction_${transactionId}`);
    });

    socket.on('leave_transaction_room', (data) => {
      const { transactionId } = data;
      socket.leave(`transaction_${transactionId}`);
      console.log(`User ${userId} left transaction room: transaction_${transactionId}`);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${userId} disconnected from socket ${socket.id}`);
      
      // Remove socket mappings
      userSockets.delete(userId);
      socketUsers.delete(socket.id);

      // Update user's offline status
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastSeen: new Date()
        }
      });

      // Broadcast user offline status
      socket.broadcast.emit('user_offline', { userId });
    });
  });

  console.log('Socket.IO server initialized');
};

// Join user to their transaction rooms
const joinTransactionRooms = async (socket: any, userId: string) => {
  try {
    // This would typically query the database for user's active transactions
    // For now, we'll handle this when messages are sent
    
    // You can implement this by:
    // 1. Querying transactions where user is participant
    // 2. Joining socket to each transaction room
    // 3. Emitting user online status to transaction participants
    
  } catch (error) {
    console.error('Error joining transaction rooms:', error);
  }
};

// Get user's socket ID
export const getUserSocket = (userId: string): string | undefined => {
  return userSockets.get(userId);
};

// Check if user is online
export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId);
};

// Send message to specific user
export const sendToUser = (userId: string, event: string, data: any) => {
  if (!io) {
    console.error('Socket.IO server not initialized');
    return;
  }
  const socketId = getUserSocket(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// Send message to all users in a transaction
export const sendToTransaction = (transactionId: string, event: string, data: any) => {
  if (!io) {
    console.error('Socket.IO server not initialized');
    return;
  }
  io.to(`transaction_${transactionId}`).emit(event, data);
  console.log(`Sent ${event} to transaction room: transaction_${transactionId}`);
};

// Broadcast to all connected users
export const broadcastToAll = (event: string, data: any) => {
  if (!io) {
    console.error('Socket.IO server not initialized');
    return;
  }
  io.emit(event, data);
};

export default {
  initializeSocket,
  getUserSocket,
  isUserOnline,
  sendToUser,
  sendToTransaction,
  broadcastToAll
};
