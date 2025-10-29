import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, User, Phone, Home } from 'lucide-react';
import { toast } from 'sonner';
import { DeliveryDetailsRequest } from '@/types';

interface DeliveryDetailsFormProps {
  onSubmit: (details: DeliveryDetailsRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function DeliveryDetailsForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: DeliveryDetailsFormProps) {
  const [formData, setFormData] = useState<DeliveryDetailsRequest>({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria'
  });

  const [errors, setErrors] = useState<Partial<DeliveryDetailsRequest>>({});

  const handleInputChange = (field: keyof DeliveryDetailsRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryDetailsRequest> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(\+234|234|0)?[789][01]\d{8}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid Nigerian phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    } else {
      toast.error('Please fill in all required fields correctly');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>Delivery Details</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please provide your delivery address for this transaction
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className={`mt-1 ${errors.fullName ? 'border-red-500' : ''}`}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+234 800 000 0000"
                  className={`mt-1 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Address Information</span>
            </h3>

            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                Street Address *
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your street address"
                className={`mt-1 min-h-[80px] resize-none ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-medium">
                  City *
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  className={`mt-1 ${errors.city ? 'border-red-500' : ''}`}
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state" className="text-sm font-medium">
                  State *
                </Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger className={`mt-1 ${errors.state ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-sm text-red-600 mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium">
                  ZIP Code *
                </Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="123456"
                  className={`mt-1 ${errors.zipCode ? 'border-red-500' : ''}`}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="country" className="text-sm font-medium">
                Country
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="mt-1"
                readOnly
              />
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Delivery Instructions</span>
            </h3>
            
            <div>
              <Label htmlFor="instructions" className="text-sm font-medium">
                Special Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="Any special delivery instructions, landmarks, or notes for the delivery person..."
                className="mt-1 min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Saving...' : 'Save Details'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
