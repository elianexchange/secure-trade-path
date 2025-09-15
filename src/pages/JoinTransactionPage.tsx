import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Link as LinkIcon, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function JoinTransactionPage() {
  const navigate = useNavigate();
  const [transactionLink, setTransactionLink] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  console.log('JoinTransactionPage rendered'); // Debug log

  const handleJoinTransaction = async () => {
    if (!transactionLink.trim()) {
      toast.error('Please enter a transaction link');
      return;
    }

    setIsValidating(true);

    try {
      // Extract invitation code from the link
      const url = new URL(transactionLink);
      const pathParts = url.pathname.split('/');
      const invitationCode = pathParts[pathParts.length - 1];

      if (!invitationCode) {
        toast.error('Invalid transaction link. Please check the link and try again.');
        setIsValidating(false);
        return;
      }

      // Navigate to the join transaction page with the invitation code
      navigate(`/app/join-transaction/${invitationCode}`);
    } catch (error) {
      toast.error('Invalid link format. Please check the link and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAlreadyJoined = () => {
    navigate('/app/transactions');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-0">
        {/* Header */}
        <div className="flex justify-end mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <LinkIcon className="h-6 w-6 text-primary" />
              <span>Join Existing Transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                Please paste the Link you received from the Person you are transacting with.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="transactionLink" className="text-sm font-medium">
                Link
              </label>
              <Input
                id="transactionLink"
                type="url"
                placeholder="https://app.tranzio.com/join-transaction/ABC123"
                value={transactionLink}
                onChange={(e) => setTransactionLink(e.target.value)}
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleJoinTransaction}
              disabled={isValidating || !transactionLink.trim()}
              className="w-full"
              size="lg"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>

            <div className="text-center">
              <Button 
                variant="link" 
                onClick={handleAlreadyJoined}
                className="text-muted-foreground hover:text-foreground"
              >
                Already joined the Transaction? Click here to confirm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>How it works</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Copy the transaction link shared with you</p>
            <p>2. Paste it in the field above</p>
            <p>3. Click "Confirm" to join the transaction</p>
            <p>4. Review transaction details and accept</p>
            <p>5. Complete any required steps (shipping, payment)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
