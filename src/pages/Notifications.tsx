import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

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
    description: 'Delivery and shipping notifications',
    enabled: true
  },
  {
    id: 'system_alerts',
    label: 'System Alerts',
    description: 'Important system notifications',
    enabled: true
  }
];

export default function Notifications() {
  const navigate = useNavigate();
  
  // Safely get notifications with fallback
  let notifications: any[] = [];
  let unreadCount = 0;
  let isLoading = false;
  let markAsRead: ((id: string) => Promise<void>) | null = null;
  let markAllAsRead: (() => Promise<void>) | null = null;
  let deleteNotification: ((id: string) => Promise<void>) | null = null;
  let clearAllNotifications: (() => Promise<void>) | null = null;
  let refreshNotifications: (() => Promise<void>) | null = null;
  
  try {
    const notificationContext = useNotifications();
    notifications = notificationContext.notifications;
    unreadCount = notificationContext.unreadCount;
    isLoading = notificationContext.isLoading;
    markAsRead = notificationContext.markAsRead;
    markAllAsRead = notificationContext.markAllAsRead;
    deleteNotification = notificationContext.deleteNotification;
    clearAllNotifications = notificationContext.clearAllNotifications;
    refreshNotifications = notificationContext.refreshNotifications;
  } catch (error) {
    console.warn('NotificationProvider not available in Notifications page');
  }
  
  const [settings, setSettings] = useState(notificationSettings);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    // Refresh notifications when component mounts
    if (refreshNotifications) {
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Remove automatic marking as read - let user explicitly mark as read

const getNotificationIcon = (type: string) => {
  switch (type) {
      case 'TRANSACTION_UPDATE':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'PAYMENT':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'SHIPPING':
        return <Package className="h-4 w-4 text-purple-600" />;
      case 'DELIVERY':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'MESSAGE':
        return <MessageCircle className="h-4 w-4 text-orange-600" />;
      case 'DISPUTE':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'SYSTEM':
        return <Bell className="h-4 w-4 text-gray-600" />;
    default:
        return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActionButtonText = (nextAction: string) => {
    switch (nextAction) {
      case 'proceed_to_fill_shipping_details':
        return 'Fill Shipping Details';
      case 'proceed_with_payment':
        return 'Proceed with Payment';
      case 'proceed_to_ship_goods':
        return 'Ship Goods';
      case 'confirm_receipt':
        return 'Confirm Receipt';
      case 'view_transaction':
        return 'View Transaction';
      default:
        return 'Take Action';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      default:
    return true;
    }
  });

  const handleMarkAsRead = async (notificationId: string) => {
    if (markAsRead) {
      await markAsRead(notificationId);
      toast.success('Notification marked as read');
    } else {
      toast.error('Notification system not available');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (deleteNotification) {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } else {
      toast.error('Notification system not available');
    }
  };

  const handleClearAll = async () => {
    if (clearAllNotifications) {
      await clearAllNotifications();
      toast.success('All notifications cleared');
    } else {
      toast.error('Notification system not available');
    }
  };

  const handleRefresh = async () => {
    if (refreshNotifications) {
      await refreshNotifications();
      toast.success('Notifications refreshed');
    } else {
      toast.error('Notification system not available');
    }
  };

  const handleSettingChange = (settingId: string, enabled: boolean) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === settingId ? { ...setting, enabled } : setting
      )
    );
    toast.success(`Notification setting updated`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>


        {/* Main Content */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                Read ({notifications.filter(n => n.isRead).length})
              </Button>
            </div>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Notifications</span>
                  {unreadCount > 0 && markAllAsRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark All Read
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading notifications...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                      {filter === 'all' 
                        ? "You're all caught up! New notifications will appear here."
                        : `No ${filter} notifications found.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Notifications hidden</h3>
                    <p className="text-muted-foreground">
                      Notification cards have been removed from this page.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                    <Label className="text-sm font-medium">{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={setting.enabled}
                      onCheckedChange={(enabled) => handleSettingChange(setting.id, enabled)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}