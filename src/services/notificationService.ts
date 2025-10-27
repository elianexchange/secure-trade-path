import { notificationsAPI } from './api';
import { toast } from 'sonner';

export interface NotificationData {
  id: string;
  userId: string;
  transactionId?: string;
  type: 'TRANSACTION_UPDATE' | 'PAYMENT' | 'SHIPPING' | 'DELIVERY' | 'DISPUTE' | 'SYSTEM' | 'MESSAGE' | 'WALLET';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    transactionStatus?: string;
    amount?: number;
    currency?: string;
    counterpartyName?: string;
    actionRequired?: boolean;
  };
}

class NotificationService {
  private listeners: ((notifications: NotificationData[]) => void)[] = [];

  // Subscribe to notification updates
  subscribe(listener: (notifications: NotificationData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(notifications: NotificationData[]) {
    this.listeners.forEach(listener => listener(notifications));
  }

  // Generate real transaction notifications
  generateTransactionNotification(
    userId: string,
    transactionId: string,
    status: string,
    counterpartyName: string,
    amount?: number
  ): NotificationData {
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

    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      transactionId,
      type: 'TRANSACTION_UPDATE',
      title: notification.title,
      message: notification.message,
      isRead: false,
      priority: notification.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        transactionStatus: status,
        amount,
        counterpartyName,
        actionRequired: ['PAYMENT_PENDING', 'DELIVERED', 'DISPUTED'].includes(status)
      }
    };
  }

  // Generate payment notifications
  generatePaymentNotification(
    userId: string,
    transactionId: string,
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_RELEASE' | 'REFUND',
    amount: number,
    currency: string = 'USD'
  ): NotificationData {
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

    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      transactionId,
      type: 'PAYMENT',
      title: notification.title,
      message: notification.message,
      isRead: false,
      priority: notification.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        amount,
        currency,
        actionRequired: type === 'WITHDRAWAL'
      }
    };
  }

  // Generate dispute notifications
  generateDisputeNotification(
    userId: string,
    transactionId: string,
    type: 'OPENED' | 'RESOLVED' | 'ESCALATED',
    counterpartyName: string
  ): NotificationData {
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

    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      transactionId,
      type: 'DISPUTE',
      title: notification.title,
      message: notification.message,
      isRead: false,
      priority: notification.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        counterpartyName,
        actionRequired: type === 'OPENED' || type === 'ESCALATED'
      }
    };
  }

  // Generate system notifications
  generateSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
  ): NotificationData {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'SYSTEM',
      title,
      message,
      isRead: false,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        actionRequired: priority === 'URGENT' || priority === 'HIGH'
      }
    };
  }

  // Generate message notifications
  generateMessageNotification(
    userId: string,
    transactionId: string,
    senderName: string,
    messagePreview: string
  ): NotificationData {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      transactionId,
      type: 'MESSAGE',
      title: `New message from ${senderName}`,
      message: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      isRead: false,
      priority: 'LOW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        counterpartyName: senderName
      }
    };
  }

  // Generate wallet notifications
  generateWalletNotification(
    userId: string,
    type: 'LOW_BALANCE' | 'SECURITY_ALERT' | 'VERIFICATION_REQUIRED',
    message: string
  ): NotificationData {
    const priorities: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      'LOW_BALANCE': 'MEDIUM',
      'SECURITY_ALERT': 'URGENT',
      'VERIFICATION_REQUIRED': 'HIGH'
    };

    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'WALLET',
      title: `Wallet ${type.replace('_', ' ')}`,
      message,
      isRead: false,
      priority: priorities[type] || 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        actionRequired: type === 'SECURITY_ALERT' || type === 'VERIFICATION_REQUIRED'
      }
    };
  }

  // Get notification icon based on type
  getNotificationIcon(type: string) {
    const icons: Record<string, string> = {
      'TRANSACTION_UPDATE': '📦',
      'PAYMENT': '💳',
      'SHIPPING': '🚚',
      'DELIVERY': '📬',
      'DISPUTE': '⚠️',
      'SYSTEM': '🔔',
      'MESSAGE': '💬',
      'WALLET': '💰'
    };
    return icons[type] || '🔔';
  }

  // Get priority color
  getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      'LOW': 'text-gray-500',
      'MEDIUM': 'text-blue-500',
      'HIGH': 'text-orange-500',
      'URGENT': 'text-red-500'
    };
    return colors[priority] || 'text-gray-500';
  }

  // Show toast notification
  showToast(notification: NotificationData) {
    const icon = this.getNotificationIcon(notification.type);
    const priorityColor = this.getPriorityColor(notification.priority);
    
    toast(notification.title, {
      description: notification.message,
      duration: notification.priority === 'URGENT' ? 8000 : 4000,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to notifications page or specific transaction
          window.location.href = '/app/notifications';
        }
      }
    });
  }
}

export const notificationService = new NotificationService();