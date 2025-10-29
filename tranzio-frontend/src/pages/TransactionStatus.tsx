import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  FileText, 
  Lock, 
  Package, 
  CheckCircle,
  Users,
  Edit,
  Info,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  role: 'BUYER' | 'SELLER';
  useCourier: boolean;
  description: string;
  currency: string;
  price: number;
  fee: number;
  total: number;
  status: 'PENDING' | 'ACTIVE' | 'SHIPPING' | 'PAYMENT' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  creatorId?: string;
  creatorRole: 'BUYER' | 'SELLER';
  counterpartyId?: string;
  counterpartyRole: 'BUYER' | 'SELLER';
  counterpartyName?: string;
  shippingDetails?: any;
  paymentCompleted: boolean;
}

interface InvitationCode {
  code: string;
  expiresAt: string;
}

export default function TransactionStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<'Copy' | 'Copied!' | 'Copy Failed'>('Copy');

  useEffect(() => {
    console.log('TransactionStatus: location.state:', location.state);
    console.log('TransactionStatus: location.state?.transaction:', location.state?.transaction);
    console.log('TransactionStatus: location.state?.invitationCode:', location.state?.invitationCode);
    
    if (location.state?.transaction) {
      console.log('TransactionStatus: Setting transaction from state:', location.state.transaction);
      setTransaction(location.state.transaction);
      
      // Get invitation code from state
      if (location.state.invitationCode) {
        setInvitationCode(location.state.invitationCode);
        console.log('TransactionStatus: Setting invitation code:', location.state.invitationCode);
      }
      
      setIsLoading(false);
    } else {
      console.log('TransactionStatus: No transaction in state, trying localStorage fallback');
      // Try to load from localStorage if no state
      const transactionId = new URLSearchParams(window.location.search).get('id');
      if (transactionId) {
        const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
        const foundTransaction = storedTransactions.find((tx: Transaction) => tx.id === transactionId);
        if (foundTransaction) {
          console.log('TransactionStatus: Found transaction in localStorage:', foundTransaction);
          setTransaction(foundTransaction);
        }
      }
      setIsLoading(false);
    }
  }, [location.state]);

  const getCurrentStage = () => {
    if (!transaction) return 0;
    
    if (transaction.status === 'PENDING') return 1;
    if (transaction.status === 'ACTIVE') return 2;
    if (transaction.status === 'SHIPPING') return 3;
    if (transaction.status === 'PAYMENT') return 4;
    if (transaction.status === 'COMPLETED') return 5;
    
    return 1;
  };

  const getStatusMessage = () => {
    if (!transaction) return '';
    
    if (transaction.status === 'PENDING') {
      return transaction.creatorRole === 'BUYER' 
        ? 'Transaction has been created. Share the Link with the Seller for them to join.'
        : 'Transaction has been created. Share the Link with the Buyer for them to join.';
    }
    
    if (transaction.status === 'ACTIVE') {
      return 'Both parties have joined. Proceed to shipping details.';
    }
    
    if (transaction.status === 'SHIPPING') {
      return 'Shipping details completed. Proceed to payment.';
    }
    
    if (transaction.status === 'PAYMENT') {
      return 'Payment completed. Transaction is active.';
    }
    
    if (transaction.status === 'COMPLETED') {
      return 'Transaction completed successfully!';
    }
    
    return '';
  };

  const getInvitationLink = () => {
    if (!transaction) {
      console.log('No transaction available for invitation link');
      return '';
    }
    
    if (!invitationCode) {
      console.error('No invitation code available');
      return '';
    }
    
    // Generate clean invitation link using the invitation code
    const invitationLink = `${window.location.origin}/app/join-transaction/${invitationCode}`;
    
    console.log('Generated invitation link:', invitationLink);
    console.log('Using invitation code:', invitationCode);
    
    return invitationLink;
  };

  const copyInvitationLink = async () => {
    const link = getInvitationLink();
    console.log('Copying invitation link:', link);
    
    try {
      await navigator.clipboard.writeText(link);
      console.log('Link copied to clipboard successfully');
      setCopyFeedback('Copied!');
      toast.success('Invitation link copied to clipboard!');
      
      // Reset feedback after 2 seconds
      setTimeout(() => setCopyFeedback('Copy'), 2000);
      
      // Verify what was copied
      const clipboardText = await navigator.clipboard.readText();
      console.log('Clipboard content after copy:', clipboardText);
      
      if (clipboardText !== link) {
        console.warn('Clipboard content differs from generated link!');
        setCopyFeedback('Copy Failed');
        toast.error('Copy failed - link may be incomplete');
        setTimeout(() => setCopyFeedback('Copy'), 2000);
      }
    } catch (err) {
      console.error('Clipboard API failed, using fallback:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyFeedback('Copied!');
      toast.success('Invitation link copied to clipboard (fallback)!');
      setTimeout(() => setCopyFeedback('Copy'), 2000);
    }
  };

  const shareInvitationLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my transaction on Tranzio',
        text: `Join my secure transaction: ${transaction?.description}`,
        url: getInvitationLink()
      });
    } else {
      copyInvitationLink();
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
          <p className="text-muted-foreground">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Transaction Not Found</h1>
          <p className="text-muted-foreground mb-4">This transaction may have been deleted or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const currentStage = getCurrentStage();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/transactions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Transaction Status</h1>
        </div>

        {/* Transaction Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{transaction.creatorRole}</span>
              <span className="text-muted-foreground">•</span>
              <span>{transaction.description}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Currency:</span>
                <p className="font-medium">{transaction.currency}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Courier Service:</span>
                <Badge variant={transaction.useCourier ? 'default' : 'outline'}>
                  {transaction.useCourier ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge className="ml-2">{transaction.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <p className="font-medium">
                  {getCurrencySymbol(transaction.currency)}{transaction.total.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Role and Status */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Your Role</p>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {transaction.creatorId === user?.id ? transaction.creatorRole : transaction.counterpartyRole || 'Joining...'}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Transaction Status</p>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
              {transaction.counterpartyId && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Counterparty</p>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {transaction.counterpartyName || 'Unknown'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transaction Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Main Steps */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-3 ${currentStage >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStage >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {currentStage > 1 ? <CheckCircle className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  </div>
                  <span className="font-medium">Both Parties Joined</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${currentStage >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStage >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {currentStage > 2 ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <span className="font-medium">Funds in Tranzio Hold</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${currentStage >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStage >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {currentStage > 3 ? <CheckCircle className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  </div>
                  <span className="font-medium">Package Delivered</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${currentStage >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStage >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {currentStage > 4 ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <span className="font-medium">Funds Released</span>
                </div>
              </div>

              {/* Sub-steps for current stage */}
              {currentStage === 1 && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">1</span>
                    </div>
                    <span className="font-medium text-primary">Share Invitation Link</span>
                  </div>
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center ml-8 mt-2">
                    <span className="text-xs text-muted-foreground font-bold">2</span>
                  </div>
                  <span className="ml-8 text-muted-foreground">Counterparty Joins</span>
                </div>
              )}

              {currentStage === 2 && transaction.useCourier && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">1</span>
                    </div>
                    <span className="font-medium text-primary">Shipping Details</span>
                  </div>
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center ml-8 mt-2">
                    <span className="text-xs text-muted-foreground font-bold">2</span>
                  </div>
                  <span className="ml-8 text-muted-foreground">Payment</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Message and Actions */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-primary">
                {transaction.status === 'PENDING' ? 'Transaction has been created.' : 'Transaction is active.'}
              </h2>
              <p className="text-primary">
                {getStatusMessage()}
              </p>

              {transaction.status === 'PENDING' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Share this invitation link with the {transaction.creatorRole === 'BUYER' ? 'seller' : 'buyer'}:
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 max-w-md mx-auto">
                    <input
                      type="text"
                      value={getInvitationLink()}
                      readOnly
                      className="flex-1 p-2 border border-border rounded text-sm bg-muted font-mono"
                    />
                    <Button onClick={copyInvitationLink} variant="outline" size="sm">
                      {copyFeedback === 'Copied!' ? (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      ) : copyFeedback === 'Copy Failed' ? (
                        <AlertCircle className="h-4 w-4 mr-1 text-red-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copyFeedback}
                    </Button>
                  </div>
                  
                  {/* Debug info - remove in production */}
                  <div className="text-center">
                    <p className="text-xs text-blue-600">
                      Debug: Link generated at {new Date().toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-blue-600">
                      Transaction ID: {transaction.id}
                    </p>
                    <p className="text-xs text-blue-600">
                      Creator Role: {transaction.creatorRole}
                    </p>
                    <p className="text-xs text-blue-600">
                      Current URL: {window.location.href}
                    </p>
                    <p className="text-xs text-blue-600">
                      Generated Link: {getInvitationLink()}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-3">
                    <Button onClick={shareInvitationLink} className="bg-primary">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Link
                    </Button>
                    
                    {/* Debug button - remove in production */}
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const link = getInvitationLink();
                        console.log('Manual invitation link test:');
                        console.log('Generated link:', link);
                        console.log('Current transaction:', transaction);
                        alert(`Generated link: ${link}`);
                      }}
                      size="sm"
                    >
                      Debug: Test Link
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      When they click the link, they'll be able to review and join the transaction.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>💡 Test the invitation:</strong> Copy this link and open it in a new incognito/private window to see how it appears to someone else.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {transaction.status === 'ACTIVE' && transaction.useCourier && (
                <Button onClick={() => navigate(`/app/shipping-details/${transaction.id}`)}>
                  <Package className="h-4 w-4 mr-2" />
                  Fill Shipping Details
                </Button>
              )}

              {transaction.status === 'ACTIVE' && !transaction.useCourier && (
                <Button onClick={() => navigate(`/app/payment/${transaction.id}`)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </Button>
              )}

              {transaction.status === 'SHIPPING' && (
                <Button onClick={() => navigate(`/app/payment/${transaction.id}`)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction Breakdown</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item:</span>
                <span>{transaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Courier Service:</span>
                <span>{transaction.useCourier ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span>{transaction.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge>{transaction.status}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {getCurrencySymbol(transaction.currency)}{transaction.total.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8 space-x-4">
          <Button variant="outline" onClick={() => navigate('/app/transactions')}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Transaction
          </Button>
          
          {/* Debug button - remove in production */}
          <Button 
            variant="outline" 
            onClick={() => {
              const transactions = localStorage.getItem('tranzio_transactions');
              console.log('Current localStorage transactions:', transactions);
              alert(`LocalStorage transactions: ${transactions}`);
            }}
            className="text-xs"
          >
            Debug: Show localStorage
          </Button>
        </div>
      </div>
    </div>
  );
}
