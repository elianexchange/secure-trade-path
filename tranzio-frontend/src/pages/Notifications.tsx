import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Package, 
  DollarSign, 
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Trash2,
  Mail,
  ArrowLeft,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  Wallet,
  Shield,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService';

const notificationSettings = [
  {
    id: 'transaction_updates',
    label: 'Transaction Updates',
    description: 'Get notified when transaction status changes',
    enabled: true
  },
  {
    id: 'payment_alerts',
    label: 'Payment Alerts', 
    description: 'Notifications for payment and escrow activities',
    enabled: true
  },
  {
    id: 'message_notifications',
    label: 'Message Notifications',
    description: 'New messages from transaction partners',
    enabled: true
  },
  {
    id: 'shipping_updates',
    label: 'Shipping Updates',
    description: 'Updates about item shipping and delivery',
    enabled: true
  },
  {
    id: 'dispute_alerts',
    label: 'Dispute Alerts',
    description: 'Notifications about disputes and resolutions',
    enabled: true
  },
  {
    id: 'wallet_activities',
    label: 'Wallet Activities',
    description: 'Wallet transactions and security alerts',
    enabled: true
  },
  {
    id: 'system_notifications',
    label: 'System Notifications',
    description: 'Important system updates and announcements',
    enabled: true
  }
];

const getNotificationIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    'TRANSACTION_UPDATE': <Package className="h-4 w-4" />,
    'PAYMENT': <DollarSign className="h-4 w-4" />,
    'SHIPPING': <Truck className="h-4 w-4" />,
    'DELIVERY': <CheckCircle className="h-4 w-4" />,
    'DISPUTE': <AlertTriangle className="h-4 w-4" />,
    'SYSTEM': <Bell className="h-4 w-4" />,
    'MESSAGE': <MessageCircle className="h-4 w-4" />,
    'WALLET': <Wallet className="h-4 w-4" />
  };
  return icons[type] || <Bell className="h-4 w-4" />;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    'LOW': 'text-gray-500',
    'MEDIUM': 'text-blue-500',
    'HIGH': 'text-orange-500',
    'URGENT': 'text-red-500'
  };
  return colors[priority] || 'text-gray-500';
};

const getPriorityBadgeColor = (priority: string) => {
  const colors: Record<string, string> = {
    'LOW': 'bg-gray-100 text-gray-800',
    'MEDIUM': 'bg-blue-100 text-blue-800',
    'HIGH': 'bg-orange-100 text-orange-800',
    'URGENT': 'bg-red-100 text-red-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days}d ago`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    refreshNotifications
  } = useNotifications();
  
  const [settings, setSettings] = useState(notificationSettings);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) || 
      (filter === 'read' && notification.isRead);
    
    const matchesTypeFilter = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesReadFilter && matchesTypeFilter;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear all notifications');
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
      toast.success('Notifications refreshed');
    } catch (error) {
      toast.error('Failed to refresh notifications');
    }
  };


  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.transactionId) {
      navigate(`/app/transactions/${notification.transactionId}`);
    } else if (notification.type === 'MESSAGE') {
      navigate('/app/messages');
    } else if (notification.type === 'WALLET') {
      navigate('/app/wallet');
    } else if (notification.type === 'DISPUTE') {
      navigate('/app/disputes');
    }
  };

  const toggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        {/* Action Buttons - Responsive */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="flex-1 sm:flex-none"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Mark All Read</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6 w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="w-full">Notifications</TabsTrigger>
          <TabsTrigger value="settings" className="w-full">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="read-filter" className="text-sm font-medium">Filter by Status</Label>
                <select
                  id="read-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="type-filter" className="text-sm font-medium">Filter by Type</Label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="TRANSACTION_UPDATE">Transactions</option>
                  <option value="PAYMENT">Payments</option>
                  <option value="MESSAGE">Messages</option>
                  <option value="DISPUTE">Disputes</option>
                  <option value="WALLET">Wallet</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {filter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "No notifications match your current filters."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dayNotifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full flex-shrink-0 ${
                              !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                                <h4 className={`font-medium text-sm md:text-base ${!notification.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getPriorityBadgeColor(notification.priority)}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                              
                              <p className={`text-xs md:text-sm ${!notification.isRead ? 'text-blue-700' : 'text-gray-600'} mb-2 line-clamp-2`}>
                                {notification.message}
                              </p>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    {getNotificationIcon(notification.type)}
                                    <span className="hidden sm:inline">{notification.type.replace('_', ' ')}</span>
                                  </span>
                                  <span>{formatTimeAgo(notification.createdAt)}</span>
                                  {notification.transactionId && (
                                    <span className="hidden md:inline">Transaction: {notification.transactionId.slice(-8)}</span>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification.id);
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Eye className="h-3 w-3 sm:mr-1" />
                                      <span className="hidden sm:inline">Mark Read</span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotification(notification.id);
                                    }}
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Notification Preferences</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={setting.id} className="text-sm font-medium">
                      {setting.label}
                    </Label>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <input
                      type="checkbox"
                      id={setting.id}
                      checked={setting.enabled}
                      onChange={() => toggleSetting(setting.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor={setting.id} className="text-sm font-medium cursor-pointer">
                      {setting.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}