import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { uploadFile, deleteFile } from '../services/fileService';
import { backendNotificationService } from '../services/notificationService';
import WebSocketService from '../services/websocket';

// WebSocket service instance - will be initialized by the main server
let wsService: WebSocketService | null = null;

// Function to set WebSocket service instance
export const setWebSocketService = (service: WebSocketService) => {
  wsService = service;
};

class MessageController {
  // Get conversations for a user
  async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user's transactions (both as creator and counterparty)
      const transactions = await prisma.escrowTransaction.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { counterpartyId: userId }
          ],
          status: { not: 'CANCELLED' }
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          counterparty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Format conversations for frontend
      const formattedConversations = transactions.map(tx => {
        const lastMessage = tx.messages[0];
        const counterparty = tx.creatorId === userId ? tx.counterparty : tx.creator;
        
        return {
          id: tx.id,
          transactionId: tx.id,
          participants: [tx.creatorId, tx.counterpartyId].filter(Boolean),
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId
          } : null,
          unreadCount: 0, // TODO: Implement unread count
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
          transactionDetails: {
            id: tx.id,
            description: tx.description,
            status: tx.status,
            total: tx.total,
            currency: tx.currency,
            createdAt: tx.createdAt
          },
          participantDetails: [
            tx.creator,
            tx.counterparty
          ].filter((user): user is NonNullable<typeof user> => user !== null).map(user => ({
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.id === tx.creatorId ? 'SELLER' : 'BUYER',
          }))
        };
      });

      return res.json(formattedConversations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to get conversations' });
    }
  }

  // Get messages for a specific transaction
  async getMessages(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user is participant in transaction
      const transaction = await prisma.escrowTransaction.findFirst({
        where: {
          id: transactionId,
          OR: [
            { creatorId: userId },
            { counterpartyId: userId }
          ]
        }
      });

      if (!transaction) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const messages = await prisma.message.findMany({
        where: { transactionId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          attachments: true
        },
        orderBy: { createdAt: 'asc' }
      });

      return res.json(messages);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to get messages' });
    }
  }

  // Send a message
  async sendMessage(req: Request, res: Response) {
    try {
      const { transactionId, content } = req.body;
      const senderId = req.user?.id;

      if (!senderId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify transaction exists and user is participant
      const transaction = await prisma.escrowTransaction.findFirst({
        where: {
          id: transactionId,
          OR: [
            { creatorId: senderId },
            { counterpartyId: senderId }
          ]
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          counterparty: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          transactionId,
          senderId,
          content,
          messageType: 'TEXT',
          isRead: false
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          attachments: true
        }
      });

      // Update transaction timestamp
      await prisma.escrowTransaction.update({
        where: { id: transactionId },
        data: { updatedAt: new Date() }
      });

      // Emit to WebSocket for real-time updates
      if (wsService) {
        try {
          // Emit to both transaction parties
          wsService.emitToTransactionParties(
            transaction.creatorId,
            transaction.counterpartyId,
            'new_message',
            {
              message: {
                ...message,
                timestamp: message.createdAt,
                messageType: 'TEXT'
              },
              transactionId,
              conversation: {
                id: `conv_${transactionId}`,
                transactionId,
                participants: [transaction.creatorId, transaction.counterpartyId].filter(Boolean),
                lastMessage: message,
                unreadCount: 1,
                createdAt: transaction.createdAt,
                updatedAt: new Date(),
                participantDetails: [
                  {
                    userId: transaction.creatorId,
                    name: `${message.sender.firstName} ${message.sender.lastName}`,
                    email: '', // Will be populated by frontend
                    role: transaction.creatorRole as 'BUYER' | 'SELLER'
                  }
                ]
              }
            }
          );
        } catch (wsError) {
          console.error('WebSocket emission failed:', wsError);
          // Don't fail the request if WebSocket fails
        }
      }

      // Create notification for the recipient (non-blocking)
      setImmediate(async () => {
        try {
          const recipientId = transaction.creatorId === senderId ? transaction.counterpartyId : transaction.creatorId;
          const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
          
          if (recipientId) {
            await backendNotificationService.createMessageNotification(
              recipientId,
              transactionId,
              senderName,
              content
            );
          }
        } catch (notificationError) {
          console.error('Failed to create message notification:', notificationError);
        }
      });

      return res.status(201).json(message);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Mark message as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the message and verify it belongs to a transaction where user is participant
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          transaction: {
            OR: [
              { creatorId: userId },
              { counterpartyId: userId }
            ]
          }
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      await prisma.message.update({
        where: { id: messageId },
        data: {
          isRead: true
        }
      });

      // Emit to WebSocket for real-time read status updates
      if (wsService) {
        try {
          // Get transaction details for proper room targeting
          const transaction = await prisma.escrowTransaction.findUnique({
            where: { id: message.transactionId },
            select: { creatorId: true, counterpartyId: true }
          });

          if (transaction) {
            wsService.emitToTransactionParties(
              transaction.creatorId,
              transaction.counterpartyId,
              'message_read',
              {
                messageId: message.id,
                readBy: userId,
                transactionId: message.transactionId
              }
            );
          }
        } catch (wsError) {
          console.error('WebSocket emission failed for message read:', wsError);
          // Don't fail the request if WebSocket fails
        }
      }

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to mark message as read' });
    }
  }

  // Upload file attachment (placeholder for future implementation)
  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { transactionId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user is participant in transaction
      const transaction = await prisma.escrowTransaction.findFirst({
        where: {
          id: transactionId,
          OR: [
            { creatorId: userId },
            { counterpartyId: userId }
          ]
        }
      });

      if (!transaction) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // For now, just return file info (file attachments not implemented in schema yet)
      const attachment = {
        filename: req.file.filename,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname
      };

      return res.json(attachment);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  // Search messages
  async searchMessages(req: Request, res: Response) {
    try {
      const { q: query, transactionId } = req.query;
      const userId = req.user?.id;

      if (!userId || !query) {
        return res.status(400).json({ error: 'Query and user required' });
      }

      let searchQuery: any = {
        content: { contains: query as string, mode: 'insensitive' }
      };

      if (transactionId) {
        searchQuery.transactionId = transactionId;
      }

      // Only search in transactions where user is participant
      const userTransactions = await prisma.escrowTransaction.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { counterpartyId: userId }
          ]
        },
        select: { id: true }
      });

      const transactionIds = userTransactions.map(tx => tx.id);
      searchQuery.transactionId = { in: transactionIds };

      const messages = await prisma.message.findMany({
        where: searchQuery,
        include: {
          transaction: {
            select: { description: true }
          },
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return res.json(messages);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to search messages' });
    }
  }

  // Get unread message count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await prisma.message.count({
        where: {
          isRead: false,
          transaction: {
            OR: [
              { creatorId: userId },
              { counterpartyId: userId }
            ]
          }
        }
      });

      return res.json({ count });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to get unread count' });
    }
  }

  // Mark all messages in a conversation as read
  async markConversationAsRead(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user is participant in transaction
      const transaction = await prisma.escrowTransaction.findFirst({
        where: {
          id: transactionId,
          OR: [
            { creatorId: userId },
            { counterpartyId: userId }
          ]
        }
      });

      if (!transaction) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Mark all unread messages in this transaction as read
      await prisma.message.updateMany({
        where: {
          transactionId,
          isRead: false,
          senderId: { not: userId } // Only mark messages from other users as read
        },
        data: {
          isRead: true
        }
      });

      // Emit to WebSocket for real-time read status updates
      if (wsService) {
        try {
          wsService.emitToTransactionParties(
            transaction.creatorId,
            transaction.counterpartyId,
            'conversation_read',
            {
              transactionId,
              readBy: userId
            }
          );
        } catch (wsError) {
          console.error('WebSocket emission failed for conversation read:', wsError);
        }
      }

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to mark conversation as read' });
    }
  }

  // Delete message (only for sender)
  async deleteMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      await prisma.message.delete({
        where: { id: messageId }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete message' });
    }
  }
}

export default new MessageController();
