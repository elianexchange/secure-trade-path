import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff,
  Copy,
  Download,
  Filter,
  Search,
  CreditCard,
  Banknote,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface WalletData {
  balance: number;
  currency: string;
  pendingEscrow: number;
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'escrow_hold' | 'escrow_release' | 'fee';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  counterparty?: string;
  transactionId?: string;
}

const Wallet: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWalletData();
    loadTransactions();
    
    // Check if we should open deposit or withdraw modal
    const action = searchParams.get('action');
    if (action === 'deposit') {
      setShowDepositModal(true);
    } else if (action === 'withdraw') {
      setShowWithdrawModal(true);
    }
  }, [searchParams]);

  const loadWalletData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call - in real app, this would fetch from backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock wallet data
      const mockWalletData: WalletData = {
        balance: 125000,
        currency: 'NGN',
        pendingEscrow: 45000,
        totalDeposits: 200000,
        totalWithdrawals: 75000,
        transactionCount: 15
      };
      
      setWalletData(mockWalletData);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast.error('Failed to load wallet information');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      // Simulate API call - in real app, this would fetch from backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock transaction data
      const mockTransactions: Transaction[] = [
        {
          id: 'tx_1',
          type: 'credit',
          amount: 50000,
          description: 'Deposit from bank transfer',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          reference: 'TXN-2024-001'
        },
        {
          id: 'tx_2',
          type: 'escrow_hold',
          amount: 45000,
          description: 'Payment held in escrow',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          transactionId: 'TXN-ESC-001',
          counterparty: 'John Doe'
        },
        {
          id: 'tx_3',
          type: 'fee',
          amount: 5000,
          description: 'Transaction fee',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          transactionId: 'TXN-001'
        },
        {
          id: 'tx_4',
          type: 'debit',
          amount: 25000,
          description: 'Withdrawal to bank account',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          reference: 'WTH-2024-001'
        },
        {
          id: 'tx_5',
          type: 'escrow_release',
          amount: 30000,
          description: 'Escrow funds released',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          transactionId: 'TXN-ESC-002',
          counterparty: 'Jane Smith'
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transaction history');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'debit':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'escrow_hold':
        return <ArrowDownLeft className="h-4 w-4 text-yellow-600" />;
      case 'escrow_release':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'fee':
        return <CreditCard className="h-4 w-4 text-gray-600" />;
      default:
        return <WalletIcon className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'escrow_release':
        return 'text-green-600';
      case 'debit':
      case 'fee':
        return 'text-red-600';
      case 'escrow_hold':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Deposit of ${formatCurrency(parseFloat(depositAmount))} initiated successfully`);
      setShowDepositModal(false);
      setDepositAmount('');
      loadWalletData();
      loadTransactions();
    } catch (error) {
      toast.error('Failed to process deposit');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (walletData && parseFloat(withdrawAmount) > walletData.balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Withdrawal of ${formatCurrency(parseFloat(withdrawAmount))} initiated successfully`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      loadWalletData();
      loadTransactions();
    } catch (error) {
      toast.error('Failed to process withdrawal');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesSearch = searchQuery === '' || 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.counterparty?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wallet information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load wallet information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
              <p className="text-gray-600 mt-1">Manage your funds and view transaction history</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="flex items-center space-x-2"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden sm:inline">{showBalance ? 'Hide' : 'Show'} Balance</span>
              </Button>
            </div>
          </div>

          {/* Wallet Overview Cards */}
          <div className="grid grid-cols-2 gap-2">
            {/* Row 1 */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1 rounded-md bg-blue-100">
                  <WalletIcon className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Available
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-gray-900">
                  {showBalance ? formatCurrency(walletData.balance, walletData.currency) : '••••••'}
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  Ready for transactions
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1 rounded-md bg-amber-100">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  Escrow
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-gray-900">
                  {showBalance ? formatCurrency(walletData.pendingEscrow, walletData.currency) : '••••••'}
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  Secured in transactions
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1 rounded-md bg-green-100">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  Deposits
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-gray-900">
                  {showBalance ? formatCurrency(walletData.totalDeposits, walletData.currency) : '••••••'}
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  All time deposits
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1 rounded-md bg-red-100">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  Withdrawals
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg font-bold text-gray-900">
                  {showBalance ? formatCurrency(walletData.totalWithdrawals, walletData.currency) : '••••••'}
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  All time withdrawals
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row items-center gap-2">
            <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Deposit Funds</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deposit-amount">Amount</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <Banknote className="h-4 w-4 inline mr-1" />
                      Funds will be available in your wallet within 1-3 business days after bank processing.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowDepositModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDeposit}>
                      Initiate Deposit
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50">
                  <ArrowDownLeft className="h-4 w-4" />
                  <span>Withdraw Funds</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {showBalance ? formatCurrency(walletData.balance, walletData.currency) : '••••••'}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Withdrawals are processed within 1-2 business days.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleWithdraw}>
                      Initiate Withdrawal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Identity Verification Section */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Identity Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Verify Your Identity</h3>
                    <p className="text-sm text-gray-600">
                      Complete verification to unlock higher transaction limits and build trust
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge 
                      variant={user?.verificationLevel === 'PREMIUM' ? 'default' : 
                              user?.verificationLevel === 'ENHANCED' ? 'secondary' : 'outline'}
                      className="mb-1"
                    >
                      {user?.verificationLevel || 'BASIC'} Level
                    </Badge>
                    <p className="text-xs text-gray-500">
                      Trust Score: {user?.trustScore || 0}/100
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/app/verification">
                      {user?.verificationLevel === 'PREMIUM' ? 'View Status' : 'Verify Now'}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Transaction History</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="credit">Deposits</option>
                    <option value="debit">Withdrawals</option>
                    <option value="escrow_hold">Escrow Holds</option>
                    <option value="escrow_release">Escrow Releases</option>
                    <option value="fee">Fees</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-3 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <WalletIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No transactions found</p>
                    <p className="text-sm text-gray-400 mt-1">Your transaction history will appear here</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-sm text-gray-900">{transaction.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            {transaction.reference && (
                              <>
                                <span>•</span>
                                <span>{transaction.reference}</span>
                              </>
                            )}
                            {transaction.counterparty && (
                              <>
                                <span>•</span>
                                <span>with {transaction.counterparty}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {showBalance ? formatCurrency(transaction.amount, walletData.currency) : '••••'}
                        </span>
                        {getStatusIcon(transaction.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wallet;