import React, { useEffect, useRef, useState } from 'react';
import { googleAuthService, GoogleUser } from '@/services/googleAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleSignInProps {
  onSuccess?: (user: GoogleUser) => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  buttonText?: string;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  onSuccess,
  onError,
  className,
  variant = 'outline',
  size = 'default',
  disabled = false,
  buttonText = 'Continue with Google'
}) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogle = async () => {
      try {
        await googleAuthService.initializeGoogleSignIn();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
        onError?.(error as Error);
      }
    };

    initializeGoogle();
  }, [onError]);

  const handleGoogleSuccess = async (user: GoogleUser) => {
    setIsLoading(true);
    try {
      // Call backend to authenticate with Google
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/google/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: user.idToken, // Use the actual ID token
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Update auth context
        await login(data.data.user, data.data.token);
        
        toast.success('Successfully signed in with Google!');
        onSuccess?.(user);
      } else {
        throw new Error(data.error || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      toast.error(errorMessage);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google Sign-In error:', error);
    toast.error('Google Sign-In failed');
    onError?.(error);
  };

  useEffect(() => {
    if (isInitialized && buttonRef.current) {
      googleAuthService.renderGoogleSignInButton(
        'google-signin-button',
        handleGoogleSuccess,
        handleGoogleError,
        buttonText
      );
    }
  }, [isInitialized, buttonText]);

  if (!isInitialized) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        className={className}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Initializing Google Sign-In...
      </Button>
    );
  }

  return (
    <div className="w-full">
      <div
        id="google-signin-button"
        ref={buttonRef}
        className={className}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default GoogleSignIn;
