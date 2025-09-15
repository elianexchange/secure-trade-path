import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  Info,
  AlertCircle,
  Clock,
  FileText,
  Truck,
  Package
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';

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

export default function Payment() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitTransactionUpdate } = useWebSocket();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const foundTransaction = storedTransactions.find((tx: Transaction) => tx.id === transactionId);
      if (foundTransaction) {
        setTransaction(foundTransaction);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [transactionId]);

  const handlePayment = async () => {
    if (!transaction) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
      
      // Update transaction status in localStorage
      const storedTransactions = JSON.parse(localStorage.getItem('tranzio_transactions') || '[]');
      const transactionIndex = storedTransactions.findIndex((tx: Transaction) => tx.id === transaction.id);
      
      if (transactionIndex !== -1) {
        storedTransactions[transactionIndex] = {
          ...storedTransactions[transactionIndex],
          status: 'PAYMENT',
          paymentCompleted: true,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('tranzio_transactions', JSON.stringify(storedTransactions));
        
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'PAYMENT');
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { transactionId: transaction.id, status: 'PAYMENT' } 
        }));
        
        toast.success('Payment successful! Transaction is now active.');
      }
    }, 3000);
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

  const currencySymbol = getCurrencySymbol(transaction.currency);

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your payment has been secured in the Tranzio Vault. The transaction is now active.
            </p>
          </div>

          {/* Transaction Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Transaction Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Transaction ID:</span>
                  <p className="font-mono text-sm">{transaction.id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Your Role:</span>
                  <Badge variant={transaction.role === 'BUYER' ? 'default' : 'secondary'}>
                    {transaction.role}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm">{transaction.description}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Courier Service:</span>
                  <Badge variant={transaction.useCourier ? 'default' : 'outline'}>
                    {transaction.useCourier ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary-foreground font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Transaction Active</p>
                    <p className="text-sm text-muted-foreground">
                      Your transaction is now active and funds are securely held in escrow.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary-foreground font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Order Fulfillment</p>
                    <p className="text-sm text-muted-foreground">
                      The seller will process and ship your order. You'll receive tracking updates.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary-foreground font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Funds Released</p>
                    <p className="text-sm text-muted-foreground">
                      Once you confirm receipt, funds are automatically released to the seller.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center mt-8">
            <Button onClick={() => navigate('/app/transactions')}>
              View My Transactions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Secure Payment
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete your payment to create the transaction. Your funds will be securely held in the Tranzio Vault.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Transaction Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Transaction Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Role:</span>
                    <Badge variant={transaction.role === 'BUYER' ? 'default' : 'secondary'}>
                      {transaction.role}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="text-sm text-right max-w-[200px]">{transaction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Courier Service:</span>
                    <Badge variant={transaction.useCourier ? 'default' : 'outline'}>
                      {transaction.useCourier ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {transaction.shippingDetails && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping Details:</span>
                      <Badge variant="default">
                        <Package className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item Price:</span>
                    <span className="font-medium">
                      {currencySymbol}{transaction.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction Fee (2.5%):</span>
                    <span className="font-medium">
                      {currencySymbol}{transaction.fee.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">
                      {currencySymbol}{transaction.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Bank-grade encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Escrow protection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Funds held securely</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment & Escrow Info */}
          <div className="space-y-6">
            {/* Escrow Information */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-primary">
                  <Info className="h-5 w-5" />
                  <span>How Tranzio Vault Protects You</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">Secure Escrow Service</p>
                      <p className="text-xs text-muted-foreground">
                        Your payment is held securely in our vault until the transaction is completed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">Buyer Protection</p>
                      <p className="text-xs text-muted-foreground">
                        Funds are only released to the seller after you confirm receipt and satisfaction.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">Dispute Resolution</p>
                      <p className="text-xs text-muted-foreground">
                        If issues arise, our team will mediate and ensure fair resolution.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Card Payment</p>
                        <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing Payment...
                      </>
                    ) : (
                                          <>
                      Pay {currencySymbol}{transaction.total.toFixed(2)}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Important Notice</p>
                    <p className="text-sm text-amber-700 mt-1">
                      By proceeding with this payment, you agree to our terms of service. 
                      Funds will be held securely until the transaction is completed or resolved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}