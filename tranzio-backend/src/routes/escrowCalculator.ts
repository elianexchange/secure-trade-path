import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { EscrowCalculator, RiskFactors } from '../services/escrowCalculator';
import { prisma } from '../lib/prisma';
import { User } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const calculateFeeSchema = z.object({
  transactionAmount: z.number().min(1, 'Transaction amount must be greater than 0'),
  transactionType: z.enum(['GOODS', 'SERVICES', 'DIGITAL', 'REAL_ESTATE']),
  categoryName: z.string().min(1, 'Category name is required'),
  deliveryMethod: z.enum(['PICKUP', 'SHIPPING', 'DIGITAL_DELIVERY']).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CARD', 'CRYPTO']).optional(),
  counterpartyId: z.string().optional(),
});

const quickEstimateSchema = z.object({
  transactionAmount: z.number().min(1, 'Transaction amount must be greater than 0'),
  transactionType: z.enum(['GOODS', 'SERVICES', 'DIGITAL', 'REAL_ESTATE']),
  categoryName: z.string().min(1, 'Category name is required'),
});

// Calculate detailed escrow fee
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = calculateFeeSchema.parse(req.body);

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationLevel: true,
        trustScore: true,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user transaction history
    const transactionHistory = await EscrowCalculator.getUserTransactionHistory(userId) || {
      totalTransactions: 0,
      successfulTransactions: 0,
      disputedTransactions: 0,
      averageTransactionAmount: 0
    };

    // Get counterparty information if provided
    let counterpartyVerificationLevel: 'BASIC' | 'ENHANCED' | 'PREMIUM' | undefined;
    let counterpartyTrustScore: number | undefined;

    if (validatedData.counterpartyId) {
      const counterparty = await prisma.user.findUnique({
        where: { id: validatedData.counterpartyId },
        select: {
          verificationLevel: true,
          trustScore: true
        }
      });

      if (counterparty) {
        counterpartyVerificationLevel = counterparty.verificationLevel as 'BASIC' | 'ENHANCED' | 'PREMIUM';
        counterpartyTrustScore = counterparty.trustScore;
      }
    }

    // Prepare risk factors
    const riskFactors: RiskFactors = {
      transactionAmount: validatedData.transactionAmount,
      userVerificationLevel: user.verificationLevel as 'BASIC' | 'ENHANCED' | 'PREMIUM',
      userTrustScore: user.trustScore,
      transactionType: validatedData.transactionType,
      isFirstTimeTransaction: transactionHistory.totalTransactions === 0,
      counterpartyVerificationLevel,
      counterpartyTrustScore,
      transactionHistory,
      categoryRisk: EscrowCalculator.getCategoryRisk(validatedData.categoryName),
      deliveryMethod: validatedData.deliveryMethod,
      paymentMethod: validatedData.paymentMethod,
    };

    // Calculate fee
    const feeCalculation = await EscrowCalculator.calculateFee(riskFactors);

    // Calculate fee amounts
    const feeAmount = (validatedData.transactionAmount * feeCalculation.feePercentage) / 100;
    const totalAmount = validatedData.transactionAmount + feeAmount;

    return res.json({
      success: true,
      data: {
        ...feeCalculation,
        feeAmount,
        totalAmount,
        transactionAmount: validatedData.transactionAmount,
        currency: 'NGN', // Default currency
        riskFactors: {
          userVerificationLevel: user.verificationLevel,
          userTrustScore: user.trustScore,
          isFirstTimeTransaction: transactionHistory.totalTransactions === 0,
          totalTransactions: transactionHistory.totalTransactions,
          successRate: transactionHistory.totalTransactions > 0 
            ? (transactionHistory.successfulTransactions / transactionHistory.totalTransactions) * 100 
            : 0,
          categoryRisk: EscrowCalculator.getCategoryRisk(validatedData.categoryName),
        }
      }
    });

  } catch (error) {
    console.error('Escrow fee calculation error:', error);
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

// Quick fee estimate (no authentication required)
router.post('/estimate', async (req, res) => {
  try {
    const validatedData = quickEstimateSchema.parse(req.body);

    // Use default risk factors for quick estimate
    const riskFactors: RiskFactors = {
      transactionAmount: validatedData.transactionAmount,
      userVerificationLevel: 'BASIC', // Default
      userTrustScore: 50, // Default
      transactionType: validatedData.transactionType,
      isFirstTimeTransaction: true, // Default
      categoryRisk: EscrowCalculator.getCategoryRisk(validatedData.categoryName),
      deliveryMethod: 'SHIPPING', // Default
      paymentMethod: 'BANK_TRANSFER', // Default
    };

    // Calculate fee
    const feeCalculation = await EscrowCalculator.calculateFee(riskFactors);

    // Calculate fee amounts
    const feeAmount = (validatedData.transactionAmount * feeCalculation.feePercentage) / 100;
    const totalAmount = validatedData.transactionAmount + feeAmount;

    return res.json({
      success: true,
      data: {
        ...feeCalculation,
        feeAmount,
        totalAmount,
        transactionAmount: validatedData.transactionAmount,
        currency: 'NGN',
        isEstimate: true,
        note: 'This is a quick estimate. Actual fees may vary based on your verification level and transaction history.'
      }
    });

  } catch (error) {
    console.error('Escrow fee estimate error:', error);
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

// Get fee structure information
router.get('/structure', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        baseFee: 1.5, // 1.5%
        minFee: 0.5,  // 0.5%
        maxFee: 5.0,  // 5.0%
        riskFactors: {
          amount: {
            low: '< ₦100',
            medium: '₦100 - ₦1,000',
            high: '₦1,000 - ₦10,000',
            veryHigh: '> ₦10,000'
          },
          verification: {
            basic: '1.5x multiplier',
            enhanced: '1.0x multiplier',
            premium: '0.7x multiplier'
          },
          trustScore: {
            low: '< 30 (1.4x multiplier)',
            medium: '30-70 (1.0x multiplier)',
            high: '> 70 (0.8x multiplier)'
          },
          transactionType: {
            digital: '0.8x multiplier',
            goods: '1.0x multiplier',
            services: '1.2x multiplier',
            realEstate: '1.5x multiplier'
          },
          category: {
            low: 'Electronics, Books, Clothing (0.8x)',
            medium: 'General items (1.0x)',
            high: 'Jewelry, Art, Vehicles (1.3x)'
          },
          delivery: {
            digital: '0.7x multiplier',
            pickup: '1.0x multiplier',
            shipping: '1.2x multiplier'
          },
          payment: {
            bankTransfer: '0.9x multiplier',
            card: '1.0x multiplier',
            crypto: '1.1x multiplier'
          }
        }
      }
    });
  } catch (error) {
    console.error('Get fee structure error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's fee history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;

    // Get user's transaction history with fees
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      },
      select: {
        id: true,
        description: true,
        price: true,
        fee: true,
        status: true,
        createdAt: true,
        creatorRole: true,
        creatorId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Last 20 transactions
    });

    // Calculate total fees paid
    const totalFeesPaid = transactions.reduce((sum, transaction) => {
      return sum + transaction.fee;
    }, 0);

    // Calculate average fee percentage
    const totalAmount = transactions.reduce((sum, transaction) => {
      return sum + transaction.price;
    }, 0);

    const averageFeePercentage = totalAmount > 0 
      ? (totalFeesPaid / totalAmount) * 100 
      : 0;

    return res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.price,
          fee: t.fee,
          feePercentage: t.price > 0 ? (t.fee / t.price) * 100 : 0,
          status: t.status,
          createdAt: t.createdAt,
          role: t.creatorId === userId ? t.creatorRole : (t.creatorRole === 'BUYER' ? 'SELLER' : 'BUYER')
        })),
        summary: {
          totalTransactions: transactions.length,
          totalFeesPaid,
          totalAmount,
          averageFeePercentage,
          totalSavings: 0 // Could calculate based on what fees would have been without verification
        }
      }
    });

  } catch (error) {
    console.error('Get fee history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
