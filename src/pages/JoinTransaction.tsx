import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  FileText,
  Users,
  Clock,
  Info,
  X,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { transactionsAPI } from '@/services/api';
import { toast } from 'sonner';
import sharedTransactionStore from '@/utils/sharedTransactionStore';

interface TransactionDetails {
  id: string;
  description: string;
  currency: string;
  price: number;
  fee: number;
  total: number;
  useCourier: boolean;
  creatorRole: 'BUYER' | 'SELLER';
  status: string;
  createdAt: string;
  creator?: {
    firstName: string;
    lastName: string;
  };
}

export default function JoinTransaction() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitTransactionUpdate, joinTransactionRoom } = useWebSocket();
  
  // Safely get notifications with fallback
  let addNotification: ((notification: any) => void) | null = null;
  try {
    const { addNotification: addNotif } = useNotifications();
    addNotification = addNotif;
  } catch (error) {
    console.warn('NotificationProvider not available in JoinTransaction');
  }
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Load transaction data from API using invitation code
  useEffect(() => {
    if (transactionId) {
      console.log('Loading transaction with invitation code:', transactionId);
      setIsLoading(true);
      
      const loadTransaction = async () => {
        try {
          console.log('Attempting to load transaction with ID:', transactionId);
          
          // Try to get from shared store first for faster loading
          const cachedTransaction = sharedTransactionStore.getTransaction(transactionId);
          if (cachedTransaction) {
            console.log('Transaction found in cache, using cached data');
            setTransaction(cachedTransaction);
            setIsLoading(false);
            return;
          }
          
          // If not in cache, fetch from API
          const response = await transactionsAPI.getTransactionByInvite(transactionId);
          console.log('Transaction loaded from API:', response.invitation);
          
          const transactionData = response.invitation.transaction;
          setTransaction(transactionData);
          
          // Cache the transaction for future use
          sharedTransactionStore.addTransaction(transactionData);
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading transaction:', error);
          setIsLoading(false);
          console.log('Showing error toast...');
          toast.error('Failed to load transaction. The invitation may be invalid or expired.');
          console.log('Error toast should have been shown');
        }
      };

      loadTransaction();
    }
  }, [transactionId]);

  const handleJoinTransaction = async () => {
    if (!transactionId || !user) return;
    
    setIsJoining(true);
    try {
      const response = await transactionsAPI.joinTransaction(transactionId);
      console.log('Successfully joined transaction:', response);
      
      // Store the transaction in the shared store for immediate access
      const updatedTransaction = response.transaction;
      console.log('JoinTransaction: API response transaction:', updatedTransaction);
      
      if (updatedTransaction && updatedTransaction.id) {
        console.log('JoinTransaction: Storing transaction in shared store:', updatedTransaction.id);
        try {
          sharedTransactionStore.addTransaction(updatedTransaction);
          console.log('JoinTransaction: Transaction stored successfully in shared store');
          
          // Verify the transaction was stored
          const storedTransaction = sharedTransactionStore.getTransaction(updatedTransaction.id);
          if (storedTransaction) {
            console.log('JoinTransaction: Transaction verified in store:', storedTransaction.id);
          } else {
            console.error('JoinTransaction: Transaction not found in store after storage attempt');
          }
        } catch (error) {
          console.error('JoinTransaction: Failed to store transaction in shared store:', error);
          console.error('JoinTransaction: Transaction data:', updatedTransaction);
        }
      } else {
        console.error('JoinTransaction: Invalid transaction data from API:', updatedTransaction);
      }
      
      // Join the transaction room for real-time updates
      if (updatedTransaction && updatedTransaction.id) {
        joinTransactionRoom(updatedTransaction.id);
        console.log('JoinTransaction: Joined transaction room for real-time updates');
      }
      
      // Force refresh all components by dispatching a global event
      window.dispatchEvent(new CustomEvent('forceRefreshTransactions'));
      
      // WebSocket will handle real-time updates, no need for fallback
      
      // Emit WebSocket event for real-time update with complete transaction data
      console.log('JoinTransaction: Emitting WebSocket update for transaction:', response.transaction.id);
      emitTransactionUpdate(response.transaction.id, 'ACTIVE', response.transaction);
      
      // Dispatch custom event to notify other components with status update
      window.dispatchEvent(new CustomEvent('transactionUpdated', { 
        detail: { 
          transactionId: response.transaction.id, 
          status: 'ACTIVE',
          counterpartyName: `${user?.firstName} ${user?.lastName}`
        }
      }));
      
      // Add notification for transaction activation - notify the creator, not the joiner
      if (addNotification && response.transaction.creatorId) {
        addNotification({
          userId: response.transaction.creatorId, // Notify the creator (not the joiner)
          transactionId: response.transaction.id,
          type: 'TRANSACTION_UPDATE',
          title: 'Transaction Activated',
          message: `${user?.firstName} ${user?.lastName} has joined your transaction. You can now proceed to the next step.`,
          isRead: false,
          priority: 'HIGH',
          metadata: {
            transactionStatus: 'ACTIVE',
            counterpartyName: `${user?.firstName} ${user?.lastName}`,
            actionRequired: true,
            nextAction: response.transaction.useCourier ? 'proceed_to_fill_shipping_details' : 'proceed_with_payment'
          }
        });
      }
      
      // The shared store automatically handles updates for all users
      
      console.log('Showing success toast...');
      toast.success('Successfully joined the transaction!');
      console.log('Success toast should have been shown');
      
      // Navigate to transaction details page
      navigate(`/app/transactions/${response.transaction.id}`, { 
        state: { transaction: response.transaction } 
      });
    } catch (error) {
      console.error('Error joining transaction:', error);
      toast.error('Failed to join transaction. Please try again.');
    } finally {
      setIsJoining(false);
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
            This transaction link may be invalid or expired. Please check with the person who shared it with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
            <Button 
              variant="ghost" 
            size="sm"
              onClick={() => navigate('/app/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
            </Button>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Join Transaction</h1>
          </div>
          </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Transaction Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Overview */}
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Transaction Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1 font-medium">{transaction.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-sm text-muted-foreground">Currency:</span>
                    <p className="text-sm mt-1">{transaction.currency}</p>
                </div>
                <div>
                    <span className="text-sm text-muted-foreground">Courier Service:</span>
                    <Badge variant={transaction.useCourier ? 'default' : 'outline'} className="mt-1">
                      {transaction.useCourier ? 'Yes' : 'No'}
                    </Badge>
                </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Created by:</span>
                  <p className="text-sm mt-1">
                   {transaction.creator ? (
                      `${transaction.creator.firstName} ${transaction.creator.lastName}`
                   ) : (
                     'Unknown User'
                   )}
                 </p>
               </div>

              <div>
                  <span className="text-sm text-muted-foreground">Your Role:</span>
                <Badge variant="secondary" className="mt-1">
                  {transaction.creatorRole === 'BUYER' ? 'SELLER' : 'BUYER'}
                </Badge>
              </div>
            </CardContent>
          </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Item Price:</span>
                    <span className="font-medium">
                      {getCurrencySymbol(transaction.currency)}{Math.floor(transaction.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction Fee (2.5%):</span>
                    <span className="font-medium">
                      {getCurrencySymbol(transaction.currency)}{Math.floor(transaction.fee).toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">
                      {getCurrencySymbol(transaction.currency)}{Math.floor(transaction.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
          {/* Security Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-primary">
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

          {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
            <Button
              onClick={handleJoinTransaction}
              disabled={isJoining}
                  className="w-full"
              size="lg"
            >
              {isJoining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                  Join Transaction
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/app/dashboard')}
                  className="w-full"
            >
                  <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Need Help?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  If you have any questions about this transaction, our support team is here to help.
                </p>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
