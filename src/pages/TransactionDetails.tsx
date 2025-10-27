import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Truck,
  Shield,
  Info,
  MessageCircle,
  X,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { transactionsAPI } from '@/services/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ResponsiveMessageContainer from '@/components/ResponsiveMessageContainer';
import TransactionStatusFlow from '@/components/TransactionStatusFlow';
import DeliveryDetailsForm from '@/components/DeliveryDetailsForm';
import PaymentConfirmation from '@/components/PaymentConfirmation';
import TransactionActivityLog from '@/components/TransactionActivityLog';
import ShipmentVerification from '@/components/ShipmentVerification';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import { PaymentConditions } from '@/components/PaymentConditions';
import TransactionTimeline from '@/components/TransactionTimeline';
import { EscrowTransaction, DeliveryDetailsRequest, PaymentConfirmationRequest } from '@/types';
import sharedTransactionStore from '@/utils/sharedTransactionStore';

// Extend the EscrowTransaction type to include additional fields
type Transaction = EscrowTransaction & {
  creatorName?: string;
  counterpartyName?: string;
  counterpartyId?: string;
  deliveryDetails?: DeliveryDetailsRequest | string;
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'RELEASED' | 'PAYMENT_MADE';
  paymentDate?: string;
  shipmentData?: {
    trackingNumber: string;
    courierService: string;
    estimatedDelivery: string;
    itemCondition: string;
    packagingDetails?: string;
    additionalNotes?: string;
    photos?: string[];
  };
};

