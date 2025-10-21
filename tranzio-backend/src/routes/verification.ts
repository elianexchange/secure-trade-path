import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { emailService } from '../services/emailService';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

const router = express.Router();

// Validation schemas
const ninVerificationSchema = z.object({
  nin: z.string().min(11).max(11).regex(/^\d{11}$/, 'NIN must be 11 digits'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

const bvnVerificationSchema = z.object({
  bvn: z.string().min(11).max(11).regex(/^\d{11}$/, 'BVN must be 11 digits'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(10).max(15)
});

const documentUploadSchema = z.object({
  documentType: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'UTILITY_BILL', 'BANK_STATEMENT']),
  documentNumber: z.string().min(1),
  documentImage: z.string().min(1) // Base64 encoded image
});

// NIN Verification
router.post('/nin', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = ninVerificationSchema.parse(req.body);

    // Check if NIN is already verified for another user
    const existingNIN = await prisma.user.findFirst({
      where: {
        nin: validatedData.nin,
        id: { not: userId }
      }
    });

    if (existingNIN) {
      return res.status(400).json({
        success: false,
        error: 'NIN is already associated with another account'
      });
    }

    // Simulate NIN verification (in real implementation, integrate with NIMC API)
    const isNINValid = await verifyNINWithNIMC(validatedData);

    if (!isNINValid) {
      // Create verification history record
      await prisma.verificationHistory.create({
        data: {
          userId,
          verificationType: 'NIN_VERIFICATION',
          status: 'REJECTED',
          details: JSON.stringify({
            nin: validatedData.nin,
            reason: 'NIN verification failed'
          }),
          notes: 'NIN details do not match official records'
        }
      });

      return res.status(400).json({
        success: false,
        error: 'NIN verification failed. Please check your details and try again.'
      });
    }

    // Update user with NIN
    await prisma.user.update({
      where: { id: userId },
      data: {
        nin: validatedData.nin,
        verificationLevel: 'ENHANCED',
        trustScore: { increment: 25 }
      }
    });

    // Create verification history record
    await prisma.verificationHistory.create({
      data: {
        userId,
        verificationType: 'NIN_VERIFICATION',
        status: 'APPROVED',
        details: JSON.stringify({
          nin: validatedData.nin,
          verifiedAt: new Date().toISOString()
        }),
        notes: 'NIN successfully verified'
      }
    });

    // Create identity document record
    await prisma.identityDocument.create({
      data: {
        userId,
        documentType: 'NIN',
        documentNumber: validatedData.nin,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'SYSTEM'
      }
    });

    // Send email notification
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      
      if (user?.email) {
        await emailService.sendVerificationCompleteEmail(user.email, {
          verificationLevel: 'ENHANCED',
          trustScore: 25,
          isVerified: false // Still need BVN for full verification
        });
      }
    } catch (emailError) {
      console.error('Failed to send NIN verification email:', emailError);
      // Don't fail the request if email fails
    }

    return res.json({
      success: true,
      message: 'NIN verification successful',
      data: {
        verificationLevel: 'ENHANCED',
        trustScore: 25
      }
    });

  } catch (error) {
    console.error('NIN verification error:', error);
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

// BVN Verification
router.post('/bvn', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = bvnVerificationSchema.parse(req.body);

    // Check if BVN is already verified for another user
    const existingBVN = await prisma.user.findFirst({
      where: {
        bvn: validatedData.bvn,
        id: { not: userId }
      }
    });

    if (existingBVN) {
      return res.status(400).json({
        success: false,
        error: 'BVN is already associated with another account'
      });
    }

    // Simulate BVN verification (in real implementation, integrate with bank API)
    const isBVNValid = await verifyBVNWithBank(validatedData);

    if (!isBVNValid) {
      // Create verification history record
      await prisma.verificationHistory.create({
        data: {
          userId,
          verificationType: 'BVN_VERIFICATION',
          status: 'REJECTED',
          details: JSON.stringify({
            bvn: validatedData.bvn,
            reason: 'BVN verification failed'
          }),
          notes: 'BVN details do not match bank records'
        }
      });

      return res.status(400).json({
        success: false,
        error: 'BVN verification failed. Please check your details and try again.'
      });
    }

    // Update user with BVN
    await prisma.user.update({
      where: { id: userId },
      data: {
        bvn: validatedData.bvn,
        verificationLevel: 'PREMIUM',
        trustScore: { increment: 35 },
        isVerified: true
      }
    });

    // Create verification history record
    await prisma.verificationHistory.create({
      data: {
        userId,
        verificationType: 'BVN_VERIFICATION',
        status: 'APPROVED',
        details: JSON.stringify({
          bvn: validatedData.bvn,
          verifiedAt: new Date().toISOString()
        }),
        notes: 'BVN successfully verified'
      }
    });

    // Create identity document record
    await prisma.identityDocument.create({
      data: {
        userId,
        documentType: 'BVN',
        documentNumber: validatedData.bvn,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'SYSTEM'
      }
    });

    // Send email notification
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      
      if (user?.email) {
        await emailService.sendVerificationCompleteEmail(user.email, {
          verificationLevel: 'PREMIUM',
          trustScore: 35,
          isVerified: true
        });
      }
    } catch (emailError) {
      console.error('Failed to send BVN verification email:', emailError);
      // Don't fail the request if email fails
    }

    return res.json({
      success: true,
      message: 'BVN verification successful',
      data: {
        verificationLevel: 'PREMIUM',
        trustScore: 35,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('BVN verification error:', error);
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

// Upload Identity Document
router.post('/document', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = documentUploadSchema.parse(req.body);

    // Create identity document record
    const document = await prisma.identityDocument.create({
      data: {
        userId,
        documentType: validatedData.documentType,
        documentNumber: validatedData.documentNumber,
        documentImage: validatedData.documentImage,
        isVerified: false
      }
    });

    // Create verification history record
    await prisma.verificationHistory.create({
      data: {
        userId,
        verificationType: 'DOCUMENT_VERIFICATION',
        status: 'PENDING',
        details: JSON.stringify({
          documentType: validatedData.documentType,
          documentNumber: validatedData.documentNumber
        }),
        notes: 'Document uploaded, pending manual review'
      }
    });

    return res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentId: document.id,
        status: 'PENDING_REVIEW'
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
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

// Get verification status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;

    // Get user verification details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationLevel: true,
        trustScore: true,
        isVerified: true,
        nin: true,
        bvn: true
      }
    });

    // Get identity documents
    const documents = await prisma.identityDocument.findMany({
      where: { userId },
      select: {
        documentType: true,
        isVerified: true,
        verifiedAt: true,
        rejectionReason: true
      }
    });

    // Get verification history
    const history = await prisma.verificationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        verificationType: true,
        status: true,
        createdAt: true,
        notes: true
      }
    });

    return res.json({
      success: true,
      data: {
        user,
        documents,
        history
      }
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper functions (simulate external API calls)
async function verifyNINWithNIMC(data: any): Promise<boolean> {
  // Simulate NIMC API call
  // In real implementation, integrate with NIMC API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, accept NINs that start with '1' or '2'
  return data.nin.startsWith('1') || data.nin.startsWith('2');
}

async function verifyBVNWithBank(data: any): Promise<boolean> {
  // Simulate bank API call
  // In real implementation, integrate with bank verification API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, accept BVNs that start with '2' or '3'
  return data.bvn.startsWith('2') || data.bvn.startsWith('3');
}

export default router;
