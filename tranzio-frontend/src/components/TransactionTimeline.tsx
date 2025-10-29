import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  DollarSign, 
  Truck, 
  Package, 
  MessageCircle, 
  Shield,
  FileText,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface TimelineEvent {
  id: string;
  type: 'TRANSACTION_CREATED' | 'TRANSACTION_JOINED' | 'PAYMENT_MADE' | 'PAYMENT_CONFIRMED' | 
        'DELIVERY_DETAILS_ADDED' | 'SHIPMENT_CONFIRMED' | 'TRANSACTION_COMPLETED' | 
        'TRANSACTION_FAILED' | 'DISPUTE_RAISED' | 'DISPUTE_RESOLVED' | 'MESSAGE_SENT' |
        'STATUS_CHANGED' | 'PAYMENT_RELEASED' | 'AUTO_RELEASE_TRIGGERED';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: {
    amount?: number;
    currency?: string;
    status?: string;
    previousStatus?: string;
    message?: string;
    disputeType?: string;
    resolution?: string;
  };
  isSystemEvent?: boolean;
}

interface TransactionTimelineProps {
  transactionId: string;
  className?: string;
}

const TransactionTimeline: React.FC<TransactionTimelineProps> = ({ 
  transactionId, 
  className = '' 
}) => {
  const { user } = useAuth();
  const { isConnected, socket } = useWebSocket();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimelineEvents();
  }, [transactionId]);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for real-time timeline updates
      const handleTimelineUpdate = (data: { transactionId: string; event: TimelineEvent }) => {
        if (data.transactionId === transactionId) {
          setTimelineEvents(prev => [data.event, ...prev]);
        }
      };

      const handleTransactionUpdate = (data: { transaction: any }) => {
        if (data.transaction.id === transactionId) {
          // Generate timeline event for status changes
          const event: TimelineEvent = {
            id: `status_${Date.now()}`,
            type: 'STATUS_CHANGED',
            title: 'Transaction Status Updated',
            description: `Status changed to ${data.transaction.status}`,
            timestamp: new Date().toISOString(),
            metadata: {
              status: data.transaction.status,
              previousStatus: timelineEvents[0]?.metadata?.status
            },
            isSystemEvent: true
          };
          setTimelineEvents(prev => [event, ...prev]);
        }
      };

      socket.on('timeline_update', handleTimelineUpdate);
      socket.on('transaction_updated', handleTransactionUpdate);

      return () => {
        socket.off('timeline_update', handleTimelineUpdate);
        socket.off('transaction_updated', handleTransactionUpdate);
      };
    }
  }, [socket, isConnected, transactionId, timelineEvents]);

  const loadTimelineEvents = async () => {
    try {
      setLoading(true);
      
      // Mock timeline events - in real app, this would come from API
      const mockEvents: TimelineEvent[] = [
        {
          id: '1',
          type: 'TRANSACTION_CREATED',
          title: 'Transaction Created',
          description: 'Transaction was created and is waiting for a counterparty to join',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          userId: 'user_1',
          userName: 'John Doe',
          metadata: {
            amount: 500000,
            currency: 'NGN'
          }
        },
        {
          id: '2',
          type: 'TRANSACTION_JOINED',
          title: 'Counterparty Joined',
          description: 'Jane Smith joined the transaction as the counterparty',
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
          userId: 'user_2',
          userName: 'Jane Smith'
        },
        {
          id: '3',
          type: 'PAYMENT_MADE',
          title: 'Payment Initiated',
          description: 'Payment of ₦500,000 has been initiated and is being processed',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          userId: 'user_2',
          userName: 'Jane Smith',
          metadata: {
            amount: 500000,
            currency: 'NGN'
          }
        },
        {
          id: '4',
          type: 'PAYMENT_CONFIRMED',
          title: 'Payment Confirmed',
          description: 'Payment has been confirmed and funds are held in escrow',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
          isSystemEvent: true,
          metadata: {
            amount: 500000,
            currency: 'NGN'
          }
        },
        {
          id: '5',
          type: 'DELIVERY_DETAILS_ADDED',
          title: 'Delivery Details Added',
          description: 'Buyer has provided delivery address and contact information',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          userId: 'user_2',
          userName: 'Jane Smith'
        },
        {
          id: '6',
          type: 'MESSAGE_SENT',
          title: 'Message Sent',
          description: 'New message: "Please confirm the delivery address is correct"',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
          userId: 'user_1',
          userName: 'John Doe',
          metadata: {
            message: 'Please confirm the delivery address is correct'
          }
        }
      ];

      setTimelineEvents(mockEvents);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TRANSACTION_CREATED':
        return <FileText className="h-4 w-4" />;
      case 'TRANSACTION_JOINED':
        return <User className="h-4 w-4" />;
      case 'PAYMENT_MADE':
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RELEASED':
        return <DollarSign className="h-4 w-4" />;
      case 'DELIVERY_DETAILS_ADDED':
        return <MapPin className="h-4 w-4" />;
      case 'SHIPMENT_CONFIRMED':
        return <Truck className="h-4 w-4" />;
      case 'TRANSACTION_COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'TRANSACTION_FAILED':
        return <XCircle className="h-4 w-4" />;
      case 'DISPUTE_RAISED':
        return <AlertCircle className="h-4 w-4" />;
      case 'DISPUTE_RESOLVED':
        return <Shield className="h-4 w-4" />;
      case 'MESSAGE_SENT':
        return <MessageCircle className="h-4 w-4" />;
      case 'STATUS_CHANGED':
        return <Activity className="h-4 w-4" />;
      case 'AUTO_RELEASE_TRIGGERED':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'TRANSACTION_CREATED':
      case 'TRANSACTION_JOINED':
        return 'text-blue-600 bg-blue-100';
      case 'PAYMENT_MADE':
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RELEASED':
        return 'text-green-600 bg-green-100';
      case 'DELIVERY_DETAILS_ADDED':
      case 'SHIPMENT_CONFIRMED':
        return 'text-purple-600 bg-purple-100';
      case 'TRANSACTION_COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'TRANSACTION_FAILED':
        return 'text-red-600 bg-red-100';
      case 'DISPUTE_RAISED':
        return 'text-orange-600 bg-orange-100';
      case 'DISPUTE_RESOLVED':
        return 'text-green-600 bg-green-100';
      case 'MESSAGE_SENT':
        return 'text-gray-600 bg-gray-100';
      case 'STATUS_CHANGED':
        return 'text-blue-600 bg-blue-100';
      case 'AUTO_RELEASE_TRIGGERED':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const formatFullTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transaction Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transaction Timeline
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? "Live" : "Offline"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTimelineEvents}
              className="h-7 px-2"
            >
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No timeline events yet</p>
            <p className="text-sm">Events will appear here as the transaction progresses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  {index < timelineEvents.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 ml-4 mt-2"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500" title={formatFullTimestamp(event.timestamp)}>
                        {formatTimestamp(event.timestamp)}
                      </span>
                      {event.isSystemEvent && (
                        <Badge variant="secondary" className="text-xs">System</Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  
                  {event.userName && !event.isSystemEvent && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>by {event.userName}</span>
                    </div>
                  )}
                  
                  {event.metadata && (
                    <div className="mt-2 space-y-1">
                      {event.metadata.amount && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <DollarSign className="h-3 w-3" />
                          <span>
                            {new Intl.NumberFormat('en-NG', {
                              style: 'currency',
                              currency: event.metadata.currency || 'NGN',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(event.metadata.amount)}
                          </span>
                        </div>
                      )}
                      
                      {event.metadata.message && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-200">
                          "{event.metadata.message}"
                        </div>
                      )}
                      
                      {event.metadata.status && (
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {event.metadata.status}
                          </Badge>
                          {event.metadata.previousStatus && (
                            <>
                              <span className="text-gray-400">→</span>
                              <Badge variant="secondary" className="text-xs">
                                {event.metadata.previousStatus}
                              </Badge>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionTimeline;