export default function TransactionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isConnected, connectionStatus, emitTransactionUpdate, joinTransactionRoom, leaveTransactionRoom, reconnect } = useWebSocket();
  
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
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [invitationCode, setInvitationCode] = useState<string>('');

  // Get invitation code from location state
  useEffect(() => {
    if (location.state?.invitationCode) {
      setInvitationCode(location.state.invitationCode);
    }
  }, [location.state]);

  // Load transaction function - accessible throughout the component
  const loadTransaction = useCallback(async () => {
    if (!id) return;
    
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Always fetch fresh data from the backend API first
      let foundTransaction = null;
      try {
        console.log('TransactionDetails: Fetching fresh data from backend API for transaction:', id);
        console.log('TransactionDetails: Auth token available:', !!localStorage.getItem('authToken'));
        const apiResponse = await transactionsAPI.getTransaction(id) as any;
        console.log('TransactionDetails: Found in backend API:', !!apiResponse);
        console.log('TransactionDetails: Backend API response:', apiResponse);
        
        // Extract transaction from API response (backend returns {success: true, transaction: {...}})
        let realDataTransaction = null;
        if (apiResponse && apiResponse.success && apiResponse.transaction) {
          realDataTransaction = apiResponse.transaction;
        } else if (apiResponse && apiResponse.transaction) {
          realDataTransaction = apiResponse.transaction;
        } else if (apiResponse && apiResponse.id) {
          realDataTransaction = apiResponse;
        }
        
        console.log('TransactionDetails: Extracted transaction data:', realDataTransaction);
        console.log('TransactionDetails: Transaction ID check:', {
          hasId: !!realDataTransaction?.id,
          id: realDataTransaction?.id,
          expectedId: id
        });
        
        if (realDataTransaction && realDataTransaction.id) {
          foundTransaction = realDataTransaction;
          
          // Update shared store with fresh data
          try {
            sharedTransactionStore.addTransaction(realDataTransaction);
            console.log('TransactionDetails: Updated shared store with fresh data');
          } catch (error) {
            console.error('TransactionDetails: Failed to update shared store:', error);
          }
        } else {
          console.log('TransactionDetails: Invalid transaction data from API:', realDataTransaction);
        }
      } catch (error) {
        console.error('TransactionDetails: Failed to fetch from backend API:', error);
        console.error('TransactionDetails: Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Fallback to shared store if API fails
        foundTransaction = sharedTransactionStore.getTransaction(id);
        console.log('TransactionDetails: Fallback to shared store:', !!foundTransaction);
      }
      
      console.log('TransactionDetails: Access check:', {
        foundTransaction: !!foundTransaction,
        creatorId: foundTransaction?.creatorId,
        counterpartyId: foundTransaction?.counterpartyId,
        userId: user.id,
        hasAccess: foundTransaction && (foundTransaction.creatorId === user.id || foundTransaction.counterpartyId === user.id)
      });
      
      if (foundTransaction && (foundTransaction.creatorId === user.id || foundTransaction.counterpartyId === user.id)) {
        // Convert to the expected Transaction type
        const transactionWithDefaults = {
          ...foundTransaction,
          paymentCompleted: foundTransaction.paymentStatus === 'COMPLETED',
          paidAt: foundTransaction.paymentDate
        } as Transaction;
        setTransaction(transactionWithDefaults);
        setActivities(generateActivityLog(transactionWithDefaults));
        
        // Note: WebSocket room joining is handled separately to avoid infinite loops
        
        console.log('TransactionDetails: Transaction loaded successfully');
      } else {
        console.log('Transaction not found or access denied:', id);
        // Transaction not found or doesn't belong to user
        setTransaction(null);
        setActivities([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load transaction:', error);
      setIsLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (id) {
      loadTransaction();

      // Debounced refresh function to prevent excessive calls
      let refreshTimeout: NodeJS.Timeout;
      const debouncedRefresh = () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          console.log('TransactionDetails: Debounced refresh triggered');
        loadTransaction();
        }, 300); // 300ms debounce
      };

      // Listen for changes in the shared store (debounced)
      const handleStoreChange = () => {
        console.log('TransactionDetails: Shared store changed, debounced refresh');
        debouncedRefresh();
      };
      
      sharedTransactionStore.addListener(handleStoreChange);
      
      // Listen for WebSocket transaction updates (only for this transaction)
      const handleTransactionUpdate = (event: CustomEvent) => {
        console.log('TransactionDetails: Received transaction update event:', event.detail);
        if (event.detail.transactionId === id) {
          console.log('TransactionDetails: Refreshing transaction data due to WebSocket update');
          debouncedRefresh();
        }
      };
      
      window.addEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
      
      return () => {
        clearTimeout(refreshTimeout);
        sharedTransactionStore.removeListener(handleStoreChange);
        window.removeEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
        // WebSocket room leaving is handled in separate useEffect
      };
    }
  }, [id, loadTransaction]);

  // Separate useEffect to handle WebSocket room joining
  useEffect(() => {
    if (id && isConnected) {
      joinTransactionRoom(id);
      console.log('TransactionDetails: Joined transaction room for real-time updates');
      
      return () => {
        leaveTransactionRoom(id);
        console.log('TransactionDetails: Left transaction room on unmount');
      };
    }
  }, [id, isConnected, joinTransactionRoom, leaveTransactionRoom]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'ACTIVE':
        return <TrendingUp className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'NGN': '₦',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || '₦';
  };

  const getDeliveryDetails = (deliveryDetails: DeliveryDetailsRequest | string | undefined): DeliveryDetailsRequest | null => {
    if (!deliveryDetails) return null;
    if (typeof deliveryDetails === 'string') {
      try {
        return JSON.parse(deliveryDetails);
      } catch {
        return null;
      }
    }
    return deliveryDetails;
  };

  const getShippingDetails = (shippingDetails: any | string | undefined): any | null => {
    if (!shippingDetails) return null;
    if (typeof shippingDetails === 'string') {
      try {
        return JSON.parse(shippingDetails);
      } catch {
        return null;
      }
    }
    return shippingDetails;
  };

  const generateActivityLog = (transaction: Transaction) => {
    const activities: any[] = [];
    
    // Transaction created
    activities.push({
      id: `activity_${transaction.id}_created`,
      action: 'transaction_created',
      description: 'Transaction created',
      timestamp: transaction.createdAt,
      userId: transaction.creatorId,
      userName: transaction.creatorName || 'Transaction Creator',
      userRole: 'SELLER',
      status: 'completed'
    });

    // Counterparty joined - Fix labeling to show correct role
    if (transaction.counterpartyId && transaction.counterpartyName) {
      const joinedRole = transaction.counterpartyRole;
      activities.push({
        id: `activity_${transaction.id}_joined`,
        action: 'transaction_joined',
        description: `Transaction joined by ${joinedRole?.toLowerCase()}`,
        timestamp: transaction.updatedAt || transaction.createdAt,
        userId: transaction.counterpartyId,
        userName: transaction.counterpartyName,
        userRole: joinedRole,
        status: 'completed'
      });
    }

    // Delivery details provided by buyer
    if (getDeliveryDetails(transaction.deliveryDetails)) {
      const deliveryDetails = getDeliveryDetails(transaction.deliveryDetails);
      activities.push({
        id: `activity_${transaction.id}_delivery`,
        action: 'delivery_details_provided',
        description: 'Shipping information added by buyer',
        timestamp: transaction.updatedAt || transaction.createdAt,
        userId: transaction.creatorRole === 'BUYER' ? transaction.creatorId : transaction.counterpartyId,
        userName: transaction.creatorRole === 'BUYER' ? transaction.creatorName : transaction.counterpartyName,
        userRole: 'BUYER',
        status: 'completed',
        metadata: {
          recipientName: deliveryDetails?.fullName,
          address: deliveryDetails?.address,
          phone: deliveryDetails?.phoneNumber
        }
      });
    }

    // Payment made by buyer
    if (transaction.paymentStatus === 'COMPLETED') {
      activities.push({
        id: `activity_${transaction.id}_payment`,
        action: 'payment_made',
        description: 'Payment made by buyer',
        timestamp: transaction.paymentDate || transaction.updatedAt || transaction.createdAt,
        userId: transaction.creatorRole === 'BUYER' ? transaction.creatorId : transaction.counterpartyId,
        userName: transaction.creatorRole === 'BUYER' ? transaction.creatorName : transaction.counterpartyName,
        userRole: 'BUYER',
        status: 'completed',
        metadata: {
          amount: transaction.total,
          currency: transaction.currency,
          paymentMethod: transaction.paymentMethod,
          paymentReference: transaction.paymentReference,
          status: 'Funds in escrow'
        }
      });
    }

    // Payment status updated (funds released)
    if (transaction.paymentStatus === 'RELEASED') {
      activities.push({
        id: `activity_${transaction.id}_funds_released`,
        action: 'funds_released',
        description: 'Funds released to seller',
        timestamp: transaction.paymentDate || transaction.updatedAt || transaction.createdAt,
        userId: transaction.creatorRole === 'SELLER' ? transaction.creatorId : transaction.counterpartyId,
        userName: transaction.creatorRole === 'SELLER' ? transaction.creatorName : transaction.counterpartyName,
        userRole: 'SELLER',
        status: 'completed',
        metadata: {
          amount: transaction.total,
          currency: transaction.currency,
          status: 'Funds released'
        }
      });
    }

    // Shipment details uploaded by seller
    if (transaction.shipmentData) {
      activities.push({
        id: `activity_${transaction.id}_shipment`,
        action: 'shipment_confirmed',
        description: 'Shipment details uploaded by seller',
        timestamp: transaction.shippedAt || transaction.updatedAt || transaction.createdAt,
        userId: transaction.creatorRole === 'SELLER' ? transaction.creatorId : transaction.counterpartyId,
        userName: transaction.creatorRole === 'SELLER' ? transaction.creatorName : transaction.counterpartyName,
        userRole: 'SELLER',
        status: 'completed',
        metadata: {
          trackingNumber: transaction.shipmentData.trackingNumber,
          courierService: transaction.shipmentData.courierService,
          estimatedDelivery: transaction.shipmentData.estimatedDelivery,
          itemCondition: transaction.shipmentData.itemCondition,
          packagingDetails: transaction.shipmentData.packagingDetails,
          photosCount: transaction.shipmentData.photos?.length || 0
        }
      });
    }

    // Item delivered confirmation by buyer
    if (transaction.status === 'COMPLETED' && transaction.paymentStatus === 'RELEASED') {
      activities.push({
        id: `activity_${transaction.id}_delivered`,
        action: 'item_delivered',
        description: 'Item delivered and confirmed by buyer',
        timestamp: transaction.updatedAt || transaction.createdAt,
        userId: transaction.creatorRole === 'BUYER' ? transaction.creatorId : transaction.counterpartyId,
        userName: transaction.creatorRole === 'BUYER' ? transaction.creatorName : transaction.counterpartyName,
        userRole: 'BUYER',
        status: 'completed',
        metadata: {
          confirmationDate: transaction.updatedAt,
          status: 'Transaction completed'
        }
      });
    }

    // Transaction completed
    if (transaction.status === 'COMPLETED') {
      activities.push({
        id: `activity_${transaction.id}_completed`,
        action: 'transaction_completed',
        description: 'Transaction completed successfully',
        timestamp: transaction.updatedAt || transaction.createdAt,
        userId: transaction.creatorId,
        userName: 'System',
        userRole: 'SYSTEM',
        status: 'completed',
        metadata: {
          finalStatus: 'COMPLETED',
          completionDate: transaction.updatedAt
        }
      });
    }

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getTransactionLink = () => {
    return `${window.location.origin}/app/join-transaction/${invitationCode}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
      } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareTransaction = async () => {
    const link = getTransactionLink();
      if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my transaction: ${transaction?.description}`,
          text: `Join my transaction: ${transaction?.description}`,
          url: link,
        });
      } catch (err) {
        console.error('Error sharing: ', err);
        copyToClipboard(link);
      }
      } else {
      copyToClipboard(link);
    }
  };

  const getUserRole = (): 'BUYER' | 'SELLER' => {
    if (!transaction || !user) return 'BUYER';
    if (transaction.creatorId === user.id) {
      return transaction.creatorRole as 'BUYER' | 'SELLER';
    }
    return transaction.counterpartyRole as 'BUYER' | 'SELLER';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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
        setShowShipmentForm(true);
        break;
      case 'confirm_receipt_of_goods':
      case 'confirm_receipt':
        setShowReceiptConfirmation(true);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleDeliveryDetails = async (details: DeliveryDetailsRequest) => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Call the API to update delivery details
      const response = await transactionsAPI.updateDeliveryDetails(transaction.id, details);
      
      // Handle different response formats
      let updatedTransactionData = null;
      if (response && response.transaction) {
        updatedTransactionData = response.transaction;
      } else if (response && (response as any).success && (response as any).transaction) {
        updatedTransactionData = (response as any).transaction;
      } else if (response && (response as any).id) {
        updatedTransactionData = response as any;
      }
      
      if (updatedTransactionData) {
        // Update transaction with the response from API
        setTransaction(updatedTransactionData);
        
        // Update shared transaction store with API response
        sharedTransactionStore.addTransaction(updatedTransactionData);
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'WAITING_FOR_PAYMENT', updatedTransactionData);
        
        // Dispatch custom event with complete transaction data
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: 'WAITING_FOR_PAYMENT',
            transaction: updatedTransactionData,
            deliveryDetails: JSON.stringify(details)
          }
        }));
      
      // Add notification to counterparty (seller)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'SHIPPING',
            title: 'Shipping Details Received',
            message: `${user?.firstName} ${user?.lastName} has provided shipping details. You can now proceed to ship the item.`,
            isRead: false,
            priority: 'HIGH',
            metadata: {
              transactionStatus: 'WAITING_FOR_SHIPMENT',
              counterpartyName: `${user?.firstName} ${user?.lastName}`,
              actionRequired: true,
              nextAction: 'proceed_to_ship_goods'
            }
          });
        }
      }
      
      setShowDeliveryForm(false);
      toast.success('Delivery details saved successfully!');
      } else {
        throw new Error('Invalid response from delivery details API');
      }
    } catch (error) {
      console.error('TransactionDetails: Delivery details update failed:', error);
      toast.error('Failed to save delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirmation = async (payment: PaymentConfirmationRequest) => {
    if (!transaction) return;
    
    setIsLoading(true);
    // Close the modal immediately to prevent reopening
    setShowPaymentForm(false);
    
    try {
      console.log('TransactionDetails: Confirming payment via API...');
      
      // Call the real API to confirm payment
      const response = await transactionsAPI.confirmPayment(transaction.id, {
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.paymentReference
      });
      
      console.log('TransactionDetails: Payment confirmation response:', response);
      
      // Handle different response formats
      let updatedTransactionData = null;
      if (response && response.transaction) {
        updatedTransactionData = response.transaction;
      } else if (response && (response as any).success && (response as any).transaction) {
        updatedTransactionData = (response as any).transaction;
      } else if (response && (response as any).id) {
        updatedTransactionData = response as any;
      }
      
      if (updatedTransactionData) {
        // Update transaction with the response from API
        setTransaction(updatedTransactionData);
        
        // Update shared transaction store with API response
        sharedTransactionStore.addTransaction(updatedTransactionData);
        
        // Determine next status based on whether transaction requires shipping
        const nextStatus = transaction.useCourier ? 'WAITING_FOR_SHIPMENT' : 'PAYMENT_MADE';
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, nextStatus, updatedTransactionData);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: nextStatus,
            transaction: updatedTransactionData
          }
        }));
        
        toast.success('Payment confirmed successfully!');
      } else {
        throw new Error('Invalid response from payment confirmation API');
      }
    } catch (error) {
      console.error('TransactionDetails: Payment confirmation failed:', error);
      toast.error('Failed to confirm payment');
      // Reopen modal on error
      setShowPaymentForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipmentConfirmation = async (shipmentData: any) => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Call the API to update shipping details
      const response = await transactionsAPI.updateShippingDetails(transaction.id, shipmentData);
      
      // Handle different response formats
      let updatedTransactionData = null;
      if (response && response.transaction) {
        updatedTransactionData = response.transaction;
      } else if (response && (response as any).success && (response as any).transaction) {
        updatedTransactionData = (response as any).transaction;
      } else if (response && (response as any).id) {
        updatedTransactionData = response as any;
      }
      
      if (updatedTransactionData) {
        // Update transaction with the response from API
        setTransaction(updatedTransactionData);
        
        // Update shared transaction store with API response
        sharedTransactionStore.addTransaction(updatedTransactionData);
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'WAITING_FOR_BUYER_CONFIRMATION', updatedTransactionData);
        
        // Dispatch custom event with complete transaction data
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: 'WAITING_FOR_BUYER_CONFIRMATION',
            transaction: updatedTransactionData,
            shipmentData: shipmentData
          }
        }));
      
      // Add notification to counterparty (buyer)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'SHIPPING',
            title: 'Item Shipped - Track Your Package',
            message: `${user?.firstName} ${user?.lastName} has shipped your item. You can now track the package and confirm receipt when it arrives.`,
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
      
      toast.success('Shipment confirmed successfully!');
      } else {
        throw new Error('Invalid response from shipping details API');
      }
    } catch (error) {
      console.error('TransactionDetails: Shipment confirmation failed:', error);
      toast.error('Failed to confirm shipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiptConfirmation = async () => {
    if (!transaction) return;
    
    setIsLoading(true);
    setShowReceiptConfirmation(false); // Close the modal
    
    try {
      console.log('TransactionDetails: Confirming receipt via API...');
      
      // Call the real API to confirm receipt
      const response = await (transactionsAPI as any).confirmReceipt(transaction.id);
      
      console.log('TransactionDetails: Receipt confirmation response:', response);
      
      if (response && response.transaction) {
        // Update transaction with the response from API
        const updatedTransactionData = response.transaction;
        setTransaction(updatedTransactionData);
      
      // Update shared transaction store
        sharedTransactionStore.updateTransaction(transaction.id, updatedTransactionData);
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'COMPLETED', updatedTransactionData);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { transactionId: transaction.id, status: 'COMPLETED' }
        }));
      
      // Add notification to counterparty (seller)
      if (addNotification) {
        const counterpartyId = transaction.creatorId === user?.id ? transaction.counterpartyId : transaction.creatorId;
        if (counterpartyId) {
          addNotification({
            userId: counterpartyId,
            transactionId: transaction.id,
            type: 'TRANSACTION_UPDATE',
            title: 'Transaction Completed - Funds Released',
            message: `${user?.firstName} ${user?.lastName} has confirmed receipt of the item. Your funds have been released from escrow and are now available in your wallet.`,
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
      
      toast.success('Transaction completed successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('TransactionDetails: Receipt confirmation failed:', error);
      toast.error('Failed to confirm receipt');
    } finally {
      setIsLoading(false);
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
    <>
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
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Transaction Details</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('TransactionDetails: Manual refresh triggered');
                loadTransaction();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Copy Invitation Link - Only show if invitation code exists and transaction is pending */}
            {invitationCode && transaction?.status === 'PENDING' && (
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
                  onClick={() => copyToClipboard(getTransactionLink())}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            )}

          {/* WebSocket Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {connectionStatus === 'connected' ? 'Real-time updates connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection error' : 'Real-time updates disconnected'}
            </span>
            {!isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Manual reconnect triggered');
                  reconnect();
                }}
                className="text-xs h-6 px-2"
              >
                Reconnect
              </Button>
            )}
            </div>
            
            {/* Last Updated Timestamp */}
            {transaction && (
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(transaction.updatedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="w-full">
          {(() => {
            const userRole = getUserRole();
            const isSeller = (transaction.creatorRole === 'SELLER' && user?.id === transaction.creatorId) ||
                             (transaction.creatorRole === 'BUYER' && user?.id === transaction.counterpartyId);
            const isBuyer = (transaction.creatorRole === 'BUYER' && user?.id === transaction.creatorId) ||
                            (transaction.creatorRole === 'SELLER' && user?.id === transaction.counterpartyId);
            
            // Debug logging
            console.log('TransactionDetails: Tab visibility debug:', {
              userRole,
              isSeller,
              isBuyer,
              useCourier: transaction.useCourier,
              creatorRole: transaction.creatorRole,
              userId: user?.id,
              creatorId: transaction.creatorId,
              counterpartyId: transaction.counterpartyId
            });
            
            // Determine which tabs to show
            // Show shipping tab for sellers if courier is used OR if delivery details exist
            const showShippingTab = isSeller && (transaction.useCourier || transaction.deliveryDetails);
            const showConfirmationTab = isBuyer;
            
            return (
              <TabsList className="grid w-full" style={{
                gridTemplateColumns: `repeat(${3 + (showShippingTab ? 1 : 0) + (showConfirmationTab ? 1 : 0)}, 1fr)`
              }}>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {showShippingTab && <TabsTrigger value="shipping">Shipping</TabsTrigger>}
                {showConfirmationTab && <TabsTrigger value="confirmation">Confirmation</TabsTrigger>}
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
            );
          })()}

          {/* Overview Tab - Simplified */}
          <TabsContent value="overview" className="space-y-6">
            {/* Transaction Status Flow */}
            <TransactionStatusFlow 
              transaction={transaction}
              userRole={getUserRole()}
              onAction={handleAction}
            />
            
            {/* Combined Transaction Overview & Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                    <span>Transaction Summary</span>
                  </div>
                  <Badge className={`border ${getStatusColor(transaction.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(transaction.status)}
                      <span className="text-xs">{transaction.status}</span>
                    </div>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Transaction ID:</span>
                    <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm break-all">{transaction.id}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transaction.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Your Role:</span>
                    <Badge variant={transaction.creatorId === user?.id ? 'default' : 'secondary'} className="mt-1">
                      {transaction.creatorId === user?.id ? transaction.creatorRole : transaction.counterpartyRole || 'Joining...'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <p className="text-sm mt-1">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1 font-medium">{transaction.description}</p>
                </div>

                <Separator />

                {/* Financial Summary */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Financial Summary</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Item Price:</span>
                      <p className="font-medium">{formatCurrency(transaction.price, transaction.currency)}</p>
                  </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Transaction Fee (2.5%):</span>
                      <p className="font-medium">{formatCurrency(transaction.fee, transaction.currency)}</p>
                  </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                      <p className="font-bold text-lg text-primary">{formatCurrency(transaction.total, transaction.currency)}</p>
                    </div>
                  </div>
                </div>

                  <Separator />

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Creator:</span>
                    <p className="text-sm mt-1 font-medium">
                      {transaction.creatorId === user?.id ? 'You' : (transaction.creatorName || 'Transaction Creator')}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Counterparty:</span>
                    <p className="text-sm mt-1 font-medium">
                      {transaction.counterpartyId === user?.id ? 'You' : (transaction.counterpartyName || 'Waiting for counterparty...')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Transaction Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Transaction Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-primary-foreground font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Transaction Created</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                    <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      ['ACTIVE', 'COMPLETED'].includes(transaction.status) ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <span className="text-xs text-white font-bold">2</span>
                      </div>
                      <div>
                      <p className="font-medium text-sm">Counterparty Joined</p>
                      <p className="text-xs text-muted-foreground">
                        {['ACTIVE', 'COMPLETED'].includes(transaction.status) 
                          ? 'Transaction is now active' 
                          : 'Waiting for counterparty to join'}
                        </p>
                      </div>
                    </div>
                  
                  {transaction.useCourier && (
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        transaction.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <span className="text-xs text-white font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Shipping Details</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.status === 'COMPLETED' 
                            ? 'Shipping details completed' 
                            : 'Shipping details pending'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                    <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      transaction.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <span className="text-xs text-white font-bold">4</span>
                      </div>
                      <div>
                      <p className="font-medium text-sm">Payment & Completion</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.status === 'COMPLETED' 
                          ? 'Transaction completed successfully' 
                          : 'Payment and completion pending'}
                        </p>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>


          {/* Shipping Tab - Buyer-provided shipping details only (Seller's view) */}
          {(() => {
            const isSeller = (transaction.creatorRole === 'SELLER' && user?.id === transaction.creatorId) ||
                             (transaction.creatorRole === 'BUYER' && user?.id === transaction.counterpartyId);
            
            console.log('TransactionDetails: Shipping tab debug:', {
              isSeller,
              useCourier: transaction.useCourier,
              deliveryDetails: transaction.deliveryDetails,
              shouldShowTab: isSeller && (transaction.useCourier || transaction.deliveryDetails)
            });
            
            return isSeller && (transaction.useCourier || transaction.deliveryDetails) ? (
              <TabsContent value="shipping" className="space-y-6">
            {(() => {
              const deliveryDetails = getDeliveryDetails(transaction.deliveryDetails);
              console.log('TransactionDetails: Parsed delivery details:', deliveryDetails);
              
              if (!deliveryDetails) {
                return (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">Shipping Details Not Provided</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        Shipping details have not been provided yet. Waiting for the counterparty to provide their delivery information.
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Truck className="h-5 w-5" />
                      <span>Shipping Information</span>
                      <Badge variant="secondary" className="ml-auto">Provided by Buyer</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
          <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Recipient Name:</span>
                          <p className="font-medium">{deliveryDetails.fullName}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Phone Number:</span>
                          <p className="font-medium">{deliveryDetails.phoneNumber}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-muted-foreground">Delivery Address:</span>
                        <p className="font-medium mt-1">{deliveryDetails.address}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">City:</span>
                          <p className="font-medium">{deliveryDetails.city}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">State:</span>
                          <p className="font-medium">{deliveryDetails.state}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">ZIP Code:</span>
                          <p className="font-medium">{deliveryDetails.zipCode}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-muted-foreground">Country:</span>
                        <p className="font-medium">{deliveryDetails.country}</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <Info className="h-4 w-4 inline mr-1" />
                          These shipping details were provided by the buyer. Use this information to ship the item to the correct address.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
              </TabsContent>
            ) : null;
          })()}

          {/* Confirmation Tab - Seller shipment verification (Buyer's view) */}
          {(() => {
            const isBuyer = (transaction.creatorRole === 'BUYER' && user?.id === transaction.creatorId) ||
                            (transaction.creatorRole === 'SELLER' && user?.id === transaction.counterpartyId);
            
            console.log('TransactionDetails: Confirmation tab debug:', {
              isBuyer,
              shipmentData: transaction.shipmentData,
              shippingDetails: transaction.shippingDetails,
              shouldShowTab: isBuyer
            });
            
            return isBuyer ? (
              <TabsContent value="confirmation" className="space-y-6">
                {(() => {
                  const shippingDetails = getShippingDetails(transaction.shippingDetails);
                  console.log('TransactionDetails: Parsed shipping details:', shippingDetails);
                  
                  if (!transaction.shipmentData && !shippingDetails) {
                    return (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Package className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">Shipment Confirmation Not Provided</h3>
                          <p className="text-sm text-muted-foreground text-center max-w-md">
                            Shipment confirmation details have not been provided yet. Waiting for the counterparty to confirm shipment with tracking details and photos.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Use either shipmentData (frontend) or shippingDetails (backend)
                  const shipmentInfo = transaction.shipmentData || shippingDetails;
                  
                  return (
            <Card>
              <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="h-5 w-5" />
                          <span>Shipment Confirmation</span>
                          <Badge variant="secondary" className="ml-auto">Confirmed by Seller</Badge>
                        </CardTitle>
              </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Tracking Number:</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="font-medium font-mono">{shipmentInfo.trackingNumber}</p>
                <Button 
                                  size="sm"
                  variant="outline" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(shipmentInfo.trackingNumber);
                                    toast.success('Tracking number copied!');
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                </Button>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Courier Service:</span>
                              <p className="font-medium">{shipmentInfo.courierService}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Estimated Delivery:</span>
                              <p className="font-medium">{new Date(shipmentInfo.estimatedDelivery).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Item Condition:</span>
                              <Badge variant="outline" className="mt-1">{shipmentInfo.itemCondition}</Badge>
                            </div>
                          </div>
                          
                          {shipmentInfo.packagingDetails && (
                            <>
                              <Separator />
                              <div>
                                <span className="text-sm text-muted-foreground">Packaging Details:</span>
                                <p className="font-medium mt-1">{shipmentInfo.packagingDetails}</p>
                              </div>
                            </>
                          )}
                          
                          {shipmentInfo.additionalNotes && (
                            <>
                              <Separator />
                              <div>
                                <span className="text-sm text-muted-foreground">Additional Notes:</span>
                                <p className="font-medium mt-1">{shipmentInfo.additionalNotes}</p>
                              </div>
                            </>
                          )}
                          
                          {/* Shipment Photos */}
                          {shipmentInfo.photos && shipmentInfo.photos.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <span className="text-sm text-muted-foreground mb-3 block">Item Photos:</span>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {shipmentInfo.photos.map((photoUrl: string, index: number) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={photoUrl}
                                        alt={`Shipment photo ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Button 
                                          size="sm"
                                          variant="secondary"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                          onClick={() => window.open(photoUrl, '_blank')}
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          View
                  </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Photos uploaded by seller during shipment confirmation
                                </p>
                              </div>
                            </>
                          )}
                          
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800">
                              <Package className="h-4 w-4 inline mr-1" />
                              The seller has confirmed shipment with tracking details and photos. Your item is on its way!
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </TabsContent>
            ) : null;
          })()}

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <PaymentConditions
              transactionId={transaction.id}
              transactionStatus={transaction.status}
              canManageConditions={true}
            />
          </TabsContent>


          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <TransactionActivityLog 
              transactionId={transaction.id}
              activities={activities}
              currentUserId={user?.id || ''}
            />
          </TabsContent>
        </Tabs>

          {/* Sidebar */}
        <div className="mt-6 space-y-6">
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
                
                  <Button 
                    onClick={shareTransaction}
                    className="w-full"
                  variant="outline"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Transaction
                  </Button>

                  {transaction && transaction.status !== 'COMPLETED' && transaction.status !== 'CANCELLED' && (
                  <Button 
                      onClick={() => navigate(`/app/disputes/create?transactionId=${transaction.id}`)}
                    className="w-full"
                      variant="outline"
                  >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Raise Dispute
                  </Button>
                )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please confirm your payment details
            </p>
          </DialogHeader>
          <PaymentConfirmation 
            transactionId={transaction?.id || ''}
            amount={transaction?.total || 0}
            currency={transaction?.currency || 'NGN'}
            onConfirm={handlePaymentConfirmation}
            onCancel={() => setShowPaymentForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Shipment Verification Modal */}
      <Dialog open={showShipmentForm} onOpenChange={setShowShipmentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Shipment</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please provide shipment details and upload photos of the item
            </p>
          </DialogHeader>
          <ShipmentVerification 
            onConfirm={(shipmentData) => {
              handleShipmentConfirmation(shipmentData);
              setShowShipmentForm(false);
            }}
            onCancel={() => setShowShipmentForm(false)}
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
            onConfirm={handleReceiptConfirmation}
            onCancel={() => setShowReceiptConfirmation(false)}
            onRaiseDispute={() => {
              setShowReceiptConfirmation(false);
              // TODO: Add dispute form modal
              toast.info('Dispute form coming soon');
            }}
            isLoading={isLoading}
            shipmentData={transaction?.shipmentData as any}
            transactionAmount={transaction?.total}
            currency={transaction?.currency}
          />
        </DialogContent>
      </Dialog>

      {/* Responsive Chat Container */}
      <ResponsiveMessageContainer
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        transactionId={transaction.id}
        counterpartyId={transaction.creatorId === user?.id ? transaction.counterpartyId || '' : transaction.creatorId}
        counterpartyName={transaction.counterpartyName || (transaction.creatorId === user?.id ? 'Counterparty' : transaction.creatorName || 'Transaction Creator')}
        counterpartyRole={transaction.creatorId === user?.id ? 'SELLER' : 'BUYER'}
        title="Chat with Counterparty"
      />
    </>
  );
}
