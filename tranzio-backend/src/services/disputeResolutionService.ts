import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dispute types and statuses
export type DisputeType = 'PAYMENT' | 'DELIVERY' | 'QUALITY' | 'FRAUD' | 'OTHER';
export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ResolutionType = 'AUTOMATIC' | 'MEDIATION' | 'ARBITRATION' | 'ADMIN_DECISION';
export type ResolutionAction = 'REFUND_FULL' | 'REFUND_PARTIAL' | 'RELEASE_PAYMENT' | 'NO_ACTION';

// Dispute creation data
export interface CreateDisputeData {
  transactionId: string;
  raisedBy: string;
  raisedAgainst: string;
  disputeType: DisputeType;
  reason: string;
  description: string;
  priority?: DisputePriority;
}

// Dispute resolution data
export interface ResolutionData {
  disputeId: string;
  resolutionType: ResolutionType;
  proposedBy: string;
  resolution: ResolutionAction;
  amount?: number;
  reason: string;
  expiresAt?: Date;
}

// Dispute evidence data
export interface EvidenceData {
  disputeId: string;
  uploadedBy: string;
  fileName: string;
  fileType: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
  fileUrl: string;
  description?: string;
}

// Dispute message data
export interface MessageData {
  disputeId: string;
  senderId: string;
  content: string;
  isInternal?: boolean;
}

