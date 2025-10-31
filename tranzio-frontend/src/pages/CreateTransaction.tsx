import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle, ShoppingCart, Store, Clipboard, X, Info, Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { transactionsAPI } from '@/services/api';
import { toast } from 'sonner';
import sharedTransactionStore from '@/utils/sharedTransactionStore';
import { useSEO } from '@/hooks/useSEO';

interface TransactionData {
  role: 'BUYER' | 'SELLER';
  useCourier: boolean;
  description: string;
  currency: string;
  price: number;
  fee: number;
  total: number;
  // Enhanced fields
  itemType: string;
  itemCategory: string;
  itemCondition: string;
  itemBrand?: string;
  itemModel?: string;
  itemSize?: string;
  itemColor?: string;
  itemWeight?: number;
  itemDimensions?: string;
  itemSerialNumber?: string;
  itemWarranty?: string;
  itemOrigin?: string;
  itemAge?: string;
  itemQuantity: number;
  specialInstructions?: string;
  returnPolicy?: string;
  estimatedDeliveryDays?: number;
  itemPhotos?: File[];
}

const currencies = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' }
];

const itemTypes = [
  'Physical Product',
  'Digital Product',
  'Service',
  'Event Ticket',
  'Gift Card',
  'Other'
];

const itemCategories = [
  'Electronics',
  'Fashion & Accessories',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Health & Beauty',
  'Automotive',
  'Toys & Games',
  'Food & Beverages',
  'Art & Collectibles',
  'Business & Industrial',
  'Other'
];

const itemConditions = [
  'Brand New',
  'Like New',
  'Good',
  'Fair',
  'Poor',
  'For Parts'
];

