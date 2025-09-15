import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  FileText,
  User,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { KYCVerificationRequest } from '@/types';

interface KYCVerificationProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function KYCVerification({ onComplete, onCancel }: KYCVerificationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nin: '',
    bvn: '',
    documentType: 'NIN' as 'NIN' | 'BVN',
    documentNumber: '',
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    ninDocument?: File;
    bvnDocument?: File;
    selfie?: File;
  }>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: 'ninDocument' | 'bvnDocument' | 'selfie', file: File) => {
    setUploadedDocuments(prev => ({ ...prev, [type]: file }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('KYC verification submitted successfully!');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
        <p className="text-sm text-muted-foreground">
          Please provide your personal details for verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="Enter your full name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth" className="text-sm font-medium">
            Date of Birth
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phoneNumber" className="text-sm font-medium">
            Phone Number
          </Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            placeholder="+234 800 000 0000"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium">
            Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter your address"
            className="mt-1"
          />
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please ensure all information matches your official documents exactly.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CreditCard className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Identity Documents</h2>
        <p className="text-sm text-muted-foreground">
          Provide your NIN and BVN for verification
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nin" className="text-sm font-medium">
            National Identification Number (NIN)
          </Label>
          <Input
            id="nin"
            value={formData.nin}
            onChange={(e) => handleInputChange('nin', e.target.value)}
            placeholder="Enter your 11-digit NIN"
            maxLength={11}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bvn" className="text-sm font-medium">
            Bank Verification Number (BVN)
          </Label>
          <Input
            id="bvn"
            value={formData.bvn}
            onChange={(e) => handleInputChange('bvn', e.target.value)}
            placeholder="Enter your 11-digit BVN"
            maxLength={11}
            className="mt-1"
          />
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your NIN and BVN are encrypted and stored securely. We use this information only for verification purposes.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
          <Upload className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Document Upload</h2>
        <p className="text-sm text-muted-foreground">
          Upload clear photos of your documents
        </p>
      </div>

      <div className="space-y-6">
        {/* NIN Document Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">NIN Document</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload a clear photo of your NIN slip
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('ninDocument', file);
              }}
              className="hidden"
              id="nin-upload"
            />
            <label
              htmlFor="nin-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </label>
            {uploadedDocuments.ninDocument && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {uploadedDocuments.ninDocument.name}
              </p>
            )}
          </div>
        </div>

        {/* BVN Document Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">BVN Document</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload a clear photo of your BVN document
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('bvnDocument', file);
              }}
              className="hidden"
              id="bvn-upload"
            />
            <label
              htmlFor="bvn-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </label>
            {uploadedDocuments.bvnDocument && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {uploadedDocuments.bvnDocument.name}
              </p>
            )}
          </div>
        </div>

        {/* Selfie Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Selfie with Document</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Take a selfie holding your NIN document
            </p>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('selfie', file);
              }}
              className="hidden"
              id="selfie-upload"
            />
            <label
              htmlFor="selfie-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Take Photo
            </label>
            {uploadedDocuments.selfie && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {uploadedDocuments.selfie.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ensure all documents are clear, well-lit, and all text is readable. 
          Verification typically takes 1-3 business days.
        </AlertDescription>
      </Alert>
    </div>
  );

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.dateOfBirth && formData.phoneNumber && formData.address;
      case 2:
        return formData.nin && formData.bvn && formData.nin.length === 11 && formData.bvn.length === 11;
      case 3:
        return uploadedDocuments.ninDocument && uploadedDocuments.bvnDocument && uploadedDocuments.selfie;
      default:
        return false;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>KYC Verification</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 rounded-full ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handleBack}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Verification'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
