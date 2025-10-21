import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MessageCircle,
  Share2,
  Shield,
  CheckCircle,
  Info,
  AlertCircle,
  Package,
  Truck,
  CalendarDays,
  Copy,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MessageThread from '@/components/MessageThread';
import TransactionStatusFlow from '@/components/TransactionStatusFlow';
import DeliveryDetailsForm from '@/components/DeliveryDetailsForm';
import PaymentConfirmation from '@/components/PaymentConfirmation';
import ShipmentVerification from '@/components/ShipmentVerification';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import DisputeForm from '@/components/DisputeForm';
import { EscrowTransaction, DeliveryDetailsRequest, PaymentConfirmationRequest } from '@/types';

// Extend the EscrowTransaction type to include additional fields
type Transaction = EscrowTransaction & {
  creatorName?: string;
  counterpartyName?: string;
  counterpartyId?: string;
  // Additional transaction form fields
  itemType?: string;
  itemCategory?: string;
  itemCondition?: string;
  itemBrand?: string;
  itemModel?: string;
  itemSize?: string;
  itemColor?: string;
  itemWeight?: number;
  itemDimensions?: string;
  itemSerialNumber?: string;
  itemWarranty?: string;
  itemOrigin?: string;
  itemAge?: string;
  itemQuantity?: number;
  specialInstructions?: string;
  returnPolicy?: string;
  estimatedDeliveryDays?: number;
  itemPhotos?: File[];
  // Security fields
  shipmentData?: any;
  disputeData?: any;
};

