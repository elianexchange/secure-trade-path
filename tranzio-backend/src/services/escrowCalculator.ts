import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Risk factors and their weights
export interface RiskFactors {
  transactionAmount: number;
  userVerificationLevel: 'BASIC' | 'ENHANCED' | 'PREMIUM';
  userTrustScore: number;
  transactionType: 'GOODS' | 'SERVICES' | 'DIGITAL' | 'REAL_ESTATE';
  isFirstTimeTransaction: boolean;
  counterpartyVerificationLevel?: 'BASIC' | 'ENHANCED' | 'PREMIUM';
  counterpartyTrustScore?: number;
  transactionHistory?: {
    totalTransactions: number;
    successfulTransactions: number;
    disputedTransactions: number;
    averageTransactionAmount: number;
  };
  categoryRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  deliveryMethod?: 'PICKUP' | 'SHIPPING' | 'DIGITAL_DELIVERY';
  paymentMethod?: 'BANK_TRANSFER' | 'CARD' | 'CRYPTO';
}

// Fee calculation result
export interface FeeCalculationResult {
  baseFee: number;
  riskAdjustment: number;
  totalFee: number;
  feePercentage: number;
  breakdown: {
    baseFee: number;
    amountRisk: number;
    verificationRisk: number;
    historyRisk: number;
    categoryRisk: number;
    deliveryRisk: number;
    paymentRisk: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendations: string[];
}

// Base fee structure (in percentage)
const BASE_FEE_STRUCTURE = {
  MIN_FEE: 0.5, // 0.5%
  MAX_FEE: 5.0, // 5.0%
  BASE_FEE: 1.5, // 1.5%
};

// Risk multipliers
const RISK_MULTIPLIERS = {
  AMOUNT: {
    LOW: 0.8,    // < $100
    MEDIUM: 1.0, // $100 - $1000
    HIGH: 1.3,   // $1000 - $10000
    VERY_HIGH: 1.8, // > $10000
  },
  VERIFICATION: {
    BASIC: 1.5,
    ENHANCED: 1.0,
    PREMIUM: 0.7,
  },
  TRUST_SCORE: {
    LOW: 1.4,    // < 30
    MEDIUM: 1.0, // 30-70
    HIGH: 0.8,   // > 70
  },
  TRANSACTION_TYPE: {
    DIGITAL: 0.8,
    GOODS: 1.0,
    SERVICES: 1.2,
    REAL_ESTATE: 1.5,
  },
  CATEGORY: {
    LOW: 0.8,
    MEDIUM: 1.0,
    HIGH: 1.3,
  },
  DELIVERY: {
    DIGITAL_DELIVERY: 0.7,
    PICKUP: 1.0,
    SHIPPING: 1.2,
  },
  PAYMENT: {
    BANK_TRANSFER: 0.9,
    CARD: 1.0,
    CRYPTO: 1.1,
  },
};

export class EscrowCalculator {
  /**
   * Calculate escrow fee based on risk factors
   */
  static async calculateFee(riskFactors: RiskFactors): Promise<FeeCalculationResult> {
    const breakdown = {
      baseFee: BASE_FEE_STRUCTURE.BASE_FEE,
      amountRisk: 0,
      verificationRisk: 0,
      historyRisk: 0,
      categoryRisk: 0,
      deliveryRisk: 0,
      paymentRisk: 0,
    };

    // 1. Amount-based risk
    const amountRisk = this.calculateAmountRisk(riskFactors.transactionAmount);
    breakdown.amountRisk = amountRisk;

    // 2. Verification risk
    const verificationRisk = this.calculateVerificationRisk(
      riskFactors.userVerificationLevel,
      riskFactors.userTrustScore,
      riskFactors.counterpartyVerificationLevel,
      riskFactors.counterpartyTrustScore
    );
    breakdown.verificationRisk = verificationRisk;

    // 3. Transaction history risk
    const historyRisk = this.calculateHistoryRisk(riskFactors.transactionHistory);
    breakdown.historyRisk = historyRisk;

    // 4. Category risk
    const categoryRisk = this.calculateCategoryRisk(riskFactors.categoryRisk);
    breakdown.categoryRisk = categoryRisk;

    // 5. Delivery method risk
    const deliveryRisk = this.calculateDeliveryRisk(riskFactors.deliveryMethod);
    breakdown.deliveryRisk = deliveryRisk;

    // 6. Payment method risk
    const paymentRisk = this.calculatePaymentRisk(riskFactors.paymentMethod);
    breakdown.paymentRisk = paymentRisk;

    // Calculate total risk adjustment
    const totalRiskAdjustment = 
      amountRisk + 
      verificationRisk + 
      historyRisk + 
      categoryRisk + 
      deliveryRisk + 
      paymentRisk;

    // Calculate final fee
    const baseFee = BASE_FEE_STRUCTURE.BASE_FEE;
    const riskAdjustment = totalRiskAdjustment;
    const totalFee = Math.max(
      BASE_FEE_STRUCTURE.MIN_FEE,
      Math.min(BASE_FEE_STRUCTURE.MAX_FEE, baseFee + riskAdjustment)
    );

    const feePercentage = totalFee;
    const riskLevel = this.determineRiskLevel(totalRiskAdjustment);

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskFactors, riskLevel);

