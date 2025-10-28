import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  Filter,
  MessageSquare,
  FileText,
  Shield,
  DollarSign,
  Truck,
  Package,
  UserX,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { disputesAPI } from '@/services/api';
import { disputeService, Dispute, DisputeFilters } from '@/services/disputeService';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Link } from 'react-router-dom';

// Dispute interface is now imported from disputeService

const Disputes: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDisputes();
    
    // Set up real-time listeners
    const unsubscribeDisputes = disputeService.addDisputeListener((newDisputes) => {
      console.log('Disputes page: Received dispute update:', newDisputes);
      loadDisputes(); // Refresh disputes list
    });

    // Refresh data periodically if WebSocket is not connected
    let refreshInterval: NodeJS.Timeout;
    if (!isConnected) {
      refreshInterval = setInterval(() => {
        loadDisputes();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      unsubscribeDisputes();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isConnected]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const filters: DisputeFilters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchTerm || undefined
      };
      
      const response = await disputeService.getUserDisputes(filters);
      console.log('🔍 Disputes page - loadDisputes response:', response);
      if (response.success) {
        console.log('🔍 Disputes page - Setting disputes:', response.data);
        setDisputes(response.data);
        setLastUpdated(new Date());
        console.log('🔍 Disputes page - Disputes state updated, count:', response.data.length);
      } else {
        console.error('🔍 Disputes page - Response not successful:', response);
      }
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  // Reload disputes when filters change
  useEffect(() => {
    if (!loading) {
      loadDisputes();
    }
  }, [statusFilter, typeFilter, priorityFilter, searchTerm]);

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
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Disputes are now filtered by the API, so we can use them directly
  const filteredDisputes = disputes;
  
  // Debug logging
  console.log('🔍 Disputes page - Current disputes state:', disputes);
  console.log('🔍 Disputes page - Filtered disputes:', filteredDisputes);
  console.log('🔍 Disputes page - Disputes length:', disputes.length);
  console.log('🔍 Disputes page - Filtered disputes length:', filteredDisputes.length);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
          <p className="text-gray-600 mt-1">
            Manage and resolve transaction disputes
            {isConnected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live Updates
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link to="/app/disputes/create">
            <Plus className="h-4 w-4 mr-2" />
            Raise Dispute
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Disputes</p>
                <p className="text-2xl font-bold text-gray-900">{disputes.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {disputes.filter(d => d.status === 'OPEN').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-blue-600">
                  {disputes.filter(d => d.status === 'IN_REVIEW').length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {disputes.filter(d => d.status === 'RESOLVED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search disputes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="DELIVERY">Delivery</SelectItem>
                <SelectItem value="QUALITY">Quality</SelectItem>
                <SelectItem value="FRAUD">Fraud</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
              <p className="text-gray-600 mb-4">
                {disputes.length === 0 
                  ? "You haven't raised or been involved in any disputes yet."
                  : "No disputes match your current filters."
                }
              </p>
              {disputes.length === 0 && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/app/disputes/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Raise Your First Dispute
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDisputes.map((dispute) => {
            const slaStatus = disputeService.calculateSLAStatus(dispute);
            const timeToResolution = disputeService.calculateTimeToResolution(dispute);
            
            return (
              <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getDisputeIcon(dispute.disputeType)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dispute.reason}
                        </h3>
                        <Badge className={getPriorityColor(dispute.priority)}>
                          {dispute.priority}
                        </Badge>
                        <Badge className={getStatusColor(dispute.status)}>
                          {getStatusIcon(dispute.status)}
                          <span className="ml-1">{dispute.status.replace('_', ' ')}</span>
                        </Badge>
                        <Badge className={getSLAStatusColor(slaStatus)}>
                          {slaStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {dispute.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>Transaction: {dispute.transaction.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(dispute.transaction.price, dispute.transaction.currency)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(dispute.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>Time: {formatTime(timeToResolution)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/app/disputes/${dispute.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    {dispute.status === 'OPEN' && (
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Link to={`/app/disputes/${dispute.id}/resolve`}>
                          <Shield className="h-4 w-4 mr-2" />
                          Resolve
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Disputes;
