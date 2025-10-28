import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  ArrowLeft, 
  DollarSign, 
  Truck, 
  Package, 
  UserX, 
  FileText,
  Shield,
  Info,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { disputesAPI, transactionsAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useChatbot } from '@/contexts/ChatbotContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

interface Transaction {
  id: string;
  description: string;
  price: number;
  currency: string;
  status: string;
  counterparty?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const CreateDispute: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const { setIsOpen: setChatbotOpen } = useChatbot();

  const [loading, setLoading] = useState(false);
  const [disputeMeta, setDisputeMeta] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [formData, setFormData] = useState({
    transactionId: transactionId || '',
    disputeType: '',
    reason: '',
    description: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    console.log('CreateDispute: Component mounted, loading data...');
    loadDisputeMeta();
    loadUserTransactions();
  }, []);

  useEffect(() => {
    if (transactionId && userTransactions.length > 0) {
      const transaction = userTransactions.find(t => t.id === transactionId);
      if (transaction) {
        setSelectedTransaction(transaction);
        setFormData(prev => ({ ...prev, transactionId }));
      }
    }
  }, [transactionId, userTransactions]);

  const loadDisputeMeta = async () => {
    try {
      console.log('CreateDispute: Loading dispute metadata...');
      const response = await disputesAPI.getDisputeMeta();
      console.log('CreateDispute: Dispute metadata response:', response);
      if (response.success) {
        setDisputeMeta(response.data);
        console.log('CreateDispute: Dispute metadata loaded successfully');
      } else {
        console.error('CreateDispute: Failed to load dispute metadata:', response.error);
      }
    } catch (error) {
      console.error('CreateDispute: Error loading dispute metadata:', error);
    }
  };

  const loadUserTransactions = async () => {
    try {
      if (!user?.id) {
        console.log('CreateDispute: No authenticated user, skipping transaction load');
        setUserTransactions([]);
        return;
      }

      console.log('CreateDispute: Loading transactions for user:', user.id);
      
      // Fetch real transactions from API
      const transactions = await transactionsAPI.getMyTransactions();
      console.log('CreateDispute: Received transactions from API:', transactions?.length || 0);
      
      if (transactions && Array.isArray(transactions)) {
        // Transform API data to match the expected format
        const formattedTransactions: Transaction[] = transactions.map((tx: any) => ({
          id: tx.id,
          description: tx.description || 'No description',
          price: tx.total || tx.price || 0,
          currency: tx.currency || 'NGN',
          status: tx.status || 'ACTIVE',
          counterparty: tx.counterparty ? {
            id: tx.counterparty.id,
            firstName: tx.counterparty.firstName || 'Unknown',
            lastName: tx.counterparty.lastName || 'User'
          } : null
        }));
        
        console.log('CreateDispute: Formatted transactions:', formattedTransactions);
        setUserTransactions(formattedTransactions);
      } else {
        console.log('CreateDispute: No transactions found or invalid format');
        setUserTransactions([]);
      }
    } catch (error) {
      console.error('CreateDispute: Error loading transactions:', error);
      toast.error('Failed to load transactions. Please try again.');
      setUserTransactions([]);
    }
  };

  const getDisputeTypeIcon = (type: string) => {
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
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.transactionId || !formData.disputeType || !formData.reason || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await disputesAPI.createDispute({
        transactionId: formData.transactionId,
        disputeType: formData.disputeType as any,
        reason: formData.reason,
        description: formData.description,
        priority: formData.priority as any
      });

      if (response.success) {
        toast.success('Dispute created successfully');
        navigate(`/app/disputes/${response.data.id}`);
      } else {
        toast.error('Failed to create dispute');
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create dispute';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSelect = (transactionId: string) => {
    const transaction = userTransactions.find(t => t.id === transactionId);
    setSelectedTransaction(transaction || null);
    setFormData(prev => ({ ...prev, transactionId }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/disputes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Disputes
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raise a Dispute</h1>
          <p className="text-gray-600 mt-1">
            Create a new dispute for a transaction issue
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setChatbotOpen(true)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Need Help?
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Transaction
            </CardTitle>
            <CardDescription>
              Choose the transaction you want to raise a dispute for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="transaction">Transaction *</Label>
                <Select 
                  value={formData.transactionId} 
                  onValueChange={handleTransactionSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTransactions.length === 0 ? (
                      <SelectItem value="no-transactions" disabled>
                        No transactions available
                      </SelectItem>
                    ) : (
                      userTransactions
                        .filter(t => t.status === 'ACTIVE' || t.status === 'COMPLETED')
                        .map((transaction) => (
                        <SelectItem key={transaction.id} value={transaction.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{transaction.description}</span>
                            <span className="text-sm text-gray-500">
                              {formatCurrency(transaction.price, transaction.currency)} • 
                              {transaction.counterparty ? 
                                ` with ${transaction.counterparty.firstName} ${transaction.counterparty.lastName}` : 
                                ' No counterparty'
                              }
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedTransaction && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Selected Transaction:</strong> {selectedTransaction.description}<br />
                    <strong>Amount:</strong> {formatCurrency(selectedTransaction.price, selectedTransaction.currency)}<br />
                    <strong>Counterparty:</strong> {selectedTransaction.counterparty ? 
                      `${selectedTransaction.counterparty.firstName} ${selectedTransaction.counterparty.lastName}` : 
                      'No counterparty'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dispute Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Dispute Details
            </CardTitle>
            <CardDescription>
              Provide details about the issue you're experiencing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="disputeType">Dispute Type *</Label>
                <Select 
                  value={formData.disputeType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, disputeType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispute type" />
                  </SelectTrigger>
                  <SelectContent>
                    {!disputeMeta?.disputeTypes ? (
                      <SelectItem value="loading" disabled>
                        Loading dispute types...
                      </SelectItem>
                    ) : (
                      disputeMeta.disputeTypes.map((type: any) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {getDisputeTypeIcon(type.value)}
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeMeta?.priorities?.map((priority: any) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div>
                          <div className="font-medium">{priority.label}</div>
                          <div className="text-sm text-gray-500">{priority.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                placeholder="Brief reason for the dispute"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.reason.length}/200 characters
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the issue..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Please ensure you have attempted to resolve the issue 
            directly with the other party before raising a dispute. Disputes are reviewed 
            by our support team and may take 1-3 business days to resolve.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link to="/app/disputes">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !formData.transactionId || !formData.disputeType || !formData.reason || !formData.description}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Dispute...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Raise Dispute
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDispute;
