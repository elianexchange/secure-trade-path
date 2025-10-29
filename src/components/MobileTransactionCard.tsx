import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  User,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface MobileTransactionCardProps {
  transaction: any;
  onViewDetails: (id: string) => void;
  onJoinTransaction?: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-800';
    case 'WAITING_FOR_PAYMENT':
      return 'bg-orange-100 text-orange-800';
    case 'WAITING_FOR_SHIPMENT':
      return 'bg-purple-100 text-purple-800';
    case 'WAITING_FOR_BUYER_CONFIRMATION':
      return 'bg-indigo-100 text-indigo-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'DISPUTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusDisplayName = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACTIVE':
      return 'Active';
    case 'WAITING_FOR_PAYMENT':
      return 'Awaiting Payment';
    case 'WAITING_FOR_SHIPMENT':
      return 'Awaiting Shipment';
    case 'WAITING_FOR_BUYER_CONFIRMATION':
      return 'In Transit';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'DISPUTED':
      return 'Disputed';
    case 'UNKNOWN':
      return 'Unknown';
    default:
      return status || 'Unknown';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return Clock;
    case 'ACTIVE':
      return Package;
    case 'WAITING_FOR_PAYMENT':
      return DollarSign;
    case 'WAITING_FOR_SHIPMENT':
      return Package;
    case 'WAITING_FOR_BUYER_CONFIRMATION':
      return Package;
    case 'COMPLETED':
      return CheckCircle;
    case 'CANCELLED':
      return XCircle;
    case 'DISPUTED':
      return AlertTriangle;
    case 'UNKNOWN':
      return Package;
    default:
      return Package;
  }
};

export function MobileTransactionCard({ 
  transaction, 
  onViewDetails, 
  onJoinTransaction 
}: MobileTransactionCardProps) {
  const StatusIcon = getStatusIcon(transaction.status);
  
  return (
    <Card className="w-full border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with status and value */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <StatusIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <Badge 
                  className={`text-xs ${getStatusColor(transaction.status || 'UNKNOWN')}`}
                >
                  {getStatusDisplayName(transaction.status || 'UNKNOWN')}
                </Badge>
              </div>
              <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                {transaction.itemDescription || transaction.description || 'Transaction'}
              </h3>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(transaction.amount || transaction.total || 0)}
              </div>
            </div>
          </div>

          {/* Transaction details */}
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-600">
              <User className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {transaction.creatorRole === 'BUYER' ? 'Buyer' : 'Seller'}: {transaction.creatorName}
              </span>
            </div>
            
            {transaction.counterpartyName && (
              <div className="flex items-center text-xs text-gray-600">
                <User className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {transaction.creatorRole === 'SELLER' ? 'Buyer' : 'Seller'}: {transaction.counterpartyName}
                </span>
              </div>
            )}

            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>
                {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-NG', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(transaction.id)}
              className="flex-1 text-xs"
            >
              View Details
            </Button>
            
            {onJoinTransaction && transaction.status === 'PENDING' && (
              <Button
                size="sm"
                onClick={() => onJoinTransaction(transaction.id)}
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
              >
                Join
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(transaction.id)}
              className="px-2"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
