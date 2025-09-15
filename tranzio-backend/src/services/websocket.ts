import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AuthenticatedSocket {
  userId: string;
  userRole: string;
  userEmail: string;
}

interface NotificationData {
  userId: string;
  transactionId?: string;
  type: string;
  title: string;
  message: string;
  priority: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          process.env.CORS_ORIGIN || 'http://localhost:8080',
          'http://localhost:8081',
          'http://127.0.0.1:8080',
          'http://127.0.0.1:8081'
        ],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user info to socket
        (socket as any).user = {
          userId: user.id,
          userRole: user.role,
          userEmail: user.email,
        };

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = (socket as any).user as AuthenticatedSocket;
      
      console.log(`User ${user.userEmail} connected with socket ${socket.id}`);
      
      // Store user's socket mapping
      this.userSockets.set(user.userId, socket.id);

      // Join user to their personal room
      socket.join(`user:${user.userId}`);

      // Join role-based rooms
      socket.join(`role:${user.userRole}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${user.userEmail} disconnected`);
        this.userSockets.delete(user.userId);
      });

      // Handle transaction status updates
      socket.on('transaction:status_update', async (data: { transactionId: string; status: string }) => {
        try {
          const transaction = await prisma.escrowTransaction.findUnique({
            where: { id: data.transactionId },
            include: {
              creator: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              },
              counterparty: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              }
            }
          });

          if (!transaction) {
            console.error('Transaction not found:', data.transactionId);
            return;
          }

          // Notify both parties about status change
          const notificationData: NotificationData = {
            userId: transaction.creatorId,
            transactionId: transaction.id,
            type: 'TRANSACTION_UPDATE',
            title: 'Transaction Status Updated',
            message: `Your transaction "${transaction.description}" status has been updated to ${data.status}`,
            priority: 'MEDIUM'
          };

          // Send to creator
          this.io.to(`user:${transaction.creatorId}`).emit('notification', notificationData);

          // Send to counterparty if exists
          if (transaction.counterpartyId) {
            const counterpartyNotification: NotificationData = {
              ...notificationData,
              userId: transaction.counterpartyId,
              message: `Transaction "${transaction.description}" status has been updated to ${data.status}`
            };
            this.io.to(`user:${transaction.counterpartyId}`).emit('notification', counterpartyNotification);
          }

          // Send to creator's personal room
          console.log(`Sending transaction:updated to creator ${transaction.creatorId} for transaction ${transaction.id}`);
          this.io.to(`user:${transaction.creatorId}`).emit('transaction:updated', {
            transactionId: transaction.id,
            status: data.status,
            description: transaction.description
          });

          // Send to counterparty's personal room if exists
          if (transaction.counterpartyId) {
            console.log(`Sending transaction:updated to counterparty ${transaction.counterpartyId} for transaction ${transaction.id}`);
            this.io.to(`user:${transaction.counterpartyId}`).emit('transaction:updated', {
              transactionId: transaction.id,
              status: data.status,
              description: transaction.description
            });
          }

          // Broadcast to role-based rooms
          this.io.to(`role:${transaction.creatorRole}`).emit('transaction:updated', {
            transactionId: transaction.id,
            status: data.status,
            description: transaction.description
          });

        } catch (error) {
          console.error('Error handling transaction status update:', error);
        }
      });

      // Handle transaction creation
      socket.on('transaction:created', async (data: { transactionId: string }) => {
        try {
          const transaction = await prisma.escrowTransaction.findUnique({
            where: { id: data.transactionId },
            include: {
              creator: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              }
            }
          });

          if (!transaction) {
            console.error('Transaction not found:', data.transactionId);
            return;
          }

          // Notify creator about successful creation
          const notificationData: NotificationData = {
            userId: transaction.creatorId,
            transactionId: transaction.id,
            type: 'TRANSACTION_CREATED',
            title: 'Transaction Created Successfully',
            message: `Your transaction "${transaction.description}" has been created and is ready for sharing`,
            priority: 'HIGH'
          };

          this.io.to(`user:${transaction.creatorId}`).emit('notification', notificationData);

          // Broadcast to role-based rooms
          this.io.to(`role:${transaction.creatorRole}`).emit('transaction:created', {
            transactionId: transaction.id,
            description: transaction.description,
            creator: transaction.creator
          });

        } catch (error) {
          console.error('Error handling transaction creation:', error);
        }
      });

      // Handle transaction joining
      socket.on('transaction:joined', async (data: { transactionId: string; userId: string }) => {
        try {
          const transaction = await prisma.escrowTransaction.findUnique({
            where: { id: data.transactionId },
            include: {
              creator: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              },
              counterparty: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              }
            }
          });

          if (!transaction) {
            console.error('Transaction not found:', data.transactionId);
            return;
          }

          // Notify creator that someone joined
          const creatorNotification: NotificationData = {
            userId: transaction.creatorId,
            transactionId: transaction.id,
            type: 'TRANSACTION_JOINED',
            title: 'Transaction Joined',
            message: `Someone has joined your transaction "${transaction.description}"`,
            priority: 'HIGH'
          };

          this.io.to(`user:${transaction.creatorId}`).emit('notification', creatorNotification);

          // Notify counterparty about successful join
          if (transaction.counterpartyId) {
            const counterpartyNotification: NotificationData = {
              userId: transaction.counterpartyId,
              transactionId: transaction.id,
              type: 'TRANSACTION_JOINED',
              title: 'Successfully Joined Transaction',
              message: `You have successfully joined the transaction "${transaction.description}"`,
              priority: 'HIGH'
            };
            this.io.to(`user:${transaction.counterpartyId}`).emit('notification', counterpartyNotification);
          }

          // Broadcast to both parties
          this.io.to(`user:${transaction.creatorId}`).to(`user:${transaction.counterpartyId}`).emit('transaction:joined', {
            transactionId: transaction.id,
            description: transaction.description,
            status: 'ACTIVE'
          });

        } catch (error) {
          console.error('Error handling transaction join:', error);
        }
      });

      // Handle payment updates
      socket.on('transaction:payment_update', async (data: { transactionId: string; paymentStatus: string }) => {
        try {
          const transaction = await prisma.escrowTransaction.findUnique({
            where: { id: data.transactionId },
            include: {
              creator: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              },
              counterparty: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              }
            }
          });

          if (!transaction) {
            console.error('Transaction not found:', data.transactionId);
            return;
          }

          // Notify both parties about payment update
          const notificationData: NotificationData = {
            userId: transaction.creatorId,
            transactionId: transaction.id,
            type: 'PAYMENT_UPDATE',
            title: 'Payment Status Updated',
            message: `Payment status for transaction "${transaction.description}" has been updated to ${data.paymentStatus}`,
            priority: 'HIGH'
          };

          // Send to creator
          this.io.to(`user:${transaction.creatorId}`).emit('notification', notificationData);

          // Send to counterparty if exists
          if (transaction.counterpartyId) {
            const counterpartyNotification: NotificationData = {
              ...notificationData,
              userId: transaction.counterpartyId
            };
            this.io.to(`user:${transaction.counterpartyId}`).emit('notification', counterpartyNotification);
          }

          // Broadcast payment update
          this.io.to(`user:${transaction.creatorId}`).to(`user:${transaction.counterpartyId}`).emit('payment:updated', {
            transactionId: transaction.id,
            paymentStatus: data.paymentStatus,
            description: transaction.description
          });

        } catch (error) {
          console.error('Error handling payment update:', error);
        }
      });

      // Handle shipping updates
      socket.on('transaction:shipping_update', async (data: { transactionId: string; shippingStatus: string }) => {
        try {
          const transaction = await prisma.escrowTransaction.findUnique({
            where: { id: data.transactionId },
            include: {
              creator: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              },
              counterparty: { 
                select: { 
                  id: true, 
                  email: true, 
                  firstName: true, 
                  lastName: true 
                } 
              }
            }
          });

          if (!transaction) {
            console.error('Transaction not found:', data.transactionId);
            return;
          }

          // Notify both parties about shipping update
          const notificationData: NotificationData = {
            userId: transaction.creatorId,
            transactionId: transaction.id,
            type: 'SHIPPING_UPDATE',
            title: 'Shipping Status Updated',
            message: `Shipping status for transaction "${transaction.description}" has been updated to ${data.shippingStatus}`,
            priority: 'MEDIUM'
          };

          // Send to creator
          this.io.to(`user:${transaction.creatorId}`).emit('notification', notificationData);

          // Send to counterparty if exists
          if (transaction.counterpartyId) {
            const counterpartyNotification: NotificationData = {
              ...notificationData,
              userId: transaction.counterpartyId
            };
            this.io.to(`user:${transaction.counterpartyId}`).emit('notification', counterpartyNotification);
          }

          // Broadcast shipping update
          this.io.to(`user:${transaction.creatorId}`).to(`user:${transaction.counterpartyId}`).emit('shipping:updated', {
            transactionId: transaction.id,
            shippingStatus: data.shippingStatus,
            description: transaction.description
          });

        } catch (error) {
          console.error('Error handling shipping update:', error);
        }
      });

      // Handle general notifications
      socket.on('send_notification', async (data: NotificationData) => {
        try {
          // Send notification to specific user
          this.io.to(`user:${data.userId}`).emit('notification', data);

          // Also broadcast to role-based room if specified
          if (data.type.includes('TRANSACTION')) {
            this.io.to(`role:${user.userRole}`).emit('notification', data);
          }
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      });

      // Handle messaging functionality
      socket.on('send_message', async (data: { message: any; transactionId: string; receiverId: string }) => {
        try {
          // Join transaction room if not already joined
          socket.join(`transaction:${data.transactionId}`);
          
          // Emit to all users in the transaction room
          this.io.to(`transaction:${data.transactionId}`).emit('new_message', {
            message: data.message,
            transactionId: data.transactionId,
            receiverId: data.receiverId
          });
          
          // Update user's last seen (commented out due to schema mismatch)
          // await prisma.user.update({
          //   where: { id: user.userId },
          //   data: { lastSeen: new Date() }
          // });
          
        } catch (error) {
          console.error('Error handling send_message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle message read status
      socket.on('mark_message_read', async (data: { messageId: string }) => {
        try {
          // Emit to all users in the transaction room
          socket.broadcast.emit('message_read', {
            messageId: data.messageId,
            readBy: user.userId
          });
          
          // Update user's last seen (commented out due to schema mismatch)
          // await prisma.user.update({
          //   where: { id: user.userId },
          //   data: { lastSeen: new Date() }
          // });
          
        } catch (error) {
          console.error('Error handling mark_message_read:', error);
          socket.emit('error', { message: 'Failed to mark message as read' });
        }
      });

      // Handle user typing
      socket.on('typing_start', (data: { transactionId: string }) => {
        socket.to(`transaction:${data.transactionId}`).emit('user_typing', {
          userId: user.userId,
          transactionId: data.transactionId,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data: { transactionId: string }) => {
        socket.to(`transaction:${data.transactionId}`).emit('user_typing', {
          userId: user.userId,
          transactionId: data.transactionId,
          isTyping: false
        });
      });
    });
  }

  // Get count of connected users
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: string, notification: NotificationData): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Broadcast to all users
  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Broadcast to specific role
  public broadcastToRole(role: string, event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Get user's socket ID
  public getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }

  // Emit event to specific user
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emit event to both parties of a transaction
  public emitToTransactionParties(creatorId: string, counterpartyId: string | null, event: string, data: any): void {
    this.io.to(`user:${creatorId}`).emit(event, data);
    if (counterpartyId) {
      this.io.to(`user:${counterpartyId}`).emit(event, data);
    }
  }
}

export default WebSocketService;
