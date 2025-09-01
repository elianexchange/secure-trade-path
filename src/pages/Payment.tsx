import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Shield, 
  Lock,
  CheckCircle,
  AlertCircle,
  Wallet,
  DollarSign,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, American Express',
    fees: 'No additional fees'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: Wallet,
    description: 'Direct bank account transfer',
    fees: '1% processing fee'
  }
];

export default function Payment() {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const orderTotal = 2548.98;

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      // Redirect to success page or handle success
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Secure Payment</h1>
          <p className="text-muted-foreground">Your payment is protected by our escrow service</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-success" />
          <span className="text-sm font-medium text-success">SSL Encrypted</span>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">Payment Progress</span>
            <span className="text-sm text-muted-foreground">Step 2 of 3</span>
          </div>
          <Progress value={66} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Order Review</span>
            <span className="font-medium text-primary">Payment</span>
            <span>Confirmation</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Choose Payment Method</CardTitle>
              <CardDescription>Select your preferred payment option</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary-light/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethod === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <method.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">{method.name}</h3>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedMethod === method.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedMethod === method.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      <p className="text-xs text-success">{method.fees}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Details Form */}
          {selectedMethod === 'card' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Card Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="h-3 w-3 text-success" />
                    <span className="text-muted-foreground">
                      Your card information is encrypted and secure
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedMethod === 'bank' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Bank Transfer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-info-light/10 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-info mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Bank Transfer Instructions</p>
                      <p className="text-muted-foreground">
                        After clicking "Complete Payment", you'll receive detailed bank transfer instructions via email. 
                        The transaction will begin once we receive your payment.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">MacBook Pro 16" M3</p>
                  <p className="text-sm text-muted-foreground">TechVendor Pro</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item Price</span>
                    <span className="text-foreground">$2,499.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Escrow Fee (2%)</span>
                    <span className="text-foreground">$49.98</span>
                  </div>
                  {selectedMethod === 'bank' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee (1%)</span>
                      <span className="text-foreground">$25.49</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">
                    ${selectedMethod === 'bank' ? (orderTotal + 25.49).toFixed(2) : orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card className="shadow-card bg-success-light/10">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                Payment Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>PCI DSS compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Fraud detection enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Escrow guarantee</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full gap-2"
              size="lg"
            >
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  Complete Payment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Order Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}