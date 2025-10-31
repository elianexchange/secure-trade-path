import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showLabels?: boolean;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  showLabels = false,
  className
}) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Circles */}
      <div className="flex items-center justify-between w-full">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isPending = step > currentStep;

          return (
            <div key={step} className="flex flex-col items-center flex-1 relative">
              {/* Connecting Line */}
              {step < totalSteps && (
                <div
                  className={cn(
                    "absolute top-4 left-[50%] w-full h-0.5 transition-all duration-300",
                    isCompleted ? "bg-blue-600" : "bg-gray-200",
                    "z-0"
                  )}
                  style={{ width: step === totalSteps - 1 ? '50%' : '100%', left: '50%' }}
                />
              )}

              {/* Step Circle */}
              <div className="relative z-10">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                    isCompleted && "bg-blue-600 text-white shadow-md",
                    isCurrent && "bg-blue-600 text-white ring-4 ring-blue-100 scale-110",
                    isPending && "bg-gray-200 text-gray-500"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span>{step}</span>
                  )}
                </div>
              </div>

              {/* Step Label */}
              {showLabels && stepLabels && stepLabels[index] && (
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center hidden sm:block max-w-[80px]",
                    isCurrent && "text-blue-600 font-semibold",
                    isCompleted && "text-gray-600",
                    isPending && "text-gray-400"
                  )}
                >
                  {stepLabels[index]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Label (Mobile) */}
      {showLabels && stepLabels && stepLabels[currentStep - 1] && (
        <div className="mt-4 text-center sm:hidden">
          <span className="text-sm font-semibold text-blue-600">
            Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
          </span>
        </div>
      )}
    </div>
  );
};

