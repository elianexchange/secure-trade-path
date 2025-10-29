import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Users, 
  Gavel,
  DollarSign,
  Truck,
  Package,
  UserX,
  Activity,
  Zap,
  Shield
} from 'lucide-react';
import { disputeService, Dispute, DisputeMetrics, DisputeDashboard } from '@/services/disputeService';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';

interface DisputeDashboardProps {
  className?: string;
  showFullDashboard?: boolean;
}

export default function DisputeDashboard({ className = '', showFullDashboard = false }: DisputeDashboardProps) {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [dashboard, setDashboard] = useState<DisputeDashboard | null>(null);
  const [metrics, setMetrics] = useState<DisputeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time listeners
    const unsubscribeDisputes = disputeService.addDisputeListener((disputes) => {
      console.log('DisputeDashboard: Received dispute update:', disputes);
      loadDashboardData(); // Refresh dashboard data
    });
    
    const unsubscribeMetrics = disputeService.addMetricsListener((newMetrics) => {
      console.log('DisputeDashboard: Received metrics update:', newMetrics);
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
      unsubscribeDisputes();
      unsubscribeMetrics();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isConnected]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, metricsResponse] = await Promise.all([
        disputeService.getDisputeDashboard(),
        disputeService.getDisputeMetrics()
      ]);

      if (dashboardResponse.success) {
        setDashboard(dashboardResponse.data);
      }
      
      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dispute dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisputeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return <DollarSign className="h-4 w-4" />;
      case 'DELIVERY':
        return <Truck className="h-4 w-4" />;
      case 'QUALITY':
        return <Package className="h-4 w-4" />;
      case 'FRAUD':
        return <UserX className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_REVIEW':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CLOSED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusColor = (status: 'ON_TIME' | 'AT_RISK' | 'OVERDUE') => {
    switch (status) {
      case 'ON_TIME':
        return 'bg-green-100 text-green-800';
      case 'AT_RISK':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!metrics) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Dispute Data</h3>
            <p className="text-gray-600">Dispute metrics will appear here when available.</p>
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
          <h2 className="text-xl font-semibold text-gray-900">Dispute Management</h2>
          <p className="text-sm text-gray-600">
            Real-time dispute tracking and resolution
            {isConnected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live
              </span>
            )}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Disputes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Disputes</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalDisputes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Open Disputes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.openDisputes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        {/* In Review */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.inReviewDisputes}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Resolved */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{metrics.resolvedDisputes}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatTime(metrics.averageResolutionTime)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Escalation Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics.escalationRate.toFixed(1)}%
                </p>
              </div>
              <Zap className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics.totalDisputes > 0 
                    ? ((metrics.resolvedDisputes / metrics.totalDisputes) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Shield className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Priority Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Object.entries(metrics.priorityBreakdown).map(([priority, count]) => (
              <div key={priority} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{priority}</div>
                <Badge className={getPriorityColor(priority)}>
                  {priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Disputes */}
      {showFullDashboard && dashboard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Disputes</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/disputes">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboard.recentDisputes.length === 0 ? (
              <div className="text-center py-8">
                <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Disputes</h3>
                <p className="text-gray-600">Recent dispute activity will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentDisputes.slice(0, 5).map((dispute) => {
                  const slaStatus = disputeService.calculateSLAStatus(dispute);
                  const timeToResolution = disputeService.calculateTimeToResolution(dispute);
                  
                  return (
                    <div key={dispute.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {getDisputeIcon(dispute.disputeType)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{dispute.reason}</span>
                            <Badge className={getPriorityColor(dispute.priority)}>
                              {dispute.priority}
                            </Badge>
                            <Badge className={getStatusIcon(dispute.status).props.className}>
                              {getStatusIcon(dispute.status)}
                              <span className="ml-1">{dispute.status.replace('_', ' ')}</span>
                            </Badge>
                            <Badge className={getSLAStatusColor(slaStatus)}>
                              {slaStatus.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(dispute.transaction.price, dispute.transaction.currency)} • 
                            {formatTime(timeToResolution)} • 
                            {formatDate(dispute.createdAt)}
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/app/disputes/${dispute.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Urgent Disputes Alert */}
      {dashboard && dashboard.urgentDisputes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Urgent Disputes Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.urgentDisputes.map((dispute) => (
                <div key={dispute.id} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-900">{dispute.reason}</span>
                    <Badge className="bg-red-100 text-red-800">URGENT</Badge>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/app/disputes/${dispute.id}`}>
                      Resolve Now
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
