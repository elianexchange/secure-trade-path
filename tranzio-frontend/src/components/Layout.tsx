import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  FileCheck, 
  CreditCard, 
  Truck, 
  Bell, 
  User,
  Shield,
  Calculator,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Users,
  MessageCircle,
  Settings,
  Wallet,
  HelpCircle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import WalletNavigation from '@/components/WalletNavigation';
import { ProfessionalMobileNavigation } from '@/components/ProfessionalMobileNavigation';
import { FallbackMobileNavigation } from '@/components/FallbackMobileNavigation';
import { PWAStatus } from '@/components/PWAInstallPrompt';
import AIChatbot from '@/components/AIChatbot';
import { useChatbot } from '@/contexts/ChatbotContext';
import { DebugInfo } from '@/components/DebugInfo';
import { SEOLinks } from '@/components/SEOLinks';
import { SkipToMain } from '@/components/SkipToMain';

const navigationItems = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Create Transaction', href: '/app/create-transaction', icon: FileCheck },
  { name: 'Join Transaction', href: '/app/join-transaction', icon: Users },
  { name: 'My Transactions', href: '/app/transactions', icon: Package },
  { name: 'Messages', href: '/app/messages', icon: MessageCircle },
  { name: 'Notifications', href: '/app/notifications', icon: Bell },
  { name: 'Wallet', href: '/app/wallet', icon: Wallet },
  { name: 'Disputes', href: '/app/disputes', icon: AlertTriangle },
  { name: 'User Profile', href: '/app/profile', icon: User },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isOpen, toggleChatbot } = useChatbot();
  const { user, logout } = useAuth();

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logout();
    closeSidebar();
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TRANSACTION_UPDATE':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'SHIPPING':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'MESSAGE':
        return <MessageCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead && markAsRead) {
      await markAsRead(notification.id);
    }
    
    // Always navigate to notifications page for expanded view
    navigate('/app/notifications');
  };

  // Safely get notification data with fallback
  let notificationCount = 0;
  let notifications: any[] = [];
  let markAsRead: ((id: string) => Promise<void>) | null = null;
  
  try {
    const notificationContext = useNotifications();
    notificationCount = notificationContext.unreadCount;
    notifications = notificationContext.notifications;
    markAsRead = notificationContext.markAsRead;
  } catch (error) {
    // NotificationProvider not available, use fallback
    console.warn('NotificationProvider not available in Layout');
  }

  const NavigationContent = () => {
    const { unreadCount } = useMessages();
    
    return (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const isActive = location.pathname === item.href;
          const showBadge = item.name === 'Messages' && unreadCount > 0;
          
          // Add target IDs for onboarding guide
          const getTargetId = (name: string) => {
            switch (name) {
              case 'Messages': return 'messages-tab';
              case 'Notifications': return 'notifications-tab';
              case 'My Transactions': return 'transactions-tab';
              case 'Wallet': return 'wallet-tab';
              default: return '';
            }
          };
          
          const targetId = getTargetId(item.name);
          
        return (
          <Link key={item.name} to={item.href} onClick={closeSidebar}>
            <Button
                id={targetId}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                  "w-full justify-start gap-3 font-medium rounded-md relative",
                isActive 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
                {showBadge && (
                  <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5">
                    {unreadCount}
                  </Badge>
                )}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
  };

  return (
    <div className="min-h-screen bg-background">
      <SkipToMain />
      <DebugInfo />
      <SEOLinks />
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className={`flex items-center justify-between ${isMobile ? 'h-12 px-3' : 'h-16 px-4 sm:px-6'}`}>
          <div className="flex items-center space-x-2">
            <div className={`rounded-lg bg-blue-600 ${isMobile ? 'p-1.5' : 'p-2'}`}>
              <Shield className={`text-white ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg sm:text-xl'}`}>Tranzio</h1>
          </div>
          
          <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2 sm:space-x-4'}`}>
            
            {/* PWA Status - Hidden on mobile */}
            {!isMobile && <PWAStatus />}
            
            {/* Wallet Navigation - Hidden on mobile */}
            {!isMobile && <WalletNavigation />}
            
            {/* Help Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChatbot}
              className={`${isMobile ? 'h-8 w-8 p-0' : ''} text-gray-700 hover:text-gray-900 hover:bg-gray-100`}
              title="Get Help"
            >
              <HelpCircle className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`relative ${isMobile ? 'h-8 w-8 p-0' : ''} ${
                    notificationCount > 0 
                      ? 'text-gray-900 hover:text-gray-900 bg-blue-100 hover:bg-blue-200' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
              <Bell className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                  {notificationCount > 0 && (
                    <span className={`absolute -top-1 -right-1 bg-red-500 rounded-full text-white flex items-center justify-center font-medium ${isMobile ? 'h-3 w-3 text-xs' : 'h-4 w-4 text-xs'}`}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/app/notifications')}
                      className="text-xs h-6 px-2"
                    >
                      View All
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-80">
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Notification cards have been removed
                  </div>
                </ScrollArea>
                
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`rounded-full flex items-center gap-2 ${isMobile ? 'h-7 p-1' : 'h-8 p-2'}`}>
                  <Avatar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}>
                    <AvatarImage src={user?.profilePicture} alt="Profile" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 z-50">
                <div className="flex items-center justify-start gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profilePicture} alt="Profile" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <span className="text-sm font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                </AvatarFallback>
              </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
              </div>
            </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/app/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/app/notifications')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={confirmLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              onClick={confirmLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block w-64 border-r border-gray-200 bg-white shadow-sm">
          <nav className="p-4 space-y-2">
            <NavigationContent />
          </nav>
        </aside>

        {/* Main Content */}
        <main 
          id="main-content"
          className={`flex-1 ${isMobile ? 'pt-6 px-4 pb-28' : 'p-2 sm:p-6'}`}
          role="main"
          aria-label="Main content"
        >
          <div className={`space-y-4 ${isMobile ? 'max-w-full' : ''}`}>
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              </div>
            }>
              <Outlet />
            </React.Suspense>
          </div>
        </main>
      </div>

      {/* Professional Mobile Navigation */}
      {isMobile && (
        <React.Suspense fallback={<FallbackMobileNavigation />}>
          <ProfessionalMobileNavigation />
        </React.Suspense>
      )}

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleLogout}
                className="flex-1"
              >
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chatbot */}
      <AIChatbot 
        isOpen={isOpen} 
        onToggle={toggleChatbot}
      />
    </div>
  );
}