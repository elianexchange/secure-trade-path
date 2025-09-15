import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, ArrowLeft, ArrowRight, Play, Pause, SkipForward } from 'lucide-react';
import { Progress } from './ui/progress';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  action?: string;
  instruction?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Tranzio!',
    description: 'Let\'s explore your dashboard together.',
    target: 'dashboard-main',
    position: 'center',
    action: 'Click Next to start',
    instruction: 'This is your main dashboard.'
  },
  {
    id: 'create-transaction',
    title: 'Create Transaction',
    description: 'Start new transactions here.',
    target: 'create-transaction-btn',
    position: 'top-right',
    action: 'Click this button',
    instruction: 'Opens transaction creation wizard.'
  },
  {
    id: 'transactions',
    title: 'My Transactions',
    description: 'View all your transactions.',
    target: 'transactions-tab',
    position: 'bottom-left',
    action: 'Click to explore',
    instruction: 'See your transaction history.'
  },
  {
    id: 'messages',
    title: 'Messages',
    description: 'Chat with transaction partners.',
    target: 'messages-tab',
    position: 'center',
    action: 'Click to open',
    instruction: 'Communicate with other users.'
  },
  {
    id: 'wallet',
    title: 'Wallet',
    description: 'Manage your funds and payments.',
    target: 'wallet-tab',
    position: 'bottom-right',
    action: 'Click to explore',
    instruction: 'View balance and transaction history.'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Stay updated on activities.',
    target: 'notifications-tab',
    position: 'top-right',
    action: 'Check notifications',
    instruction: 'See important updates.'
  }
];

interface OnboardingGuideProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  useEffect(() => {
    if (isOpen && currentStepData?.target) {
      highlightTarget(currentStepData.target);
    }
  }, [currentStep, isOpen, currentStepData]);

  const highlightTarget = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('onboarding-highlight');
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        element.classList.remove('onboarding-highlight');
      }, 3000);
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getModalPosition = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'top-32 left-8';
      case 'top-right':
        return 'top-32 right-8';
      case 'bottom-left':
        return 'bottom-32 left-8';
      case 'bottom-right':
        return 'bottom-32 right-8';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-32 right-8';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" />
      
      {/* Compact Modal */}
      <div 
        className={`fixed z-50 w-72 sm:w-80 max-w-sm bg-white rounded-lg shadow-2xl border transition-all duration-300 ${getModalPosition(currentStepData.position)}`}
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">{currentStep + 1}/{onboardingSteps.length}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {currentStepData.description}
          </p>
          
          {currentStepData.action && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-3">
              <p className="text-xs sm:text-sm text-blue-800 font-medium">
                ✨ {currentStepData.action}
              </p>
            </div>
          )}

          {/* Progress Bar - Hidden on mobile */}
          <div className="mb-3 hidden sm:block">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-7 px-2 text-xs"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Skip</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="h-7 px-2 text-xs"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            
            <Button
              onClick={currentStep === onboardingSteps.length - 1 ? handleComplete : handleNext}
              size="sm"
              className="h-7 px-3 text-xs"
            >
              {currentStep === onboardingSteps.length - 1 ? (
                'Done'
              ) : (
                <>
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight className="h-3 w-3 sm:ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Tips - Hidden on mobile */}
      <div className="fixed bottom-20 left-4 z-50 hidden sm:block">
        <div className="bg-white rounded-lg shadow-lg border p-3 max-w-xs">
          <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Quick Tips</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Click highlighted elements to proceed</li>
            <li>• Skip steps you're familiar with</li>
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};