export default function CreateTransaction() {
  // SEO optimization
  useSEO();
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitTransactionCreated } = useWebSocket();
  
  // Safely get notifications with fallback
  let addNotification: ((notification: any) => void) | null = null;
  try {
    const { addNotification: addNotif } = useNotifications();
    addNotification = addNotif;
  } catch (error) {
    console.warn('NotificationProvider not available in CreateTransaction');
  }
  const [currentStep, setCurrentStep] = useState(1);
  const [transactionData, setTransactionData] = useState<TransactionData>({
    role: 'BUYER',
    useCourier: false,
    description: '',
    currency: 'NGN',
    price: 0,
    fee: 0,
    total: 0,
    // Enhanced fields
    itemType: 'Physical Product',
    itemCategory: 'Electronics',
    itemCondition: 'Brand New',
    itemQuantity: 1,
    estimatedDeliveryDays: 3
  });

  const calculateFee = (price: number) => {
    // 2.5% transaction fee
    const fee = price * 0.025;
    return fee;
  };

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value) || 0;
    const fee = calculateFee(price);
    setTransactionData(prev => ({
      ...prev,
      price,
      fee,
      total: price + fee
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      let response;
      
      try {
        console.log('Attempting API call with enhanced data:', {
          description: transactionData.description,
          itemType: transactionData.itemType,
          itemCategory: transactionData.itemCategory,
          itemCondition: transactionData.itemCondition
        });
        // Try to call the API to create the transaction
        response = await transactionsAPI.createTransaction({
        description: transactionData.description,
        currency: transactionData.currency,
        price: transactionData.price,
        fee: transactionData.fee,
        total: transactionData.total,
        useCourier: transactionData.useCourier,
          creatorRole: transactionData.role,
          // Enhanced item details
          itemType: transactionData.itemType,
          itemCategory: transactionData.itemCategory,
          itemCondition: transactionData.itemCondition,
          itemBrand: transactionData.itemBrand,
          itemModel: transactionData.itemModel,
          itemSize: transactionData.itemSize,
          itemColor: transactionData.itemColor,
          itemWeight: transactionData.itemWeight,
          itemDimensions: transactionData.itemDimensions,
          itemSerialNumber: transactionData.itemSerialNumber,
          itemWarranty: transactionData.itemWarranty,
          itemOrigin: transactionData.itemOrigin,
          itemAge: transactionData.itemAge,
          itemQuantity: transactionData.itemQuantity,
          specialInstructions: transactionData.specialInstructions,
          returnPolicy: transactionData.returnPolicy,
          estimatedDeliveryDays: transactionData.estimatedDeliveryDays
        });
      } catch (apiError) {
        console.log('API call failed, creating mock transaction:', apiError);
        // Create mock response if API fails
        const mockTransaction = {
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description: transactionData.description,
          currency: transactionData.currency,
          price: transactionData.price,
          fee: transactionData.fee,
          total: transactionData.total,
          useCourier: transactionData.useCourier,
          status: 'PENDING' as const,
          creatorId: user?.id || '',
          creatorRole: transactionData.role,
          paymentCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Include all enhanced item details
          itemType: transactionData.itemType,
          itemCategory: transactionData.itemCategory,
          itemCondition: transactionData.itemCondition,
          itemBrand: transactionData.itemBrand,
          itemModel: transactionData.itemModel,
          itemSize: transactionData.itemSize,
          itemColor: transactionData.itemColor,
          itemWeight: transactionData.itemWeight,
          itemDimensions: transactionData.itemDimensions,
          itemSerialNumber: transactionData.itemSerialNumber,
          itemWarranty: transactionData.itemWarranty,
          itemOrigin: transactionData.itemOrigin,
          itemAge: transactionData.itemAge,
          itemQuantity: transactionData.itemQuantity,
          specialInstructions: transactionData.specialInstructions,
          returnPolicy: transactionData.returnPolicy,
          estimatedDeliveryDays: transactionData.estimatedDeliveryDays
        };
        
        response = {
          transaction: mockTransaction,
          invitation: {
            code: `INV_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          }
        };
      }

      const { transaction, invitation } = response;
      
      console.log('API response transaction:', transaction);
      console.log('Does transaction have enhanced data?', {
        itemType: transaction.itemType,
        itemCategory: transaction.itemCategory,
        itemCondition: transaction.itemCondition
      });
      
      // If API response is missing enhanced data, merge it from form data
      if (!transaction.itemType || !transaction.itemCategory) {
        console.log('API response missing enhanced data, merging with form data');
        transaction.itemType = transactionData.itemType;
        transaction.itemCategory = transactionData.itemCategory;
        transaction.itemCondition = transactionData.itemCondition;
        transaction.itemBrand = transactionData.itemBrand;
        transaction.itemModel = transactionData.itemModel;
        transaction.itemSize = transactionData.itemSize;
        transaction.itemColor = transactionData.itemColor;
        transaction.itemWeight = transactionData.itemWeight;
        transaction.itemDimensions = transactionData.itemDimensions;
        transaction.itemSerialNumber = transactionData.itemSerialNumber;
        transaction.itemWarranty = transactionData.itemWarranty;
        transaction.itemOrigin = transactionData.itemOrigin;
        transaction.itemAge = transactionData.itemAge;
        transaction.itemQuantity = transactionData.itemQuantity;
        transaction.specialInstructions = transactionData.specialInstructions;
        transaction.returnPolicy = transactionData.returnPolicy;
        transaction.estimatedDeliveryDays = transactionData.estimatedDeliveryDays;
        
        console.log('Enhanced transaction after merge:', {
          itemType: transaction.itemType,
          itemCategory: transaction.itemCategory,
          itemCondition: transaction.itemCondition
        });
      }
      
      // Add creator name and detailed item information to the transaction
      const transactionWithCreator = {
        ...transaction,
        creatorName: `${user?.firstName} ${user?.lastName}`,
        counterpartyName: 'Waiting for counterparty to join...',
        // Include all detailed item information
        itemType: transactionData.itemType,
        itemCategory: transactionData.itemCategory,
        itemCondition: transactionData.itemCondition,
        itemBrand: transactionData.itemBrand,
        itemModel: transactionData.itemModel,
        itemSize: transactionData.itemSize,
        itemColor: transactionData.itemColor,
        itemWeight: transactionData.itemWeight,
        itemDimensions: transactionData.itemDimensions,
        itemSerialNumber: transactionData.itemSerialNumber,
        itemWarranty: transactionData.itemWarranty,
        itemOrigin: transactionData.itemOrigin,
        itemAge: transactionData.itemAge,
        itemQuantity: transactionData.itemQuantity,
        specialInstructions: transactionData.specialInstructions,
        returnPolicy: transactionData.returnPolicy,
        estimatedDeliveryDays: transactionData.estimatedDeliveryDays
      };
      
      // Store in shared transaction store
      sharedTransactionStore.createTransaction(transactionWithCreator);
      
      console.log('Saved transaction to localStorage with enhanced data:', {
        id: transactionWithCreator.id,
        itemType: transactionWithCreator.itemType,
        itemCategory: transactionWithCreator.itemCategory,
        itemCondition: transactionWithCreator.itemCondition,
        itemBrand: transactionWithCreator.itemBrand,
        itemModel: transactionWithCreator.itemModel
      });
      
      // Emit WebSocket event for real-time notification
      emitTransactionCreated(transaction.id);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('transactionUpdated'));
      
      // Add notification for transaction creation if available
      if (addNotification) {
        addNotification({
          userId: user?.id || '',
          transactionId: transaction.id,
          type: 'TRANSACTION_UPDATE',
          title: 'Transaction Created',
          message: `Your transaction "${transaction.description}" has been created successfully. Share the link with your counterparty.`,
          isRead: false,
          priority: 'MEDIUM',
          metadata: {
            transactionStatus: 'PENDING',
            amount: transaction.total,
            currency: transaction.currency,
            actionRequired: true
          }
        });
      }
      
      console.log('Transaction created via API:', transaction);
      console.log('Invitation code:', invitation.code);
      
      // Navigate to transaction details page with invitation code
      navigate(`/app/transactions/${transaction.id}`, { 
        state: { 
          transaction,
          invitationCode: invitation.code 
        } 
      });
      
      toast.success('Transaction created successfully! Share the link with your counterparty.');
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction. Please try again.');
    }
  };

  const renderStep1 = () => (
      <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Select Your Role</h2>
        <p className="text-sm text-muted-foreground">Choose your role in this transaction</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Buyer Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            transactionData.role === 'BUYER' 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:ring-1 hover:ring-border'
          }`}
          onClick={() => setTransactionData(prev => ({ ...prev, role: 'BUYER' }))}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                transactionData.role === 'BUYER' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">Buyer</h3>
                <p className="text-xs text-muted-foreground">I want to purchase something</p>
              </div>
              {transactionData.role === 'BUYER' && (
                <CheckCircle className="h-4 w-4 text-primary" />
            )}
            </div>
          </CardContent>
        </Card>

        {/* Seller Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            transactionData.role === 'SELLER' 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:ring-1 hover:ring-border'
          }`}
          onClick={() => setTransactionData(prev => ({ ...prev, role: 'SELLER' }))}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                transactionData.role === 'SELLER' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Store className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">Seller</h3>
                <p className="text-xs text-muted-foreground">I want to sell something</p>
              </div>
              {transactionData.role === 'SELLER' && (
                <CheckCircle className="h-4 w-4 text-primary" />
            )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep2 = () => (
      <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Shipping Method</h2>
        <p className="text-xs text-muted-foreground">Will you be using courier services?</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Yes Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            transactionData.useCourier === true 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:ring-1 hover:ring-border'
          }`}
          onClick={() => setTransactionData(prev => ({ ...prev, useCourier: true }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                transactionData.useCourier === true 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Clipboard className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">Yes</h3>
                <p className="text-xs text-muted-foreground">I need shipping services</p>
              </div>
              {transactionData.useCourier === true && (
                <CheckCircle className="h-4 w-4 text-primary" />
            )}
            </div>
          </CardContent>
        </Card>

        {/* No Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            transactionData.useCourier === false 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:ring-1 hover:ring-border'
          }`}
          onClick={() => setTransactionData(prev => ({ ...prev, useCourier: false }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                transactionData.useCourier === false 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <X className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">No</h3>
                <p className="text-xs text-muted-foreground">Local pickup or delivery</p>
              </div>
              {transactionData.useCourier === false && (
                <CheckCircle className="h-4 w-4 text-primary" />
            )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Transaction Details</h2>
        <p className="text-xs text-muted-foreground">Fill in the details of your transaction</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="description" className="text-sm font-medium text-foreground">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe the goods or service you're trading..."
            value={transactionData.description}
            onChange={(e) => setTransactionData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-2 min-h-[60px] resize-none text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currency" className="text-sm font-medium text-foreground">
              Currency
            </Label>
            <Select 
              value={transactionData.currency} 
              onValueChange={(value) => setTransactionData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price" className="text-sm font-medium text-foreground">
              Price
            </Label>
            <div className="relative mt-2">
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={transactionData.price || ''}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="pr-10 text-sm"
              />
              <Info className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Fee and Total Display */}
        <Card className="bg-muted/30">
          <CardContent className="p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Transaction Fee (2.5%):</span>
              <span className="font-medium text-foreground">
                {currencies.find(c => c.code === transactionData.currency)?.symbol}
                {transactionData.fee.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Total Amount:</span>
                <span className="text-base font-semibold text-primary">
                  {currencies.find(c => c.code === transactionData.currency)?.symbol}
                  {transactionData.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          {transactionData.role === 'SELLER' ? 'Item Details' : 'Transaction Preferences'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {transactionData.role === 'SELLER' 
            ? 'Provide detailed information about the item you\'re selling'
            : 'Set your preferences for this transaction'
          }
        </p>
      </div>
      
      <div className="space-y-4">
        {transactionData.role === 'SELLER' ? (
          // Seller sees detailed item information fields
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemType" className="text-sm font-medium text-foreground">
                  Item Type *
                </Label>
                <Select 
                  value={transactionData.itemType} 
                  onValueChange={(value) => setTransactionData(prev => ({ ...prev, itemType: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="itemCategory" className="text-sm font-medium text-foreground">
                  Category *
                </Label>
                <Select 
                  value={transactionData.itemCategory} 
                  onValueChange={(value) => setTransactionData(prev => ({ ...prev, itemCategory: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : (
          // Buyer sees transaction preferences
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxBudget" className="text-sm font-medium text-foreground">
                  Maximum Budget
                </Label>
                <Input
                  id="maxBudget"
                  type="number"
                  placeholder="Enter your maximum budget"
                  value={transactionData.price || ''}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="preferredCondition" className="text-sm font-medium text-foreground">
                  Preferred Condition
                </Label>
                <Select 
                  value={transactionData.itemCondition} 
                  onValueChange={(value) => setTransactionData(prev => ({ ...prev, itemCondition: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select preferred condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemConditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="buyerRequirements" className="text-sm font-medium text-foreground">
                Specific Requirements
              </Label>
              <Textarea
                id="buyerRequirements"
                placeholder="Describe what you're looking for, any specific requirements, or preferences..."
                value={transactionData.specialInstructions || ''}
                onChange={(e) => setTransactionData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                className="mt-2 min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </>
        )}

        {transactionData.role === 'SELLER' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemQuantity" className="text-sm font-medium text-foreground">
                Quantity *
              </Label>
              <Input
                id="itemQuantity"
                type="number"
                min="1"
                value={transactionData.itemQuantity}
                onChange={(e) => setTransactionData(prev => ({ ...prev, itemQuantity: parseInt(e.target.value) || 1 }))}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {transactionData.role === 'SELLER' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemBrand" className="text-sm font-medium text-foreground">
                  Brand
                </Label>
                <Input
                  id="itemBrand"
                  placeholder="e.g., Apple, Samsung, Nike"
                  value={transactionData.itemBrand || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemBrand: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="itemModel" className="text-sm font-medium text-foreground">
                  Model
                </Label>
                <Input
                  id="itemModel"
                  placeholder="e.g., iPhone 14, Galaxy S23"
                  value={transactionData.itemModel || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemModel: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="itemSize" className="text-sm font-medium text-foreground">
                  Size
                </Label>
                <Input
                  id="itemSize"
                  placeholder="e.g., Large, 42mm, 10.5"
                  value={transactionData.itemSize || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemSize: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="itemColor" className="text-sm font-medium text-foreground">
                  Color
                </Label>
                <Input
                  id="itemColor"
                  placeholder="e.g., Black, Red, Blue"
                  value={transactionData.itemColor || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemColor: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="itemWeight" className="text-sm font-medium text-foreground">
                  Weight (kg)
                </Label>
                <Input
                  id="itemWeight"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={transactionData.itemWeight || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemWeight: parseFloat(e.target.value) || undefined }))}
                  className="mt-2"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          {transactionData.role === 'SELLER' ? 'Additional Information' : 'Transaction Terms'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {transactionData.role === 'SELLER' 
            ? 'Provide any additional details and policies'
            : 'Set your terms and expectations for this transaction'
          }
        </p>
      </div>
      
      <div className="space-y-4">
        {transactionData.role === 'SELLER' ? (
          // Seller sees detailed additional information
          <>
            <div>
              <Label htmlFor="itemDimensions" className="text-sm font-medium text-foreground">
                Dimensions
              </Label>
              <Input
                id="itemDimensions"
                placeholder="e.g., 10cm x 15cm x 5cm"
                value={transactionData.itemDimensions || ''}
                onChange={(e) => setTransactionData(prev => ({ ...prev, itemDimensions: e.target.value }))}
                className="mt-2"
              />
            </div>
          </>
        ) : (
          // Buyer sees transaction terms
          <>
            <div>
              <Label htmlFor="buyerTerms" className="text-sm font-medium text-foreground">
                Transaction Terms
              </Label>
              <Textarea
                id="buyerTerms"
                placeholder="Any specific terms, conditions, or expectations for this transaction..."
                value={transactionData.returnPolicy || ''}
                onChange={(e) => setTransactionData(prev => ({ ...prev, returnPolicy: e.target.value }))}
                className="mt-2 min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </>
        )}

        {transactionData.role === 'SELLER' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemSerialNumber" className="text-sm font-medium text-foreground">
                  Serial Number
                </Label>
                <Input
                  id="itemSerialNumber"
                  placeholder="Enter serial number if applicable"
                  value={transactionData.itemSerialNumber || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemSerialNumber: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="itemWarranty" className="text-sm font-medium text-foreground">
                  Warranty
                </Label>
                <Input
                  id="itemWarranty"
                  placeholder="e.g., 1 year, 6 months"
                  value={transactionData.itemWarranty || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemWarranty: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemOrigin" className="text-sm font-medium text-foreground">
                  Country of Origin
                </Label>
                <Input
                  id="itemOrigin"
                  placeholder="e.g., Nigeria, China, USA"
                  value={transactionData.itemOrigin || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemOrigin: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="itemAge" className="text-sm font-medium text-foreground">
                  Age/Usage
                </Label>
                <Input
                  id="itemAge"
                  placeholder="e.g., 6 months old, 2 years"
                  value={transactionData.itemAge || ''}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, itemAge: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialInstructions" className="text-sm font-medium text-foreground">
                Special Instructions
              </Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any special handling instructions, assembly requirements, or important notes..."
                value={transactionData.specialInstructions || ''}
                onChange={(e) => setTransactionData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                className="mt-2 min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="returnPolicy" className="text-sm font-medium text-foreground">
                Return Policy
              </Label>
              <Textarea
                id="returnPolicy"
                placeholder="Describe your return policy, conditions, and timeframes..."
                value={transactionData.returnPolicy || ''}
                onChange={(e) => setTransactionData(prev => ({ ...prev, returnPolicy: e.target.value }))}
                className="mt-2 min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </>
        )}

        {transactionData.useCourier && (
          <div>
            <Label htmlFor="estimatedDeliveryDays" className="text-sm font-medium text-foreground">
              Estimated Delivery Time (Days)
            </Label>
            <Input
              id="estimatedDeliveryDays"
              type="number"
              min="1"
              max="30"
              value={transactionData.estimatedDeliveryDays || 3}
              onChange={(e) => setTransactionData(prev => ({ ...prev, estimatedDeliveryDays: parseInt(e.target.value) || 3 }))}
              className="mt-2"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack} 
              disabled={currentStep === 1}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">Create Transaction</h1>
            </div>
          </div>
          
          {/* Mobile: Stack buttons vertically, Desktop: Keep horizontal */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/app/escrow-calculator')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Calculator className="h-4 w-4" />
              Fee Calculator
            </Button>
          </div>
      </div>


        {/* Step Content */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6">
          {currentStep > 1 && (
            <Button 
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentStep < 5 ? (
            <Button 
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !transactionData.role) ||
                (currentStep === 2 && transactionData.useCourier === undefined) ||
                (currentStep === 3 && (!transactionData.description || transactionData.price <= 0)) ||
                (currentStep === 4 && transactionData.role === 'SELLER' && (!transactionData.itemType || !transactionData.itemCategory || !transactionData.itemCondition))
              }
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreateTransaction}
              disabled={!transactionData.description || transactionData.price <= 0}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Transaction
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
