import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  User, 
  DollarSign, 
  Calendar,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Edit,
  ArrowRight
} from 'lucide-react';

const orderDetails = {
  item: {
    name: 'MacBook Pro 16" M3',
    description: 'Latest MacBook Pro with M3 chip, 16GB RAM, 512GB SSD, Space Gray',
    category: 'Electronics',
    specifications: [
      'Apple M3 Pro chip',
      '16GB Unified Memory',
      '512GB SSD Storage',
      '16-inch Liquid Retina XDR display'
    ]
  },
  vendor: {
    name: 'TechVendor Pro',
    rating: 4.9,
    location: 'San Francisco, CA',
    trustLevel: 'Verified'
  },
  pricing: {
    itemPrice: 2499.00,
    escrowFee: 49.98,
    total: 2548.98
  },
  delivery: {
    address: '123 Main Street, Apt 4B, New York, NY 10001',
    estimatedDate: '2024-01-25',
    method: 'Standard Shipping'
  }
};

export default function OrderConfirmation() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Confirmation</h1>
          <p className="text-muted-foreground">Review your order details before proceeding to payment</p>
        </div>
        <Badge className="bg-info text-info-foreground">
          <Shield className="h-3 w-3 mr-1" />
          Escrow Protected
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Summary */}
        <div className="space-y-6">
          {/* Item Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{orderDetails.item.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{orderDetails.item.description}</p>
                  <Badge variant="outline" className="mt-2">{orderDetails.item.category}</Badge>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-foreground">Specifications:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {orderDetails.item.specifications.map((spec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="h-5 w-5" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{orderDetails.vendor.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>★ {orderDetails.vendor.rating}</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {orderDetails.vendor.location}
                    </div>
                  </div>
                  <Badge className="bg-success text-success-foreground mt-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {orderDetails.vendor.trustLevel}
                  </Badge>
                </div>
                <Button variant="outline" size="sm">View Profile</Button>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Delivery Address</Label>
                <p className="text-muted-foreground text-sm mt-1">{orderDetails.delivery.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Estimated Delivery</Label>
                  <p className="text-foreground font-medium flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {orderDetails.delivery.estimatedDate}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Shipping Method</Label>
                  <p className="text-foreground font-medium flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {orderDetails.delivery.method}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Price</span>
                  <span className="text-foreground font-medium">${orderDetails.pricing.itemPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Escrow Service Fee (2%)</span>
                  <span className="text-foreground font-medium">${orderDetails.pricing.escrowFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-foreground">Total Amount</span>
                  <span className="text-foreground">${orderDetails.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escrow Protection */}
          <Card className="shadow-card bg-primary-light/10">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Escrow Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Your payment is held securely until delivery confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Funds released only after both parties confirm completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Dispute resolution available if needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Full refund protection for eligible transactions</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms Agreement */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-primary hover:underline">Escrow Agreement</a>.
                    I understand that my payment will be held in escrow until both parties confirm transaction completion.
                  </label>
                </div>
                
                <Button 
                  className="w-full gap-2" 
                  disabled={!agreed}
                  size="lg"
                >
                  Proceed to Payment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}