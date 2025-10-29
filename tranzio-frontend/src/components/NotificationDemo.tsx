import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from 'sonner';

export default function NotificationDemo() {
  // Safely get notifications with fallback
  let addNotification: ((notification: any) => void) | null = null;
  try {
    const { addNotification: addNotif } = useNotifications();
    addNotification = addNotif;
  } catch (error) {
    console.warn('NotificationProvider not available in NotificationDemo');
  }

  const simulateTransactionUpdate = () => {
    if (addNotification) {
      addNotification({
        userId: 'demo-user',
        transactionId: 'demo-tx-001',
        type: 'TRANSACTION_UPDATE',
        title: 'Transaction Status Updated',
        message: 'Your transaction has moved to the next stage. Please check for required actions.',
        isRead: false,
        priority: 'HIGH',
        metadata: {
          transactionStatus: 'PAYMENT_MADE',
          amount: 50000,
          currency: 'NGN',
          actionRequired: true
        }
      });
    } else {
      toast.error('Notification system not available');
    }
  };

  const simulatePaymentNotification = () => {
    if (addNotification) {
      addNotification({
        userId: 'demo-user',
        transactionId: 'demo-tx-002',
        type: 'PAYMENT',
        title: 'Payment Received',
        message: 'Payment of ₦25,000 has been received and held in escrow.',
        isRead: false,
        priority: 'HIGH',
        metadata: {
          amount: 25000,
          currency: 'NGN',
          actionRequired: false
        }
      });
    } else {
      toast.error('Notification system not available');
    }
  };

  const simulateMessageNotification = () => {
    if (addNotification) {
      addNotification({
        userId: 'demo-user',
        transactionId: 'demo-tx-003',
        type: 'MESSAGE',
        title: 'New Message from John Doe',
        message: 'Hi! I have shipped your order. The tracking number is TRK123456789.',
        isRead: false,
        priority: 'MEDIUM',
        metadata: {
          counterpartyName: 'John Doe',
          actionRequired: true
        }
      });
    } else {
      toast.error('Notification system not available');
    }
  };

  const simulateSystemAlert = () => {
    if (addNotification) {
      addNotification({
        userId: 'demo-user',
        type: 'SYSTEM',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM. Some features may be temporarily unavailable.',
        isRead: false,
        priority: 'URGENT',
        metadata: {
          actionRequired: false
        }
      });
    } else {
      toast.error('Notification system not available');
    }
  };

  const simulateShippingUpdate = () => {
    if (addNotification) {
      addNotification({
        userId: 'demo-user',
        transactionId: 'demo-tx-004',
        type: 'SHIPPING',
        title: 'Package Shipped',
        message: 'Your package has been shipped via DHL. Expected delivery: 2-3 business days.',
        isRead: false,
        priority: 'MEDIUM',
        metadata: {
          actionRequired: false
        }
      });
    } else {
      toast.error('Notification system not available');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Notification Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={simulateTransactionUpdate} className="w-full">
          Simulate Transaction Update
        </Button>
        <Button onClick={simulatePaymentNotification} className="w-full">
          Simulate Payment Notification
        </Button>
        <Button onClick={simulateMessageNotification} className="w-full">
          Simulate Message Notification
        </Button>
        <Button onClick={simulateShippingUpdate} className="w-full">
          Simulate Shipping Update
        </Button>
        <Button onClick={simulateSystemAlert} className="w-full">
          Simulate System Alert
        </Button>
      </CardContent>
    </Card>
  );
}