    return {
      baseFee,
      riskAdjustment,
      totalFee,
      feePercentage,
      breakdown,
      riskLevel,
      recommendations,
    };
  }

  /**
   * Calculate amount-based risk
   */
  private static calculateAmountRisk(amount: number): number {
    if (amount < 100) return RISK_MULTIPLIERS.AMOUNT.LOW - 1;
    if (amount < 1000) return RISK_MULTIPLIERS.AMOUNT.MEDIUM - 1;
    if (amount < 10000) return RISK_MULTIPLIERS.AMOUNT.HIGH - 1;
    return RISK_MULTIPLIERS.AMOUNT.VERY_HIGH - 1;
  }

  /**
   * Calculate verification-based risk
   */
  private static calculateVerificationRisk(
    userVerification: string,
    userTrustScore: number,
    counterpartyVerification?: string,
    counterpartyTrustScore?: number
  ): number {
    let risk = 0;

    // User verification risk
    const userVerificationMultiplier = RISK_MULTIPLIERS.VERIFICATION[userVerification as keyof typeof RISK_MULTIPLIERS.VERIFICATION] || 1.0;
    risk += (userVerificationMultiplier - 1) * 0.5;

    // User trust score risk
    const userTrustMultiplier = this.getTrustScoreMultiplier(userTrustScore);
    risk += (userTrustMultiplier - 1) * 0.3;

    // Counterparty verification risk (if available)
    if (counterpartyVerification) {
      const counterpartyVerificationMultiplier = RISK_MULTIPLIERS.VERIFICATION[counterpartyVerification as keyof typeof RISK_MULTIPLIERS.VERIFICATION] || 1.0;
      risk += (counterpartyVerificationMultiplier - 1) * 0.3;
    }

    // Counterparty trust score risk (if available)
    if (counterpartyTrustScore) {
      const counterpartyTrustMultiplier = this.getTrustScoreMultiplier(counterpartyTrustScore);
      risk += (counterpartyTrustMultiplier - 1) * 0.2;
    }

    return risk;
  }

  /**
   * Calculate transaction history risk
   */
  private static calculateHistoryRisk(history?: RiskFactors['transactionHistory']): number {
    if (!history) return 0.2; // Default risk for new users

    const successRate = history.totalTransactions > 0 
      ? history.successfulTransactions / history.totalTransactions 
      : 0;

    const disputeRate = history.totalTransactions > 0 
      ? history.disputedTransactions / history.totalTransactions 
      : 0;

    let risk = 0;

    // Success rate impact
    if (successRate < 0.7) risk += 0.3;
    else if (successRate < 0.9) risk += 0.1;

    // Dispute rate impact
    if (disputeRate > 0.1) risk += 0.4;
    else if (disputeRate > 0.05) risk += 0.2;

    // Transaction volume impact
    if (history.totalTransactions < 5) risk += 0.2;

    return risk;
  }

  /**
   * Calculate category-based risk
   */
  private static calculateCategoryRisk(categoryRisk: string): number {
    const multiplier = RISK_MULTIPLIERS.CATEGORY[categoryRisk as keyof typeof RISK_MULTIPLIERS.CATEGORY] || 1.0;
    return multiplier - 1;
  }

