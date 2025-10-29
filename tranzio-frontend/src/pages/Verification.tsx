import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  FileText,
  User,
  CreditCard,
  AlertCircle,
  Star
} from 'lucide-react';
import { verificationAPI } from '@/services/api';
import { toast } from 'sonner';

interface VerificationStatus {
  user: {
    verificationLevel: string;
    trustScore: number;
    isVerified: boolean;
    nin: string | null;
    bvn: string | null;
  };
  documents: Array<{
    documentType: string;
    isVerified: boolean;
    verifiedAt: string | null;
    rejectionReason: string | null;
  }>;
  history: Array<{
    verificationType: string;
    status: string;
    createdAt: string;
    notes: string | null;
  }>;
}

export default function Verification() {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // NIN Verification Form
  const [ninForm, setNinForm] = useState({
    nin: '',
    firstName: '',
    lastName: '',
    dateOfBirth: ''
  });

  // BVN Verification Form
  const [bvnForm, setBvnForm] = useState({
    bvn: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  // Document Upload Form
  const [documentForm, setDocumentForm] = useState({
    documentType: 'DRIVERS_LICENSE' as 'DRIVERS_LICENSE' | 'PASSPORT' | 'UTILITY_BILL' | 'BANK_STATEMENT',
    documentNumber: '',
    documentImage: ''
  });

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await verificationAPI.getVerificationStatus();
      if (response.success) {
        setVerificationStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleNINVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await verificationAPI.verifyNIN(ninForm);
      if (response.success) {
        toast.success(response.message);
        setNinForm({ nin: '', firstName: '', lastName: '', dateOfBirth: '' });
        loadVerificationStatus();
      } else {
        toast.error(response.message || 'NIN verification failed');
      }
    } catch (error) {
      console.error('NIN verification error:', error);
      toast.error('NIN verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBVNVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await verificationAPI.verifyBVN(bvnForm);
      if (response.success) {
        toast.success(response.message);
        setBvnForm({ bvn: '', firstName: '', lastName: '', phoneNumber: '' });
        loadVerificationStatus();
      } else {
        toast.error(response.message || 'BVN verification failed');
      }
    } catch (error) {
      console.error('BVN verification error:', error);
      toast.error('BVN verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await verificationAPI.uploadDocument(documentForm);
      if (response.success) {
        toast.success(response.message);
        setDocumentForm({ 
          documentType: 'DRIVERS_LICENSE', 
          documentNumber: '', 
          documentImage: '' 
        });
        loadVerificationStatus();
      } else {
        toast.error(response.message || 'Document upload failed');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Document upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setDocumentForm(prev => ({ ...prev, documentImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getVerificationLevelColor = (level: string) => {
    switch (level) {
      case 'BASIC': return 'bg-gray-100 text-gray-800';
      case 'ENHANCED': return 'bg-blue-100 text-blue-800';
      case 'PREMIUM': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !verificationStatus) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
          <p className="text-gray-600">
            Verify your identity to increase your trust score and unlock premium features
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nin">NIN Verification</TabsTrigger>
            <TabsTrigger value="bvn">BVN Verification</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Verification Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {verificationStatus && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {verificationStatus.user.verificationLevel}
                        </div>
                        <div className="text-sm text-gray-600">Verification Level</div>
                        <Badge className={`mt-2 ${getVerificationLevelColor(verificationStatus.user.verificationLevel)}`}>
                          {verificationStatus.user.verificationLevel}
                        </Badge>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {verificationStatus.user.trustScore}/100
                        </div>
                        <div className="text-sm text-gray-600">Trust Score</div>
                        <Progress 
                          value={verificationStatus.user.trustScore} 
                          className="mt-2"
                        />
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {verificationStatus.user.isVerified ? 'Verified' : 'Unverified'}
                        </div>
                        <div className="text-sm text-gray-600">Account Status</div>
                        {verificationStatus.user.isVerified ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mt-2" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600 mx-auto mt-2" />
                        )}
                      </div>
                    </div>

                    {/* Verification Progress */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Verification Progress</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Basic Profile</span>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>NIN Verification</span>
                          </div>
                          {verificationStatus.user.nin ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>BVN Verification</span>
                          </div>
                          {verificationStatus.user.bvn ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verification History */}
                    {verificationStatus.history.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                        <div className="space-y-2">
                          {verificationStatus.history.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(item.status)}
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.verificationType.replace('_', ' ')}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={item.status === 'APPROVED' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  NIN Verification
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Verify your National Identification Number to increase your trust score
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNINVerification} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nin">NIN Number</Label>
                      <Input
                        id="nin"
                        type="text"
                        placeholder="12345678901"
                        value={ninForm.nin}
                        onChange={(e) => setNinForm(prev => ({ ...prev, nin: e.target.value }))}
                        maxLength={11}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={ninForm.dateOfBirth}
                        onChange={(e) => setNinForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={ninForm.firstName}
                        onChange={(e) => setNinForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={ninForm.lastName}
                        onChange={(e) => setNinForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Verifying...' : 'Verify NIN'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bvn" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  BVN Verification
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Verify your Bank Verification Number for premium verification
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBVNVerification} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bvn">BVN Number</Label>
                      <Input
                        id="bvn"
                        type="text"
                        placeholder="12345678901"
                        value={bvnForm.bvn}
                        onChange={(e) => setBvnForm(prev => ({ ...prev, bvn: e.target.value }))}
                        maxLength={11}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+234 801 234 5678"
                        value={bvnForm.phoneNumber}
                        onChange={(e) => setBvnForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bvnFirstName">First Name</Label>
                      <Input
                        id="bvnFirstName"
                        type="text"
                        value={bvnForm.firstName}
                        onChange={(e) => setBvnForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bvnLastName">Last Name</Label>
                      <Input
                        id="bvnLastName"
                        type="text"
                        value={bvnForm.lastName}
                        onChange={(e) => setBvnForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Verifying...' : 'Verify BVN'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Document Upload
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Upload additional identity documents for enhanced verification
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDocumentUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="documentType">Document Type</Label>
                      <select
                        id="documentType"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={documentForm.documentType}
                        onChange={(e) => setDocumentForm(prev => ({ 
                          ...prev, 
                          documentType: e.target.value as any 
                        }))}
                        required
                      >
                        <option value="DRIVERS_LICENSE">Driver's License</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="UTILITY_BILL">Utility Bill</option>
                        <option value="BANK_STATEMENT">Bank Statement</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="documentNumber">Document Number</Label>
                      <Input
                        id="documentNumber"
                        type="text"
                        value={documentForm.documentNumber}
                        onChange={(e) => setDocumentForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="documentImage">Document Image</Label>
                    <Input
                      id="documentImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a clear image of your document
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Document Status */}
            {verificationStatus && verificationStatus.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {verificationStatus.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(doc.isVerified ? 'APPROVED' : 'PENDING')}
                          <div>
                            <div className="font-medium text-sm">
                              {doc.documentType.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-gray-600">
                              {doc.verifiedAt ? 
                                `Verified on ${new Date(doc.verifiedAt).toLocaleDateString()}` :
                                'Pending review'
                              }
                            </div>
                          </div>
                        </div>
                        <Badge variant={doc.isVerified ? 'default' : 'secondary'}>
                          {doc.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
