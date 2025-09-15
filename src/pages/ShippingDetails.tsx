import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  Truck,
  MapPin,
  User,
  Phone,
  Home,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import sharedTransactionStore from '@/utils/sharedTransactionStore';

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

interface ShippingFormData {
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function ShippingDetails() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitTransactionUpdate } = useWebSocket();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingData, setShippingData] = useState<ShippingFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: '+234',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria'
  });

  useEffect(() => {
    if (transactionId) {
      const foundTransaction = sharedTransactionStore.getTransaction(transactionId);
      if (foundTransaction) {
        setTransaction(foundTransaction as unknown as Transaction);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [transactionId]);

  const handleInputChange = (field: keyof ShippingFormData, value: string) => {
    setShippingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return shippingData.firstName.trim() !== '' && 
               shippingData.lastName.trim() !== '' && 
               shippingData.phone.trim() !== '';
      case 2:
        return shippingData.addressLine1.trim() !== '' && 
               shippingData.city.trim() !== '' && 
               shippingData.state.trim() !== '';
      case 3:
        return shippingData.zipCode.trim() !== '' && 
               shippingData.country.trim() !== '';
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!transaction || !validateStep(3)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Update transaction in shared store
      const updatedTransaction = sharedTransactionStore.updateTransaction(transaction.id, {
        status: 'WAITING_FOR_PAYMENT',
        deliveryDetails: shippingData,
        updatedAt: new Date().toISOString()
      });
      
      if (updatedTransaction) {
        // Emit WebSocket event for real-time update
        emitTransactionUpdate(transaction.id, 'WAITING_FOR_PAYMENT');
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('transactionUpdated', { 
          detail: { 
            transactionId: transaction.id, 
            status: 'WAITING_FOR_PAYMENT',
            deliveryDetails: shippingData,
            updatedAt: new Date().toISOString(),
            transaction: updatedTransaction
          }
        }));
        
        toast.success('Shipping details saved successfully!');
        
        // Navigate to payment page
        navigate(`/app/payment/${transaction.id}`);
      } else {
        toast.error('Transaction not found');
      }
    } catch (error) {
      toast.error('Failed to save shipping details');
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
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Transaction Not Found</h1>
          <p className="text-muted-foreground mb-4">This transaction may have been deleted or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (!transaction.useCourier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Courier Service Not Required</h1>
          <p className="text-muted-foreground mb-4">This transaction doesn't require shipping details.</p>
          <Button onClick={() => navigate(`/app/payment/${transaction.id}`)}>
            Proceed to Payment
          </Button>
        </div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-muted-foreground">Please provide your contact details</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={shippingData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={shippingData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <div className="flex space-x-2">
          <Select value={shippingData.countryCode} onValueChange={(value) => handleInputChange('countryCode', value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+234">+234</SelectItem>
              <SelectItem value="+1">+1</SelectItem>
              <SelectItem value="+44">+44</SelectItem>
              <SelectItem value="+33">+33</SelectItem>
              <SelectItem value="+49">+49</SelectItem>
            </SelectContent>
          </Select>
          <Input
            id="phone"
            value={shippingData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Home className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Address Information</h2>
        <p className="text-muted-foreground">Please provide your shipping address</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="addressLine1">Address Line 1 *</Label>
          <Input
            id="addressLine1"
            value={shippingData.addressLine1}
            onChange={(e) => handleInputChange('addressLine1', e.target.value)}
            placeholder="Street address, P.O. box, company name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
          <Input
            id="addressLine2"
            value={shippingData.addressLine2}
            onChange={(e) => handleInputChange('addressLine2', e.target.value)}
            placeholder="Apartment, suite, unit, building, floor, etc."
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={shippingData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter your city"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State/County *</Label>
            <Input
              id="state"
              value={shippingData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="Enter your state"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Location Details</h2>
        <p className="text-muted-foreground">Please provide your location information</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
          <Input
            id="zipCode"
            value={shippingData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="Enter your ZIP code"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select value={shippingData.country} onValueChange={(value) => handleInputChange('country', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nigeria">Nigeria</SelectItem>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="Germany">Germany</SelectItem>
              <SelectItem value="France">France</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/app/transactions/${transactionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Shipping Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Shipping Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-16 h-0.5 mx-2 ${
                          step < currentStep ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    onClick={handleNextStep}
                    disabled={!validateStep(currentStep)}
                  >
                    {currentStep === 3 ? 'Save & Continue' : 'Next'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Transaction Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item:</span>
                    <span className="font-medium">{transaction.description}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Courier Service:</span>
                    <Badge variant="default">Yes</Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>{transaction.currency}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span>{getCurrencySymbol(transaction.currency)}{transaction.price.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee:</span>
                    <span>{getCurrencySymbol(transaction.currency)}{transaction.fee.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">
                      {getCurrencySymbol(transaction.currency)}{transaction.total.toLocaleString()}
                    </span>
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
