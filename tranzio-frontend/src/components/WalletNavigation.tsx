import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WalletData {
  balance: number;
  currency: string;
  pendingEscrow: number;
  recentTransactions: Array<{
    id: string;
    type: 'credit' | 'debit' | 'escrow_hold' | 'escrow_release';
    amount: number;
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

const WalletNavigation: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadWalletData();
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call - in real app, this would fetch from backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock wallet data - in real app, this would come from API
      const mockWalletData: WalletData = {
        balance: 125000, // ₦125,000
        currency: 'NGN',
        pendingEscrow: 45000, // ₦45,000 in escrow
        recentTransactions: [
          {
            id: 'tx_1',
            type: 'credit',
            amount: 50000,
            description: 'Deposit from bank transfer',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed'
          },
          {
            id: 'tx_2',
            type: 'escrow_hold',
            amount: 45000,
            description: 'Payment held in escrow - Transaction #TXN-001',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          },
          {
            id: 'tx_3',
            type: 'debit',
            amount: 5000,
            description: 'Transaction fee',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed'
          }
        ]
      };
      
      setWalletData(mockWalletData);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      toast.error('Failed to load wallet information');
    } finally {
      setIsLoading(false);
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
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'escrow_release':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      case 'escrow_hold':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!walletData) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Wallet className="h-4 w-4 mr-2" />
          {showBalance ? formatCurrency(walletData.balance, walletData.currency) : '••••••'}
          {walletData.pendingEscrow > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {formatCurrency(walletData.pendingEscrow)} in escrow
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Wallet Balance</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="h-6 w-6 p-0"
            >
              {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <span className="font-semibold">
                {showBalance ? formatCurrency(walletData.balance, walletData.currency) : '••••••'}
              </span>
            </div>
            {walletData.pendingEscrow > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In Escrow</span>
                <span className="font-semibold text-yellow-600">
                  {showBalance ? formatCurrency(walletData.pendingEscrow, walletData.currency) : '••••••'}
                </span>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          <div className="space-y-1">
            <DropdownMenuItem onClick={() => navigate('/app/wallet')}>
              <Wallet className="h-4 w-4 mr-2" />
              View Full Wallet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/wallet?action=deposit')}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Deposit Funds
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/wallet?action=withdraw')}>
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Withdraw Funds
            </DropdownMenuItem>
          </div>

          {walletData.recentTransactions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="mt-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {walletData.recentTransactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex items-center space-x-2 text-xs">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{transaction.description}</p>
                        <p className="text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                        {showBalance ? formatCurrency(transaction.amount, walletData.currency) : '••••'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletNavigation;
