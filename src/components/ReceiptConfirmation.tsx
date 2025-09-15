import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Shield, Package, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReceiptConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  onRaiseDispute: () => void;
  isLoading?: boolean;
  shipmentData?: {
    photos?: (File | string)[];
    trackingNumber: string;
    courierService: string;
    estimatedDelivery: string;
    packagingDetails: string;
    itemCondition: string;
    additionalNotes: string;
  };
  transactionAmount?: number;
  currency?: string;
}

export default function ReceiptConfirmation({ 
  onConfirm, 
  onCancel, 
  onRaiseDispute, 
  isLoading = false,
  shipmentData,
  transactionAmount,
  currency = 'NGN'
}: ReceiptConfirmationProps) {
  const [confirmations, setConfirmations] = useState({
    itemReceived: false,
    itemMatchesDescription: false,
    itemConditionAcceptable: false,
    understandFundRelease: false,
    noDisputes: false
  });

  const handleConfirmationChange = (key: keyof typeof confirmations, checked: boolean) => {
    setConfirmations(prev => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = () => {
    // Check if all confirmations are made
    const allConfirmed = Object.values(confirmations).every(Boolean);
    
    if (!allConfirmed) {
      toast.error('Please confirm all items before proceeding');
      return;
    }

    onConfirm();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Shipment Details */}
      {shipmentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <span>Shipment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                <p className="text-sm text-gray-900">{shipmentData.trackingNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Courier Service</p>
                <p className="text-sm text-gray-900">{shipmentData.courierService}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Estimated Delivery</p>
                <p className="text-sm text-gray-900">{new Date(shipmentData.estimatedDelivery).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Item Condition</p>
                <p className="text-sm text-gray-900">{shipmentData.itemCondition}</p>
              </div>
            </div>

            {shipmentData.packagingDetails && (
              <div>
                <p className="text-sm font-medium text-gray-700">Packaging Details</p>
                <p className="text-sm text-gray-900">{shipmentData.packagingDetails}</p>
              </div>
            )}

            {shipmentData.additionalNotes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Additional Notes</p>
                <p className="text-sm text-gray-900">{shipmentData.additionalNotes}</p>
              </div>
            )}

            {/* Shipment Photos */}
            {shipmentData.photos && shipmentData.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Item Photos</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {shipmentData.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
                      alt={`Shipment photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Receipt Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Confirm Receipt of Goods</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Please carefully review the item and confirm receipt. This action will release funds to the seller.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confirmation Checklist */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="itemReceived"
                checked={confirmations.itemReceived}
                onCheckedChange={(checked) => handleConfirmationChange('itemReceived', checked as boolean)}
              />
              <div className="flex-1">
                <label htmlFor="itemReceived" className="text-sm font-medium cursor-pointer">
                  I have received the item as described
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  The item has been delivered to me and I have physically received it.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="itemMatchesDescription"
                checked={confirmations.itemMatchesDescription}
                onCheckedChange={(checked) => handleConfirmationChange('itemMatchesDescription', checked as boolean)}
              />
              <div className="flex-1">
                <label htmlFor="itemMatchesDescription" className="text-sm font-medium cursor-pointer">
                  The item matches the description provided
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  The received item is exactly as described in the transaction details.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="itemConditionAcceptable"
                checked={confirmations.itemConditionAcceptable}
                onCheckedChange={(checked) => handleConfirmationChange('itemConditionAcceptable', checked as boolean)}
              />
              <div className="flex-1">
                <label htmlFor="itemConditionAcceptable" className="text-sm font-medium cursor-pointer">
                  The item condition is acceptable
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  The item is in the condition as described and meets my expectations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="understandFundRelease"
                checked={confirmations.understandFundRelease}
                onCheckedChange={(checked) => handleConfirmationChange('understandFundRelease', checked as boolean)}
              />
              <div className="flex-1">
                <label htmlFor="understandFundRelease" className="text-sm font-medium cursor-pointer">
                  I understand that funds will be released to the seller
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirming receipt will release {transactionAmount ? formatCurrency(transactionAmount, currency) : 'the funds'} to the seller.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="noDisputes"
                checked={confirmations.noDisputes}
                onCheckedChange={(checked) => handleConfirmationChange('noDisputes', checked as boolean)}
              />
              <div className="flex-1">
                <label htmlFor="noDisputes" className="text-sm font-medium cursor-pointer">
                  I have no disputes or issues with this transaction
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  I am satisfied with the transaction and have no complaints.
                </p>
              </div>
            </div>
          </div>

          {/* Critical Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900">Critical Warning</p>
                <p className="text-red-700 mt-1">
                  Once you confirm receipt, the funds will be immediately released to the seller and this action cannot be reversed. 
                  Please ensure you are completely satisfied with the item before proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Dispute Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Having Issues?</p>
                <p className="text-yellow-700 mt-1">
                  If the item doesn't match the description, is damaged, or you have any concerns, 
                  please raise a dispute before confirming receipt. Our support team will help resolve the issue.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !Object.values(confirmations).every(Boolean)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? 'Confirming Receipt...' : 'Confirm Receipt & Release Funds'}
            </Button>
            <Button
              variant="outline"
              onClick={onRaiseDispute}
              disabled={isLoading}
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              Raise Dispute
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