export default function TransactionDetailsNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, emitTransactionUpdate } = useWebSocket();
  
  // Safely get notifications with fallback
  let addNotification: ((notification: any) => void) | null = null;
  try {
    const { addNotification: addNotif } = useNotifications();
    addNotification = addNotif;
  } catch (error) {
    console.warn('NotificationProvider not available in TransactionDetails');
  }
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showShipmentVerification, setShowShipmentVerification] = useState(false);
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [shipmentData, setShipmentData] = useState<any>(null);

  // Function to refresh transaction data from localStorage
  const refreshTransactionData = useCallback((transactionId?: string) => {
    const targetId = transactionId || transaction?.id;
    if (!targetId) return;
    
    console.log('TransactionDetailsNew: Refreshing transaction data for ID:', targetId);
    const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
    const updatedTransaction = storedTransactions.find((tx: Transaction) => tx.id === targetId);
    
    if (updatedTransaction) {
      console.log('TransactionDetailsNew: Found updated transaction:', updatedTransaction);
      console.log('TransactionDetailsNew: Old status:', transaction?.status, 'New status:', updatedTransaction.status);
      
      // Check if status has changed
      if (transaction?.status && transaction.status !== updatedTransaction.status) {
        console.log('TransactionDetailsNew: Status changed from', transaction.status, 'to', updatedTransaction.status);
        
        // Show a toast notification for status changes
        toast.success(`Transaction status updated to: ${updatedTransaction.status.replace(/_/g, ' ')}`);
      }
      
      setTransaction(updatedTransaction);
      console.log('TransactionDetailsNew: Transaction data refreshed successfully');
    } else {
      console.warn('TransactionDetailsNew: Transaction not found in localStorage:', targetId);
    }
  }, [transaction?.id, transaction?.status]);

  // Listen for real-time transaction updates
  useEffect(() => {
    if (!id || !transaction?.id) {
      console.log('TransactionDetailsNew: No transaction ID available yet, skipping listener setup');
      return;
    }

    const handleTransactionUpdate = (event: CustomEvent) => {
      const data = event.detail;
      console.log('TransactionDetailsNew: Real-time transaction update received:', data);
      if (data && data.transactionId) {
        console.log('TransactionDetailsNew: Processing update for transaction:', data.transactionId, 'current transaction:', transaction?.id);
        if (data.transactionId === transaction.id) {
          console.log('TransactionDetailsNew: Updating transaction state directly from WebSocket data');
          
          // Update transaction state directly from WebSocket data
          if (data.transaction) {
            setTransaction(data.transaction);
            console.log('TransactionDetailsNew: Transaction state updated from WebSocket:', data.transaction);
          } else {
            // Fallback: refresh from API if no transaction data provided
            console.log('TransactionDetailsNew: No transaction data in WebSocket message, refreshing from API...');
            refreshTransactionData(data.transactionId);
          }
          
          // Show toast notification for status changes
          if (data.message) {
            toast.success(data.message);
          }
        }
      }
    };

    console.log('TransactionDetailsNew: Setting up transaction update listener for transaction:', transaction.id);
    window.addEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
    
    return () => {
      console.log('TransactionDetailsNew: Removing transaction update listener');
      window.removeEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
    };
  }, [transaction?.id]);

  // Single consolidated refresh mechanism
  useEffect(() => {
    if (!transaction?.id) return;

    // Determine refresh interval based on transaction status
    const getRefreshInterval = (status: string) => {
      const criticalStatuses = ['ACTIVE', 'WAITING_FOR_PAYMENT', 'WAITING_FOR_SHIPMENT', 'WAITING_FOR_BUYER_CONFIRMATION'];
      
      if (criticalStatuses.includes(status)) {
        return 5000; // 5 seconds for critical statuses
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        return 0; // No refresh for completed transactions
      } else {
        return 10000; // 10 seconds for other statuses
      }
    };

    const intervalMs = getRefreshInterval(transaction.status);
    
    if (intervalMs === 0) {
      return; // No refresh needed
    }

    const interval = setInterval(() => {
      console.log('Periodic refresh for transaction:', transaction.id, 'status:', transaction.status);
      refreshTransactionData(transaction.id);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [transaction?.id, transaction?.status, refreshTransactionData]);

  useEffect(() => {
    if (id) {
      // Load transaction from localStorage first, then API if not found
      const loadTransaction = async () => {
        try {
          if (!user?.id) {
            setIsLoading(false);
            return;
          }

          // First try localStorage
          const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
          const foundTransaction = storedTransactions.find((tx: Transaction) => 
            tx.id === id && (tx.creatorId === user.id || tx.counterpartyId === user.id)
          );
          
          if (foundTransaction) {
            console.log('TransactionDetailsNew: Found transaction in localStorage:', foundTransaction);
            setTransaction(foundTransaction);
            setIsLoading(false);
            return;
          }

          // If not found in localStorage, try API
          console.log('TransactionDetailsNew: Transaction not found in localStorage, trying API...');
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://tranzio-backend.onrender.com/api'}/transactions/${id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.transaction) {
                console.log('TransactionDetailsNew: Found transaction via API:', data.transaction);
                setTransaction(data.transaction);
                
                // Store in localStorage for future use
                const updatedTransactions = [...storedTransactions.filter((tx: Transaction) => tx.id !== id), data.transaction];
                localStorage.setItem('tranzio_transactions', JSON.stringify(updatedTransactions));
              } else {
                console.log('TransactionDetailsNew: Transaction not found via API');
                setTransaction(null);
              }
            } else {
              console.log('TransactionDetailsNew: API request failed:', response.status);
              setTransaction(null);
            }
          } catch (apiError) {
            console.error('TransactionDetailsNew: API request error:', apiError);
            setTransaction(null);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to load transaction:', error);
          setIsLoading(false);
        }
      };

      loadTransaction();
    }
  }, [id, user]);

  const getUserRole = (): 'BUYER' | 'SELLER' => {
    if (!transaction || !user) return 'BUYER';
    if (transaction.creatorId === user.id) {
      return transaction.creatorRole as 'BUYER' | 'SELLER';
    }
    return transaction.counterpartyRole as 'BUYER' | 'SELLER';
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    const symbols: { [key: string]: string } = {
      'NGN': '₦',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleAction = (action: string, data: any) => {
    console.log('TransactionDetailsNew: handleAction function called at all!');
    try {
      console.log('TransactionDetailsNew: Action triggered:', action, data);
      console.log('TransactionDetailsNew: handleAction function called with action:', action);
      
      switch (action) {
        case 'proceed_to_fill_shipping_details':
        case 'provide_delivery_details':
          console.log('TransactionDetailsNew: Opening delivery form for action:', action);
          setShowDeliveryForm(true);
          break;
        case 'proceed_with_payment':
        case 'make_payment':
          console.log('TransactionDetailsNew: Opening payment form for action:', action);
          setShowPaymentForm(true);
          break;
        case 'proceed_to_ship_goods':
        case 'confirm_shipment':
          console.log('TransactionDetailsNew: Opening shipment verification for action:', action);
          setShowShipmentVerification(true);
          break;
        case 'confirm_receipt_of_goods':
        case 'confirm_receipt':
          console.log('TransactionDetailsNew: Opening receipt confirmation for action:', action);
          setShowReceiptConfirmation(true);
          break;
        default:
          console.log('TransactionDetailsNew: Unknown action:', action);
          console.log('TransactionDetailsNew: Available actions: proceed_to_fill_shipping_details, provide_delivery_details, proceed_with_payment, make_payment, proceed_to_ship_goods, confirm_shipment, confirm_receipt_of_goods, confirm_receipt');
          toast.info(`Action "${action}" not implemented yet`);
      }
    } catch (error) {
      console.error('TransactionDetailsNew: Error in handleAction:', error);
      toast.error('An error occurred while processing the action');
    }
  };

  const handleDeliveryDetails = async (details: DeliveryDetailsRequest) => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      console.log('TransactionDetailsNew: Saving delivery details via API:', details);
      
      // Make real API call to save delivery details
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://tranzio-backend.onrender.com/api'}/transactions/${transaction.id}/delivery-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ deliveryDetails: details })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save delivery details');
      }
      
      const result = await response.json();
      console.log('TransactionDetailsNew: Delivery details saved successfully:', result);
      
      // Update local state with the response from server
      if (result.success && result.transaction) {
        setTransaction(result.transaction);
        
        // Update localStorage for both parties
        const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
        const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
        
        if (transactionIndex !== -1) {
          storedTransactions[transactionIndex] = result.transaction;
          localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
          console.log('TransactionDetailsNew: localStorage updated with server response');
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
      }
      
      setShowDeliveryForm(false);
      toast.success('Delivery details saved successfully!');
    } catch (error) {
      console.error('TransactionDetailsNew: Error saving delivery details:', error);
      toast.error(`Failed to save delivery details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirmation = async (payment: PaymentConfirmationRequest) => {
    if (!transaction) return;
    
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
      const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
      
      console.log('TransactionDetailsNew: Updating localStorage for payment, transactionIndex:', transactionIndex);
      
      if (transactionIndex !== -1) {
        const updatedTransaction = {
          ...storedTransactions[transactionIndex],
          status: nextStatus,
          paymentCompleted: true,
          paymentMethod: payment.paymentMethod,
          paymentReference: payment.paymentReference,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        storedTransactions[transactionIndex] = updatedTransaction;
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        console.log('TransactionDetailsNew: localStorage updated with new status:', updatedTransaction.status);
        
        // Emit WebSocket event for real-time update
        console.log('Emitting WebSocket update for payment:', transaction.id, nextStatus);
        emitTransactionUpdate(transaction.id, nextStatus);
        
        // Dispatch custom event
        console.log('Dispatching custom event for payment:', transaction.id, nextStatus);
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: nextStatus,
            paymentCompleted: true,
            paymentMethod: payment.paymentMethod,
            paymentReference: payment.paymentReference,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Include all transaction data for complete sync
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
      const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
      
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
      
      // Update transaction status - after receipt confirmation, move to completed
      setTransaction(prev => prev ? {
        ...prev,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : null);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
      
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
      const updatedTransaction: Transaction = {
        ...transaction,
        status: 'WAITING_FOR_BUYER_CONFIRMATION' as any,
        shippedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shipmentData: shipmentData // Store shipment verification data
      };
      
      setTransaction(updatedTransaction);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
      
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
      const updatedTransaction: Transaction = {
        ...transaction,
        status: 'COMPLETED' as any,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTransaction(updatedTransaction);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
      
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
      const updatedTransaction: Transaction = {
        ...transaction,
        status: 'DISPUTED' as any,
        updatedAt: new Date().toISOString(),
        disputeData: disputeData
      } as any;
      
      setTransaction(updatedTransaction);
      
      // Update localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
      
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

  const shareTransaction = () => {
    if (transaction) {
      const shareUrl = `${window.location.origin}/join-transaction/${transaction.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Transaction link copied to clipboard!');
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Transaction Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The transaction you're looking for could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/transactions')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-foreground">Transaction Details</h1>
            </div>
          </div>

          {/* WebSocket Connection Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Manual refresh triggered');
                refreshTransactionData(transaction?.id);
              }}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Transaction Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Status Flow */}
            {(() => {
              console.log('TransactionDetailsNew: Rendering TransactionStatusFlow with onAction:', !!handleAction);
              return (
                <TransactionStatusFlow 
                  transaction={transaction}
                  userRole={getUserRole()}
                  onAction={handleAction}
                />
              );
            })()}

            {/* Detailed Transaction Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Transaction Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Description:</span>
                        <span className="text-sm text-right max-w-[200px]">{transaction.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Amount:</span>
                        <span className="text-sm font-medium">{formatCurrency(transaction.total, transaction.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Shipping:</span>
                        <span className="text-sm">{transaction.useCourier ? 'Courier Service' : 'Local Pickup'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Your Role:</span>
                        <Badge variant="outline" className="text-xs">
                          {getUserRole()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Item/Service Details */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">
                      {getUserRole() === 'SELLER' ? 'Item Details' : 'Service Details'}
                    </h3>
                    <div className="space-y-3">
                      {(transaction as any).itemType && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Type:</span>
                          <span className="text-sm">{(transaction as any).itemType}</span>
                        </div>
                      )}
                      {(transaction as any).itemCategory && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Category:</span>
                          <span className="text-sm">{(transaction as any).itemCategory}</span>
                        </div>
                      )}
                      {(transaction as any).itemCondition && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Condition:</span>
                          <Badge variant="outline" className="text-xs">
                            {(transaction as any).itemCondition}
                          </Badge>
                        </div>
                      )}
                      {(transaction as any).itemQuantity && (transaction as any).itemQuantity > 1 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Quantity:</span>
                          <span className="text-sm">{(transaction as any).itemQuantity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {((transaction as any).itemBrand || (transaction as any).itemModel || (transaction as any).itemSize || (transaction as any).itemColor) && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-foreground mb-4">Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(transaction as any).itemBrand && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Brand:</span>
                          <span className="text-sm">{(transaction as any).itemBrand}</span>
                        </div>
                      )}
                      {(transaction as any).itemModel && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Model:</span>
                          <span className="text-sm">{(transaction as any).itemModel}</span>
                        </div>
                      )}
                      {(transaction as any).itemSize && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Size:</span>
                          <span className="text-sm">{(transaction as any).itemSize}</span>
                        </div>
                      )}
                      {(transaction as any).itemColor && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Color:</span>
                          <span className="text-sm">{(transaction as any).itemColor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Details */}
                {transaction.deliveryDetails && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-foreground mb-4">Delivery Details</h3>
                    <div className="space-y-4">
                      {(() => {
                        try {
                          const details = typeof transaction.deliveryDetails === 'string' 
                            ? JSON.parse(transaction.deliveryDetails) 
                            : transaction.deliveryDetails;
                          
                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Full Name:</span>
                                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                    {details.fullName || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Phone Number:</span>
                                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                    {details.phoneNumber || 'Not provided'}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Address:</span>
                                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                  {details.address || 'Not provided'}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">City:</span>
                                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                    {details.city || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">State/Province:</span>
                                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                    {details.state || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Postal Code:</span>
                                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                    {details.postalCode || 'Not provided'}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Country:</span>
                                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                  {details.country || 'Not provided'}
                                </p>
                              </div>
                              
                              {details.specialInstructions && (
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Special Instructions:</span>
                                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                                    {details.specialInstructions}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        } catch (error) {
                          console.error('Error parsing delivery details:', error);
                          return (
                            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                              Delivery details are available but could not be parsed.
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Special Instructions & Policies */}
                {((transaction as any).specialInstructions || (transaction as any).returnPolicy) && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-foreground mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      {(transaction as any).specialInstructions && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Special Instructions:</span>
                          <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                            {(transaction as any).specialInstructions}
                          </p>
                        </div>
                      )}
                      {(transaction as any).returnPolicy && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Return Policy:</span>
                          <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                            {(transaction as any).returnPolicy}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setShowChatModal(true)}
                  className="w-full"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with Counterparty
                </Button>
                
                <Button
                  onClick={() => navigate('/app/messages', { state: { transactionId: transaction.id } })}
                  className="w-full"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Go to Messages
                </Button>
                
                {/* Quick Chat Preview */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Recent Messages</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChatModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Click "Chat with Counterparty" to start messaging
                  </div>
                </div>
                
                <Button
                  onClick={shareTransaction}
                  className="w-full"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Transaction
                </Button>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2 text-primary">
                  <Shield className="h-5 w-5" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Escrow protected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Funds secured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">24/7 monitoring</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Information - Only show for buyers when shipment data exists */}
            {getUserRole() === 'BUYER' && (transaction as any)?.shipmentData && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2 text-blue-700">
                    <Package className="h-5 w-5" />
                    <span>Shipment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  {/* Shipment Photos */}
                  {(transaction as any).shipmentData.photos && (transaction as any).shipmentData.photos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-blue-700">Verification Photos</span>
                      <div className="grid grid-cols-2 gap-2">
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
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Need Help?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  If you have any questions about this transaction, our support team is here to help.
                </p>
                <Button variant="outline" className="w-full text-sm">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delivery Details Form Modal */}
      <Dialog open={showDeliveryForm} onOpenChange={setShowDeliveryForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provide Delivery Details</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please provide your delivery address and preferences
            </p>
          </DialogHeader>
          <DeliveryDetailsForm 
            onSubmit={handleDeliveryDetails}
            onCancel={() => setShowDeliveryForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Form Modal */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please confirm your payment details
            </p>
          </DialogHeader>
          <PaymentConfirmation 
            transactionId={transaction.id}
            amount={transaction.total}
            currency={transaction.currency}
            onConfirm={handlePaymentConfirmation}
            onCancel={() => setShowPaymentForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat with Counterparty</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Communicate securely with your transaction partner
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Transaction #{transaction.id.slice(-8)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {transaction.creatorId === user?.id ? 'SELLER' : 'BUYER'}
                </Badge>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <MessageThread 
              transactionId={transaction.id}
              counterpartyId={transaction.creatorId === user?.id ? transaction.counterpartyId || '' : transaction.creatorId}
              counterpartyName={transaction.counterpartyName || (transaction.creatorId === user?.id ? 'Waiting for counterparty...' : 'Transaction Creator')}
              counterpartyRole={transaction.creatorId === user?.id ? 'SELLER' : 'BUYER'}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Verification Modal */}
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

      {/* Receipt Confirmation Modal */}
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

      {/* Dispute Form Modal */}
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
