import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingCart, Package, Shield, Users, Calendar, MessageCircle, Search, FileText, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import sharedTransactionStore from '@/utils/sharedTransactionStore';
import { transactionsAPI } from '@/services/api';
import { OnboardingGuide } from '@/components/OnboardingGuide';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, showOnboarding, setShowOnboarding } = useAuth();
  const { isConnected } = useWebSocket();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    activeTransactions: 0,
    completedTransactions: 0,
    totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        if (!user) {
          console.log('Dashboard: No authenticated user, skipping data load');
          setIsLoading(false);
          return;
        }
        
        console.log('Dashboard: Loading data for user:', user.id);
        
        // Load transactions from real data service
        const transactions = await transactionsAPI.getMyTransactions();
        
        console.log('Dashboard: Received transactions:', transactions);
        
        // Ensure transactions is an array
        const transactionsArray = Array.isArray(transactions) ? transactions : [];
        setUserTransactions(transactionsArray);
        
        // Calculate stats
        const totalTransactions = transactionsArray.length;
        const activeTransactions = transactionsArray.filter((tx: any) => 
          ['PENDING', 'ACTIVE', 'PAYMENT', 'SHIPPING'].includes(tx.status)
        ).length;
        const completedTransactions = transactionsArray.filter((tx: any) => 
          tx.status === 'COMPLETED'
        ).length;
        const totalValue = transactionsArray.reduce((sum: number, tx: any) => sum + (tx.total || 0), 0);

        setStats({
          totalTransactions,
          activeTransactions,
          completedTransactions,
          totalValue,
        });
        
        console.log('Dashboard: Stats updated:', { totalTransactions, activeTransactions, completedTransactions, totalValue });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set empty data on error
        setUserTransactions([]);
        setStats({
          totalTransactions: 0,
          activeTransactions: 0,
          completedTransactions: 0,
          totalValue: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
      
      // Debounced refresh function to prevent excessive calls
      let refreshTimeout: NodeJS.Timeout;
      const debouncedRefresh = () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          console.log('Dashboard: Debounced refresh triggered');
          loadDashboardData();
        }, 500); // 500ms debounce
      };
      
      // Listen for WebSocket transaction updates (only for relevant transactions)
      const handleTransactionUpdate = (event: CustomEvent) => {
        const { transactionId, status } = event.detail;
        console.log('Dashboard: Received transaction update event:', { transactionId, status });
        
        // Only refresh if this affects user's transactions
        const userTx = userTransactions.find(tx => tx.id === transactionId);
        if (userTx) {
          debouncedRefresh();
        }
      };
      
      // Listen for shared store changes (debounced)
      const handleSharedStoreChange = () => {
        console.log('Dashboard: Shared store changed, debounced refresh');
        debouncedRefresh();
      };
      
      sharedTransactionStore.addListener(handleSharedStoreChange);
      window.addEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
      
      return () => {
        clearTimeout(refreshTimeout);
        sharedTransactionStore.removeListener(handleSharedStoreChange);
        window.removeEventListener('transactionUpdated', handleTransactionUpdate as EventListener);
      };
    }
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-runs

  // Fallback mechanism: refresh transactions periodically if WebSocket is not connected
  useEffect(() => {
    if (!isConnected) {
      console.log('Dashboard: WebSocket not connected, setting up fallback refresh mechanism');
      
      const fallbackInterval = setInterval(async () => {
        try {
          console.log('Dashboard: Fallback - refreshing transactions due to WebSocket disconnection');
          const transactions = await transactionsAPI.getMyTransactions();
          const transactionsArray = Array.isArray(transactions) ? transactions : [];
          setUserTransactions(transactionsArray);
          
          // Update stats
          const totalTransactions = transactionsArray.length;
          const activeTransactions = transactionsArray.filter((tx: any) => 
            ['PENDING', 'ACTIVE', 'PAYMENT', 'SHIPPING'].includes(tx.status)
          ).length;
          const completedTransactions = transactionsArray.filter((tx: any) => 
            tx.status === 'COMPLETED'
          ).length;
          const totalValue = transactionsArray.reduce((sum: number, tx: any) => sum + (tx.total || 0), 0);
          
          setStats({
            totalTransactions,
            activeTransactions,
            completedTransactions,
            totalValue
          });
        } catch (error) {
          console.error('Dashboard: Fallback refresh failed:', error);
        }
      }, 10000); // Refresh every 10 seconds when WebSocket is disconnected
      
      return () => {
        clearInterval(fallbackInterval);
      };
    }
  }, [isConnected]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'status-pending',
      'ACTIVE': 'status-active',
      'PAYMENT': 'status-payment',
      'SHIPPING': 'status-shipping',
      'WAITING_FOR_PAYMENT': 'status-payment',
      'WAITING_FOR_SHIPMENT': 'status-shipping',
      'WAITING_FOR_BUYER_CONFIRMATION': 'status-shipping',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled',
      'DISPUTED': 'status-disputed',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'ACTIVE':
        return 'Active';
      case 'WAITING_FOR_PAYMENT':
        return 'Awaiting Payment';
      case 'WAITING_FOR_SHIPMENT':
        return 'Awaiting Shipment';
      case 'WAITING_FOR_BUYER_CONFIRMATION':
        return 'In Transit';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'DISPUTED':
        return 'Disputed';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary">        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  localStorage.removeItem('authToken');
                  window.location.href = '/login';
                }}
                className="flex-1"
              >
                Log Out
              </Button>
            </div>
        </div>
        </DialogContent>
      </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20" id="dashboard-main">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-8 shadow-sm">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-600 shadow-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg sm:text-3xl font-bold text-gray-900">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Here's what's happening with your transactions today.
                </p>
              </div>
            </div>
            
            {/* WebSocket Connection Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
          <Button 
              id="create-transaction-btn"
            onClick={() => navigate('/app/create-transaction')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-colors w-full sm:w-auto"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </Button>
            

          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {/* Total Transactions */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1 rounded-md bg-blue-100">
              <Package className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              Total
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-bold text-gray-900">{stats.totalTransactions}</div>
            <p className="text-xs text-gray-600 leading-tight">
              All time transactions
            </p>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1 rounded-md bg-green-100">
              <Shield className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
              Value
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-gray-600 leading-tight">
              All transactions value
            </p>
          </div>
        </div>

        {/* Active Transactions */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1 rounded-md bg-amber-100">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              Active
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-bold text-gray-900">{stats.activeTransactions}</div>
            <p className="text-xs text-gray-600 leading-tight">
              In progress
            </p>
          </div>
        </div>

        {/* Completed Transactions */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1 rounded-md bg-gray-100">
              <CheckCircle className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <div className="text-xs font-medium text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
              Completed
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-bold text-gray-900">{stats.completedTransactions}</div>
            <p className="text-xs text-gray-600 leading-tight">
              Successfully completed
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Recent Transactions
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your latest trading activities
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md px-4 py-2"
              onClick={() => navigate('/app/transactions')}
            >
              View All
            </Button>
            </div>
            
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="WAITING_FOR_PAYMENT">Waiting for Payment</option>
                <option value="WAITING_FOR_SHIPMENT">Waiting for Shipment</option>
                <option value="WAITING_FOR_BUYER_CONFIRMATION">In Transit</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            // Use transactions from state - ensure it's an array
            let filteredTransactions = Array.isArray(userTransactions) ? userTransactions : [];
            
            // Apply filters
            if (transactionFilter !== 'all') {
              filteredTransactions = filteredTransactions.filter((tx: any) => tx.status === transactionFilter);
            }
            
            // Apply search
            if (searchQuery) {
              filteredTransactions = filteredTransactions.filter((tx: any) => 
                tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (tx.counterpartyName && tx.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase()))
              );
            }
            
            // Sort by date (newest first) and take first 5
            filteredTransactions = filteredTransactions
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
            
            return filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((tx: any) => (
                  <div 
                    key={tx.id} 
                    className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/transactions/${tx.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 p-2 rounded-md bg-gray-100">
                        <Package className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Transaction #{tx.id.slice(-8)}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{formatCurrency(tx.total || 0)}</span>
                          <span>•</span>
                          <span>{tx.creatorId === user?.id ? 'Created' : 'Joined'}</span>
                          {tx.counterpartyName && (
                            <>
                              <span>•</span>
                              <span className="truncate">with {tx.counterpartyName}</span>
                            </>
                          )}
                        </div>
                        {tx.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {tx.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getStatusColor(tx.status)} px-2 py-1 text-xs font-medium rounded`}>
                        {getStatusDisplayName(tx.status)}
                      </Badge>
                      <div className="text-right">
                        <span className="text-sm text-gray-500 block">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                        {tx.updatedAt && tx.updatedAt !== tx.createdAt && (
                          <span className="text-xs text-gray-400">
                            Updated {new Date(tx.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">No transactions yet</h3>
                <p className="text-gray-500 mb-4">Start trading to see your transactions here</p>
                <Button 
                  onClick={() => navigate('/app/create-transaction')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2"
                >
                  Create Your First Transaction
                </Button>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-600">
            Access your most important features
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 grid-cols-2">
            {/* Row 1 */}
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/transactions')}
            >
              <Package className="h-5 w-5" />
              <span className="font-medium text-sm">View Transactions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/create-transaction')}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium text-sm">Create New</span>
            </Button>
            
            {/* Row 2 */}
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/join-transaction')}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium text-sm">Join Transaction</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/profile')}
            >
              <Shield className="h-5 w-5" />
              <span className="font-medium text-sm">Security Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Security Notice */}
      <Card className="border border-gray-200 shadow-sm bg-gray-50">
        <CardContent className="p-6 pb-12">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-md bg-blue-100">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Trading</h3>
              <p className="text-gray-600 leading-relaxed">
                All transactions are protected by our advanced escrow system. Your funds are held securely until the transaction is completed, ensuring safe and trustworthy trading for all parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  localStorage.removeItem('authToken');
                  window.location.href = '/login';
                }}
                className="flex-1"
              >
                Log Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Onboarding Guide */}
      <OnboardingGuide
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          // Mark onboarding as completed in localStorage
          localStorage.setItem('onboardingCompleted', 'true');
        }}
      />
    </div>
  );
}