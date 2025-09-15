import { Request, Response } from 'express';
import { prisma } from '../index';
import { uploadFile, deleteFile } from '../services/fileService';
// WebSocket functionality temporarily disabled to fix circular dependency

export class MessageController {
  // Get conversations for a user
  static async getConversations(req: Request, res: Response) {
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
            price: tx.price,
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
  static async getMessages(req: Request, res: Response) {
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
          }
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
  static async sendMessage(req: Request, res: Response) {
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
          isRead: false
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      // Update transaction timestamp
      await prisma.escrowTransaction.update({
        where: { id: transactionId },
        data: { updatedAt: new Date() }
      });

      // Emit to WebSocket (temporarily disabled)
      // wsService.emitToTransactionParties(
      //   transaction.creatorId,
      //   transaction.counterpartyId,
      //   'new_message',
      //   {
      //     message,
      //     transactionId
      //   }
      // );

      return res.status(201).json(message);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Mark message as read
  static async markAsRead(req: Request, res: Response) {
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

      // Emit to WebSocket (temporarily disabled)
      // wsService.broadcastToAll('message_read', {
      //   messageId: message.id
      // });

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to mark message as read' });
    }
  }

  // Upload file attachment (placeholder for future implementation)
  static async uploadFile(req: Request, res: Response) {
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
  static async searchMessages(req: Request, res: Response) {
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
  static async getUnreadCount(req: Request, res: Response) {
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

  // Delete message (only for sender)
  static async deleteMessage(req: Request, res: Response) {
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
