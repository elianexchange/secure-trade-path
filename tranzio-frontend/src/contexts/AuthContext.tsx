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

  // Load user from localStorage on mount (optimistic: decode JWT, then hydrate profile in background)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const payloadBase64 = token.split('.')[1];
            const payloadJson = atob(payloadBase64);
            const payload = JSON.parse(payloadJson) as { userId?: string; email?: string; role?: string; exp?: number };
            const nowSec = Math.floor(Date.now() / 1000);
            if (payload?.exp && payload.exp > nowSec) {
              // Set minimal auth state immediately
              setAuthState({
                user: {
                  id: (payload as any).userId || '',
                  email: payload.email || '',
                  firstName: '',
                  lastName: '',
                  role: (payload as any).role || 'BUYER',
                  status: 'ACTIVE',
                } as unknown as User,
                token,
                isAuthenticated: true,
                isLoading: false,
              });
              // Hydrate full profile in background
              authAPI.getProfile()
                .then((fullUser) => {
                  setAuthState(prev => ({ ...prev, user: fullUser }));
                })
                .catch(() => {
                  // keep minimal token-derived user
                });
              return;
            }
          } catch {
            // invalid token format -> fall through and clear
          }
          // Invalid/expired token
          localStorage.removeItem('authToken');
        }

        // For development: optional auto-login on desktop only
        if (process.env.NODE_ENV === 'development' && !isMobileDevice()) {
          try {
            const { user, token: devToken } = await authAPI.login('test@example.com', 'password123');
            localStorage.setItem('authToken', devToken);
            setAuthState({ user, token: devToken, isAuthenticated: true, isLoading: false });
            return;
          } catch {
            // ignore
          }
        }
        setAuthState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        localStorage.removeItem('authToken');
        setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
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
      
      // Call signup API
      await authAPI.signup(userData.email, userData.password, userData.firstName, userData.lastName);
      
      // Clear any existing data for new users
      localStorage.removeItem('tranzio_transactions');
      localStorage.removeItem('tranzio_conversations');
      localStorage.removeItem('tranzio_messages');
      
      // Reset auth state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
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
