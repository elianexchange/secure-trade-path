import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  FileCheck, 
  Users, 
  MessageCircle, 
  Bell, 
  Wallet,
  User
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const mobileNavItems = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Create', href: '/app/create-transaction', icon: FileCheck },
  { name: 'Join', href: '/app/join-transaction', icon: Users },
  { name: 'Transactions', href: '/app/transactions', icon: Package },
  { name: 'Messages', href: '/app/messages', icon: MessageCircle },
  { name: 'Notifications', href: '/app/notifications', icon: Bell },
  { name: 'Wallet', href: '/app/wallet', icon: Wallet },
  { name: 'Profile', href: '/app/profile', icon: User },
];

export function MobileNavigation() {
  const location = useLocation();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 mobile-nav">
      <div className="grid grid-cols-4 gap-0.5 p-1">
        {mobileNavItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 rounded-md transition-colors",
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-0.5 leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Secondary row for additional items */}
      <div className="grid grid-cols-4 gap-0.5 p-1 border-t border-gray-100">
        {mobileNavItems.slice(4).map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 rounded-md transition-colors",
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium mt-0.5 leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
