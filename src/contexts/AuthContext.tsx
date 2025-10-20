import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import { User } from '@/types';

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

  // Check if onboarding has been completed (disabled for testing - show for all users)
  useEffect(() => {
    // For testing phase, show onboarding for all users
    // const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    // if (onboardingCompleted === 'true') {
    //   setShowOnboarding(false);
    // }
    
    // Always show onboarding during testing
    setShowOnboarding(true);
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
          // For development: Auto-login test user if no token exists
          if (process.env.NODE_ENV === 'development') {
            console.log('AuthContext: No auth token found, attempting auto-login for development...');
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
      
      const { user, token } = await authAPI.login(email, password);
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Call signup API but don't auto-login
      await authAPI.signup(userData.email, userData.password, userData.firstName, userData.lastName);
      
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
    } catch (error) {
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
