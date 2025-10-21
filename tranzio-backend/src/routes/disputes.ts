import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { 
  DisputeResolutionService, 
  CreateDisputeData, 
  ResolutionData, 
  EvidenceData, 
  MessageData 
} from '../services/disputeResolutionService';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

const router = express.Router();

// Validation schemas
const createDisputeSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  disputeType: z.enum(['PAYMENT', 'DELIVERY', 'QUALITY', 'FRAUD', 'OTHER']),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
});

const addEvidenceSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO']),
  fileUrl: z.string().url('Invalid file URL'),
  description: z.string().max(500, 'Description too long').optional()
});

const addMessageSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long')
});

const proposeResolutionSchema = z.object({
  disputeId: z.string().min(1, 'Dispute ID is required'),
  resolutionType: z.enum(['AUTOMATIC', 'MEDIATION', 'ARBITRATION', 'ADMIN_DECISION']),
  resolution: z.enum(['REFUND_FULL', 'REFUND_PARTIAL', 'RELEASE_PAYMENT', 'NO_ACTION']),
  amount: z.number().min(0).optional(),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  expiresAt: z.string().datetime().optional()
});

// Create dispute
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = createDisputeSchema.parse(req.body);

    // Get transaction to determine the other party
    const transaction = await prisma.escrowTransaction.findFirst({
      where: {
        id: validatedData.transactionId,
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      include: {
        creator: { select: { id: true } },
        counterparty: { select: { id: true } }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access denied'
      });
    }

    const raisedAgainst = transaction.creatorId === userId 
      ? transaction.counterparty?.id 
      : transaction.creator.id;

    if (!raisedAgainst) {
      return res.status(400).json({
        success: false,
        error: 'Transaction must have a counterparty to raise dispute'
      });
    }

    const disputeData: CreateDisputeData = {
      transactionId: validatedData.transactionId,
      raisedBy: userId,
      raisedAgainst,
      disputeType: validatedData.disputeType,
      reason: validatedData.reason,
      description: validatedData.description,
      priority: validatedData.priority
    };

    const dispute = await DisputeResolutionService.createDispute(disputeData);

    return res.status(201).json({
      success: true,
      data: dispute,
      message: 'Dispute created successfully'
    });

  } catch (error) {
    console.error('Create dispute error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get dispute by ID
router.get('/:disputeId', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { disputeId } = req.params;
    const userId = req.user.id;

    const dispute = await DisputeResolutionService.getDispute(disputeId, userId);

    return res.json({
      success: true,
      data: dispute
    });

  } catch (error) {
    console.error('Get dispute error:', error);
    if (error instanceof Error) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's disputes
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const disputes = await DisputeResolutionService.getUserDisputes(userId);

    return res.json({
      success: true,
      data: disputes
    });

  } catch (error) {
    console.error('Get user disputes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add evidence to dispute
router.post('/:disputeId/evidence', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { disputeId } = req.params;
    const userId = req.user.id;
    const validatedData = addEvidenceSchema.parse({
      ...req.body,
      disputeId
    });

    const evidenceData: EvidenceData = {
      disputeId: validatedData.disputeId,
      uploadedBy: userId,
      fileName: validatedData.fileName,
      fileType: validatedData.fileType,
      fileUrl: validatedData.fileUrl,
      description: validatedData.description
    };

    const evidence = await DisputeResolutionService.addEvidence(evidenceData);

    return res.status(201).json({
      success: true,
      data: evidence,
      message: 'Evidence added successfully'
    });

  } catch (error) {
    console.error('Add evidence error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add message to dispute
router.post('/:disputeId/messages', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { disputeId } = req.params;
    const userId = req.user.id;
    const validatedData = addMessageSchema.parse({
      ...req.body,
      disputeId
    });

    const messageData: MessageData = {
      disputeId: validatedData.disputeId,
      senderId: userId,
      content: validatedData.content
    };

    const message = await DisputeResolutionService.addMessage(messageData);

    return res.status(201).json({
      success: true,
      data: message,
      message: 'Message added successfully'
    });

  } catch (error) {
    console.error('Add message error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Propose resolution
router.post('/:disputeId/resolutions', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { disputeId } = req.params;
    const userId = req.user.id;
    const validatedData = proposeResolutionSchema.parse({
      ...req.body,
      disputeId
    });

    const resolutionData: ResolutionData = {
      disputeId: validatedData.disputeId,
      resolutionType: validatedData.resolutionType,
      proposedBy: userId,
      resolution: validatedData.resolution,
      amount: validatedData.amount,
      reason: validatedData.reason,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    };

    const resolution = await DisputeResolutionService.proposeResolution(resolutionData);

    return res.status(201).json({
      success: true,
      data: resolution,
      message: 'Resolution proposed successfully'
    });

  } catch (error) {
    console.error('Propose resolution error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Accept resolution
router.post('/resolutions/:resolutionId/accept', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { resolutionId } = req.params;
    const userId = req.user.id;

    const resolution = await DisputeResolutionService.acceptResolution(resolutionId, userId);

    return res.json({
      success: true,
      data: resolution,
      message: 'Resolution accepted successfully'
    });

  } catch (error) {
    console.error('Accept resolution error:', error);
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reject resolution
router.post('/resolutions/:resolutionId/reject', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { resolutionId } = req.params;
    const userId = req.user.id;

    const resolution = await DisputeResolutionService.rejectResolution(resolutionId, userId);

    return res.json({
      success: true,
      data: resolution,
      message: 'Resolution rejected successfully'
    });

  } catch (error) {
    console.error('Reject resolution error:', error);
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get dispute statistics (admin only)
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // In a real implementation, you would check if user is admin
    // For now, we'll allow any authenticated user to see stats
    const stats = await DisputeResolutionService.getDisputeStats();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get dispute stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get dispute types and statuses (for frontend forms)
router.get('/meta/types', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        disputeTypes: [
          { value: 'PAYMENT', label: 'Payment Issue', description: 'Problems with payment processing or release' },
          { value: 'DELIVERY', label: 'Delivery Issue', description: 'Problems with item delivery or shipping' },
          { value: 'QUALITY', label: 'Quality Issue', description: 'Item not as described or defective' },
          { value: 'FRAUD', label: 'Fraud', description: 'Suspected fraudulent activity' },
          { value: 'OTHER', label: 'Other', description: 'Other issues not covered above' }
        ],
        priorities: [
          { value: 'LOW', label: 'Low', description: 'Non-urgent issue' },
          { value: 'MEDIUM', label: 'Medium', description: 'Standard priority' },
          { value: 'HIGH', label: 'High', description: 'Urgent issue' },
          { value: 'URGENT', label: 'Urgent', description: 'Critical issue requiring immediate attention' }
        ],
        resolutionTypes: [
          { value: 'AUTOMATIC', label: 'Automatic', description: 'System-generated resolution' },
          { value: 'MEDIATION', label: 'Mediation', description: 'Mutual agreement between parties' },
          { value: 'ARBITRATION', label: 'Arbitration', description: 'Third-party arbitration' },
          { value: 'ADMIN_DECISION', label: 'Admin Decision', description: 'Administrative decision' }
        ],
        resolutionActions: [
          { value: 'REFUND_FULL', label: 'Full Refund', description: 'Refund the full transaction amount' },
          { value: 'REFUND_PARTIAL', label: 'Partial Refund', description: 'Refund a portion of the transaction' },
          { value: 'RELEASE_PAYMENT', label: 'Release Payment', description: 'Release payment to seller' },
          { value: 'NO_ACTION', label: 'No Action', description: 'No action required' }
        ],
        statuses: [
          { value: 'OPEN', label: 'Open', description: 'Dispute is open and being reviewed' },
          { value: 'IN_REVIEW', label: 'In Review', description: 'Dispute is under review' },
          { value: 'RESOLVED', label: 'Resolved', description: 'Dispute has been resolved' },
          { value: 'CLOSED', label: 'Closed', description: 'Dispute is closed' }
        ]
      }
    });
  } catch (error) {
    console.error('Get dispute meta error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
