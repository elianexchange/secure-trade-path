import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { emailService } from '../services/emailService';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Validation schemas
const createConditionSchema = z.object({
  transactionId: z.string().min(1),
  conditionType: z.enum(['TIME_BASED', 'DELIVERY_CONFIRMED', 'MANUAL_APPROVAL', 'DISPUTE_RESOLVED']),
  conditionValue: z.string().optional()
});

const updateConditionSchema = z.object({
  conditionId: z.string().min(1),
  isMet: z.boolean(),
  metAt: z.string().optional()
});

// Create payment condition
router.post('/create', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = createConditionSchema.parse(req.body);

    // Verify user has access to this transaction
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: validatedData.transactionId,
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

    // Create the condition
    const condition = await prisma.paymentCondition.create({
      data: {
        transactionId: validatedData.transactionId,
        conditionType: validatedData.conditionType,
        conditionValue: validatedData.conditionValue || null,
        isMet: false
      }
    });

    // Update transaction to enable auto-release if not already enabled
    if (!transaction.autoReleaseEnabled) {
      await prisma.escrowTransaction.update({
        where: { id: validatedData.transactionId },
        data: { 
          autoReleaseEnabled: true,
          autoReleaseConditions: JSON.stringify([{
            type: validatedData.conditionType,
            value: validatedData.conditionValue
          }])
        }
      });
    }

    return res.json({
      success: true,
      message: 'Payment condition created successfully',
      data: { condition }
    });

  } catch (error) {
    console.error('Create payment condition error:', error);
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

// Update payment condition
router.put('/update', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = updateConditionSchema.parse(req.body);

    // Get the condition with transaction details
    const condition = await prisma.paymentCondition.findUnique({
      where: { id: validatedData.conditionId },
      include: {
        transaction: true
      }
    });

    if (!condition) {
      return res.status(404).json({
        success: false,
        error: 'Condition not found'
      });
    }

    // Verify user has access to this transaction
    if (condition.transaction.creatorId !== userId && condition.transaction.counterpartyId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update the condition
    const updatedCondition = await prisma.paymentCondition.update({
      where: { id: validatedData.conditionId },
      data: {
        isMet: validatedData.isMet,
        metAt: validatedData.isMet ? (validatedData.metAt ? new Date(validatedData.metAt) : new Date()) : null
      }
    });

    // Check if all conditions are met for auto-release
    if (validatedData.isMet) {
      await checkAndExecuteAutoRelease(condition.transactionId);
    }

    return res.json({
      success: true,
      message: 'Payment condition updated successfully',
      data: { condition: updatedCondition }
    });

  } catch (error) {
    console.error('Update payment condition error:', error);
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

// Get payment conditions for a transaction
router.get('/transaction/:transactionId', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const { transactionId } = req.params;

    // Verify user has access to this transaction
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
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Get all conditions for this transaction
    const conditions = await prisma.paymentCondition.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({
      success: true,
      data: { conditions, autoReleaseEnabled: transaction.autoReleaseEnabled }
    });

  } catch (error) {
    console.error('Get payment conditions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Set up time-based auto-release
router.post('/time-based', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const { transactionId, releaseDate } = req.body;

    if (!transactionId || !releaseDate) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and release date are required'
      });
    }

    // Verify user has access to this transaction
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
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Create time-based condition
    const condition = await prisma.paymentCondition.create({
      data: {
        transactionId,
        conditionType: 'TIME_BASED',
        conditionValue: JSON.stringify({
          releaseDate: new Date(releaseDate).toISOString(),
          timezone: 'UTC'
        }),
        isMet: false
      }
    });

    // Update transaction with auto-release settings
    await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: {
        autoReleaseEnabled: true,
        autoReleaseDate: new Date(releaseDate),
        autoReleaseConditions: JSON.stringify([{
          type: 'TIME_BASED',
          releaseDate: new Date(releaseDate).toISOString()
        }])
      }
    });

    return res.json({
      success: true,
      message: 'Time-based auto-release configured successfully',
      data: { 
        condition,
        releaseDate: new Date(releaseDate).toISOString()
      }
    });

  } catch (error) {
    console.error('Set time-based auto-release error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Manual payment release (override auto-release)
router.post('/manual-release', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const { transactionId, reason } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Verify user has access to this transaction
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
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    // Check if transaction is in a state where payment can be released
    if (!['SHIPMENT_CONFIRMED', 'WAITING_FOR_BUYER_CONFIRMATION'].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        error: 'Transaction is not in a state where payment can be released'
      });
    }

    // Create manual approval condition
    const condition = await prisma.paymentCondition.create({
      data: {
        transactionId,
        conditionType: 'MANUAL_APPROVAL',
        conditionValue: JSON.stringify({
          approvedBy: userId,
          reason: reason || 'Manual approval',
          approvedAt: new Date().toISOString()
        }),
        isMet: true,
        metAt: new Date()
      }
    });

    // Execute payment release
    await executePaymentRelease(transactionId, 'MANUAL_APPROVAL');

    // Send email notifications
    try {
      const transaction = await prisma.escrowTransaction.findUnique({
        where: { id: transactionId },
        include: {
          creator: { select: { email: true, firstName: true, lastName: true } },
          counterparty: { select: { email: true, firstName: true, lastName: true } }
        }
      });

      if (transaction) {
        // Send email to seller (who receives payment)
        if (transaction.counterparty?.email) {
          await emailService.sendPaymentReleasedEmail(transactionId, transaction.counterparty.email);
        }

        // Send notification email to buyer (who released payment)
        if (transaction.creator?.email) {
          await emailService.sendNotificationEmail(transaction.creator.email, {
            title: 'Payment Released',
            message: `You have manually released payment of ${transaction.currency} ${transaction.price} for transaction "${transaction.description}". The seller has been notified.`
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send payment release emails:', emailError);
      // Don't fail the request if email fails
    }

    return res.json({
      success: true,
      message: 'Payment released manually',
      data: { condition }
    });

  } catch (error) {
    console.error('Manual payment release error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to check and execute auto-release
async function checkAndExecuteAutoRelease(transactionId: string) {
  try {
    // Get all conditions for the transaction
    const conditions = await prisma.paymentCondition.findMany({
      where: { transactionId }
    });

    // Check if all conditions are met
    const allConditionsMet = conditions.every(condition => condition.isMet);

    if (allConditionsMet && conditions.length > 0) {
      await executePaymentRelease(transactionId, 'AUTO_RELEASE');
    }
  } catch (error) {
    console.error('Error checking auto-release conditions:', error);
  }
}

// Helper function to execute payment release
async function executePaymentRelease(transactionId: string, releaseType: string) {
  try {
    // Update transaction status
    await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create wallet transaction for payment release
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: transactionId },
      include: { creator: true, counterparty: true }
    });

    if (transaction && transaction.counterparty) {
      // Create wallet transaction record
      await prisma.walletTransaction.create({
        data: {
          walletId: 'default', // TODO: Get actual wallet ID from user
          transactionId: transactionId,
          type: 'ESCROW_RELEASE',
          amount: transaction.price,
          balance: 0, // This would be calculated based on current wallet balance
          description: `Payment released for transaction ${transactionId}`,
          reference: `REL-${transactionId}-${Date.now()}`,
          status: 'COMPLETED'
        }
      });

      // Create notification for both parties
      await prisma.notification.createMany({
        data: [
          {
            userId: transaction.creatorId,
            transactionId: transactionId,
            type: 'PAYMENT_RELEASED',
            title: 'Payment Released',
            message: `Payment of ${transaction.currency} ${transaction.price} has been released for transaction ${transaction.description}`,
            priority: 'HIGH'
          },
          {
            userId: transaction.counterpartyId!,
            transactionId: transactionId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Received',
            message: `You have received ${transaction.currency} ${transaction.price} for transaction ${transaction.description}`,
            priority: 'HIGH'
          }
        ]
      });

      // Send email notifications for auto-release
      if (releaseType === 'AUTO_RELEASE') {
        try {
          const [creator, counterparty] = await Promise.all([
            prisma.user.findUnique({
              where: { id: transaction.creatorId },
              select: { email: true, firstName: true, lastName: true }
            }),
            prisma.user.findUnique({
              where: { id: transaction.counterpartyId! },
              select: { email: true, firstName: true, lastName: true }
            })
          ]);

          // Send email to seller (who receives payment)
          if (counterparty?.email) {
            await emailService.sendPaymentReleasedEmail(transactionId, counterparty.email);
          }

          // Send notification email to buyer (who released payment)
          if (creator?.email) {
            await emailService.sendNotificationEmail(creator.email, {
              title: 'Payment Auto-Released',
              message: `Payment of ${transaction.currency} ${transaction.price} has been automatically released for transaction "${transaction.description}" based on the conditions you set. The seller has been notified.`
            });
          }
        } catch (emailError) {
          console.error('Failed to send auto-release emails:', emailError);
          // Don't fail the function if email fails
        }
      }
    }

    console.log(`Payment released for transaction ${transactionId} via ${releaseType}`);
  } catch (error) {
    console.error('Error executing payment release:', error);
    throw error;
  }
}

export default router;
