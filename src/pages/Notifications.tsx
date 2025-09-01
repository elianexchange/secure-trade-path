import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Mail
} from 'lucide-react';

const notifications = [
  {
    id: 'NOT-001',
    type: 'payment',
    title: 'Payment Received in Escrow',
    message: 'Your payment of $2,499.00 for MacBook Pro 16" M3 has been securely held in escrow.',
    time: '2 minutes ago',
    read: false,
    priority: 'high',
    orderId: 'ORD-001'
  },
  {
    id: 'NOT-002',
    type: 'order',
    title: 'Vendor Confirmed Order',
    message: 'TechVendor Pro has confirmed your order and will begin processing shortly.',
    time: '15 minutes ago',
    read: false,
    priority: 'medium',
    orderId: 'ORD-001'
  },
  {
    id: 'NOT-003',
    type: 'shipping',
    title: 'Item Shipped',
    message: 'Your iPhone 15 Pro has been shipped. Tracking number: TRK987654321',
    time: '2 hours ago',
    read: true,
    priority: 'medium',
    orderId: 'ORD-002'
  },
  {
    id: 'NOT-004',
    type: 'message',
    title: 'New Message from Vendor',
    message: 'Home Supplies Co. sent you a message regarding your office chair order.',
    time: '1 day ago',
    read: true,
    priority: 'low',
    orderId: 'ORD-003'
  },
  {
    id: 'NOT-005',
    type: 'delivery',
    title: 'Delivery Completed',
    message: 'Your iPhone 15 Pro has been delivered. Please confirm receipt to release payment.',
    time: '2 days ago',
    read: false,
    priority: 'high',
    orderId: 'ORD-002'
  }
];

const notificationSettings = [
  {
    id: 'order_updates',
    label: 'Order Updates',
    description: 'Get notified when your order status changes',
    enabled: true
  },
  {
    id: 'payment_alerts',
    label: 'Payment Alerts', 
    description: 'Notifications for payment and escrow activities',
    enabled: true
  },
  {
    id: 'vendor_messages',
    label: 'Vendor Messages',
    description: 'New messages from vendors',
    enabled: true
  },
  {
    id: 'delivery_updates',
    label: 'Delivery Updates',
    description: 'Shipping and delivery notifications',
    enabled: true
  },
  {
    id: 'promotional',
    label: 'Promotional',
    description: 'Special offers and platform updates',
    enabled: false
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'payment':
      return DollarSign;
    case 'order':
      return Package;
    case 'shipping':
      return Package;
    case 'message':
      return MessageCircle;
    case 'delivery':
      return CheckCircle;
    default:
      return Bell;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-destructive text-destructive-foreground';
    case 'medium':
      return 'bg-warning text-warning-foreground';
    case 'low':
      return 'bg-info text-info-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [settings, setSettings] = useState(notificationSettings);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'payment') return notification.type === 'payment';
    if (activeTab === 'orders') return ['order', 'shipping', 'delivery'].includes(notification.type);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Stay updated on your orders and transactions</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filter Tabs */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All', count: notifications.length },
                  { id: 'unread', label: 'Unread', count: unreadCount },
                  { id: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
                  { id: 'orders', label: 'Orders', count: notifications.filter(n => ['order', 'shipping', 'delivery'].includes(n.type)).length }
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="gap-2"
                  >
                    {tab.label}
                    <Badge variant="secondary" className="text-xs">
                      {tab.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              
              return (
                <Card 
                  key={notification.id} 
                  className={`shadow-card transition-colors ${
                    !notification.read ? 'border-l-4 border-l-primary bg-primary-light/5' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        !notification.read ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium ${
                                !notification.read ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {notification.time}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {notification.orderId}
                              </Badge>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredNotifications.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No notifications found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "No notifications match your current filter."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CheckCircle className="h-4 w-4" />
                Mark All as Read
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Trash2 className="h-4 w-4" />
                Clear All Read
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Notification Settings</CardTitle>
              <CardDescription>Customize what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{setting.label}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(setting.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card bg-info-light/10">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-info" />
                Stay Informed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enable notifications to stay updated on important order changes, payments, and messages from vendors.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}