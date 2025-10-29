import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  Zap,
  Shield,
  Eye,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Gavel
} from 'lucide-react';
import { 
  disputeTrackingService, 
  DisputeTrackingEvent, 
  DisputeTrackingDashboard as TrackingDashboard,
  DisputeTrackingMetrics 
} from '@/services/disputeTrackingService';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface DisputeTrackingDashboardProps {
  className?: string;
  showFullDashboard?: boolean;
}

export default function DisputeTrackingDashboard({ 
  className = '', 
  showFullDashboard = false 
}: DisputeTrackingDashboardProps) {
  const { isConnected } = useWebSocket();
  const [dashboard, setDashboard] = useState<TrackingDashboard | null>(null);
  const [metrics, setMetrics] = useState<DisputeTrackingMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<DisputeTrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time listeners
    const unsubscribeEvents = disputeTrackingService.addEventListener((events) => {
      console.log('DisputeTrackingDashboard: Received events:', events);
      loadDashboardData();
    });
    
    const unsubscribeMetrics = disputeTrackingService.addMetricsListener((newMetrics) => {
      console.log('DisputeTrackingDashboard: Received metrics update:', newMetrics);
      setMetrics(newMetrics);
      setLastUpdated(new Date());
    });

    // Refresh data periodically if WebSocket is not connected
    let refreshInterval: NodeJS.Timeout;
    if (!isConnected) {
      refreshInterval = setInterval(() => {
        loadDashboardData();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      unsubscribeEvents();
      unsubscribeMetrics();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isConnected]);

  const loadDashboardData = () => {
    try {
      const dashboardData = disputeTrackingService.getDashboard();
      const metricsData = disputeTrackingService.getMetrics();
      const eventsData = disputeTrackingService.getEvents({ limit: 20 });
      
      setDashboard(dashboardData);
      setMetrics(metricsData);
      setRecentEvents(eventsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load tracking dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return <Activity className="h-4 w-4" />;
      case 'PRIORITY_CHANGE':
        return <TrendingUp className="h-4 w-4" />;
      case 'ASSIGNMENT_CHANGE':
        return <Users className="h-4 w-4" />;
      case 'MESSAGE_ADDED':
        return <MessageSquare className="h-4 w-4" />;
      case 'EVIDENCE_ADDED':
        return <FileText className="h-4 w-4" />;
      case 'RESOLUTION_PROPOSED':
        return <Gavel className="h-4 w-4" />;
      case 'RESOLUTION_ACCEPTED':
        return <CheckCircle className="h-4 w-4" />;
      case 'RESOLUTION_REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'SLA_BREACH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'ESCALATION':
        return <Zap className="h-4 w-4" />;
      case 'AUTO_ACTION':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
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

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!dashboard || !metrics) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracking Data</h3>
            <p className="text-gray-600">Dispute tracking data will appear here when available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dispute Tracking</h2>
          <p className="text-sm text-gray-600">
            Real-time dispute activity and performance metrics
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

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Events Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.eventsToday}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Escalations Today</p>
                <p className="text-2xl font-bold text-orange-600">{dashboard.escalationsToday}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.averageResolutionTime}h</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.resolutionRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.escalationRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Escalation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{metrics.averageResponseTime}m</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Events by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {Object.entries(metrics.eventsByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Urgent Alerts */}
      {dashboard.urgentAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Urgent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.urgentAlerts.map((event) => (
                <Alert key={event.id} className="border-red-200 bg-white">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-red-900">{event.title}</div>
                        <div className="text-sm text-red-800">{event.description}</div>
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      {showFullDashboard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Events</h3>
                <p className="text-gray-600">Recent dispute events will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{event.title}</span>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                      
                      <div className="text-xs text-gray-500">
                        {formatDate(event.timestamp)}
                        {event.userName && (
                          <>
                            <span> • </span>
                            <span>by {event.userName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Real-time Tracking</h4>
              <p className="text-sm text-blue-800">
                All dispute activities are tracked in real-time with complete audit trails. 
                This ensures transparency, accountability, and helps identify patterns for 
                continuous improvement of the dispute resolution process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
