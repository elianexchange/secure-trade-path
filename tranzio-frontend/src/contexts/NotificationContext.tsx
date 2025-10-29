import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { notificationsAPI } from '@/services/api';
import { notificationService, NotificationData } from '@/services/notificationService';
import { toast } from 'sonner';

export interface Notification {
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
  generateSampleNotifications: () => void;
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
      
      // Transform API notifications to our format
      const transformedNotifications: Notification[] = apiNotifications.map((notif: any) => ({
        id: notif.id,
        userId: notif.userId,
        transactionId: notif.transactionId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        priority: notif.priority,
        createdAt: notif.createdAt,
        updatedAt: notif.updatedAt,
        metadata: notif.metadata || {}
      }));
      
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Generate sample notifications for demo if API fails
      generateSampleNotifications();
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Generate sample notifications for demo
  const generateSampleNotifications = useCallback(() => {
    if (!user) return;

    const sampleNotifications: Notification[] = [
      notificationService.generateTransactionNotification(
        user.id,
        'txn_123456789',
        'ACTIVE',
        'John Doe',
        1500
      ),
      notificationService.generatePaymentNotification(
        user.id,
        'txn_123456789',
        'ESCROW_RELEASE',
        1500
      ),
      notificationService.generateDisputeNotification(
        user.id,
        'txn_987654321',
        'OPENED',
        'Jane Smith'
      ),
      notificationService.generateSystemNotification(
        user.id,
        'Welcome to Tranzio!',
        'Your account has been successfully set up. Start creating secure transactions today!',
        'MEDIUM'
      ),
      notificationService.generateMessageNotification(
        user.id,
        'txn_123456789',
        'John Doe',
        'Hi, I have shipped your order. The tracking number is 1Z999AA1234567890.'
      ),
      notificationService.generateWalletNotification(
        user.id,
        'LOW_BALANCE',
        'Your wallet balance is low. Consider adding funds for future transactions.'
      )
    ];

    setNotifications(sampleNotifications);
    console.log('Generated sample notifications:', sampleNotifications.length);
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

      // Show toast notification
      notificationService.showToast(newNotification);
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
  }, [user, saveNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, updatedAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback to local update
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, updatedAt: new Date().toISOString() }
            : notif
        )
      );
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          updatedAt: new Date().toISOString() 
        }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback to local update
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          updatedAt: new Date().toISOString() 
        }))
      );
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Fallback to local update
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationsAPI.clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      // Fallback to local update
      setNotifications([]);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, loadNotifications]);

  // Listen for WebSocket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      console.log('Received notification via WebSocket:', data);
      
      if (data.userId === user?.id) {
        const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: data.userId,
          transactionId: data.transactionId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
          priority: data.priority || 'MEDIUM',
          metadata: data.metadata || {}
        };
        
        addNotification(notification);
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, user, addNotification]);

  // Listen for notification events
  useEffect(() => {
    const handleNotificationAdded = () => {
      console.log('Notification added event received');
      loadNotifications();
    };

    window.addEventListener('notificationAdded', handleNotificationAdded);
    return () => {
      window.removeEventListener('notificationAdded', handleNotificationAdded);
    };
  }, [loadNotifications]);

  // Auto-generate sample notifications for demo (remove in production)
  useEffect(() => {
    if (user && notifications.length === 0 && !isLoading) {
      // Generate sample notifications after a short delay
      const timer = setTimeout(() => {
        generateSampleNotifications();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, notifications.length, isLoading, generateSampleNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    addNotification,
    generateSampleNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};