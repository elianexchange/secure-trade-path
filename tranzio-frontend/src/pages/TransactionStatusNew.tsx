import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Share2, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Package,
  Truck,
  CalendarDays,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TransactionStatusFlow from '@/components/TransactionStatusFlow';
import DeliveryDetailsForm from '@/components/DeliveryDetailsForm';
import PaymentConfirmation from '@/components/PaymentConfirmation';
import ShipmentVerification from '@/components/ShipmentVerification';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import DisputeForm from '@/components/DisputeForm';
import { EscrowTransaction, DeliveryDetailsRequest, PaymentConfirmationRequest } from '@/types';

export default function TransactionStatusNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, emitTransactionUpdate } = useWebSocket();
  
  // Safely get notifications with fallback
  let addNotification: ((notification: any) => void) | null = null;
  try {
    const { addNotification: addNotif } = useNotifications();
    addNotification = addNotif;
  } catch (error) {
    console.warn('NotificationProvider not available in TransactionStatusNew');
  }
  const [transaction, setTransaction] = useState<EscrowTransaction | null>(null);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showShipmentVerification, setShowShipmentVerification] = useState(false);
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh transaction data from localStorage
  const refreshTransactionData = useCallback((transactionId?: string) => {
    const targetId = transactionId || transaction?.id;
    if (!targetId) return;
    
    const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
    const updatedTransaction = storedTransactions.find((tx: EscrowTransaction) => tx.id === targetId);
    
    if (updatedTransaction) {
      // Check if status changed from PENDING to ACTIVE
      if (transaction?.status === 'PENDING' && updatedTransaction.status === 'ACTIVE') {
        toast.success('🎉 Transaction Activated! Your counterparty has joined. You can now proceed to the next step.');
      }
      
      setTransaction(updatedTransaction);
      console.log('Transaction data refreshed:', updatedTransaction);
    } else {
      console.warn('Transaction not found in localStorage:', targetId);
    }
  }, [transaction?.id, transaction?.status]);

  // Listen for real-time transaction updates
  useEffect(() => {
    const handleTransactionUpdate = (event: CustomEvent) => {
      const data = event.detail;
      if (data && data.transactionId) {
        console.log('Real-time transaction update received:', data);
        // Always refresh if it's our transaction or if we don't have a transaction yet
        if (!transaction?.id || data.transactionId === transaction.id) {
          console.log('TransactionStatusNew: Updating transaction state directly from WebSocket data');
          
          // Update transaction state directly from WebSocket data
          if (data.transaction) {
            setTransaction(data.transaction);
            console.log('TransactionStatusNew: Transaction state updated from WebSocket:', data.transaction);
          } else {
            // Fallback to refreshing from localStorage
            refreshTransactionData(data.transactionId);
          }
        }
      }
    };

    // Listen for custom events
    window.addEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
    };
  }, [transaction?.id, refreshTransactionData]);

  // Listen for WebSocket transaction updates
  useEffect(() => {
    if (!socket) return;

    const handleWebSocketUpdate = (data: any) => {
      if (data.transactionId) {
        console.log('WebSocket transaction update received:', data);
        // Always refresh if it's our transaction or if we don't have a transaction yet
        if (!transaction?.id || data.transactionId === transaction.id) {
          refreshTransactionData(data.transactionId);
        }
      }
    };

    socket.on('transaction:updated', handleWebSocketUpdate);
    
    return () => {
      socket.off('transaction:updated', handleWebSocketUpdate);
    };
  }, [socket, transaction?.id, refreshTransactionData]);

  useEffect(() => {
    if (location.state) {
      setTransaction(location.state.transaction);
      setInvitationCode(location.state.invitationCode);
    } else {
      // If no state, redirect to dashboard
      navigate('/app/dashboard');
    }
  }, [location.state, navigate]);

  // Add periodic refresh to catch missed updates (especially for PENDING -> ACTIVE transition)
  useEffect(() => {
    if (!transaction?.id) return;

    const interval = setInterval(() => {
      // Only refresh if transaction is still PENDING (waiting for seller to join)
      if (transaction.status === 'PENDING') {
        console.log('Periodic refresh for PENDING transaction:', transaction.id);
        refreshTransactionData(transaction.id);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [transaction?.id, transaction?.status, refreshTransactionData]);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transaction...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    const symbol = currency === 'NGN' ? '₦' : currency;
    return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const getTransactionLink = () => {
    return `${window.location.origin}/app/join-transaction/${invitationCode}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareTransaction = async () => {
    const link = getTransactionLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tranzio transaction',
          text: `Join my transaction: ${transaction.description}`,
          url: link
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      copyToClipboard(link);
    }
  };

  const handleTransactionAction = async (action: string, data?: any) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'provide_delivery_details':
          setShowDeliveryForm(true);
          break;
        case 'make_payment':
          setShowPaymentForm(true);
          break;
        case 'confirm_shipment':
          // Handle shipment confirmation
          toast.info('Shipment confirmation functionality coming soon!');
          break;
        case 'confirm_receipt':
          // Handle receipt confirmation
          toast.info('Receipt confirmation functionality coming soon!');
          break;
        default:
          toast.info('Action not implemented yet');
      }
    } catch (error) {
      toast.error('Failed to perform action');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliveryDetailsSubmit = async (details: DeliveryDetailsRequest) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update transaction status - after delivery details, move to payment
      setTransaction(prev => prev ? {
        ...prev,
        status: 'WAITING_FOR_PAYMENT',
        deliveryDetails: JSON.stringify(details),
        updatedAt: new Date().toISOString()
      } : null);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: EscrowTransaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = {
          ...storedTransactions[transactionIndex],
          status: 'WAITING_FOR_PAYMENT',
          deliveryDetails: JSON.stringify(details),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'WAITING_FOR_PAYMENT');
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { transactionId: transaction.id, status: 'WAITING_FOR_PAYMENT' }
        }));
      }
      
      // Add notification to counterparty (seller)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'TRANSACTION_UPDATE',
            title: 'Delivery Details Provided',
            message: `${user?.firstName} ${user?.lastName} has provided delivery details. You can now proceed with payment.`,
            isRead: false,
            priority: 'HIGH',
            metadata: {
              transactionStatus: 'WAITING_FOR_PAYMENT',
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: true,
              nextAction: 'proceed_with_payment'
            }
          });
        }
      }
      
      setShowDeliveryForm(false);
      toast.success('Delivery details saved successfully!');
    } catch (error) {
      toast.error('Failed to save delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirmation = async (payment: PaymentConfirmationRequest) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Determine next status based on whether transaction requires shipping
      const nextStatus = transaction.useCourier ? 'WAITING_FOR_SHIPMENT' : 'PAYMENT_MADE';
      
      // Update transaction status - after payment, move to appropriate next status
      setTransaction(prev => prev ? {
        ...prev,
        status: nextStatus,
        paymentCompleted: true,
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.paymentReference,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : null);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: EscrowTransaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = {
          ...storedTransactions[transactionIndex],
          status: nextStatus,
          paymentCompleted: true,
          paymentMethod: payment.paymentMethod,
          paymentReference: payment.paymentReference,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, nextStatus);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { transactionId: transaction.id, status: nextStatus }
        }));
      }
      
      // Add notification to counterparty (seller)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'PAYMENT',
            title: 'Payment Received',
            message: `${user?.firstName} ${user?.lastName} has made payment of ${transaction.currency} ${transaction.total}. Please ship the goods.`,
            isRead: false,
            priority: 'HIGH',
            metadata: {
              amount: transaction.total,
              currency: transaction.currency,
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: true,
              nextAction: 'proceed_to_ship_goods'
            }
          });
        }
      }
      
      setShowPaymentForm(false);
      toast.success('Payment confirmed successfully!');
    } catch (error) {
      toast.error('Failed to confirm payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: string, data: any) => {
    console.log('Action triggered:', action, data);
    
    switch (action) {
      case 'proceed_to_fill_shipping_details':
      case 'provide_delivery_details':
        setShowDeliveryForm(true);
        break;
      case 'proceed_with_payment':
      case 'make_payment':
        setShowPaymentForm(true);
        break;
      case 'proceed_to_ship_goods':
      case 'confirm_shipment':
        setShowShipmentVerification(true);
        break;
      case 'confirm_receipt_of_goods':
      case 'confirm_receipt':
        setShowReceiptConfirmation(true);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleShipmentConfirmation = async () => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update transaction status - after shipment, move to waiting for buyer confirmation
      setTransaction(prev => prev ? {
        ...prev,
        status: 'WAITING_FOR_BUYER_CONFIRMATION',
        shippedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : null);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: EscrowTransaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = {
          ...storedTransactions[transactionIndex],
          status: 'WAITING_FOR_BUYER_CONFIRMATION',
          shippedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'WAITING_FOR_BUYER_CONFIRMATION');
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { transactionId: transaction.id, status: 'WAITING_FOR_BUYER_CONFIRMATION' }
        }));
      }
      
      // Add notification to counterparty (buyer)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'TRANSACTION_UPDATE',
            title: 'Goods Shipped',
            message: `${user?.firstName} ${user?.lastName} has shipped the goods. Please confirm receipt when you receive them.`,
            isRead: false,
            priority: 'HIGH',
            metadata: {
              transactionStatus: 'WAITING_FOR_BUYER_CONFIRMATION',
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: true,
              nextAction: 'confirm_receipt'
            }
          });
        }
      }
      
      toast.success('Shipment confirmed successfully!');
    } catch (error) {
      toast.error('Failed to confirm shipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiptConfirmation = async () => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update transaction status
      setTransaction(prev => prev ? {
        ...prev,
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      } : null);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: EscrowTransaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = {
          ...storedTransactions[transactionIndex],
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'COMPLETED');
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { transactionId: transaction.id, status: 'COMPLETED' }
        }));
      }
      
      // Add notification to counterparty (seller)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'TRANSACTION_UPDATE',
            title: 'Transaction Completed',
            message: `${user?.firstName} ${user?.lastName} has confirmed receipt. The transaction is now complete!`,
            isRead: false,
            priority: 'MEDIUM',
            metadata: {
              transactionStatus: 'COMPLETED',
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: false,
              nextAction: 'view_transaction'
            }
          });
        }
      }
      
      toast.success('Transaction completed successfully!');
    } catch (error) {
      toast.error('Failed to confirm receipt');
    } finally {
      setIsLoading(false);
    }
  };

  // New security handler functions
  const handleShipmentVerification = async (shipmentData: any) => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update transaction status - after shipment verification, move to waiting for buyer confirmation
      const updatedTransaction: EscrowTransaction = {
        ...transaction,
        status: 'WAITING_FOR_BUYER_CONFIRMATION' as any,
        shippedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shipmentData: shipmentData // Store shipment verification data
      } as any;
      
      setTransaction(updatedTransaction);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: EscrowTransaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = updatedTransaction;
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'WAITING_FOR_BUYER_CONFIRMATION');
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: 'WAITING_FOR_BUYER_CONFIRMATION',
            shipmentData: shipmentData,
            updatedAt: new Date().toISOString(),
            transaction: updatedTransaction
          }
        }));
      }
      
      // Add notification to counterparty (buyer)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'SHIPPING',
            title: 'Goods Shipped with Verification',
            message: `${user?.firstName} ${user?.lastName} has shipped the goods with verification photos. Please confirm receipt when you receive the item.`,
            isRead: false,
            priority: 'HIGH',
            metadata: {
              transactionStatus: 'WAITING_FOR_BUYER_CONFIRMATION',
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: true,
              nextAction: 'confirm_receipt_of_goods'
            }
          });
        }
      }
      
      setShowShipmentVerification(false);
      setShipmentData(shipmentData);
      toast.success('Shipment verified and confirmed successfully!');
    } catch (error) {
      toast.error('Failed to confirm shipment verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiptConfirmationWithWarning = async () => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update transaction status - after receipt confirmation, move to completed
      const updatedTransaction: EscrowTransaction = {
        ...transaction,
        status: 'COMPLETED' as any,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any;
      
      setTransaction(updatedTransaction);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: EscrowTransaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = updatedTransaction;
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'COMPLETED');
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            transaction: updatedTransaction
          }
        }));
      }
      
      // Add notification to counterparty (seller)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'TRANSACTION_UPDATE',
            title: 'Transaction Completed - Funds Released',
            message: `${user?.firstName} ${user?.lastName} has confirmed receipt. Funds have been released to your account!`,
            isRead: false,
            priority: 'HIGH',
            metadata: {
              transactionStatus: 'COMPLETED',
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: false,
              nextAction: 'view_transaction'
            }
          });
        }
      }
      
      setShowReceiptConfirmation(false);
      toast.success('Receipt confirmed! Funds have been released to the seller.');
    } catch (error) {
      toast.error('Failed to confirm receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisputeSubmission = async (disputeData: any) => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update transaction status to disputed
      const updatedTransaction: EscrowTransaction = {
        ...transaction,
        status: 'DISPUTED' as any,
        disputedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        disputeData: disputeData
      } as any;
      
      setTransaction(updatedTransaction);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: EscrowTransaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = updatedTransaction;
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'DISPUTED');
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: 'DISPUTED',
            disputedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            transaction: updatedTransaction
          }
        }));
      }
      
      // Add notification to counterparty
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'DISPUTE',
            title: 'Dispute Raised',
            message: `${user?.firstName} ${user?.lastName} has raised a dispute for this transaction. Our support team will review the case.`,
            isRead: false,
            priority: 'URGENT',
            metadata: {
              transactionStatus: 'DISPUTED',
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: true,
              nextAction: 'view_dispute'
            }
          });
        }
      }
      
      setShowDisputeForm(false);
      toast.success('Dispute submitted successfully! Our support team will review your case within 24-48 hours.');
    } catch (error) {
      toast.error('Failed to submit dispute');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserRole = (): 'BUYER' | 'SELLER' => {
    if (transaction.creatorId === user?.id) {
      return transaction.creatorRole as 'BUYER' | 'SELLER';
    }
    return transaction.counterpartyRole as 'BUYER' | 'SELLER';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WAITING_FOR_DELIVERY_DETAILS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELIVERY_DETAILS_IMPORTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WAITING_FOR_PAYMENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PAYMENT_MADE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WAITING_FOR_SHIPMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPMENT_CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WAITING_FOR_BUYER_CONFIRMATION':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Transaction Status</h1>
            <p className="text-sm text-muted-foreground">
              Monitor your transaction progress
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusBadgeColor(transaction.status)} border`}>
              {transaction.status.replace(/_/g, ' ').toLowerCase()}
            </Badge>
          </div>
        </div>

        {/* Transaction Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction Overview</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(transaction.total, transaction.currency)}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Transaction Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="text-right">{transaction.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Role:</span>
                      <Badge variant="outline">
                        {getUserRole()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span>{transaction.useCourier ? 'Courier Service' : 'Local Pickup'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Share Transaction</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Transaction Link</p>
                        <p className="text-sm font-mono truncate">{getTransactionLink()}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(getTransactionLink())}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={shareTransaction}
                        className="flex-1"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(invitationCode)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status Flow */}
        <TransactionStatusFlow
          transaction={transaction}
          userRole={getUserRole()}
          onAction={handleAction}
        />

        {/* Delivery Details Form Modal */}
        {showDeliveryForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <DeliveryDetailsForm
                onSubmit={handleDeliveryDetailsSubmit}
                onCancel={() => setShowDeliveryForm(false)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <PaymentConfirmation
                transactionId={transaction.id}
                amount={transaction.total}
                currency={transaction.currency}
                onConfirm={handlePaymentConfirmation}
                onCancel={() => setShowPaymentForm(false)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span>Need Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Transaction Process</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Share the transaction link with your counterparty</li>
                  <li>• Wait for them to join the transaction</li>
                  <li>• Follow the status flow to complete each step</li>
                  <li>• Funds are held securely in escrow until completion</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Support</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Help Center
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Information - Only show for buyers when shipment data exists */}
        {getUserRole() === 'BUYER' && (transaction as any)?.shipmentData && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <Package className="h-5 w-5" />
                <span>Shipment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Tracking Information */}
                  {(transaction as any).shipmentData.trackingNumber && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Tracking Number</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText((transaction as any).shipmentData.trackingNumber);
                            toast.success('Tracking number copied to clipboard');
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="p-2 bg-white rounded border font-mono text-sm">
                        {(transaction as any).shipmentData.trackingNumber}
                      </div>
                    </div>
                  )}

                  {/* Courier Service */}
                  {(transaction as any).shipmentData.courierService && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-blue-700">Courier Service</span>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{(transaction as any).shipmentData.courierService}</span>
                      </div>
                    </div>
                  )}

                  {/* Estimated Delivery */}
                  {(transaction as any).shipmentData.estimatedDeliveryDate && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-blue-700">Estimated Delivery</span>
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          {new Date((transaction as any).shipmentData.estimatedDeliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Item Condition */}
                  {(transaction as any).shipmentData.itemCondition && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-blue-700">Item Condition</span>
                      <Badge variant="outline" className="text-xs">
                        {(transaction as any).shipmentData.itemCondition}
                      </Badge>
                    </div>
                  )}

                  {/* Packaging Details */}
                  {(transaction as any).shipmentData.packagingDetails && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-blue-700">Packaging Details</span>
                      <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                        {(transaction as any).shipmentData.packagingDetails}
                      </p>
                    </div>
                  )}

                  {/* Track Package Button */}
                  {(transaction as any).shipmentData.trackingNumber && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // Open tracking in new tab based on courier service
                        const courier = (transaction as any).shipmentData.courierService?.toLowerCase();
                        let trackingUrl = '';
                        
                        if (courier?.includes('dhl')) {
                          trackingUrl = `https://www.dhl.com/tracking?trackingNumber=${(transaction as any).shipmentData.trackingNumber}`;
                        } else if (courier?.includes('fedex')) {
                          trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${(transaction as any).shipmentData.trackingNumber}`;
                        } else if (courier?.includes('ups')) {
                          trackingUrl = `https://www.ups.com/track?trackingNumber=${(transaction as any).shipmentData.trackingNumber}`;
                        } else {
                          // Generic tracking search
                          trackingUrl = `https://www.google.com/search?q=${(transaction as any).shipmentData.trackingNumber}+tracking`;
                        }
                        
                        window.open(trackingUrl, '_blank');
                      }}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Track Package
                    </Button>
                  )}
                </div>
              </div>

              {/* Shipment Photos */}
              {(transaction as any).shipmentData.photos && (transaction as any).shipmentData.photos.length > 0 && (
                <div className="mt-6 space-y-3">
                  <span className="text-sm font-medium text-blue-700">Verification Photos</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(transaction as any).shipmentData.photos.map((photo: any, index: number) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded border overflow-hidden">
                          <img
                            src={photo.preview || URL.createObjectURL(photo)}
                            alt={`Shipment verification ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(photo.preview || URL.createObjectURL(photo), '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = photo.preview || URL.createObjectURL(photo);
                                link.download = `shipment_photo_${index + 1}.jpg`;
                                link.click();
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Security Component Modals */}
      <Dialog open={showShipmentVerification} onOpenChange={setShowShipmentVerification}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipment Verification</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please provide verification details and photos of the item being shipped
            </p>
          </DialogHeader>
          <ShipmentVerification 
            onConfirm={handleShipmentVerification}
            onCancel={() => setShowShipmentVerification(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptConfirmation} onOpenChange={setShowReceiptConfirmation}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Receipt of Goods</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please carefully review the item and confirm receipt. This action will release funds to the seller.
            </p>
          </DialogHeader>
          <ReceiptConfirmation 
            onConfirm={handleReceiptConfirmationWithWarning}
            onCancel={() => setShowReceiptConfirmation(false)}
            onRaiseDispute={() => {
              setShowReceiptConfirmation(false);
              setShowDisputeForm(true);
            }}
            isLoading={isLoading}
            shipmentData={shipmentData}
            transactionAmount={transaction?.total}
            currency={transaction?.currency}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDisputeForm} onOpenChange={setShowDisputeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please provide detailed information about your dispute
            </p>
          </DialogHeader>
          <DisputeForm 
            onSubmit={handleDisputeSubmission}
            onCancel={() => setShowDisputeForm(false)}
            isLoading={isLoading}
            transactionId={transaction?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
