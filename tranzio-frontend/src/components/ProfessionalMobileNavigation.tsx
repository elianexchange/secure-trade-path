import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Package, 
  FileCheck, 
  Users, 
  MessageCircle, 
  Bell, 
  Wallet,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useMessages } from '@/contexts/MessageContext';

const navigationItems = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, description: 'Overview and analytics' },
  { name: 'Create Transaction', href: '/app/create-transaction', icon: FileCheck, description: 'Start a new transaction' },
  { name: 'Join Transaction', href: '/app/join-transaction', icon: Users, description: 'Join existing transaction' },
  { name: 'My Transactions', href: '/app/transactions', icon: Package, description: 'View all transactions' },
  { name: 'Messages', href: '/app/messages', icon: MessageCircle, description: 'Chat with partners' },
  { name: 'Notifications', href: '/app/notifications', icon: Bell, description: 'Stay updated' },
  { name: 'Wallet', href: '/app/wallet', icon: Wallet, description: 'Manage funds' },
  { name: 'Profile', href: '/app/profile', icon: User, description: 'Account settings' },
];

export function ProfessionalMobileNavigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add error boundary for mobile navigation
  if (!user) {
    console.warn('ProfessionalMobileNavigation: No user data available');
    return null;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header with Hamburger Menu - Enhanced */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-white/98 backdrop-blur-md border-b border-gray-200 shadow-lg" 
          : "bg-white border-b border-gray-100"
      )}>
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo - Enhanced */}
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-2 shadow-md">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-bold text-gray-900 text-lg tracking-tight">Tranzio</h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications - Enhanced */}
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-9 p-0 hover:bg-gray-100 transition-colors"
              onClick={() => window.location.href = '/app/notifications'}
            >
              <Bell className="h-4 w-4 text-gray-700" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 p-0 text-xs bg-red-500 text-white flex items-center justify-center rounded-full shadow-sm animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>


            {/* Logout Button - Enhanced */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Hamburger Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="left" className="w-80 sm:w-96 p-0 overflow-y-auto">
                <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 shadow-md">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <SheetTitle className="text-lg font-bold text-gray-900">Tranzio</SheetTitle>
                        <p className="text-sm text-gray-600">Secure Trading Platform</p>
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                {/* User Profile Section - Enhanced */}
                <div className="p-6 border-b bg-gradient-to-br from-blue-50/50 via-white to-gray-50/50">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-14 w-14 ring-2 ring-blue-200 ring-offset-2">
                      <AvatarImage src={user?.profilePicture} alt="Profile" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-base">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {user?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {user?.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user?.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items - Enhanced */}
                <nav className="flex-1 p-4 sm:p-6 space-y-1.5">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 p-3.5 rounded-xl transition-all duration-200 group focus-visible-ring interactive-scale",
                          isActive
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                        )}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={`Navigate to ${item.name}`}
                      >
                        <div className={cn(
                          "flex-shrink-0 p-2.5 rounded-lg transition-all duration-200",
                          isActive 
                            ? "bg-blue-600 text-white shadow-md scale-110" 
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:scale-105"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-semibold text-sm",
                            isActive ? "text-blue-700" : "text-gray-900"
                          )}>
                            {item.name}
                          </p>
                          <p className={cn(
                            "text-xs mt-0.5",
                            isActive ? "text-blue-600" : "text-gray-500"
                          )}>
                            {item.description}
                          </p>
                        </div>
                        {(item.name === 'Notifications' && unreadCount > 0) && (
                          <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                        {(item.name === 'Messages' && messageUnreadCount > 0) && (
                          <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                            {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
                          </Badge>
                        )}
                        {isActive && (
                          <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Footer Actions */}
                <div className="p-6 border-t space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => window.location.href = '/app/profile'}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => window.location.href = '/help'}
                  >
                    <HelpCircle className="h-4 w-4 mr-3" />
                    Help & Support
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header - Increased for better spacing */}
      <div className="h-16" />
    </>
  );
}
