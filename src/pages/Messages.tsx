import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MessageCircle, 
  Search, 
  Settings,
  Bell,
  BellOff
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { notificationService } from '@/services/notificationService';
import ConversationsList from '@/components/ConversationsList';
import EnhancedMessageThread from '@/components/EnhancedMessageThread';
import MessageSearch from '@/components/MessageSearch';
import { MessageSearchResult } from '@/types/message';

export default function Messages() {
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
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | undefined>();
  const [selectedCounterparty, setSelectedCounterparty] = useState<{
    id: string;
    name: string;
    role: 'BUYER' | 'SELLER';
  } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Check for transactionId in location state (from transaction details navigation)
  React.useEffect(() => {
    if (location.state?.transactionId) {
      setSelectedTransactionId(location.state.transactionId);
      // Load the conversation for this transaction
      loadConversation(location.state.transactionId);
    }
  }, [location.state, loadConversation]);

  const handleSelectConversation = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    
    // Find conversation to get participant details
    const conversation = conversations.find(c => c.transactionId === transactionId);
    if (conversation && conversation.participantDetails.length > 0) {
      // Find the counterparty (not the current user)
      const counterparty = conversation.participantDetails.find(
        p => p.userId !== user?.id
      );
      
      if (counterparty) {
        setSelectedCounterparty({
          id: counterparty.userId,
          name: counterparty.businessName || counterparty.name,
          role: counterparty.role
        });
      } else {
        // Fallback to placeholder
        setSelectedCounterparty({
          id: 'counterparty_id',
          name: 'Transaction Partner',
          role: 'BUYER'
        });
      }
    } else {
      // Fallback to placeholder
      setSelectedCounterparty({
        id: 'counterparty_id',
        name: 'Transaction Partner',
        role: 'BUYER'
      });
    }
  };


  const handleSearchResultClick = (result: MessageSearchResult) => {
    // Navigate to the conversation and scroll to the message
    handleSelectConversation(result.message.transactionId);
    setShowSearch(false);
    
    // TODO: Implement scroll to specific message
    // This would require enhancing the MessageThread component
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      // Note: We can't programmatically disable notifications, 
      // but we can stop showing them in our app
    } else {
      const permission = await notificationService.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const handleRefresh = async () => {
    await refreshConversations();
  };

  // Load conversations when component mounts
  React.useEffect(() => {
    if (user) {
      refreshConversations();
    }
  }, [user, refreshConversations]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Messages</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <MessageSearch
            transactionId={selectedTransactionId}
            onResultClick={handleSearchResultClick}
            onClose={() => setShowSearch(false)}
          />
        </div>
      )}

      {/* Messages Interface */}
      <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-200px)] min-h-[500px] max-h-[calc(100vh-120px)]">
        {/* Conversations List - Hidden on mobile when conversation is selected */}
        <div className={`${selectedTransactionId ? 'hidden lg:flex' : 'flex'} lg:w-1/3 w-full flex-col`}>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <ConversationsList
              onSelectConversation={handleSelectConversation}
              selectedTransactionId={selectedTransactionId}
            />
          </div>
        </div>

        {/* Message Thread - Full width on mobile */}
        <div className={`${selectedTransactionId ? 'flex' : 'hidden lg:flex'} lg:w-2/3 w-full flex-col`}>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {selectedTransactionId && selectedCounterparty ? (
              <>
                {/* Fixed Header - Always visible */}
                <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10 rounded-t-lg">
                  <div className="flex items-center space-x-3">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransactionId(undefined)}
                      className="lg:hidden p-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {selectedCounterparty.name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {selectedCounterparty.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Transaction #{selectedTransactionId.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearch(true)}
                      className="text-xs"
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Search
                    </Button>
                  </div>
                </div>
                
                {/* Message Thread */}
                <div className="flex-1 min-h-0">
                  <EnhancedMessageThread
                    transactionId={selectedTransactionId}
                    counterpartyId={selectedCounterparty.id}
                    counterpartyName={selectedCounterparty.name}
                    counterpartyRole={selectedCounterparty.role}
                    className="h-full"
                  />
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
                  <MessageCircle className="h-12 w-12 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Choose a conversation from the list to start messaging. Your conversations will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