export class DisputeResolutionService {
  /**
   * Create a new dispute
   */
  static async createDispute(data: CreateDisputeData): Promise<any> {
    try {
      // Verify transaction exists and user is participant
      const transaction = await prisma.escrowTransaction.findFirst({
        where: {
          id: data.transactionId,
          OR: [
            { creatorId: data.raisedBy },
            { counterpartyId: data.raisedBy }
          ]
        },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          counterparty: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      if (!transaction) {
        throw new Error('Transaction not found or user not authorized');
      }

      // Determine the other party
      const otherParty = transaction.creatorId === data.raisedBy 
        ? transaction.counterparty 
        : transaction.creator;

      if (!otherParty) {
        throw new Error('Transaction must have a counterparty to raise dispute');
      }

      // Check if dispute already exists for this transaction
      const existingDispute = await prisma.dispute.findFirst({
        where: {
          transactionId: data.transactionId,
          status: { in: ['OPEN', 'IN_REVIEW'] }
        }
      });

      if (existingDispute) {
        throw new Error('An active dispute already exists for this transaction');
      }

      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          transactionId: data.transactionId,
          raisedBy: data.raisedBy,
          raisedAgainst: otherParty.id,
          disputeType: data.disputeType,
          reason: data.reason,
          description: data.description,
          priority: data.priority || 'MEDIUM',
          status: 'OPEN'
        },
        include: {
          transaction: {
            select: {
              id: true,
              description: true,
              price: true,
              currency: true
            }
          },
          raiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          accused: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Note: Initial message creation removed to avoid foreign key constraint issues
      // Messages can be added later when users interact with the dispute

      // Update transaction status if needed
      if (transaction.status === 'ACTIVE') {
        await prisma.escrowTransaction.update({
          where: { id: data.transactionId },
          data: { status: 'DISPUTED' }
        });
      }

      return dispute;
    } catch (error) {
      console.error('Error creating dispute:', error);
      throw error;
    }
  }

  /**
   * Get dispute by ID
   */
  static async getDispute(disputeId: string, userId: string): Promise<any> {
    try {
      const dispute = await prisma.dispute.findFirst({
        where: {
          id: disputeId,
          OR: [
            { raisedBy: userId },
            { raisedAgainst: userId }
          ]
        },
        include: {
          transaction: {
            select: {
              id: true,
              description: true,
              price: true,
              currency: true,
              status: true,
              createdAt: true
            }
          },
          raiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              verificationLevel: true,
              trustScore: true
            }
          },
          accused: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              verificationLevel: true,
              trustScore: true
            }
          },
          evidence: {
            include: {
              uploader: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          resolutions: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found or access denied');
      }

      return dispute;
    } catch (error) {
      console.error('Error getting dispute:', error);
      throw error;
    }
  }

  /**
   * Get user's disputes
   */
  static async getUserDisputes(userId: string): Promise<any[]> {
    try {
      const disputes = await prisma.dispute.findMany({
        where: {
          OR: [
            { raisedBy: userId },
            { raisedAgainst: userId }
          ]
        },
        include: {
          transaction: {
            select: {
              id: true,
              description: true,
              price: true,
              currency: true,
              status: true
            }
          },
          raiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          accused: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return disputes;
    } catch (error) {
      console.error('Error getting user disputes:', error);
      throw error;
    }
  }

  /**
   * Add evidence to dispute
   */
  static async addEvidence(data: EvidenceData): Promise<any> {
    try {
      // Verify user has access to dispute
      const dispute = await prisma.dispute.findFirst({
        where: {
          id: data.disputeId,
          OR: [
            { raisedBy: data.uploadedBy },
            { raisedAgainst: data.uploadedBy }
          ]
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found or access denied');
      }

      if (dispute.status === 'CLOSED') {
        throw new Error('Cannot add evidence to closed dispute');
      }

      const evidence = await prisma.disputeEvidence.create({
        data: {
          disputeId: data.disputeId,
          uploadedBy: data.uploadedBy,
          fileName: data.fileName,
          fileType: data.fileType,
          fileUrl: data.fileUrl,
          description: data.description
        },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Add system message
      await this.addMessage({
        disputeId: data.disputeId,
        senderId: 'SYSTEM',
        content: `Evidence uploaded: ${data.fileName}`,
        isInternal: true
      });

      return evidence;
    } catch (error) {
      console.error('Error adding evidence:', error);
      throw error;
    }
  }

  /**
   * Add message to dispute
   */
  static async addMessage(data: MessageData): Promise<any> {
    try {
      // For system messages, skip user verification
      if (data.senderId !== 'SYSTEM') {
        // Verify user has access to dispute
        const dispute = await prisma.dispute.findFirst({
          where: {
            id: data.disputeId,
            OR: [
              { raisedBy: data.senderId },
              { raisedAgainst: data.senderId }
            ]
          }
        });

        if (!dispute) {
          throw new Error('Dispute not found or access denied');
        }

        if (dispute.status === 'CLOSED') {
          throw new Error('Cannot add messages to closed dispute');
        }
      }

      const message = await prisma.disputeMessage.create({
        data: {
          disputeId: data.disputeId,
          senderId: data.senderId,
          content: data.content,
          isInternal: data.isInternal || false
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return message;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Propose resolution
   */
  static async proposeResolution(data: ResolutionData): Promise<any> {
    try {
      // Verify user has access to dispute
      const dispute = await prisma.dispute.findFirst({
        where: {
          id: data.disputeId,
          OR: [
            { raisedBy: data.proposedBy },
            { raisedAgainst: data.proposedBy }
          ]
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found or access denied');
      }

      if (dispute.status === 'CLOSED') {
        throw new Error('Cannot propose resolution for closed dispute');
      }

      // Create resolution proposal
      const resolution = await prisma.disputeResolution.create({
        data: {
          disputeId: data.disputeId,
          resolutionType: data.resolutionType,
          proposedBy: data.proposedBy,
          resolution: data.resolution,
          amount: data.amount,
          reason: data.reason,
          expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
        }
      });

      // Add system message
      await this.addMessage({
        disputeId: data.disputeId,
        senderId: 'SYSTEM',
        content: `Resolution proposed: ${data.resolution} - ${data.reason}`,
        isInternal: true
      });

      return resolution;
    } catch (error) {
      console.error('Error proposing resolution:', error);
      throw error;
    }
  }

  /**
   * Accept resolution
   */
  static async acceptResolution(resolutionId: string, userId: string): Promise<any> {
    try {
      const resolution = await prisma.disputeResolution.findUnique({
        where: { id: resolutionId },
        include: {
          dispute: {
            include: {
              transaction: true
            }
          }
        }
      });

      if (!resolution) {
        throw new Error('Resolution not found');
      }

      // Verify user can accept this resolution
      const canAccept = resolution.dispute.raisedBy === userId || 
                       resolution.dispute.raisedAgainst === userId;

      if (!canAccept) {
        throw new Error('Not authorized to accept this resolution');
      }

      if (resolution.status !== 'PENDING') {
        throw new Error('Resolution is no longer pending');
      }

      if (resolution.expiresAt && resolution.expiresAt < new Date()) {
        throw new Error('Resolution has expired');
      }

      // Update resolution status
      const updatedResolution = await prisma.disputeResolution.update({
        where: { id: resolutionId },
        data: {
          status: 'ACCEPTED',
          acceptedBy: userId
        }
      });

      // Check if both parties have accepted (for mutual resolutions)
      const allResolutions = await prisma.disputeResolution.findMany({
        where: {
          disputeId: resolution.disputeId,
          status: 'ACCEPTED'
        }
      });

      // If this is a mutual resolution and both parties have accepted, resolve the dispute
      if (resolution.resolutionType === 'MEDIATION' && allResolutions.length >= 2) {
        await this.resolveDispute(resolution.disputeId, resolution.resolution as ResolutionAction, resolution.amount || undefined);
      }

      // Add system message
      await this.addMessage({
        disputeId: resolution.disputeId,
        senderId: 'SYSTEM',
        content: `Resolution accepted by user`,
        isInternal: true
      });

      return updatedResolution;
    } catch (error) {
      console.error('Error accepting resolution:', error);
      throw error;
    }
  }

  /**
   * Reject resolution
   */
  static async rejectResolution(resolutionId: string, userId: string): Promise<any> {
    try {
      const resolution = await prisma.disputeResolution.findUnique({
        where: { id: resolutionId },
        include: {
          dispute: true
        }
      });

      if (!resolution) {
        throw new Error('Resolution not found');
      }

      // Verify user can reject this resolution
      const canReject = resolution.dispute.raisedBy === userId || 
                       resolution.dispute.raisedAgainst === userId;

      if (!canReject) {
        throw new Error('Not authorized to reject this resolution');
      }

      if (resolution.status !== 'PENDING') {
        throw new Error('Resolution is no longer pending');
      }

      // Update resolution status
      const updatedResolution = await prisma.disputeResolution.update({
        where: { id: resolutionId },
        data: {
          status: 'REJECTED',
          rejectedBy: userId
        }
      });

      // Add system message
      await this.addMessage({
        disputeId: resolution.disputeId,
        senderId: 'SYSTEM',
        content: `Resolution rejected by user`,
        isInternal: true
      });

      return updatedResolution;
    } catch (error) {
      console.error('Error rejecting resolution:', error);
      throw error;
    }
  }

  /**
   * Resolve dispute (admin or system action)
   */
  static async resolveDispute(
    disputeId: string, 
    resolution: ResolutionAction, 
    amount?: number,
    resolvedBy: string = 'SYSTEM',
    notes?: string
  ): Promise<any> {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          transaction: true
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      if (dispute.status === 'CLOSED') {
        throw new Error('Dispute is already closed');
      }

      // Update dispute status
      const updatedDispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution,
          resolutionNotes: notes,
          resolvedBy,
          resolvedAt: new Date()
        }
      });

      // Execute resolution action
      await this.executeResolution(dispute.transactionId, resolution, amount);

      // Add system message
      await this.addMessage({
        disputeId,
        senderId: 'SYSTEM',
        content: `Dispute resolved: ${resolution}${notes ? ` - ${notes}` : ''}`,
        isInternal: true
      });

      return updatedDispute;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  }

  /**
   * Execute resolution action
   */
  private static async executeResolution(
    transactionId: string,
    resolution: ResolutionAction,
    amount?: number
  ): Promise<void> {
    try {
      const transaction = await prisma.escrowTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      switch (resolution) {
        case 'REFUND_FULL':
          // Refund full amount to buyer
          await prisma.escrowTransaction.update({
            where: { id: transactionId },
            data: {
              status: 'FAILED',
              completedAt: new Date()
            }
          });
          break;

        case 'REFUND_PARTIAL':
          // Refund partial amount
          if (!amount || amount <= 0) {
            throw new Error('Partial refund amount must be specified');
          }
          await prisma.escrowTransaction.update({
            where: { id: transactionId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          });
          break;

        case 'RELEASE_PAYMENT':
          // Release payment to seller
          await prisma.escrowTransaction.update({
            where: { id: transactionId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          });
          break;

        case 'NO_ACTION':
          // No action taken, keep current status
          break;

        default:
          throw new Error('Invalid resolution action');
      }
    } catch (error) {
      console.error('Error executing resolution:', error);
      throw error;
    }
  }

  /**
   * Get dispute statistics
   */
  static async getDisputeStats(): Promise<any> {
    try {
      const stats = await prisma.dispute.groupBy({
        by: ['status', 'disputeType'],
        _count: {
          id: true
        }
      });

      const totalDisputes = await prisma.dispute.count();
      const resolvedDisputes = await prisma.dispute.count({
        where: { status: 'RESOLVED' }
      });

      return {
        total: totalDisputes,
        resolved: resolvedDisputes,
        resolutionRate: totalDisputes > 0 ? (resolvedDisputes / totalDisputes) * 100 : 0,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
          return acc;
        }, {} as any),
        byType: stats.reduce((acc, stat) => {
          acc[stat.disputeType] = (acc[stat.disputeType] || 0) + stat._count.id;
          return acc;
        }, {} as any)
      };
    } catch (error) {
      console.error('Error getting dispute stats:', error);
      throw error;
    }
  }
}
