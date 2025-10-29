import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DisputeFormProps {
  onSubmit: (disputeData: DisputeData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  transactionId?: string;
}

interface DisputeData {
  reason: string;
  description: string;
  evidence: File[];
  requestedResolution: string;
  contactPreference: string;
}

const disputeReasons = [
  'Item not as described',
  'Item damaged during shipping',
  'Item not received',
  'Wrong item received',
  'Item quality issues',
  'Seller not responding',
  'Payment issues',
  'Other'
];

const resolutionOptions = [
  'Full refund',
  'Partial refund',
  'Item replacement',
  'Return and refund',
  'Compensation for damages',
  'Other'
];

const contactPreferences = [
  'Email',
  'Phone call',
  'In-app messaging',
  'No preference'
];

export default function DisputeForm({ onSubmit, onCancel, isLoading = false, transactionId }: DisputeFormProps) {
  const [disputeData, setDisputeData] = useState<DisputeData>({
    reason: '',
    description: '',
    evidence: [],
    requestedResolution: '',
    contactPreference: 'Email'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEvidenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setDisputeData(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...validFiles].slice(0, 10) // Max 10 files
      }));
      toast.success(`${validFiles.length} file(s) added successfully`);
    }
  };

  const removeEvidence = (index: number) => {
    setDisputeData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!disputeData.reason) {
      toast.error('Please select a dispute reason');
      return;
    }
    if (!disputeData.description.trim()) {
      toast.error('Please provide a detailed description');
      return;
    }
    if (!disputeData.requestedResolution) {
      toast.error('Please select your requested resolution');
      return;
    }

    onSubmit(disputeData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Raise a Dispute</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Please provide detailed information about your dispute. Our support team will review your case and work to resolve it fairly.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction ID */}
          {transactionId && (
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input value={transactionId} disabled className="bg-gray-50" />
            </div>
          )}

          {/* Dispute Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Dispute *</Label>
            <Select
              value={disputeData.reason}
              onValueChange={(value) => setDisputeData(prev => ({ ...prev, reason: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the reason for your dispute" />
              </SelectTrigger>
              <SelectContent>
                {disputeReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={disputeData.description}
              onChange={(e) => setDisputeData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide a detailed description of the issue. Include specific details about what went wrong, when it happened, and how it has affected you."
              rows={6}
            />
          </div>

          {/* Evidence Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Evidence (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload photos, documents, or other evidence that supports your dispute. This can include photos of damaged items, screenshots of conversations, receipts, etc.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Upload Button */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-600">Add Evidence</p>
                <p className="text-xs text-gray-400">Max 10 files</p>
              </div>

              {/* Display uploaded files */}
              {disputeData.evidence.map((file, index) => (
                <div key={index} className="relative">
                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                  <button
                    onClick={() => removeEvidence(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleEvidenceUpload}
              className="hidden"
            />
          </div>

          {/* Requested Resolution */}
          <div className="space-y-2">
            <Label htmlFor="requestedResolution">Requested Resolution *</Label>
            <Select
              value={disputeData.requestedResolution}
              onValueChange={(value) => setDisputeData(prev => ({ ...prev, requestedResolution: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="What resolution are you seeking?" />
              </SelectTrigger>
              <SelectContent>
                {resolutionOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Preference */}
          <div className="space-y-2">
            <Label htmlFor="contactPreference">Preferred Contact Method</Label>
            <Select
              value={disputeData.contactPreference}
              onValueChange={(value) => setDisputeData(prev => ({ ...prev, contactPreference: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactPreferences.map((preference) => (
                  <SelectItem key={preference} value={preference}>
                    {preference}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Information Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Dispute Process</p>
                <p className="text-blue-700 mt-1">
                  Once you submit this dispute, our support team will review your case within 24-48 hours. 
                  We will contact you using your preferred method to discuss the resolution. 
                  All disputes are handled fairly and in accordance with our terms of service.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isLoading ? 'Submitting Dispute...' : 'Submit Dispute'}
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
