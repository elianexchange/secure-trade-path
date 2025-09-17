import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  ArrowRight, 
  Mail, 
  User, 
  Phone,
  Shield,
  Clock,
  Star,
  Users,
  Zap,
  X
} from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WaitlistModal({ isOpen, onClose, onSuccess }: WaitlistModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    interest: 'individual' as 'individual' | 'business' | 'marketplace'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = [
    { id: 1, title: 'Contact Info', icon: User, description: 'Tell us about yourself' },
    { id: 2, title: 'Interest', icon: Star, description: 'What brings you here?' },
    { id: 3, title: 'Confirmation', icon: CheckCircle, description: 'You\'re all set!' }
  ];

  const interestOptions = [
    {
      value: 'individual',
      label: 'Individual Trader',
      description: 'I want to buy or sell items securely',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      value: 'business',
      label: 'Business Owner',
      description: 'I run a business and need secure transactions',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      value: 'marketplace',
      label: 'Marketplace Platform',
      description: 'I want to integrate Tranzio into my platform',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        interest: 'individual'
      });
      setIsSubmitted(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    onSuccess?.();
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.email && formData.firstName && formData.lastName;
      case 2:
        return formData.interest;
      default:
        return true;
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 shadow-2xl">
          <CardContent className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center space-x-2 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Join Waitlist</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Welcome to the Tranzio Waitlist! 🎉
                </h3>
                
                <p className="text-lg text-muted-foreground mb-6">
                  Thank you for joining us! We'll notify you as soon as Tranzio is ready to launch.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expected launch: Q2 2024</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsSubmitted(false);
                      setCurrentStep(1);
                      setFormData({
                        email: '',
                        firstName: '',
                        lastName: '',
                        phone: '',
                        interest: 'individual'
                      });
                    }}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Join Another Person
                  </Button>
                  <Button 
                    onClick={() => window.open('https://twitter.com/tranzio', '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Follow Us for Updates
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Be the First to Experience Tranzio
                  </h2>
                  
                  <p className="text-muted-foreground">
                    Get early access to secure escrow trading when we launch
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    {steps.map((step, index) => {
                      const isActive = currentStep === step.id;
                      const isCompleted = currentStep > step.id;
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.id} className="flex items-center">
                          <div className={`
                            w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                            ${isCompleted 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : isActive 
                                ? 'bg-primary border-primary text-white' 
                                : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                            }
                          `}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </div>
                          
                          {index < steps.length - 1 && (
                            <div className={`
                              w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 transition-all duration-300
                              ${isCompleted ? 'bg-green-500' : 'bg-muted-foreground/30'}
                            `} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step Content */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                          Let's get to know you
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          We'll use this information to personalize your experience
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-foreground font-medium">
                            First Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="Enter your first name"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              className="pl-10 h-11"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-foreground font-medium">
                            Last Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Enter your last name"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              className="pl-10 h-11"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">
                          Email Address *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground font-medium">
                          Phone Number (Optional)
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                          What brings you to Tranzio?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Help us understand how you plan to use our platform
                        </p>
                      </div>
                      
                      <div className="grid gap-3">
                        {interestOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = formData.interest === option.value;
                          
                          return (
                            <div
                              key={option.value}
                              onClick={() => handleInputChange('interest', option.value)}
                              className={`
                                p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105
                                ${isSelected 
                                  ? `${option.bgColor} ${option.borderColor} border-2` 
                                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                                }
                              `}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`
                                  w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center
                                  ${isSelected ? option.bgColor : 'bg-muted'}
                                `}>
                                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isSelected ? option.color : 'text-muted-foreground'}`} />
                                </div>
                                
                                <div className="flex-1">
                                  <h4 className={`font-semibold text-sm sm:text-base ${isSelected ? option.color : 'text-foreground'}`}>
                                    {option.label}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    {option.description}
                                  </p>
                                </div>
                                
                                {isSelected && (
                                  <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${option.color}`} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                          Review Your Information
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Please confirm your details before joining the waitlist
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                            <p className="text-sm sm:text-base text-foreground font-medium">
                              {formData.firstName} {formData.lastName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                            <p className="text-sm sm:text-base text-foreground font-medium">{formData.email}</p>
                          </div>
                          {formData.phone && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                              <p className="text-sm sm:text-base text-foreground font-medium">{formData.phone}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Interest</Label>
                            <p className="text-sm sm:text-base text-foreground font-medium">
                              {interestOptions.find(opt => opt.value === formData.interest)?.label}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 text-sm mb-1">Your data is secure</h4>
                            <p className="text-xs text-blue-700">
                              We'll only use your information to notify you about Tranzio updates. 
                              No spam, no sharing with third parties.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="px-4 sm:px-6"
                    >
                      Previous
                    </Button>
                    
                    {currentStep < steps.length ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!isStepValid(currentStep)}
                        className="px-4 sm:px-6"
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 sm:px-6 bg-primary hover:bg-primary/90"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Joining...
                          </>
                        ) : (
                          <>
                            Join Waitlist
                            <CheckCircle className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
