import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  MessageSquare, 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  Truck,
  Package,
  UserX,
  Shield,
  Send,
  Paperclip,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { disputesAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useParams } from 'react-router-dom';

interface Dispute {
  id: string;
  transactionId: string;
  disputeType: string;
  reason: string;
  description: string;
  status: string;
  priority: string;
  resolution?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  transaction: {
    id: string;
    description: string;
    price: number;
    currency: string;
  };
  raiser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  accused: {
    id: string;
    firstName: string;
    lastName: string;
  };
  evidence: any[];
  messages: any[];
  resolutions: any[];
}

const DisputeDetails: React.FC = () => {
  const { user } = useAuth();
  const { disputeId } = useParams<{ disputeId: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [disputeMeta, setDisputeMeta] = useState<any>(null);

  useEffect(() => {
    if (disputeId) {
      loadDispute();
      loadDisputeMeta();
    }
  }, [disputeId]);

  const loadDispute = async () => {
    try {
      setLoading(true);
      const response = await disputesAPI.getDispute(disputeId!);
      if (response.success) {
        setDispute(response.data);
      }
    } catch (error) {
      console.error('Error loading dispute:', error);
      toast.error('Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const loadDisputeMeta = async () => {
    try {
      const response = await disputesAPI.getDisputeMeta();
      if (response.success) {
        setDisputeMeta(response.data);
      }
    } catch (error) {
      console.error('Error loading dispute metadata:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !disputeId) return;

    try {
      setSendingMessage(true);
      const response = await disputesAPI.addMessage({
        disputeId,
        content: newMessage.trim()
      });

      if (response.success) {
        setNewMessage('');
        await loadDispute(); // Reload to get new message
        toast.success('Message sent successfully');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getDisputeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return <DollarSign className="h-5 w-5" />;
      case 'DELIVERY':
        return <Truck className="h-5 w-5" />;
      case 'QUALITY':
        return <Package className="h-5 w-5" />;
      case 'FRAUD':
        return <UserX className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
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

  const isUserInvolved = dispute && (dispute.raiser.id === user?.id || dispute.accused.id === user?.id);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dispute not found</h3>
            <p className="text-gray-600 mb-4">
              The dispute you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link to="/app/disputes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Disputes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/disputes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Disputes
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getDisputeIcon(dispute.disputeType)}
            <h1 className="text-2xl font-bold text-gray-900">{dispute.reason}</h1>
            <Badge className={getPriorityColor(dispute.priority)}>
              {dispute.priority}
            </Badge>
            <Badge className={getStatusColor(dispute.status)}>
              {getStatusIcon(dispute.status)}
              <span className="ml-1">{dispute.status.replace('_', ' ')}</span>
            </Badge>
          </div>
          <p className="text-gray-600">
            Dispute #{dispute.id} • Created {formatDate(dispute.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-gray-900 mt-1">{dispute.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Transaction</Label>
                  <p className="text-gray-900 mt-1">{dispute.transaction.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-gray-900 mt-1">
                    {formatCurrency(dispute.transaction.price, dispute.transaction.currency)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Raised by</Label>
                  <p className="text-gray-900 mt-1">
                    {dispute.raiser.firstName} {dispute.raiser.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Against</Label>
                  <p className="text-gray-900 mt-1">
                    {dispute.accused.firstName} {dispute.accused.lastName}
                  </p>
                </div>
              </div>

              {dispute.resolution && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Resolution</Label>
                  <p className="text-gray-900 mt-1">{dispute.resolution}</p>
                  {dispute.resolutionNotes && (
                    <p className="text-gray-600 mt-1">{dispute.resolutionNotes}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {dispute.messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                ) : (
                  dispute.messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {message.sender?.firstName?.[0] || 'S'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.sender?.firstName} {message.sender?.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.createdAt)}
                          </span>
                          {message.isInternal && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                        </div>
                        <p className="text-gray-900 text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isUserInvolved && dispute.status !== 'CLOSED' && (
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="self-end"
                    >
                      {sendingMessage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {isUserInvolved && dispute.status === 'OPEN' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Evidence
                </Button>
                <Button className="w-full" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Propose Resolution
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dispute.evidence.length === 0 ? (
                <p className="text-gray-500 text-sm">No evidence uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {dispute.evidence.map((evidence) => (
                    <div key={evidence.id} className="flex items-center gap-2 p-2 border rounded">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{evidence.fileName}</p>
                        <p className="text-xs text-gray-500">
                          by {evidence.uploader?.firstName} {evidence.uploader?.lastName}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolutions */}
          {dispute.resolutions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Resolutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dispute.resolutions.map((resolution) => (
                    <div key={resolution.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{resolution.resolutionType}</Badge>
                        <Badge className={
                          resolution.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          resolution.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {resolution.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{resolution.resolution}</p>
                      <p className="text-xs text-gray-500 mt-1">{resolution.reason}</p>
                      {resolution.amount && (
                        <p className="text-sm text-gray-600 mt-1">
                          Amount: {formatCurrency(resolution.amount, dispute.transaction.currency)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{dispute.transaction.description}</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(dispute.transaction.price, dispute.transaction.currency)}
                </p>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to={`/app/transactions/${dispute.transactionId}`}>
                    View Transaction
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetails;
