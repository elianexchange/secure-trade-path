import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  icon?: React.ReactNode;
  showValidation?: boolean;
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ label, error, helperText, success, icon, showValidation = true, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== '';
    
    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id} 
            className={cn(
              "text-sm font-semibold text-gray-700",
              error && "text-red-600"
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <Input
            ref={ref}
            className={cn(
              "transition-all duration-200",
              icon && "pl-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              success && !error && "border-green-500 focus:border-green-500 focus:ring-green-500",
              !error && !success && "focus:border-blue-500 focus:ring-blue-500",
              showValidation && hasValue && !error && !success && "border-gray-300",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {showValidation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {error && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {success && !error && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="flex items-start gap-1.5 text-xs">
            {error ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-600">{error}</span>
              </>
            ) : helperText ? (
              <span className="text-gray-500">{helperText}</span>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  showValidation?: boolean;
}

export const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ label, error, helperText, success, showValidation = true, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== '';
    
    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id} 
            className={cn(
              "text-sm font-semibold text-gray-700",
              error && "text-red-600"
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            className={cn(
              "flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500",
              success && !error && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500",
              !error && !success && "focus-visible:border-blue-500",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {showValidation && (
            <div className="absolute right-3 top-3">
              {error && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {success && !error && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="flex items-start gap-1.5 text-xs">
            {error ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-600">{error}</span>
              </>
            ) : helperText ? (
              <span className="text-gray-500">{helperText}</span>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

EnhancedTextarea.displayName = 'EnhancedTextarea';

