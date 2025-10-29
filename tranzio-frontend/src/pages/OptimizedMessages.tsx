import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  ArrowLeft, 
  MessageCircle, 
  Search, 
  Settings,
  Bell,
  BellOff,
  Users,
  Filter,
  MoreVertical,
  Phone,
  Video,
  Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { notificationService } from '@/services/notificationService';
import OptimizedMessageThread from '@/components/OptimizedMessageThread';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  transactionId: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyRole: 'BUYER' | 'SELLER';
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount: number;
  isActive: boolean;
  updatedAt: Date;
}

export default function OptimizedMessages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    conversations, 
    currentConversation, 
    unreadCount, 
    refreshConversations,
    loadConversation
  } = useMessages();

  // State management
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'BUYER' | 'SELLER'>('ALL');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    notificationService.isEnabled()
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = searchQuery === '' || 
        conv.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole === 'ALL' || conv.counterpartyRole === filterRole;
      
      return matchesSearch && matchesRole;
    }).sort((a, b) => {
      // Sort by unread first, then by last message time
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations, searchQuery, filterRole]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check for transactionId in location state
  useEffect(() => {
    if (location.state?.transactionId) {
      const conversation = conversations.find(conv => conv.transactionId === location.state.transationId);
      if (conversation) {
        setSelectedConversation(conversation);
        loadConversation(conversation.transactionId);
      }
    }
  }, [location.state, conversations, loadConversation]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadConversation(conversation.transactionId);
    
    // On mobile, close the sidebar after selection
    if (isMobile) {
      // The sheet will be controlled by the parent component
    }
  }, [loadConversation, isMobile]);

  // Handle search toggle
  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
    if (showSearch) {
      setSearchQuery('');
    }
  }, [showSearch]);

  // Handle notification toggle
  const toggleNotifications = useCallback(() => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    if (newState) {
      notificationService.enable();
    } else {
      notificationService.disable();
    }
  }, [notificationsEnabled]);

  // Format conversation time
  const formatConversationTime = useCallback((timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return timestamp.toLocaleDateString();
  }, []);

  // Get avatar fallback
  const getAvatarFallback = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  // Conversation list component
  const ConversationList = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSearch}
              className="h-8 w-8 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNotifications}
              className="h-8 w-8 p-0"
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 text-blue-500" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mb-4">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {(['ALL', 'BUYER', 'SELLER'] as const).map((role) => (
            <Button
              key={role}
              variant={filterRole === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterRole(role)}
              className="h-8 text-xs"
            >
              {role === 'ALL' ? 'All' : role.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No conversations found</p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={cn(
                  "mb-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedConversation?.id === conversation.id && "ring-2 ring-blue-500 bg-blue-50/50"
                )}
                onClick={() => handleSelectConversation(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getAvatarFallback(conversation.counterpartyName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.counterpartyName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={conversation.counterpartyRole === 'BUYER' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {conversation.counterpartyRole.toLowerCase()}
                          </Badge>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {conversation.lastMessage && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {conversation.lastMessage.content}
                          </p>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {formatConversationTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Main content component
  const MainContent = () => (
    <div className="h-full flex flex-col">
      {selectedConversation ? (
        <>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center space-x-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h3 className="font-medium">{selectedConversation.counterpartyName}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedConversation.counterpartyRole.toLowerCase()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 min-h-0">
            <OptimizedMessageThread
              transactionId={selectedConversation.transactionId}
              counterpartyId={selectedConversation.counterpartyId}
              counterpartyName={selectedConversation.counterpartyName}
              counterpartyRole={selectedConversation.counterpartyRole}
              className="h-full"
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500 text-sm">
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-full flex">
        {/* Desktop Layout */}
        {!isMobile ? (
          <>
            {/* Sidebar */}
            <div className="w-80 border-r bg-white flex-shrink-0">
              <ConversationList />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <MainContent />
            </div>
          </>
        ) : (
          /* Mobile Layout */
          <div className="flex-1">
            {selectedConversation ? (
              <MainContent />
            ) : (
              <ConversationList />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
