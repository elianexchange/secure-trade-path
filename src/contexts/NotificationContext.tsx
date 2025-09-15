import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { notificationsAPI } from '@/services/api';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  userId: string;
  transactionId?: string;
  type: 'TRANSACTION_UPDATE' | 'PAYMENT' | 'SHIPPING' | 'DELIVERY' | 'DISPUTE' | 'SYSTEM' | 'MESSAGE';
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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    if (!user) {
      console.log('No user found, cannot load notifications');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Loading notifications for user:', user.id);
      const apiNotifications = await notificationsAPI.getNotifications();
      console.log('Loaded notifications from API:', apiNotifications.length);
      setNotifications(apiNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to empty array on error
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save notifications to localStorage
  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    if (!user) return;
    localStorage.setItem(`tranzio_notifications_${user.id}`, JSON.stringify(newNotifications));
  }, [user]);

  // Add a new notification
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      console.log('No user found, cannot add notification');
      return;
    }

    console.log('Adding notification:', {
      forUserId: notificationData.userId,
      currentUserId: user.id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message
    });

    const newNotification: Notification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Only add notification to current user's list if it's intended for them
    if (notificationData.userId === user.id) {
      console.log('Adding notification to current user state');
      setNotifications(prev => {
        // Check if notification with same ID already exists
        const exists = prev.some(notif => notif.id === newNotification.id);
        if (exists) {
          console.log('Notification already exists, skipping');
          return prev; // Don't add duplicate
        }
        const updated = [newNotification, ...prev];
        saveNotifications(updated);
        console.log('Notification added to state, total notifications:', updated.length);
        return updated;
      });
    } else {
      console.log('Notification not for current user, only saving to localStorage');
    }

    // Always save notification to the intended recipient's localStorage
    const recipientNotifications = JSON.parse(localStorage.getItem(`tranzio_notifications_${notificationData.userId}`) || '[]');
    // Check if notification with same ID already exists in localStorage
    const existsInStorage = recipientNotifications.some((notif: Notification) => notif.id === newNotification.id);
    if (!existsInStorage) {
      const updatedRecipientNotifications = [newNotification, ...recipientNotifications];
      localStorage.setItem(`tranzio_notifications_${notificationData.userId}`, JSON.stringify(updatedRecipientNotifications));
      console.log('Notification saved to localStorage for user:', notificationData.userId, 'total notifications:', updatedRecipientNotifications.length);
    } else {
      console.log('Notification already exists in localStorage, skipping');
    }
    
    // Dispatch event to notify recipient if they're currently logged in
    if (notificationData.userId === user.id) {
      window.dispatchEvent(new CustomEvent('notificationAdded'));
    }

    // Show toast notification only for current user
    if (notificationData.userId === user.id) {
      const toastMessage = notificationData.metadata?.actionRequired 
        ? `${notificationData.title} - Action Required`
        : notificationData.title;
      
      switch (notificationData.priority) {
        case 'URGENT':
          toast.error(toastMessage, {
            description: notificationData.message,
            duration: 8000
          });
          break;
        case 'HIGH':
          toast.warning(toastMessage, {
            description: notificationData.message,
            duration: 6000
          });
          break;
        case 'MEDIUM':
          toast.info(toastMessage, {
            description: notificationData.message,
            duration: 4000
          });
          break;
        default:
          toast(toastMessage, {
            description: notificationData.message,
            duration: 3000
          });
      }
    }
  }, [user, saveNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => {
        const updated = prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, updatedAt: new Date().toISOString() }
            : notification
        );
        return updated;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => {
        const updated = prev.map(notification => ({
          ...notification,
          isRead: true,
          updatedAt: new Date().toISOString()
        }));
        return updated;
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => {
        const updated = prev.filter(notification => notification.id !== notificationId);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationsAPI.clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // WebSocket event handlers for real-time notifications
  useEffect(() => {
    if (!socket || !user) return;

    // Transaction status updates
    const handleTransactionUpdate = (data: any) => {
      const { transaction, status, counterpartyName } = data;
      
      let title = '';
      let message = '';
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
      let actionRequired = false;

      switch (status) {
        case 'ACTIVE':
          title = 'Transaction Activated';
          message = `${counterpartyName} has joined your transaction.`;
          priority = 'HIGH';
          actionRequired = true;
          break;
        case 'WAITING_FOR_DELIVERY_DETAILS':
          title = 'Delivery Details Required';
          message = 'Please provide your delivery details to continue.';
          priority = 'HIGH';
          actionRequired = true;
          break;
        case 'DELIVERY_DETAILS_IMPORTED':
          title = 'Delivery Details Received';
          message = 'Delivery details have been provided successfully.';
          priority = 'MEDIUM';
          break;
        case 'WAITING_FOR_PAYMENT':
          title = 'Payment Required';
          message = 'Please make payment to proceed with the transaction.';
          priority = 'HIGH';
          actionRequired = true;
          break;
        case 'PAYMENT_MADE':
          title = 'Payment Received';
          message = `Payment of ${transaction.currency} ${transaction.total} has been received and held in escrow.`;
          priority = 'HIGH';
          break;
        case 'WAITING_FOR_SHIPMENT':
          title = 'Shipment Required';
          message = 'Please ship the goods and confirm shipment.';
          priority = 'HIGH';
          actionRequired = true;
          break;
        case 'SHIPMENT_CONFIRMED':
          title = 'Goods Shipped';
          message = 'The goods have been shipped and are on their way.';
          priority = 'MEDIUM';
          break;
        case 'WAITING_FOR_BUYER_CONFIRMATION':
          title = 'Confirmation Required';
          message = 'Please confirm receipt of the goods.';
          priority = 'HIGH';
          actionRequired = true;
          break;
        case 'COMPLETED':
          title = 'Transaction Completed';
          message = 'Your transaction has been completed successfully!';
          priority = 'MEDIUM';
          break;
        case 'CANCELLED':
          title = 'Transaction Cancelled';
          message = 'The transaction has been cancelled.';
          priority = 'MEDIUM';
          break;
        default:
          title = 'Transaction Update';
          message = `Transaction status updated to ${status}.`;
      }

      addNotification({
        userId: user.id,
        transactionId: transaction.id,
        type: 'TRANSACTION_UPDATE',
        title,
        message,
        isRead: false,
        priority,
        metadata: {
          transactionStatus: status,
          amount: transaction.total,
          currency: transaction.currency,
          counterpartyName,
          actionRequired
        }
      });
    };

    // Payment notifications
    const handlePaymentUpdate = (data: any) => {
      const { transaction, paymentMethod, amount, currency } = data;
      
      addNotification({
        userId: user.id,
        transactionId: transaction.id,
        type: 'PAYMENT',
        title: 'Payment Processed',
        message: `Payment of ${currency} ${amount} via ${paymentMethod} has been processed.`,
        isRead: false,
        priority: 'HIGH',
        metadata: {
          amount,
          currency,
          actionRequired: false
        }
      });
    };

    // Message notifications
    const handleMessageNotification = (data: any) => {
      const { senderName, transactionId, messagePreview } = data;
      
      addNotification({
        userId: user.id,
        transactionId,
        type: 'MESSAGE',
        title: `New Message from ${senderName}`,
        message: messagePreview,
        isRead: false,
        priority: 'MEDIUM',
        metadata: {
          counterpartyName: senderName,
          actionRequired: true
        }
      });
    };

    // Shipping notifications
    const handleShippingUpdate = (data: any) => {
      const { transaction, trackingNumber, courierService } = data;
      
      addNotification({
        userId: user.id,
        transactionId: transaction.id,
        type: 'SHIPPING',
        title: 'Shipping Update',
        message: `Your package has been shipped via ${courierService}. Tracking: ${trackingNumber}`,
        isRead: false,
        priority: 'MEDIUM',
        metadata: {
          actionRequired: false
        }
      });
    };

    // System notifications
    const handleSystemNotification = (data: any) => {
      const { title, message, priority = 'MEDIUM' } = data;
      
      addNotification({
        userId: user.id,
        type: 'SYSTEM',
        title,
        message,
        isRead: false,
        priority,
        metadata: {
          actionRequired: false
        }
      });
    };

    // Register WebSocket event listeners
    socket.on('transaction_update', handleTransactionUpdate);
    socket.on('payment_update', handlePaymentUpdate);
    socket.on('message_notification', handleMessageNotification);
    socket.on('shipping_update', handleShippingUpdate);
    socket.on('system_notification', handleSystemNotification);

    // Cleanup
    return () => {
      socket.off('transaction_update', handleTransactionUpdate);
      socket.off('payment_update', handlePaymentUpdate);
      socket.off('message_notification', handleMessageNotification);
      socket.off('shipping_update', handleShippingUpdate);
      socket.off('system_notification', handleSystemNotification);
    };
  }, [socket, user, addNotification]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen for new notifications added for current user
  useEffect(() => {
    const handleNewNotification = () => {
      // Reload notifications when a new one is added
      loadNotifications();
    };

    window.addEventListener('notificationAdded', handleNewNotification);
    
    return () => {
      window.removeEventListener('notificationAdded', handleNewNotification);
    };
  }, [loadNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
