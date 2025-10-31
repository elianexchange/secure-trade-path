import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingCart, Package, Shield, Users, Calendar, MessageCircle, Search, FileText, Star, CheckCircle, AlertTriangle, Gavel } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import sharedTransactionStore from '@/utils/sharedTransactionStore';
import { transactionsAPI } from '@/services/api';
import { disputeService } from '@/services/disputeService';
import { OnboardingGuide } from '@/components/OnboardingGuide';
import { MobileTransactionCard } from '@/components/MobileTransactionCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSEO } from '@/hooks/useSEO';
import { Breadcrumbs } from '@/components/SEOLinks';
import { DashboardSkeleton } from '@/components/SkeletonLoader';

export default function Dashboard() {
  // SEO optimization
  useSEO();
  
  const navigate = useNavigate();
  const { user, showOnboarding, setShowOnboarding } = useAuth();
  const { isConnected } = useWebSocket();
  const isMobile = useIsMobile();
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    activeTransactions: 0,
    completedTransactions: 0,
    totalValue: 0,
    disputedTransactions: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug logging
  console.log('Dashboard: Component rendering', { user, isLoading, showOnboarding });
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
        
        // Load transactions from API with error handling
        let transactions = [];
        try {
          transactions = await transactionsAPI.getMyTransactions();
          console.log('Dashboard: Received transactions from API:', transactions?.length || 0);
        } catch (apiError) {
          console.warn('Dashboard: API failed, using shared store fallback:', apiError);
          // Fallback to shared store if API fails
          transactions = sharedTransactionStore.getTransactionsForUser(user.id);
          console.log('Dashboard: Using shared store transactions:', transactions.length);
        }
        
        // Ensure transactions is an array
        const transactionsArray = Array.isArray(transactions) ? transactions : [];
        setUserTransactions(transactionsArray);
        
        // Load dispute data from API
        let disputeStats = { openDisputes: 0, resolvedDisputes: 0 };
        try {
          console.log('Dashboard: Loading disputes from API...');
          const disputeResponse = await disputeService.getUserDisputes();
          if (disputeResponse.success) {
            const disputes = disputeResponse.data;
            disputeStats = {
              openDisputes: disputes.filter((d: any) => d.status === 'OPEN' || d.status === 'IN_REVIEW').length,
              resolvedDisputes: disputes.filter((d: any) => d.status === 'RESOLVED' || d.status === 'CLOSED').length
            };
            console.log('Dashboard: Loaded dispute stats:', disputeStats);
          }
        } catch (disputeError) {
          console.warn('Dashboard: Failed to load disputes:', disputeError);
        }
        
        // Calculate stats efficiently
        const stats = transactionsArray.reduce((acc, tx: any) => {
          acc.totalTransactions++;
          if (['PENDING', 'ACTIVE', 'PAYMENT', 'SHIPPING'].includes(tx.status)) {
            acc.activeTransactions++;
          } else if (tx.status === 'COMPLETED') {
            acc.completedTransactions++;
          } else if (tx.status === 'DISPUTED') {
            acc.disputedTransactions++;
          }
          acc.totalValue += tx.total || 0;
          return acc;
        }, {
          totalTransactions: 0,
          activeTransactions: 0,
          completedTransactions: 0,
          totalValue: 0,
          disputedTransactions: 0,
          openDisputes: disputeStats.openDisputes,
          resolvedDisputes: disputeStats.resolvedDisputes,
        });

        setStats(stats);
        console.log('Dashboard: Stats updated:', stats);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set empty data on error
        setUserTransactions([]);
        setStats({
          totalTransactions: 0,
          activeTransactions: 0,
          completedTransactions: 0,
          totalValue: 0,
          disputedTransactions: 0,
          openDisputes: 0,
          resolvedDisputes: 0,
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
        }, 1000); // 1 second debounce to reduce API calls
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
            totalValue,
            disputedTransactions: transactionsArray.filter((tx: any) => tx.status === 'DISPUTED').length,
            openDisputes: 0, // Will be loaded from disputes API
            resolvedDisputes: 0, // Will be loaded from disputes API
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
      case 'UNKNOWN':
        return 'Unknown';
      default:
        return status || 'Unknown';
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // If no user, redirect to login
  if (!user) {
    console.log('Dashboard: No user, redirecting to login');
    navigate('/login');
    return null;
  }

  return (
    <div className="space-y-4 pb-20" id="dashboard-main" role="region" aria-label="Dashboard">
      {/* Breadcrumbs for SEO */}
      <nav aria-label="Breadcrumb">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' }
        ]} />
      </nav>
      
      {/* Header - Enhanced with better visual hierarchy */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/30 border border-blue-100 rounded-xl p-4 sm:p-8 elevation-1 transition-all duration-300 hover:elevation-2">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg elevation-2">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  Welcome back, <span className="text-blue-600">{user?.firstName}</span>!
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1.5">
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-sm transition-colors w-full sm:w-auto focus-visible-ring interactive-scale"
            aria-label="Create new transaction"
          >
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </Button>
            

          </div>
        </div>
      </div>

      {/* Stats Grid - Enhanced with better cards */}
      <div 
        className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 tablet-stats-grid"
        role="region"
        aria-label="Transaction statistics"
      >
        {/* Total Transactions - Enhanced */}
        <div 
          className="bg-white border border-gray-200 rounded-xl p-4 elevation-1 hover:elevation-2 transition-all duration-300 hover:-translate-y-0.5 group card-hover focus-visible-ring"
          role="article"
          aria-label={`Total transactions: ${stats.totalTransactions}`}
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
              Total
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalTransactions}</div>
            <p className="text-xs text-gray-600 leading-tight">
              All time transactions
            </p>
          </div>
        </div>

        {/* Total Value - Enhanced */}
        <div 
          className="bg-white border border-gray-200 rounded-xl p-4 elevation-1 hover:elevation-2 transition-all duration-300 hover:-translate-y-0.5 group card-hover focus-visible-ring"
          role="article"
          aria-label={`Total transaction value: ${formatCurrency(stats.totalValue)}`}
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md">
              Value
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-gray-600 leading-tight">
              All transactions value
            </p>
          </div>
        </div>

        {/* Active Transactions - Enhanced */}
        <div 
          className="bg-white border border-gray-200 rounded-xl p-4 elevation-1 hover:elevation-2 transition-all duration-300 hover:-translate-y-0.5 group card-hover focus-visible-ring"
          role="article"
          aria-label={`Active transactions: ${stats.activeTransactions}`}
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
              Active
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.activeTransactions}</div>
            <p className="text-xs text-gray-600 leading-tight">
              In progress
            </p>
          </div>
        </div>

        {/* Completed Transactions - Enhanced */}
        <div 
          className="bg-white border border-gray-200 rounded-xl p-4 elevation-1 hover:elevation-2 transition-all duration-300 hover:-translate-y-0.5 group card-hover focus-visible-ring"
          role="article"
          aria-label={`Completed transactions: ${stats.completedTransactions}`}
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
              Completed
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.completedTransactions}</div>
            <p className="text-xs text-gray-600 leading-tight">
              Successfully completed
            </p>
          </div>
        </div>

        {/* Disputed Transactions - Enhanced */}
        <div 
          className="bg-white border border-gray-200 rounded-xl p-4 elevation-1 hover:elevation-2 transition-all duration-300 hover:-translate-y-0.5 group card-hover focus-visible-ring"
          role="article"
          aria-label={`Disputed transactions: ${stats.disputedTransactions}`}
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-md">
              Disputed
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.disputedTransactions}</div>
            <p className="text-xs text-gray-600 leading-tight">
              Under dispute
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions - Enhanced */}
      <Card className="border border-gray-200 rounded-xl elevation-1 overflow-hidden" role="region" aria-label="Recent transactions">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900" id="recent-transactions-title">
                Recent Transactions
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                Your latest trading activities
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg px-4 py-2 transition-all duration-200 hover:shadow-md focus-visible-ring interactive-scale"
              onClick={() => navigate('/app/transactions')}
              aria-label="View all transactions"
            >
              View All
            </Button>
            </div>
            
            {/* Filters and Search - Enhanced */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 input-focus"
                  aria-label="Search transactions"
                />
              </div>
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white input-focus"
                aria-label="Filter transactions by status"
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
        <CardContent className="p-4 sm:p-6">
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
                {isMobile ? (
                  // Mobile-optimized cards
                  filteredTransactions.map((tx: any) => (
                    <MobileTransactionCard
                      key={tx.id}
                      transaction={tx}
                      onViewDetails={(id) => navigate(`/app/transactions/${id}`)}
                    />
                  ))
                ) : (
                  // Desktop layout - Enhanced
                  filteredTransactions.map((tx: any) => (
                    <div 
                      key={tx.id} 
                      className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border border-gray-200 rounded-lg hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer group card-hover focus-visible-ring"
                      onClick={() => navigate(`/app/transactions/${tx.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/app/transactions/${tx.id}`);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View transaction ${tx.id?.slice(-8)} - ${getStatusDisplayName(tx.status || 'UNKNOWN')}`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-shrink-0 p-2.5 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                          <Package className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                            Transaction #{tx.id ? tx.id.slice(-8) : 'N/A'}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-0.5">
                            <span className="font-medium text-gray-900">{formatCurrency(tx.total || 0)}</span>
                            <span className="text-gray-400">•</span>
                            <span>{tx.creatorId === user?.id ? 'Created' : 'Joined'}</span>
                            {tx.counterpartyName && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="truncate text-gray-600">with {tx.counterpartyName}</span>
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
                      <div className="flex items-center space-x-4">
                        <Badge className={`${getStatusColor(tx.status || 'UNKNOWN')} px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm`}>
                          {getStatusDisplayName(tx.status || 'UNKNOWN')}
                        </Badge>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-700 block">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                          {tx.updatedAt && tx.updatedAt !== tx.createdAt && (
                            <span className="text-xs text-gray-500">
                              Updated {tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Package className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">Start trading to see your transactions here. Create your first secure transaction to get started!</p>
                <Button 
                  onClick={() => navigate('/app/create-transaction')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus-visible-ring interactive-scale"
                  aria-label="Create your first transaction"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
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
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3">
            {/* Row 1 */}
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/transactions')}
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-xs sm:text-sm text-center">View Transactions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/create-transaction')}
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-xs sm:text-sm text-center">Create New</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/disputes')}
            >
              <Gavel className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-xs sm:text-sm text-center">Disputes</span>
            </Button>
            
            {/* Row 2 */}
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/join-transaction')}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-xs sm:text-sm text-center">Join Transaction</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/profile')}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-xs sm:text-sm text-center">Security Settings</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
              onClick={() => navigate('/app/notifications')}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-xs sm:text-sm text-center">Notifications</span>
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