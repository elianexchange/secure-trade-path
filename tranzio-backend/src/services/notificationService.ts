import { prisma } from '../lib/prisma';
import { sendToUser } from './websocketService';

export interface NotificationData {
  userId: string;
  transactionId?: string;
  type: 'TRANSACTION_UPDATE' | 'PAYMENT' | 'SHIPPING' | 'DELIVERY' | 'DISPUTE' | 'SYSTEM' | 'MESSAGE' | 'WALLET';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  metadata?: {
    transactionStatus?: string;
    amount?: number;
    currency?: string;
    counterpartyName?: string;
    actionRequired?: boolean;
  };
}

class BackendNotificationService {
  // Create a notification in the database and send via WebSocket
  async createNotification(data: NotificationData) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          transactionId: data.transactionId,
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority
        }
      });

      // Send real-time notification via WebSocket
      await sendToUser(data.userId, 'notification', {
        id: notification.id,
        userId: data.userId,
        transactionId: data.transactionId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority,
        metadata: data.metadata,
        isRead: false,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.createdAt.toISOString()
      });

      console.log(`✅ Notification created for user ${data.userId}: ${data.title}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Generate transaction notifications
  async createTransactionNotification(
    userId: string,
    transactionId: string,
    status: string,
    counterpartyName: string,
    amount?: number
  ) {
    const notifications: Record<string, { title: string; message: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }> = {
      'PENDING': {
        title: 'Transaction Created',
        message: `Your transaction with ${counterpartyName} has been created and is pending confirmation.`,
        priority: 'MEDIUM'
      },
      'ACTIVE': {
        title: 'Transaction Activated',
        message: `Your transaction with ${counterpartyName} is now active. Funds are secured in escrow.`,
        priority: 'HIGH'
      },
      'PAYMENT_PENDING': {
        title: 'Payment Pending',
        message: `Payment of ${amount ? `$${amount}` : 'funds'} is pending for your transaction with ${counterpartyName}.`,
        priority: 'HIGH'
      },
      'PAYMENT_CONFIRMED': {
        title: 'Payment Confirmed',
        message: `Payment has been confirmed for your transaction with ${counterpartyName}.`,
        priority: 'HIGH'
      },
      'SHIPPED': {
        title: 'Item Shipped',
        message: `Your item has been shipped by ${counterpartyName}. Track your package for updates.`,
        priority: 'MEDIUM'
      },
      'DELIVERED': {
        title: 'Item Delivered',
        message: `Your item has been delivered. Please confirm receipt to release payment to ${counterpartyName}.`,
        priority: 'HIGH'
      },
      'COMPLETED': {
        title: 'Transaction Completed',
        message: `Your transaction with ${counterpartyName} has been completed successfully.`,
        priority: 'MEDIUM'
      },
      'CANCELLED': {
        title: 'Transaction Cancelled',
        message: `Your transaction with ${counterpartyName} has been cancelled.`,
        priority: 'HIGH'
      },
      'DISPUTED': {
        title: 'Dispute Opened',
        message: `A dispute has been opened for your transaction with ${counterpartyName}.`,
        priority: 'URGENT'
      }
    };

    const notification = notifications[status] || {
      title: 'Transaction Update',
      message: `Your transaction with ${counterpartyName} status has been updated to ${status}.`,
      priority: 'MEDIUM' as const
    };

    return this.createNotification({
      userId,
      transactionId,
      type: 'TRANSACTION_UPDATE',
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      metadata: {
        transactionStatus: status,
        amount,
        counterpartyName,
        actionRequired: ['PAYMENT_PENDING', 'DELIVERED', 'DISPUTED'].includes(status)
      }
    });
  }

  // Generate payment notifications
  async createPaymentNotification(
    userId: string,
    transactionId: string,
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_RELEASE' | 'REFUND',
    amount: number,
    currency: string = 'USD'
  ) {
    const notifications: Record<string, { title: string; message: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }> = {
      'DEPOSIT': {
        title: 'Funds Deposited',
        message: `$${amount} has been deposited to your wallet.`,
        priority: 'MEDIUM'
      },
      'WITHDRAWAL': {
        title: 'Funds Withdrawn',
        message: `$${amount} has been withdrawn from your wallet.`,
        priority: 'HIGH'
      },
      'ESCROW_RELEASE': {
        title: 'Escrow Released',
        message: `$${amount} has been released from escrow for transaction ${transactionId.slice(-8)}.`,
        priority: 'HIGH'
      },
      'REFUND': {
        title: 'Refund Processed',
        message: `$${amount} refund has been processed for transaction ${transactionId.slice(-8)}.`,
        priority: 'HIGH'
      }
    };

    const notification = notifications[type] || {
      title: 'Payment Update',
      message: `Payment activity: ${type} of $${amount}`,
      priority: 'MEDIUM' as const
    };

    return this.createNotification({
      userId,
      transactionId,
      type: 'PAYMENT',
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      metadata: {
        amount,
        currency,
        actionRequired: type === 'WITHDRAWAL'
      }
    });
  }

  // Generate message notifications
  async createMessageNotification(
    userId: string,
    transactionId: string,
    senderName: string,
    messagePreview: string
  ) {
    return this.createNotification({
      userId,
      transactionId,
      type: 'MESSAGE',
      title: `New message from ${senderName}`,
      message: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      priority: 'LOW',
      metadata: {
        counterpartyName: senderName
      }
    });
  }

  // Generate system notifications
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
  ) {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      priority,
      metadata: {
        actionRequired: priority === 'URGENT' || priority === 'HIGH'
      }
    });
  }

  // Generate dispute notifications
  async createDisputeNotification(
    userId: string,
    transactionId: string,
    type: 'OPENED' | 'RESOLVED' | 'ESCALATED',
    counterpartyName: string
  ) {
    const notifications: Record<string, { title: string; message: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }> = {
      'OPENED': {
        title: 'Dispute Opened',
        message: `A dispute has been opened by ${counterpartyName} for transaction ${transactionId.slice(-8)}.`,
        priority: 'URGENT'
      },
      'RESOLVED': {
        title: 'Dispute Resolved',
        message: `The dispute for transaction ${transactionId.slice(-8)} has been resolved.`,
        priority: 'HIGH'
      },
      'ESCALATED': {
        title: 'Dispute Escalated',
        message: `The dispute for transaction ${transactionId.slice(-8)} has been escalated to admin review.`,
        priority: 'URGENT'
      }
    };

    const notification = notifications[type] || {
      title: 'Dispute Update',
      message: `Dispute activity for transaction ${transactionId.slice(-8)}.`,
      priority: 'HIGH' as const
    };

    return this.createNotification({
      userId,
      transactionId,
      type: 'DISPUTE',
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      metadata: {
        counterpartyName,
        actionRequired: type === 'OPENED' || type === 'ESCALATED'
      }
    });
  }
}

export const backendNotificationService = new BackendNotificationService();
