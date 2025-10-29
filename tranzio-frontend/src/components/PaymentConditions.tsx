import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Calendar,
  Shield,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';
import { paymentConditionsAPI } from '@/services/api';
import { toast } from 'sonner';

interface PaymentCondition {
  id: string;
  transactionId: string;
  conditionType: string;
  conditionValue: string | null;
  isMet: boolean;
  metAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentConditionsProps {
  transactionId: string;
  transactionStatus: string;
  canManageConditions?: boolean;
}

export function PaymentConditions({ 
  transactionId, 
  transactionStatus, 
  canManageConditions = true 
}: PaymentConditionsProps) {
  const [conditions, setConditions] = useState<PaymentCondition[]>([]);
  const [autoReleaseEnabled, setAutoReleaseEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualReason, setManualReason] = useState('');

  useEffect(() => {
    loadConditions();
  }, [transactionId]);

  const loadConditions = async () => {
    try {
      setLoading(true);
      const response = await paymentConditionsAPI.getTransactionConditions(transactionId);
      if (response.success) {
        setConditions(response.data.conditions);
        setAutoReleaseEnabled(response.data.autoReleaseEnabled);
      }
    } catch (error) {
      console.error('Error loading payment conditions:', error);
      toast.error('Failed to load payment conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeBasedRelease = async () => {
    if (!releaseDate) {
      toast.error('Please select a release date');
      return;
    }

    try {
      setLoading(true);
      const response = await paymentConditionsAPI.setTimeBasedRelease({
        transactionId,
        releaseDate
      });

      if (response.success) {
        toast.success(response.message);
        setShowTimeDialog(false);
        setReleaseDate('');
        loadConditions();
      } else {
        toast.error(response.message || 'Failed to set time-based release');
      }
    } catch (error) {
      console.error('Error setting time-based release:', error);
      toast.error('Failed to set time-based release');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRelease = async () => {
    try {
      setLoading(true);
      const response = await paymentConditionsAPI.manualRelease({
        transactionId,
        reason: manualReason
      });

      if (response.success) {
        toast.success(response.message);
        setShowManualDialog(false);
        setManualReason('');
        loadConditions();
      } else {
        toast.error(response.message || 'Failed to release payment manually');
      }
    } catch (error) {
      console.error('Error releasing payment manually:', error);
      toast.error('Failed to release payment manually');
    } finally {
      setLoading(false);
    }
  };

  const getConditionIcon = (type: string, isMet: boolean) => {
    switch (type) {
      case 'TIME_BASED':
        return <Clock className={`h-4 w-4 ${isMet ? 'text-green-600' : 'text-blue-600'}`} />;
      case 'DELIVERY_CONFIRMED':
        return <CheckCircle className={`h-4 w-4 ${isMet ? 'text-green-600' : 'text-blue-600'}`} />;
      case 'MANUAL_APPROVAL':
        return <Shield className={`h-4 w-4 ${isMet ? 'text-green-600' : 'text-blue-600'}`} />;
      case 'DISPUTE_RESOLVED':
        return <AlertTriangle className={`h-4 w-4 ${isMet ? 'text-green-600' : 'text-blue-600'}`} />;
      default:
        return <Settings className={`h-4 w-4 ${isMet ? 'text-green-600' : 'text-blue-600'}`} />;
    }
  };

  const getConditionDescription = (condition: PaymentCondition) => {
    switch (condition.conditionType) {
      case 'TIME_BASED':
        if (condition.conditionValue) {
          const value = JSON.parse(condition.conditionValue);
          return `Auto-release on ${new Date(value.releaseDate).toLocaleDateString()}`;
        }
        return 'Time-based auto-release';
      case 'DELIVERY_CONFIRMED':
        return 'Release when delivery is confirmed';
      case 'MANUAL_APPROVAL':
        return 'Manual approval required';
      case 'DISPUTE_RESOLVED':
        return 'Release when dispute is resolved';
      default:
        return condition.conditionType.replace('_', ' ').toLowerCase();
    }
  };

  const canSetConditions = canManageConditions && 
    ['ACTIVE', 'WAITING_FOR_PAYMENT', 'WAITING_FOR_SHIPMENT', 'SHIPMENT_CONFIRMED'].includes(transactionStatus);

  const canReleaseManually = canManageConditions && 
    ['SHIPMENT_CONFIRMED', 'WAITING_FOR_BUYER_CONFIRMATION'].includes(transactionStatus);

  if (loading && conditions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Conditions
          </div>
          {autoReleaseEnabled && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Play className="h-3 w-3 mr-1" />
              Auto-Release Enabled
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {conditions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No payment conditions set</p>
            <p className="text-sm">Set conditions for automatic payment release</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition) => (
              <div
                key={condition.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  condition.isMet 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getConditionIcon(condition.conditionType, condition.isMet)}
                  <div>
                    <div className="font-medium text-sm">
                      {getConditionDescription(condition)}
                    </div>
                    {condition.metAt && (
                      <div className="text-xs text-gray-500">
                        Met on {new Date(condition.metAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <Badge 
                  variant={condition.isMet ? 'default' : 'secondary'}
                  className={condition.isMet ? 'bg-green-100 text-green-800' : ''}
                >
                  {condition.isMet ? 'Met' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {canSetConditions && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Set Time Release
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Time-Based Auto Release</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="releaseDate">Release Date</Label>
                    <Input
                      id="releaseDate"
                      type="datetime-local"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowTimeDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleTimeBasedRelease}
                      disabled={loading || !releaseDate}
                    >
                      {loading ? 'Setting...' : 'Set Auto Release'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                // Add delivery confirmation condition
                paymentConditionsAPI.createCondition({
                  transactionId,
                  conditionType: 'DELIVERY_CONFIRMED'
                }).then(() => {
                  toast.success('Delivery confirmation condition added');
                  loadConditions();
                });
              }}
            >
              <CheckCircle className="h-4 w-4" />
              Add Delivery Condition
            </Button>
          </div>
        )}

        {canReleaseManually && (
          <div className="pt-4 border-t">
            <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Release Payment Now
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manual Payment Release</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Input
                      id="reason"
                      placeholder="Enter reason for manual release..."
                      value={manualReason}
                      onChange={(e) => setManualReason(e.target.value)}
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will immediately release the payment to the seller. 
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowManualDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleManualRelease}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Releasing...' : 'Release Payment'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {!canSetConditions && !canReleaseManually && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Payment conditions cannot be modified in the current transaction state
          </div>
        )}
      </CardContent>
    </Card>
  );
}
