import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Calculator, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  DollarSign,
  Percent,
  Target,
  BarChart3
} from 'lucide-react';
import { escrowCalculatorAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface FeeCalculationResult {
  baseFee: number;
  riskAdjustment: number;
  totalFee: number;
  feePercentage: number;
  feeAmount: number;
  totalAmount: number;
  transactionAmount: number;
  currency: string;
  breakdown: {
    baseFee: number;
    amountRisk: number;
    verificationRisk: number;
    historyRisk: number;
    categoryRisk: number;
    deliveryRisk: number;
    paymentRisk: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendations: string[];
  riskFactors?: any;
  isEstimate?: boolean;
  note?: string;
}

export function EscrowCalculator() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [calculation, setCalculation] = useState<FeeCalculationResult | null>(null);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    transactionAmount: '',
    transactionType: 'GOODS' as 'GOODS' | 'SERVICES' | 'DIGITAL' | 'REAL_ESTATE',
    categoryName: '',
    deliveryMethod: 'SHIPPING' as 'PICKUP' | 'SHIPPING' | 'DIGITAL_DELIVERY',
    paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CARD' | 'CRYPTO',
  });

  // Load fee structure on component mount
  useEffect(() => {
    loadFeeStructure();
  }, []);

  const loadFeeStructure = async () => {
    try {
      const result = await escrowCalculatorAPI.getFeeStructure();
      if (result.success) {
        setFeeStructure(result.data);
      }
    } catch (error) {
      console.error('Failed to load fee structure:', error);
    }
  };

  const handleCalculate = async () => {
    if (!formData.transactionAmount || !formData.categoryName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await escrowCalculatorAPI.calculateFee({
        transactionAmount: parseFloat(formData.transactionAmount),
        transactionType: formData.transactionType,
        categoryName: formData.categoryName,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
      });

      if (result.success) {
        setCalculation(result.data);
        toast.success('Fee calculated successfully!');
      } else {
        toast.error('Failed to calculate fee');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('Failed to calculate fee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEstimate = async () => {
    if (!formData.transactionAmount || !formData.categoryName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await escrowCalculatorAPI.estimateFee({
        transactionAmount: parseFloat(formData.transactionAmount),
        transactionType: formData.transactionType,
        categoryName: formData.categoryName,
      });

      if (result.success) {
        setCalculation(result.data);
        toast.success('Quick estimate generated!');
      } else {
        toast.error('Failed to generate estimate');
      }
    } catch (error) {
      console.error('Estimate error:', error);
      toast.error('Failed to generate estimate');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'VERY_HIGH': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return <CheckCircle2 className="h-4 w-4" />;
      case 'MEDIUM': return <Info className="h-4 w-4" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'VERY_HIGH': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-blue-600" />
            Escrow Fee Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.transactionAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionAmount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, transactionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOODS">Goods</SelectItem>
                  <SelectItem value="SERVICES">Services</SelectItem>
                  <SelectItem value="DIGITAL">Digital</SelectItem>
                  <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Electronics, Jewelry, Books"
                value={formData.categoryName}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery Method</Label>
              <Select
                value={formData.deliveryMethod}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICKUP">Pickup</SelectItem>
                  <SelectItem value="SHIPPING">Shipping</SelectItem>
                  <SelectItem value="DIGITAL_DELIVERY">Digital Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleCalculate}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Calculating...' : 'Calculate Detailed Fee'}
            </Button>
            <Button 
              onClick={handleQuickEstimate}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? 'Estimating...' : 'Quick Estimate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                Fee Calculation Result
              </span>
              <Badge className={`${getRiskLevelColor(calculation.riskLevel)} border`}>
                <span className="flex items-center">
                  {getRiskLevelIcon(calculation.riskLevel)}
                  <span className="ml-1">{calculation.riskLevel} Risk</span>
                </span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ₦{calculation.transactionAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">Transaction Amount</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      ₦{calculation.feeAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-orange-600">Escrow Fee</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₦{calculation.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Total Amount</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold">
                    Fee Rate: {calculation.feePercentage.toFixed(2)}%
                  </div>
                  <Progress 
                    value={(calculation.feePercentage / 5) * 100} 
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    Range: 0.5% - 5.0%
                  </div>
                </div>

                {calculation.isEstimate && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <Info className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 font-medium">Quick Estimate</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      {calculation.note}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Base Fee</span>
                    <span className="font-mono">+{calculation.breakdown.baseFee.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Amount Risk</span>
                    <span className="font-mono">+{calculation.breakdown.amountRisk.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Verification Risk</span>
                    <span className="font-mono">+{calculation.breakdown.verificationRisk.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">History Risk</span>
                    <span className="font-mono">+{calculation.breakdown.historyRisk.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Category Risk</span>
                    <span className="font-mono">+{calculation.breakdown.categoryRisk.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Delivery Risk</span>
                    <span className="font-mono">+{calculation.breakdown.deliveryRisk.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                    <span className="font-medium">Payment Risk</span>
                    <span className="font-mono">+{calculation.breakdown.paymentRisk.toFixed(2)}%</span>
                  </div>
                </div>

                <Separator />
                
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg font-semibold">
                  <span>Total Fee</span>
                  <span className="font-mono">{calculation.feePercentage.toFixed(2)}%</span>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {calculation.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {calculation.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                        <Target className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-800">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No specific recommendations at this time.</p>
                    <p className="text-sm">Your transaction has a good risk profile.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {feeStructure && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-purple-600" />
              Fee Structure Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {feeStructure.baseFee}%
                </div>
                <div className="text-sm text-blue-600">Base Fee</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {feeStructure.minFee}%
                </div>
                <div className="text-sm text-green-600">Minimum Fee</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {feeStructure.maxFee}%
                </div>
                <div className="text-sm text-red-600">Maximum Fee</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Risk Factors</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Amount Risk</h5>
                  <div className="text-xs space-y-1">
                    <div>• Low: {feeStructure.riskFactors.amount.low}</div>
                    <div>• Medium: {feeStructure.riskFactors.amount.medium}</div>
                    <div>• High: {feeStructure.riskFactors.amount.high}</div>
                    <div>• Very High: {feeStructure.riskFactors.amount.veryHigh}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Verification Level</h5>
                  <div className="text-xs space-y-1">
                    <div>• Basic: {feeStructure.riskFactors.verification.basic}</div>
                    <div>• Enhanced: {feeStructure.riskFactors.verification.enhanced}</div>
                    <div>• Premium: {feeStructure.riskFactors.verification.premium}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
