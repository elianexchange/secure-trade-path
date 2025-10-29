import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Wallet, 
  Banknote, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { PaymentConfirmationRequest } from '@/types';

interface PaymentConfirmationProps {
  transactionId: string;
  amount?: number;
  currency?: string;
  onConfirm: (payment: PaymentConfirmationRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PaymentConfirmation({ 
  transactionId, 
  amount = 0, 
  currency = 'NGN', 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: PaymentConfirmationProps) {
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'BANK_TRANSFER' | 'CARD'>('WALLET');
  const [paymentReference, setPaymentReference] = useState('');
  const [walletBalance] = useState(150000); // Mock wallet balance
  const [errors, setErrors] = useState<{ paymentReference?: string }>({});

  const formatCurrency = (amount: number | undefined, currency: string = 'NGN') => {
    if (amount === undefined || amount === null) {
      return '₦0.00';
    }
    const symbol = currency === 'NGN' ? '₦' : currency;
    return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method as 'WALLET' | 'BANK_TRANSFER' | 'CARD');
    setPaymentReference('');
    setErrors({});
  };

  const handleReferenceChange = (value: string) => {
    setPaymentReference(value);
    if (errors.paymentReference) {
      setErrors(prev => ({ ...prev, paymentReference: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { paymentReference?: string } = {};

    if (paymentMethod === 'WALLET') {
      if (walletBalance < amount) {
        toast.error('Insufficient wallet balance');
        return false;
      }
    } else {
      if (!paymentReference.trim()) {
        newErrors.paymentReference = 'Payment reference is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm({
        paymentMethod,
        paymentReference: paymentMethod === 'WALLET' ? `WALLET_${Date.now()}` : paymentReference,
        amount
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'WALLET':
        return <Wallet className="h-5 w-5" />;
      case 'BANK_TRANSFER':
        return <Banknote className="h-5 w-5" />;
      case 'CARD':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodDescription = (method: string) => {
    switch (method) {
      case 'WALLET':
        return 'Pay directly from your Tranzio wallet';
      case 'BANK_TRANSFER':
        return 'Transfer from your bank account';
      case 'CARD':
        return 'Pay with your debit/credit card';
      default:
        return '';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <span>Payment Confirmation</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Confirm your payment for this transaction
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Summary */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <h3 className="font-medium text-foreground">Transaction Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(amount, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span>{currency}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Select Payment Method</h3>
            
            <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
              <div className="space-y-3">
                {/* Wallet Payment */}
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="WALLET" id="wallet" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Wallet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="wallet" className="font-medium cursor-pointer">
                          Tranzio Wallet
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodDescription('WALLET')}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-muted-foreground">Balance:</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(walletBalance)}
                          </span>
                          {walletBalance >= amount ? (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                              Sufficient
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                              Insufficient
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Banknote className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="bank" className="font-medium cursor-pointer">
                          Bank Transfer
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodDescription('BANK_TRANSFER')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Payment */}
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="CARD" id="card" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="card" className="font-medium cursor-pointer">
                          Debit/Credit Card
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodDescription('CARD')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Reference (for non-wallet payments) */}
          {paymentMethod !== 'WALLET' && (
            <div className="space-y-3">
              <Label htmlFor="paymentReference" className="text-sm font-medium">
                Payment Reference *
              </Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => handleReferenceChange(e.target.value)}
                placeholder="Enter your payment reference number"
                className={errors.paymentReference ? 'border-red-500' : ''}
              />
              {errors.paymentReference && (
                <p className="text-sm text-red-600">{errors.paymentReference}</p>
              )}
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Payment Instructions:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Make payment to the provided account details</li>
                    <li>• Use the reference number above in your payment description</li>
                    <li>• Payment will be verified within 24 hours</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start space-x-2 p-4 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Secure Payment</p>
              <p className="mt-1">
                Your payment is protected by our escrow system. Funds will be held securely 
                until the transaction is completed.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (paymentMethod === 'WALLET' && walletBalance < amount)}
              className="min-w-[140px]"
            >
              {isLoading ? 'Processing...' : `Pay ${formatCurrency(amount, currency)}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
