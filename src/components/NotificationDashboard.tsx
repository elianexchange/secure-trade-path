import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellRing, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Monitor,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  Activity,
  Filter,
  Search
} from 'lucide-react';
import { 
  enhancedNotificationService, 
  NotificationData, 
  NotificationPreferences,
  NotificationTemplate,
  NotificationRule
} from '@/services/enhancedNotificationService';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationDashboardProps {
  className?: string;
  showFullDashboard?: boolean;
}

export default function NotificationDashboard({ 
  className = '', 
  showFullDashboard = false 
}: NotificationDashboardProps) {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filter, setFilter] = useState({
    type: 'all',
    category: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time listeners
    const unsubscribeNotifications = enhancedNotificationService.addEventListener((newNotifications) => {
      console.log('NotificationDashboard: Received notifications:', newNotifications);
      loadDashboardData();
    });

    // Refresh data periodically if WebSocket is not connected
    let refreshInterval: NodeJS.Timeout;
    if (!isConnected) {
      refreshInterval = setInterval(() => {
        loadDashboardData();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      unsubscribeNotifications();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isConnected, user?.id]);

  const loadDashboardData = () => {
    try {
      const notificationsData = enhancedNotificationService.getNotifications(user?.id, 50);
      const preferencesData = user?.id ? enhancedNotificationService.getUserPreferences(user.id) : null;
      const templatesData = enhancedNotificationService.getTemplates();
      const rulesData = enhancedNotificationService.getRules();
      
      setNotifications(notificationsData);
      setPreferences(preferencesData);
      setTemplates(templatesData);
      setRules(rulesData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load notification dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'URGENT':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'WARNING':
        return 'bg-orange-100 text-orange-800';
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800';
      case 'DELIVERED':
        return 'bg-blue-100 text-blue-800';
      case 'READ':
        return 'bg-purple-100 text-purple-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = (notificationId: string) => {
    enhancedNotificationService.markAsRead(notificationId);
    loadDashboardData();
  };

  const handleUpdatePreferences = (updates: Partial<NotificationPreferences>) => {
    if (user?.id) {
      enhancedNotificationService.updateUserPreferences(user.id, updates);
      loadDashboardData();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter.type !== 'all' && notification.type !== filter.type) return false;
    if (filter.category !== 'all' && notification.category !== filter.category) return false;
    if (filter.status !== 'all' && notification.status !== filter.status) return false;
    return true;
  });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600">
            Manage your notification preferences and view recent activity
            {isConnected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.status !== 'READ').length}
                </p>
              </div>
              <BellRing className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.status === 'FAILED').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-bold text-green-600">{templates.length}</p>
              </div>
              <Settings className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <select
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="DISPUTE">Dispute</option>
                  <option value="TRANSACTION">Transaction</option>
                  <option value="SYSTEM">System</option>
                  <option value="SECURITY">Security</option>
                  <option value="PAYMENT">Payment</option>
                </select>
                
                <select
                  value={filter.category}
                  onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                  <option value="SUCCESS">Success</option>
                  <option value="URGENT">Urgent</option>
                </select>
                
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="SENT">Sent</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="READ">Read</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                  <p className="text-gray-600">No notifications match your current filters.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0 mt-1">
                        {getCategoryIcon(notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{notification.title}</span>
                          <Badge className={getCategoryColor(notification.category)}>
                            {notification.category}
                          </Badge>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Badge className={getStatusColor(notification.status)}>
                            {notification.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          <span>•</span>
                          <span>{formatDate(notification.createdAt)}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            {notification.channels.map((channel, index) => (
                              <span key={index} className="flex items-center gap-1">
                                {channel === 'EMAIL' && <Mail className="h-3 w-3" />}
                                {channel === 'SMS' && <MessageSquare className="h-3 w-3" />}
                                {channel === 'PUSH' && <Smartphone className="h-3 w-3" />}
                                {channel === 'IN_APP' && <Monitor className="h-3 w-3" />}
                                {channel}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {notification.status !== 'READ' && (
                        <Button
                          onClick={() => handleMarkAsRead(notification.id)}
                          variant="outline"
                          size="sm"
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          {preferences ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Channel Preferences */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.email}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ email: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.sms}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ sms: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Push Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.push}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ push: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>In-App Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.inApp}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ inApp: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Category Preferences */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Notification Categories</h3>
                  <div className="space-y-4">
                    {Object.entries(preferences.categories).map(([category, enabled]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category.toLowerCase()}</span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            handleUpdatePreferences({
                              categories: {
                                ...preferences.categories,
                                [category]: checked
                              }
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Quiet Hours</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Enable Quiet Hours</span>
                      <Switch
                        checked={preferences.quietHours.enabled}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({
                            quietHours: {
                              ...preferences.quietHours,
                              enabled: checked
                            }
                          })
                        }
                      />
                    </div>
                    
                    {preferences.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Start Time</label>
                          <input
                            type="time"
                            value={preferences.quietHours.start}
                            onChange={(e) => 
                              handleUpdatePreferences({
                                quietHours: {
                                  ...preferences.quietHours,
                                  start: e.target.value
                                }
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">End Time</label>
                          <input
                            type="time"
                            value={preferences.quietHours.end}
                            onChange={(e) => 
                              handleUpdatePreferences({
                                quietHours: {
                                  ...preferences.quietHours,
                                  end: e.target.value
                                }
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Preferences</h3>
                <p className="text-gray-600">Notification preferences will appear here when available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates</h3>
                  <p className="text-gray-600">Notification templates will appear here when available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="text-xs text-gray-500">
                        Type: {template.type} • Channels: {template.channels.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Notification Security</h4>
              <p className="text-sm text-blue-800">
                All notifications are encrypted and delivered securely. Your preferences are 
                respected, and you can control exactly what notifications you receive and when.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
