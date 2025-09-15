import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { activitiesAPI } from '@/services/api';
import { 
  Clock, 
  User, 
  CreditCard, 
  Truck, 
  Package, 
  CheckCircle, 
  AlertCircle,
  FileText,
  MessageCircle,
  Shield,
  RefreshCw
} from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'BUYER' | 'SELLER';
  status: 'completed' | 'pending' | 'failed';
  metadata?: {
    amount?: number;
    currency?: string;
    trackingNumber?: string;
    courierService?: string;
    paymentMethod?: string;
    paymentReference?: string;
  };
}

interface TransactionActivityLogProps {
  transactionId: string;
  activities?: ActivityLogEntry[]; // Make optional since we'll fetch live data
  currentUserId: string;
}

const TransactionActivityLog: React.FC<TransactionActivityLogProps> = ({
  transactionId,
  activities: propActivities,
  currentUserId
}) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>(propActivities || []);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch activities from API
  const fetchActivities = async () => {
    if (!transactionId) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching activities for transaction:', transactionId);
      const apiActivities = await activitiesAPI.getTransactionActivities(transactionId);
      console.log('Fetched activities:', apiActivities);
      setActivities(apiActivities);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Keep existing activities on error
    } finally {
      setIsLoading(false);
    }
  };

  // Load activities on mount and when transactionId changes
  useEffect(() => {
    fetchActivities();
  }, [transactionId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities();
    }, 30000);

    return () => clearInterval(interval);
  }, [transactionId]);
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'transaction_created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'transaction_joined':
        return <User className="h-4 w-4 text-green-600" />;
      case 'delivery_details_provided':
        return <Truck className="h-4 w-4 text-orange-600" />;
      case 'payment_made':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'payment_confirmed':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'shipment_confirmed':
        return <Package className="h-4 w-4 text-purple-600" />;
      case 'receipt_confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dispute_raised':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'message_sent':
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'transaction_created':
        return 'bg-blue-50 border-blue-200';
      case 'transaction_joined':
        return 'bg-green-50 border-green-200';
      case 'delivery_details_provided':
        return 'bg-orange-50 border-orange-200';
      case 'payment_made':
      case 'payment_confirmed':
        return 'bg-green-50 border-green-200';
      case 'shipment_confirmed':
        return 'bg-purple-50 border-purple-200';
      case 'receipt_confirmed':
        return 'bg-green-50 border-green-200';
      case 'dispute_raised':
        return 'bg-red-50 border-red-200';
      case 'message_sent':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Activity Log</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Activity Log</span>
          <Badge variant="outline" className="ml-auto">
            {activities.length} {activities.length === 1 ? 'entry' : 'entries'}
          </Badge>
        </CardTitle>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
          <button
            onClick={fetchActivities}
            disabled={isLoading}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative">
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200" />
              )}
              
              <div className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.action)}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    {getStatusBadge(activity.status)}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                    <span>by {activity.userName}</span>
                    <span>•</span>
                    <span className="capitalize">{activity.userRole.toLowerCase()}</span>
                    <span>•</span>
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                  
                  {/* Activity-specific metadata */}
                  {activity.metadata && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {activity.metadata.amount && activity.metadata.currency && (
                        <p>Amount: {formatCurrency(activity.metadata.amount, activity.metadata.currency)}</p>
                      )}
                      {activity.metadata.paymentMethod && (
                        <p>Payment Method: {activity.metadata.paymentMethod}</p>
                      )}
                      {activity.metadata.paymentReference && (
                        <p>Reference: {activity.metadata.paymentReference}</p>
                      )}
                      {activity.metadata.trackingNumber && (
                        <p>Tracking: {activity.metadata.trackingNumber}</p>
                      )}
                      {activity.metadata.courierService && (
                        <p>Courier: {activity.metadata.courierService}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionActivityLog;
