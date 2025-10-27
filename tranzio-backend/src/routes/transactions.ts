import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { emailService } from '../services/emailService';
import { sendToUser, sendToTransaction } from '../services/websocketService';
import { backendNotificationService } from '../services/notificationService';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Validation schemas
const createTransactionSchema = z.object({
  description: z.string().min(1),
  currency: z.string().min(3).max(3),
  price: z.number().positive(),
  fee: z.number().positive(),
  total: z.number().positive(),
  useCourier: z.boolean(),
  creatorRole: z.enum(['BUYER', 'SELLER'])
});

const joinTransactionSchema = z.object({
  inviteCode: z.string().min(1)
});

// Generate unique invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new escrow transaction
router.post('/create', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;
    const validatedData = createTransactionSchema.parse(req.body);

    // Generate invitation code
    const inviteCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create transaction and invitation in a single transaction for better performance
    const result = await prisma.$transaction(async (tx) => {
    // Create the transaction
      const transaction = await tx.escrowTransaction.create({
      data: {
        ...validatedData,
        creatorId: userId,
        status: 'PENDING'
      }
    });

      // Create invitation
      const invitation = await tx.transactionInvitation.create({
      data: {
        transactionId: transaction.id,
        inviteCode,
          expiresAt
        }
      });

      return { transaction, invitation };
    });

    // Send response immediately
    return res.status(201).json({
      success: true,
      transaction: result.transaction,
      invitation: {
        code: result.invitation.inviteCode,
        expiresAt: result.invitation.expiresAt
      }
    });

    // Handle email and notification asynchronously (non-blocking)
    setImmediate(async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true }
      });
      
      if (user?.email) {
          await emailService.sendTransactionCreatedEmail(result.transaction.id, user.email);
      }

      // Create notification for transaction creator
      await backendNotificationService.createTransactionNotification(
        userId,
        result.transaction.id,
        'PENDING',
        `${user?.firstName} ${user?.lastName}`,
        validatedData.price
      );
    } catch (error) {
      console.error('Failed to send transaction created notification:', error);
      }
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction by invite code
router.get('/invite/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const invitation = await prisma.transactionInvitation.findFirst({
      where: {
        inviteCode: code,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        transaction: {
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or expired'
      });
    }

    return res.json({
      success: true,
      invitation: {
        code: invitation.inviteCode,
        expiresAt: invitation.expiresAt,
        transaction: invitation.transaction
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Join transaction with invite code
router.post('/join', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;
    const { inviteCode } = joinTransactionSchema.parse(req.body);

    // Find and validate invitation
    const invitation = await prisma.transactionInvitation.findFirst({
      where: {
        inviteCode,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        transaction: true
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or expired'
      });
    }

    // Check if user is trying to join their own transaction
    if (invitation.transaction.creatorId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot join your own transaction'
      });
    }

    // Check if transaction already has a counterparty
    if (invitation.transaction.counterpartyId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction already has a counterparty'
      });
    }

    // Update transaction and mark invitation as used in a single transaction
    const counterpartyName = req.user.firstName + ' ' + req.user.lastName;
    const result = await prisma.$transaction(async (tx) => {
    // Update transaction with counterparty
      const updatedTransaction = await tx.escrowTransaction.update({
      where: { id: invitation.transaction.id },
      data: {
        counterpartyId: userId,
        counterpartyRole: invitation.transaction.creatorRole === 'BUYER' ? 'SELLER' : 'BUYER',
          counterpartyName,
        status: 'ACTIVE'
      }
    });

    // Mark invitation as used
      await tx.transactionInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        usedBy: userId
      }
    });

      return updatedTransaction;
    });

    // Send response immediately
    return res.json({
      success: true,
      transaction: result,
      message: 'Successfully joined transaction'
    });

    // Handle WebSocket and email notifications asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        // Emit WebSocket events for transaction status update
        if (invitation) {
          sendToUser(invitation.transaction.creatorId, 'transaction:updated', {
            transactionId: result.id,
            status: result.status,
            description: result.description,
            counterpartyJoined: true,
            counterpartyName,
            transaction: result
          });
        }

      // Notify the joiner about successful join
      sendToUser(userId, 'transaction:updated', {
          transactionId: result.id,
          status: result.status,
          description: result.description,
        joined: true,
          transaction: result
      });

      // Broadcast to all users in the transaction room
        sendToTransaction(result.id, 'transaction:updated', {
          transactionId: result.id,
          status: result.status,
          description: result.description,
          transaction: result
        });

        console.log(`WebSocket events sent for transaction ${result.id} - status updated to ${result.status}`);

        // Send email notifications and create notifications
        if (invitation) {
          const [creator, counterparty] = await Promise.all([
            prisma.user.findUnique({
              where: { id: invitation.transaction.creatorId },
              select: { email: true, firstName: true, lastName: true }
            }),
            prisma.user.findUnique({
              where: { id: userId },
              select: { email: true, firstName: true, lastName: true }
            })
          ]);

          // Send emails in parallel
          const emailPromises: Promise<boolean>[] = [];
          
          if (counterparty?.email) {
            emailPromises.push(
              emailService.sendTransactionJoinedEmail(result.id, counterparty.email)
            );
          }

          if (creator?.email) {
            emailPromises.push(
              emailService.sendNotificationEmail(creator.email, {
                title: 'Transaction Joined',
                message: `${counterpartyName} has joined your transaction "${result.description}". The transaction is now active and you can proceed with the next steps.`
              })
            );
          }

          // Create notifications for both users
          const notificationPromises = [
            // Notification for the creator that someone joined
            backendNotificationService.createTransactionNotification(
              invitation.transaction.creatorId,
              result.id,
              'ACTIVE',
              counterpartyName,
              result.price
            ),
            // Notification for the joiner
            backendNotificationService.createTransactionNotification(
              userId,
              result.id,
              'ACTIVE',
              `${creator?.firstName} ${creator?.lastName}`,
              result.price
            )
          ];

          await Promise.allSettled([...emailPromises, ...notificationPromises]);
        }
      } catch (error) {
        console.error('Error in async operations:', error);
      }
    });
  } catch (error) {
    console.error('Error joining transaction:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's transactions
router.get('/my-transactions', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        counterparty: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        counterparty: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    return res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction participants
router.get('/:id/participants', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is participant in transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
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
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Format participants for frontend
    const participants: Array<{
      userId: string;
      name: string;
      email: string;
      role: 'BUYER' | 'SELLER';
    }> = [
      {
        userId: transaction.creator.id,
        name: `${transaction.creator.firstName} ${transaction.creator.lastName}`,
        email: transaction.creator.email,
        role: 'SELLER',
      }
    ];

    if (transaction.counterparty) {
      participants.push({
        userId: transaction.counterparty.id,
        name: `${transaction.counterparty.firstName} ${transaction.counterparty.lastName}`,
        email: transaction.counterparty.email,
        role: 'BUYER',
      });
    }

    return res.json(participants);
  } catch (error) {
    console.error('Error fetching transaction participants:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update delivery details (buyer provides shipping information)
router.put('/:id/delivery-details', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { deliveryDetails } = req.body;

    // Validate delivery details
    if (!deliveryDetails || typeof deliveryDetails !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Delivery details are required'
      });
    }

    // Check if user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Check if user is the buyer (only buyer can provide delivery details)
    const isBuyer = (transaction.creatorId === userId && transaction.creatorRole === 'BUYER') ||
                    (transaction.counterpartyId === userId && transaction.counterpartyRole === 'BUYER');
    
    if (!isBuyer) {
      return res.status(403).json({
        success: false,
        error: 'Only the buyer can provide delivery details'
      });
    }

    // Update delivery details
    const updatedTransaction = await prisma.escrowTransaction.update({
      where: { id },
      data: {
        deliveryDetails: JSON.stringify(deliveryDetails),
        status: 'WAITING_FOR_PAYMENT',
        updatedAt: new Date()
      }
    });

    // Send WebSocket updates to both parties
    try {
      // Notify creator
      sendToUser(transaction.creatorId, 'transaction:updated', {
        transactionId: updatedTransaction.id,
        status: updatedTransaction.status,
        deliveryDetails: JSON.stringify(deliveryDetails),
        transaction: updatedTransaction
      });

      // Notify counterparty if exists
      if (transaction.counterpartyId) {
        sendToUser(transaction.counterpartyId, 'transaction:updated', {
          transactionId: updatedTransaction.id,
          status: updatedTransaction.status,
          deliveryDetails: JSON.stringify(deliveryDetails),
          transaction: updatedTransaction
        });
      }

      // Broadcast to transaction room
      sendToTransaction(updatedTransaction.id, 'transaction:updated', {
        transactionId: updatedTransaction.id,
        status: updatedTransaction.status,
        deliveryDetails: JSON.stringify(deliveryDetails),
        transaction: updatedTransaction
      });

      console.log(`Delivery details updated for transaction ${updatedTransaction.id}`);
    } catch (error) {
      console.error('Error sending WebSocket events:', error);
    }

    return res.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Delivery details updated successfully'
    });
  } catch (error) {
    console.error('Error updating delivery details:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update shipping details (seller provides shipment confirmation)
router.put('/:id/shipping-details', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { shipmentData } = req.body;

    // Validate shipment data
    if (!shipmentData || typeof shipmentData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Shipment data is required'
      });
    }

    // Check if user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Check if user is the seller (only seller can provide shipping details)
    const isSeller = (transaction.creatorId === userId && transaction.creatorRole === 'SELLER') ||
                     (transaction.counterpartyId === userId && transaction.counterpartyRole === 'SELLER');
    
    if (!isSeller) {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can provide shipping details'
      });
    }

    // Update shipping details
    const updatedTransaction = await prisma.escrowTransaction.update({
      where: { id },
      data: {
        shippingDetails: JSON.stringify(shipmentData),
        status: 'WAITING_FOR_BUYER_CONFIRMATION',
        shippedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Send WebSocket updates to both parties
    try {
      // Notify creator
      sendToUser(transaction.creatorId, 'transaction:updated', {
        transactionId: updatedTransaction.id,
        status: updatedTransaction.status,
        shipmentData: shipmentData,
        transaction: updatedTransaction
      });

      // Notify counterparty if exists
      if (transaction.counterpartyId) {
        sendToUser(transaction.counterpartyId, 'transaction:updated', {
          transactionId: updatedTransaction.id,
          status: updatedTransaction.status,
          shipmentData: shipmentData,
          transaction: updatedTransaction
        });
      }

      // Broadcast to transaction room
      sendToTransaction(updatedTransaction.id, 'transaction:updated', {
        transactionId: updatedTransaction.id,
        status: updatedTransaction.status,
        shipmentData: shipmentData,
        transaction: updatedTransaction
      });

      console.log(`Shipping details updated for transaction ${updatedTransaction.id}`);
    } catch (error) {
      console.error('Error sending WebSocket events:', error);
    }

    return res.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Shipping details updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipping details:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Confirm payment (buyer confirms payment)
router.put('/:id/confirm-payment', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethod, paymentReference } = req.body;

    // Check if user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
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
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Check if user is the buyer (either creator or counterparty)
    const isBuyer = (transaction.creatorId === userId && transaction.creatorRole === 'BUYER') ||
                    (transaction.counterpartyId === userId && transaction.counterpartyRole === 'BUYER');
    
    if (!isBuyer) {
      return res.status(403).json({
        success: false,
        error: 'Only the buyer can confirm payment'
      });
    }

    // Check if transaction is in the correct status for payment
    // For non-shipping transactions, they can be in 'ACTIVE' status
    // For shipping transactions, they should be in 'WAITING_FOR_PAYMENT' status
    const validPaymentStatuses = transaction.useCourier 
      ? ['WAITING_FOR_PAYMENT'] 
      : ['ACTIVE', 'WAITING_FOR_PAYMENT'];
    
    if (!validPaymentStatuses.includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        error: `Transaction is not in payment status. Current status: ${transaction.status}. Valid statuses for ${transaction.useCourier ? 'shipping' : 'non-shipping'} transactions: ${validPaymentStatuses.join(', ')}`
      });
    }

    // Determine next status based on whether transaction requires shipping
    const nextStatus = transaction.useCourier ? 'WAITING_FOR_SHIPMENT' : 'PAYMENT_MADE';
    
    // Update transaction with payment confirmation
    const updatedTransaction = await prisma.escrowTransaction.update({
      where: { id },
      data: {
        status: nextStatus,
        paymentCompleted: true,
        paymentMethod: paymentMethod || 'WALLET',
        paymentReference: paymentReference || `PAY_${id}_${Date.now()}`,
        paidAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create notification for seller (the non-buyer participant)
    const sellerId = transaction.creatorRole === 'SELLER' ? transaction.creatorId : transaction.counterpartyId;
    const buyerName = transaction.creatorRole === 'BUYER' 
      ? `${transaction.creator?.firstName} ${transaction.creator?.lastName}`
      : `${transaction.counterparty?.firstName} ${transaction.counterparty?.lastName}`;
    
    if (sellerId) {
      await prisma.notification.create({
        data: {
          userId: sellerId,
          transactionId: transaction.id,
          type: 'PAYMENT',
          title: 'Payment Received - Funds in Escrow',
          message: `${buyerName} has made payment of ${transaction.currency} ${transaction.total}. Funds are secured in escrow. You can now proceed to ship the item.`,
          isRead: false,
          priority: 'HIGH'
        }
      });
    }

    // Send WebSocket updates to both parties
    try {
      // Notify both parties about payment confirmation
      sendToUser(transaction.creatorId, 'transaction:updated', {
        transactionId: transaction.id,
        status: nextStatus,
        paymentCompleted: true,
        message: 'Payment confirmed successfully',
        transaction: updatedTransaction
      });

      if (transaction.counterpartyId) {
        sendToUser(transaction.counterpartyId, 'transaction:updated', {
          transactionId: transaction.id,
          status: nextStatus,
          paymentCompleted: true,
          message: 'Payment confirmed successfully',
          transaction: updatedTransaction
        });
      }

      // Broadcast to transaction room
      sendToTransaction(transaction.id, 'transaction:updated', {
        transactionId: transaction.id,
        status: nextStatus,
        paymentCompleted: true,
        message: 'Payment confirmed successfully',
        transaction: updatedTransaction
      });
    } catch (wsError) {
      console.error('WebSocket notification error:', wsError);
    }

    return res.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Confirm receipt (buyer confirms receipt of goods)
router.put('/:id/confirm-receipt', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Check if user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
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
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Check if user is the buyer (either creator or counterparty)
    const isBuyer = (transaction.creatorId === userId && transaction.creatorRole === 'BUYER') ||
                    (transaction.counterpartyId === userId && transaction.counterpartyRole === 'BUYER');
    
    if (!isBuyer) {
      return res.status(403).json({
        success: false,
        error: 'Only the buyer can confirm receipt'
      });
    }

    // Check if transaction is in the correct status
    if (transaction.status !== 'WAITING_FOR_BUYER_CONFIRMATION') {
      return res.status(400).json({
        success: false,
        error: `Transaction is not in buyer confirmation status. Current status: ${transaction.status}`
      });
    }

    // Update transaction with receipt confirmation
    const updatedTransaction = await prisma.escrowTransaction.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create notification for seller (the non-buyer participant)
    const sellerId = transaction.creatorRole === 'SELLER' ? transaction.creatorId : transaction.counterpartyId;
    const buyerName = transaction.creatorRole === 'BUYER' 
      ? `${transaction.creator?.firstName} ${transaction.creator?.lastName}`
      : `${transaction.counterparty?.firstName} ${transaction.counterparty?.lastName}`;
    
    if (sellerId) {
        await prisma.notification.create({
          data: {
            userId: sellerId,
            transactionId: transaction.id,
            type: 'TRANSACTION_UPDATE',
            title: 'Transaction Completed - Funds Released',
            message: `${buyerName} has confirmed receipt of the item. Your funds have been released from escrow and are now available in your wallet.`,
            isRead: false,
            priority: 'HIGH'
          }
        });
    }

    // Send WebSocket updates to both parties
    try {
      // Notify both parties about receipt confirmation
      sendToUser(transaction.creatorId, 'transaction:updated', {
        transactionId: transaction.id,
        status: 'COMPLETED',
        receiptConfirmed: true,
        message: 'Receipt confirmed successfully',
        transaction: updatedTransaction
      });

      if (transaction.counterpartyId) {
        sendToUser(transaction.counterpartyId, 'transaction:updated', {
          transactionId: transaction.id,
          status: 'COMPLETED',
          receiptConfirmed: true,
          message: 'Receipt confirmed successfully',
          transaction: updatedTransaction
        });
      }

      // Broadcast to transaction room
      sendToTransaction(transaction.id, 'transaction:updated', {
        transactionId: transaction.id,
        status: 'COMPLETED',
        receiptConfirmed: true,
        message: 'Receipt confirmed successfully',
        transaction: updatedTransaction
      });
    } catch (wsError) {
      console.error('WebSocket notification error:', wsError);
    }

    return res.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Receipt confirmed successfully. Transaction completed.'
    });

  } catch (error) {
    console.error('Receipt confirmation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction activity log
router.get('/:id/activities', authenticateToken, async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Verify user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: id,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
      return;
    }

    // Get notifications related to this transaction as activity log
    const activities = await prisma.notification.findMany({
      where: {
        transactionId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform notifications to activity log format
    const activityLog = activities.map(notification => ({
      id: notification.id,
      action: notification.type.toLowerCase(),
      description: notification.title,
      timestamp: notification.createdAt.toISOString(),
      userId: notification.userId,
      userName: 'System', // We'll need to join with user data for real names
      userRole: 'SYSTEM' as 'BUYER' | 'SELLER',
      status: notification.isRead ? 'completed' : 'pending',
      metadata: (notification as any).metadata || {}
    }));

    res.json({
      success: true,
      activities: activityLog,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching transaction activities:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
