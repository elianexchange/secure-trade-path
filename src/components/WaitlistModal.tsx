import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FORMSPREE_URL } from '@/config/waitlist';
import { EMAILJS_CONFIG, EMAIL_TEMPLATE_VARS } from '@/config/email';
import emailjs from '@emailjs/browser';
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
  X,
  Loader2
} from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isLoading?: boolean;
}

export default function WaitlistModal({ isOpen, onClose, onSuccess, isLoading = false }: WaitlistModalProps) {
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

  // Prevent body scroll and fix mobile zoom issues when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      // Prevent zoom on mobile
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
      // Restore normal viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendWelcomeEmail = async (formData: any) => {
    try {
      console.log('Attempting to send welcome email...');
      console.log('EmailJS Config:', EMAILJS_CONFIG);
      
      // Only send email if EmailJS is configured
      if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.log('EmailJS not configured, skipping welcome email');
        return;
      }

      const templateParams = {
        to_name: `${formData.firstName} ${formData.lastName}`,
        to_email: formData.email,
        from_name: 'Tranzio Team',
        company_name: 'Tranzio',
        website_url: window.location.origin,
        social_x: 'https://x.com/tranzio_escrow',
        launch_date: 'Q4 2025'
      };

      console.log('Template params:', templateParams);

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('EmailJS response:', response);
      console.log('Welcome email sent successfully!');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        text: error.text
      });
      // Don't show error to user, just log it
    }
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
    
    try {
      console.log('Submitting form data:', formData);
      console.log('Sending to URL:', FORMSPREE_URL);
      
      // Create a form and submit it to Formspree in a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.name = 'formspree-submit';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = FORMSPREE_URL;
      form.target = 'formspree-submit'; // Submit to the hidden iframe
      form.style.display = 'none';
      
      // Add form fields
      const fields = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || '',
        interest: formData.interest,
        _subject: 'New Tranzio Waitlist Signup'
      };
      
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      // Add form to page and submit
      document.body.appendChild(form);
      form.submit();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 2000);
      
      // Show success immediately
      console.log('Successfully submitted to waitlist!', formData);
      setIsSubmitted(true);
      onSuccess?.();
      
      // Send welcome email
      sendWelcomeEmail(formData);
      
    } catch (error) {
      console.error('Error submitting waitlist:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        formData: formData,
        url: FORMSPREE_URL
      });
      alert(`Failed to submit. Please try again.\n\nError: ${error.message}`);
      setIsSubmitting(false);
    }
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
    // Always allow closing, but reset submitting state if needed
    if (isSubmitting) {
      setIsSubmitting(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
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
                className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors"
                title="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Welcome to the Tranzio Waitlist! 🎉
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Thank you for joining us! We'll notify you as soon as Tranzio is ready to launch.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Expected launch: Q2 2024</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
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
                    className="border-green-300 text-green-700 hover:bg-green-50 h-9 text-sm"
                  >
                    Join Another Person
                  </Button>
                  <Button 
                    onClick={() => window.open('https://x.com/tranzio_escrow', '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
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
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          Let's get to know you
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          We'll use this information to personalize your experience
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="firstName" className="text-xs font-medium text-foreground">
                            First Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="First name"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              className="pl-8 h-9 text-sm"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="lastName" className="text-xs font-medium text-foreground">
                            Last Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Last name"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              className="pl-8 h-9 text-sm"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="email" className="text-xs font-medium text-foreground">
                            Email *
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="Email address"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="pl-8 h-9 text-sm"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                            Phone (Optional)
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="Phone number"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className="pl-8 h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          What brings you to Tranzio?
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Help us understand how you plan to use our platform
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        {interestOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = formData.interest === option.value;
                          
                          return (
                            <div
                              key={option.value}
                              onClick={() => handleInputChange('interest', option.value)}
                              className={`
                                p-2 rounded-lg border-2 cursor-pointer transition-all duration-200
                                ${isSelected 
                                  ? `${option.bgColor} ${option.borderColor} border-2` 
                                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                                }
                              `}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center
                                  ${isSelected ? option.bgColor : 'bg-muted'}
                                `}>
                                  <Icon className={`h-4 w-4 ${isSelected ? option.color : 'text-muted-foreground'}`} />
                                </div>
                                
                                <div className="flex-1">
                                  <h4 className={`font-semibold text-sm ${isSelected ? option.color : 'text-foreground'}`}>
                                    {option.label}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {option.description}
                                  </p>
                                </div>
                                
                                {isSelected && (
                                  <CheckCircle className={`h-4 w-4 ${option.color}`} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          Review Your Information
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Please confirm your details before joining the waitlist
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                            <p className="text-sm text-foreground font-medium">
                              {formData.firstName} {formData.lastName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                            <p className="text-sm text-foreground font-medium">{formData.email}</p>
                          </div>
                          {formData.phone && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                              <p className="text-sm text-foreground font-medium">{formData.phone}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Interest</Label>
                            <p className="text-sm text-foreground font-medium">
                              {interestOptions.find(opt => opt.value === formData.interest)?.label}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="flex items-start space-x-2">
                          <Shield className="h-3 w-3 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 text-xs mb-1">Your data is secure</h4>
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
                  <div className="flex justify-between pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="px-3 h-8 text-sm"
                    >
                      Previous
                    </Button>
                    
                    {currentStep < steps.length ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!isStepValid(currentStep)}
                        className="px-3 h-8 text-sm"
                      >
                        Next
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3 h-8 text-sm bg-primary hover:bg-primary/90"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                            Joining...
                          </>
                        ) : (
                          <>
                            Join Waitlist
                            <CheckCircle className="ml-1 h-3 w-3" />
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