  /**
   * Calculate delivery method risk
   */
  private static calculateDeliveryRisk(deliveryMethod?: string): number {
    if (!deliveryMethod) return 0;
    const multiplier = RISK_MULTIPLIERS.DELIVERY[deliveryMethod as keyof typeof RISK_MULTIPLIERS.DELIVERY] || 1.0;
    return multiplier - 1;
  }

  /**
   * Calculate payment method risk
   */
  private static calculatePaymentRisk(paymentMethod?: string): number {
    if (!paymentMethod) return 0;
    const multiplier = RISK_MULTIPLIERS.PAYMENT[paymentMethod as keyof typeof RISK_MULTIPLIERS.PAYMENT] || 1.0;
    return multiplier - 1;
  }

  /**
   * Get trust score multiplier
   */
  private static getTrustScoreMultiplier(trustScore: number): number {
    if (trustScore < 30) return RISK_MULTIPLIERS.TRUST_SCORE.LOW;
    if (trustScore < 70) return RISK_MULTIPLIERS.TRUST_SCORE.MEDIUM;
    return RISK_MULTIPLIERS.TRUST_SCORE.HIGH;
  }

  /**
   * Determine overall risk level
   */
  private static determineRiskLevel(totalRiskAdjustment: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (totalRiskAdjustment < 0.2) return 'LOW';
    if (totalRiskAdjustment < 0.5) return 'MEDIUM';
    if (totalRiskAdjustment < 1.0) return 'HIGH';
    return 'VERY_HIGH';
  }

  /**
   * Generate recommendations based on risk factors
   */
  private static generateRecommendations(
    riskFactors: RiskFactors,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    // Verification recommendations
    if (riskFactors.userVerificationLevel === 'BASIC') {
      recommendations.push('Complete identity verification to reduce fees');
    }

    if (riskFactors.userTrustScore < 50) {
      recommendations.push('Build your trust score by completing more successful transactions');
    }

    // Amount recommendations
    if (riskFactors.transactionAmount > 10000) {
      recommendations.push('Consider splitting large transactions to reduce risk');
    }

    // Category recommendations
    if (riskFactors.categoryRisk === 'HIGH') {
      recommendations.push('Consider additional documentation for high-risk categories');
    }

    // Delivery recommendations
    if (riskFactors.deliveryMethod === 'SHIPPING') {
      recommendations.push('Use tracked shipping for better protection');
    }

    // General risk recommendations
    if (riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH') {
      recommendations.push('Consider using conditional payment release for additional protection');
    }

    return recommendations;
  }

  /**
   * Get user transaction history for risk calculation
   */
  static async getUserTransactionHistory(userId: string): Promise<RiskFactors['transactionHistory']> {
    try {
      const transactions = await prisma.escrowTransaction.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { counterpartyId: userId }
          ],
          status: { in: ['COMPLETED', 'FAILED', 'DISPUTED'] }
        },
        select: {
          status: true,
          price: true
        }
      });

      const totalTransactions = transactions.length;
      const successfulTransactions = transactions.filter(t => t.status === 'COMPLETED').length;
      const disputedTransactions = transactions.filter(t => t.status === 'DISPUTED').length;
      const averageTransactionAmount = totalTransactions > 0 
        ? transactions.reduce((sum, t) => sum + t.price, 0) / totalTransactions 
        : 0;

      return {
        totalTransactions,
        successfulTransactions,
        disputedTransactions,
        averageTransactionAmount
      };
    } catch (error) {
      console.error('Error fetching user transaction history:', error);
      return {
        totalTransactions: 0,
        successfulTransactions: 0,
        disputedTransactions: 0,
        averageTransactionAmount: 0
      };
    }
  }

  /**
   * Get category risk level based on category name
   */
  static getCategoryRisk(categoryName: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const lowRiskCategories = ['electronics', 'books', 'clothing', 'accessories'];
    const highRiskCategories = ['jewelry', 'art', 'collectibles', 'vehicles', 'real-estate'];

    if (lowRiskCategories.includes(categoryName.toLowerCase())) {
      return 'LOW';
    } else if (highRiskCategories.includes(categoryName.toLowerCase())) {
      return 'HIGH';
    } else {
      return 'MEDIUM';
    }
  }
}
