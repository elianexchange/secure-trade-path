import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export const DebugInfo: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-xs z-50">
      <div>Auth: {isLoading ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <div>User: {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
      <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
      <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
    </div>
  );
};
