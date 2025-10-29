import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  FileText, 
  Eye,
  ArrowLeft,
  Package,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import sharedTransactionStore from '@/utils/sharedTransactionStore';
import { transactionsAPI } from '@/services/api';

interface Transaction {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorRole: 'BUYER' | 'SELLER';
  counterpartyId?: string;
  counterpartyName?: string;
  counterpartyRole?: 'BUYER' | 'SELLER';
  description: string;
  price: number;
  fee: number;
  total: number;
  currency: string;
  status: 'PENDING' | 'ACTIVE' | 'WAITING_FOR_DELIVERY_DETAILS' | 'DELIVERY_DETAILS_IMPORTED' | 'WAITING_FOR_PAYMENT' | 'PAYMENT_MADE' | 'WAITING_FOR_SHIPMENT' | 'SHIPMENT_CONFIRMED' | 'WAITING_FOR_BUYER_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';
  useCourier: boolean;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  completedAt?: string;
  deliveryDetails?: any;
  paymentStatus?: 'PENDING' | 'PAYMENT_MADE' | 'COMPLETED' | 'FAILED' | 'RELEASED';
  paymentDate?: string;
  paymentMethod?: 'WALLET' | 'BANK_TRANSFER' | 'CARD';
  paymentReference?: string;
  shipmentData?: {
    trackingNumber: string;
    courierService: string;
    estimatedDelivery: string;
    itemCondition: string;
    packagingDetails?: string;
    additionalNotes?: string;
    photos?: string[];
  };
  paymentCompleted?: boolean;
  paidAt?: string;
}

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load transactions from backend API first, then fallback to shared store
    const loadTransactions = async () => {
      try {
        if (!user?.id) {
          console.log('Transactions: No user ID, setting empty transactions');
          setTransactions([]);
          setIsLoading(false);
          return;
        }

        console.log('Transactions: Loading transactions for user:', user.id);
        
        // First, try to fetch from backend API
        try {
          console.log('Transactions: Fetching from backend API...');
          const transactions = await transactionsAPI.getMyTransactions();
          console.log('Transactions: Backend API response:', transactions);
          
          if (transactions && Array.isArray(transactions)) {
            console.log('Transactions: Found transactions from API:', transactions.length);
            
            // Update shared store with fresh data from API
            transactions.forEach((tx: any) => {
              try {
                sharedTransactionStore.addTransaction(tx);
              } catch (error) {
                console.error('Transactions: Failed to add transaction to shared store:', error);
              }
            });
            
            setTransactions(transactions as Transaction[]);
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          console.error('Transactions: Failed to fetch from backend API:', apiError);
          console.log('Transactions: Falling back to shared store...');
        }
        
        // Fallback to shared store if API fails
        const userTransactions = sharedTransactionStore.getTransactionsForUser(user.id);
        console.log('Transactions: Found transactions from shared store:', userTransactions.length);
        console.log('Transactions: Transaction details:', userTransactions);
        
        setTransactions(userTransactions as Transaction[]);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setIsLoading(false);
      }
    };

    loadTransactions();
    
    // Debounced refresh function to prevent excessive calls
    let refreshTimeout: NodeJS.Timeout;
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        console.log('Transactions: Debounced refresh triggered');
        loadTransactions();
      }, 500); // 500ms debounce
    };
    
    // Listen for changes in the shared store (debounced)
    const handleStoreChange = () => {
      console.log('Transactions: Shared store changed, debounced refresh');
      debouncedRefresh();
    };
    
    // Listen for WebSocket transaction updates (debounced)
    const handleTransactionUpdate = (event: CustomEvent) => {
      console.log('Transactions: Received transaction update event:', event.detail);
      debouncedRefresh();
    };
    
    sharedTransactionStore.addListener(handleStoreChange);
    window.addEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
    
    return () => {
      clearTimeout(refreshTimeout);
      sharedTransactionStore.removeListener(handleStoreChange);
      window.removeEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
    };
  }, [user?.id]);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, statusFilter, roleFilter, transactions]);

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.counterpartyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(tx => {
        const userRole = tx.creatorId === user?.id ? tx.creatorRole : tx.counterpartyRole;
        return userRole === roleFilter;
      });
    }

    setFilteredTransactions(filtered);
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

  const getStatusDisplay = (transaction: Transaction) => {
    if (transaction.status === 'PENDING') {
      if (transaction.creatorRole === 'BUYER') {
        return 'Waiting for Seller to Join';
      } else {
        return 'Waiting for Buyer to Join';
      }
    }
    
    if (transaction.status === 'ACTIVE') {
      if (transaction.useCourier) {
        return 'Fill Shipping Details';
      } else {
        return 'Proceed to Payment';
      }
    }
    
    if (transaction.status === 'WAITING_FOR_SHIPMENT') {
      return 'Waiting for Shipment';
    }
    
    if (transaction.status === 'WAITING_FOR_PAYMENT') {
      return 'Waiting for Payment';
    }
    
    if (transaction.status === 'COMPLETED') {
      return 'Transaction Completed';
    }
    
    if (transaction.status === 'CANCELLED') {
      return 'Transaction Cancelled';
    }
    
    return transaction.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WAITING_FOR_SHIPMENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WAITING_FOR_PAYMENT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'ACTIVE':
        return <TrendingUp className="h-4 w-4" />;
      case 'WAITING_FOR_SHIPMENT':
        return <Package className="h-4 w-4" />;
      case 'WAITING_FOR_PAYMENT':
        return <AlertCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">My Transactions</h1>
        </div>
      </div>



      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="BUYER">Buyer</SelectItem>
            <SelectItem value="SELLER">Seller</SelectItem>
          </SelectContent>
        </Select>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={async () => {
                  console.log('Transactions: Manual refresh triggered');
                  setIsLoading(true);
                  try {
                    const apiResponse = await transactionsAPI.getMyTransactions();
                    if (apiResponse && (apiResponse as any).transactions) {
                      const transactions = (apiResponse as any).transactions;
                      transactions.forEach((tx: any) => {
                        try {
                          sharedTransactionStore.addTransaction(tx);
                        } catch (error) {
                          console.error('Transactions: Failed to add transaction to shared store:', error);
                        }
                      });
                      setTransactions(transactions as Transaction[]);
                    }
                  } catch (error) {
                    console.error('Transactions: Failed to refresh from API:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => navigate('/app/create-transaction')} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Connection Status */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}
        </span>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first transaction.'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && roleFilter === 'ALL' && (
                <Button onClick={() => navigate('/app/create-transaction')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Transaction
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Transaction Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={transaction.creatorId === user?.id ? 'default' : 'secondary'} className="text-xs">
                        {transaction.creatorId === user?.id ? transaction.creatorRole : transaction.counterpartyRole || 'Joining...'}
                      </Badge>
                      <Badge className={`text-xs border ${getStatusColor(transaction.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(transaction.status)}
                          <span>{getStatusDisplay(transaction)}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <h3 className="font-medium text-foreground text-sm">
                      {transaction.description}
                    </h3>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.id.substring(0, 12)}...
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {getCurrencySymbol(transaction.currency)}{Math.floor(transaction.total).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getCurrencySymbol(transaction.currency)}{Math.floor(transaction.price).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/transactions/${transaction.id}`)}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
