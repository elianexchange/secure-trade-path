import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import { User } from '@/types';

// Helper function to detect mobile devices
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (typeof window !== 'undefined' && window.innerWidth <= 768);
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding has been completed - only show for first-time users
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (onboardingCompleted === 'true') {
      setShowOnboarding(false);
    } else {
      // Only show onboarding for new users who haven't completed it
      setShowOnboarding(true);
    }
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('AuthContext: Checking for existing token:', token ? 'Found' : 'Not found');
        
        if (token) {
          // Verify token by getting user profile
          console.log('AuthContext: Verifying existing token...');
          const user = await authAPI.getProfile();
          console.log('AuthContext: Token verified, user loaded:', user.email);
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // For development: Auto-login test user if no token exists (desktop only)
          if (process.env.NODE_ENV === 'development' && !isMobileDevice()) {
            console.log('AuthContext: No auth token found, attempting auto-login for development (desktop only)...');
            try {
              const { user, token } = await authAPI.login('test@example.com', 'password123');
              console.log('AuthContext: Auto-login successful, storing token and user data');
              localStorage.setItem('authToken', token);
              setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
              });
              console.log('AuthContext: Auto-login completed successfully');
              return;
            } catch (autoLoginError) {
              console.error('AuthContext: Auto-login failed:', autoLoginError);
              console.log('AuthContext: User needs to login manually');
            }
          }
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('AuthContext: Failed to load user:', error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      console.log('🔍 AuthContext.login - Starting login for:', email);
      console.log('🔍 AuthContext.login - Device info:', {
        userAgent: navigator.userAgent,
        isMobile: isMobileDevice(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      });
      
      const { user, token } = await authAPI.login(email, password);
      console.log('🔍 AuthContext.login - Login API result:', { user: user?.email, hasToken: !!token });
      
      // Store token in localStorage
      try {
        localStorage.setItem('authToken', token);
        console.log('🔍 AuthContext.login - Token stored in localStorage successfully');
      } catch (storageError) {
        console.error('❌ AuthContext.login - Failed to store token in localStorage:', storageError);
        throw new Error('Failed to store authentication token. Please try again.');
      }
      
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Check if user has completed onboarding
      const onboardingCompleted = localStorage.getItem('onboardingCompleted');
      setShowOnboarding(onboardingCompleted !== 'true');
      
      console.log('✅ AuthContext.login - Login completed successfully');
    } catch (error) {
      console.error('❌ AuthContext.login - Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      console.log('🔍 AuthContext.signup - Starting signup for:', userData.email);
      
      // Call signup API but don't auto-login
      const result = await authAPI.signup(userData.email, userData.password, userData.firstName, userData.lastName);
      console.log('🔍 AuthContext.signup - Signup API result:', result);
      
      // Clear any existing transaction data for new users
      localStorage.removeItem('tranzio_transactions');
      localStorage.removeItem('tranzio_conversations');
      localStorage.removeItem('tranzio_messages');
      
      // Don't store token or set authenticated state
      // User needs to login manually after signup
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Don't show onboarding yet - user needs to login first
      setShowOnboarding(false);
      
      console.log('✅ AuthContext.signup - Signup completed successfully');
    } catch (error) {
      console.error('❌ AuthContext.signup - Signup failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state and token
      localStorage.removeItem('authToken');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      const updatedUser = await authAPI.updateProfile(updates);
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    updateUser,
    showOnboarding,
    setShowOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
