import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X, Package, Truck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import CustomDatePicker from '@/components/ui/custom-date-picker';

interface ShipmentVerificationProps {
  onConfirm: (shipmentData: ShipmentData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ShipmentData {
  photos: File[];
  trackingNumber: string;
  courierService: string;
  estimatedDelivery: string;
  packagingDetails: string;
  itemCondition: string;
  additionalNotes: string;
}

const courierServices = [
  'DHL',
  'FedEx',
  'UPS',
  'USPS',
  'GIG Logistics',
  'Max.ng',
  'Jumia Logistics',
  'Kwik Delivery',
  'Other'
];

export default function ShipmentVerification({ onConfirm, onCancel, isLoading = false }: ShipmentVerificationProps) {
  const [shipmentData, setShipmentData] = useState<ShipmentData>({
    photos: [],
    trackingNumber: '',
    courierService: '',
    estimatedDelivery: '',
    packagingDetails: '',
    itemCondition: 'EXCELLENT',
    additionalNotes: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: File[]) => {
    console.log('ShipmentVerification: handleFileUpload called with files:', files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      console.log('ShipmentVerification: Validating file:', file.name, 'type:', file.type, 'size:', file.size);
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    console.log('ShipmentVerification: Valid files:', validFiles);

    if (validFiles.length > 0) {
      setShipmentData(prev => {
        const newPhotos = [...prev.photos, ...validFiles].slice(0, 5); // Max 5 photos
        console.log('ShipmentVerification: Updated photos:', newPhotos);
        return {
          ...prev,
          photos: newPhotos
        };
      });
      toast.success(`${validFiles.length} photo(s) added successfully`);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFileUpload(files);
  };

  const removePhoto = (index: number) => {
    setShipmentData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (shipmentData.photos.length === 0) {
      toast.error('Please upload at least one photo of the item');
      return;
    }
    if (!shipmentData.trackingNumber.trim()) {
      toast.error('Please enter tracking number');
      return;
    }
    if (!shipmentData.courierService) {
      toast.error('Please select courier service');
      return;
    }
    if (!shipmentData.estimatedDelivery) {
      toast.error('Please enter estimated delivery date');
      return;
    }

    onConfirm(shipmentData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>Shipment Verification</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Please provide verification details and photos of the item being shipped to ensure transaction security.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Item Photos (Required)</Label>
            <p className="text-xs text-muted-foreground">
              Upload clear photos of the item being shipped. This helps verify the item condition and authenticity.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Photo Upload Button */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => {
                  console.log('ShipmentVerification: Upload button clicked');
                  fileInputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                  console.log('ShipmentVerification: Drag over event');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  console.log('ShipmentVerification: Drag leave event');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  const files = Array.from(e.dataTransfer.files);
                  console.log('ShipmentVerification: Drop event with files:', files);
                  handleFileUpload(files);
                }}
              >
                <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-600">Add Photo</p>
                <p className="text-xs text-gray-400">Max 5 photos</p>
                <p className="text-xs text-gray-400 mt-1">Drag & drop or click</p>
              </div>

              {/* Display uploaded photos */}
              {shipmentData.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Shipment photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
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
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Tracking Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Tracking Number *</Label>
              <Input
                id="trackingNumber"
                value={shipmentData.trackingNumber}
                onChange={(e) => setShipmentData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Enter tracking number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courierService">Courier Service *</Label>
              <Select
                value={shipmentData.courierService}
                onValueChange={(value) => setShipmentData(prev => ({ ...prev, courierService: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select courier service" />
                </SelectTrigger>
                <SelectContent>
                  {courierServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <CustomDatePicker
                label="Estimated Delivery Date"
                value={shipmentData.estimatedDelivery}
                onChange={(value) => setShipmentData(prev => ({ ...prev, estimatedDelivery: value }))}
                placeholder="Select delivery date"
                required={true}
                minDate={new Date().toISOString().split('T')[0]} // Today
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemCondition">Item Condition</Label>
              <Select
                value={shipmentData.itemCondition}
                onValueChange={(value) => setShipmentData(prev => ({ ...prev, itemCondition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Packaging Details */}
          <div className="space-y-2">
            <Label htmlFor="packagingDetails">Packaging Details</Label>
            <Textarea
              id="packagingDetails"
              value={shipmentData.packagingDetails}
              onChange={(e) => setShipmentData(prev => ({ ...prev, packagingDetails: e.target.value }))}
              placeholder="Describe how the item is packaged (e.g., bubble wrap, box, etc.)"
              rows={3}
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={shipmentData.additionalNotes}
              onChange={(e) => setShipmentData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Any additional information about the shipment"
              rows={3}
            />
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Security Notice</p>
                <p className="text-blue-700 mt-1">
                  These photos and details will be shared with the buyer to verify the shipment. 
                  Ensure all information is accurate as this helps protect both parties in the transaction.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              <Truck className="h-4 w-4 mr-2" />
              {isLoading ? 'Confirming Shipment...' : 'Confirm Shipment'}
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
