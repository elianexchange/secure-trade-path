import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  CreditCard, 
  Truck, 
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { EscrowTransaction, EscrowTransactionStatus } from '@/types';

interface TransactionStatusFlowProps {
  transaction: EscrowTransaction;
  userRole: 'BUYER' | 'SELLER';
  onAction?: (action: string, data?: any) => void;
}

export default function TransactionStatusFlow({ 
  transaction, 
  userRole, 
  onAction 
}: TransactionStatusFlowProps) {
  
  const getStatusIcon = (status: EscrowTransactionStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'ACTIVE':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'WAITING_FOR_DELIVERY_DETAILS':
        return <MapPin className="h-5 w-5 text-orange-600" />;
      case 'DELIVERY_DETAILS_IMPORTED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'WAITING_FOR_PAYMENT':
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      case 'PAYMENT_MADE':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'WAITING_FOR_SHIPMENT':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'SHIPMENT_CONFIRMED':
        return <Truck className="h-5 w-5 text-green-600" />;
      case 'WAITING_FOR_BUYER_CONFIRMATION':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: EscrowTransactionStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WAITING_FOR_DELIVERY_DETAILS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELIVERY_DETAILS_IMPORTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WAITING_FOR_PAYMENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PAYMENT_MADE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WAITING_FOR_SHIPMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPMENT_CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WAITING_FOR_BUYER_CONFIRMATION':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDescription = (status: EscrowTransactionStatus, userRole: 'BUYER' | 'SELLER') => {
    switch (status) {
      case 'PENDING':
        return 'Waiting for counterparty to join the transaction';
      case 'ACTIVE':
        return 'Transaction is active! Both parties have joined. You can now proceed to the next step.';
      case 'WAITING_FOR_DELIVERY_DETAILS':
        return userRole === 'BUYER' 
          ? 'Please provide your delivery details' 
          : 'Waiting for buyer to provide delivery details';
      case 'DELIVERY_DETAILS_IMPORTED':
        return 'Delivery details have been provided';
      case 'WAITING_FOR_PAYMENT':
        return userRole === 'BUYER' 
          ? 'Please make payment to proceed' 
          : 'Waiting for buyer to make payment';
      case 'PAYMENT_MADE':
        return 'Payment has been made and funds are held in escrow';
      case 'WAITING_FOR_SHIPMENT':
        return userRole === 'SELLER' 
          ? 'Please ship the goods and confirm shipment' 
          : 'Waiting for seller to ship the goods';
      case 'SHIPMENT_CONFIRMED':
        return 'Goods have been shipped';
      case 'WAITING_FOR_BUYER_CONFIRMATION':
        return userRole === 'BUYER' 
          ? 'Please confirm receipt of goods' 
          : 'Waiting for buyer to confirm receipt';
      case 'COMPLETED':
        return 'Transaction completed successfully';
      case 'CANCELLED':
        return 'Transaction has been cancelled';
      default:
        return 'Unknown status';
    }
  };

  const getNextAction = (status: EscrowTransactionStatus, userRole: 'BUYER' | 'SELLER', useCourier: boolean) => {
    switch (status) {
      case 'ACTIVE':
        // When transaction becomes active, determine next step based on user role and courier option
        if (useCourier) {
          return userRole === 'BUYER' ? 'Proceed to Fill Shipping Details' : 'Waiting for Buyer to Fill Shipping Details';
        } else {
          return userRole === 'BUYER' ? 'Proceed with Payment' : 'Waiting for Buyer to Make Payment';
        }
      case 'WAITING_FOR_DELIVERY_DETAILS':
        return userRole === 'BUYER' ? 'Provide Delivery Details' : 'Waiting for Buyer to Provide Delivery Details';
      case 'DELIVERY_DETAILS_IMPORTED':
        return userRole === 'BUYER' ? 'Proceed with Payment' : 'Waiting for Buyer to Make Payment';
      case 'WAITING_FOR_PAYMENT':
        return userRole === 'BUYER' ? 'Make Payment' : 'Waiting for Buyer to Make Payment';
      case 'PAYMENT_MADE':
        return userRole === 'SELLER' ? 'Proceed to Ship Goods' : 'Waiting for Seller to Ship Goods';
      case 'WAITING_FOR_SHIPMENT':
        return userRole === 'SELLER' ? 'Confirm Shipment' : 'Waiting for Seller to Ship Goods';
      case 'SHIPMENT_CONFIRMED':
        return userRole === 'BUYER' ? 'Confirm Receipt of Goods' : 'Waiting for Buyer to Confirm Receipt';
      case 'WAITING_FOR_BUYER_CONFIRMATION':
        return userRole === 'BUYER' ? 'Confirm Receipt' : 'Waiting for Buyer to Confirm Receipt';
      default:
        return null;
    }
  };

  const handleAction = (action: string) => {
    console.log('TransactionStatusFlow: Action button clicked, calling onAction with:', action);
    console.log('TransactionStatusFlow: onAction function available:', !!onAction);
    if (onAction) {
      console.log('TransactionStatusFlow: Calling onAction function');
      onAction(action, { transactionId: transaction.id });
    } else {
      console.error('TransactionStatusFlow: onAction function is not available!');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    const symbol = currency === 'NGN' ? '₦' : currency;
    return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextAction = getNextAction(transaction.status, userRole, transaction.useCourier);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transaction Status</span>
          <Badge className={`${getStatusColor(transaction.status)} border`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(transaction.status)}
              <span className="capitalize">
                {transaction.status.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Description */}
        <div className={`p-4 rounded-lg ${
          transaction.status === 'ACTIVE' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-muted/30'
        }`}>
          <p className={`text-sm ${
            transaction.status === 'ACTIVE' 
              ? 'text-green-700 font-medium' 
              : 'text-muted-foreground'
          }`}>
            {getStatusDescription(transaction.status, userRole)}
          </p>
          {transaction.status === 'ACTIVE' && (
            <div className="mt-2 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Ready to proceed to next step!</span>
            </div>
          )}
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
              <p className="text-sm font-mono">{transaction.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{transaction.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(transaction.total, transaction.currency)}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(transaction.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(transaction.updatedAt)}</p>
            </div>
            {transaction.paidAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                <p className="text-sm">{formatDate(transaction.paidAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Details (if applicable) */}
        {transaction.useCourier && transaction.deliveryDetails && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Delivery Details</span>
            </h4>
            <div className="text-sm text-muted-foreground">
              <p>Delivery details have been provided</p>
              {transaction.expectedDeliveryTime && (
                <p className="mt-1">
                  Expected delivery: {transaction.expectedDeliveryTime} days
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payment Information */}
        {transaction.paymentCompleted && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payment Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{transaction.paymentMethod || 'N/A'}</p>
              </div>
              {transaction.paymentReference && (
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-mono text-xs">{transaction.paymentReference}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping Information */}
        {transaction.shippedAt && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Shipping Information</span>
            </h4>
            <div className="text-sm text-muted-foreground">
              <p>Goods shipped on {formatDate(transaction.shippedAt)}</p>
              {transaction.actualDeliveryTime && (
                <p className="mt-1">
                  Actual delivery time: {transaction.actualDeliveryTime} days
                </p>
              )}
            </div>
          </div>
        )}

        {/* Next Action Button */}
        {nextAction && (
          <div className="pt-4 border-t">
            {nextAction.startsWith('Waiting for') ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">{nextAction}</span>
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => {
                  // Convert action text to proper action string
                  let actionString = '';
                  if (nextAction.includes('Proceed to Fill Shipping Details')) {
                    actionString = 'proceed_to_fill_shipping_details';
                  } else if (nextAction.includes('Provide Delivery Details')) {
                    actionString = 'provide_delivery_details';
                  } else if (nextAction.includes('Proceed with Payment')) {
                    actionString = 'proceed_with_payment';
                  } else if (nextAction.includes('Make Payment')) {
                    actionString = 'make_payment';
                  } else if (nextAction.includes('Proceed to Ship Goods')) {
                    actionString = 'proceed_to_ship_goods';
                  } else if (nextAction.includes('Confirm Shipment')) {
                    actionString = 'confirm_shipment';
                  } else if (nextAction.includes('Confirm Receipt')) {
                    actionString = 'confirm_receipt';
                  } else {
                    // Fallback to original conversion
                    actionString = nextAction.toLowerCase().replace(/\s+/g, '_');
                  }
                  
                  console.log('TransactionStatusFlow: Button clicked, nextAction:', nextAction, 'converted to:', actionString);
                  handleAction(actionString);
                }}
                className="w-full"
                size="lg"
              >
                {nextAction}
              </Button>
            )}
          </div>
        )}

        {/* Progress Timeline */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-foreground mb-4">Transaction Timeline</h4>
          <div className="space-y-3">
            {[
              { status: 'PENDING', label: 'Transaction Created' },
              { status: 'ACTIVE', label: 'Counterparty Joined' },
              ...(transaction.useCourier ? [
                { status: 'WAITING_FOR_DELIVERY_DETAILS', label: 'Delivery Details Required' },
                { status: 'DELIVERY_DETAILS_IMPORTED', label: 'Delivery Details Provided' }
              ] : []),
              { status: 'WAITING_FOR_PAYMENT', label: 'Payment Required' },
              { status: 'PAYMENT_MADE', label: 'Payment Completed' },
              { status: 'WAITING_FOR_SHIPMENT', label: 'Shipment Required' },
              { status: 'SHIPMENT_CONFIRMED', label: 'Goods Shipped' },
              { status: 'WAITING_FOR_BUYER_CONFIRMATION', label: 'Awaiting Confirmation' },
              { status: 'COMPLETED', label: 'Transaction Completed' }
            ].map((step, index) => {
              const isCompleted = getStatusOrder(transaction.status) >= getStatusOrder(step.status as EscrowTransactionStatus);
              const isCurrent = transaction.status === step.status;
              
              return (
                <div key={step.status} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 text-green-600' : 
                    isCurrent ? 'bg-blue-100 text-blue-600' : 
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    isCompleted ? 'text-green-600 font-medium' : 
                    isCurrent ? 'text-blue-600 font-medium' : 
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get status order for timeline
function getStatusOrder(status: EscrowTransactionStatus): number {
  const order = {
    'PENDING': 1,
    'ACTIVE': 2,
    'WAITING_FOR_DELIVERY_DETAILS': 3,
    'DELIVERY_DETAILS_IMPORTED': 4,
    'WAITING_FOR_PAYMENT': 5,
    'PAYMENT_MADE': 6,
    'WAITING_FOR_SHIPMENT': 7,
    'SHIPMENT_CONFIRMED': 8,
    'WAITING_FOR_BUYER_CONFIRMATION': 9,
    'COMPLETED': 10,
    'CANCELLED': 0
  };
  return order[status] || 0;
}
