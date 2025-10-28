import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Clock, 
  ArrowRight, 
  User,
  Building
} from 'lucide-react';
import { useMessages } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Conversation, ParticipantDetail } from '@/types/message';

interface ConversationsListProps {
  onSelectConversation: (transactionId: string) => void;
  selectedTransactionId?: string;
}

export default function ConversationsList({ 
  onSelectConversation, 
  selectedTransactionId 
}: ConversationsListProps) {
  const { conversations, unreadCount } = useMessages();
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  // Debug logging
  console.log('ConversationsList: conversations:', conversations);
  console.log('ConversationsList: unreadCount:', unreadCount);
  console.log('ConversationsList: user:', user);

  const getAvatarFallback = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastMessageTime = (timestamp: Date | string | undefined) => {
    try {
      if (!timestamp) {
        return 'Just now';
      }
      
      // Handle both Date objects and string timestamps
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp received:', timestamp);
        return 'Just now';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      console.error('Error formatting message time:', error, 'Timestamp:', timestamp);
      return 'Just now';
    }
  };

  const getCounterpartyDetails = (conversation: Conversation): ParticipantDetail | null => {
    if (!user || !conversation.participantDetails) return null;
    
    // Find the counterparty (not the current user)
    return conversation.participantDetails.find(p => p.userId !== user.id) || null;
  };

  const getCounterpartyName = (conversation: Conversation): string => {
    const counterparty = getCounterpartyDetails(conversation);
    if (counterparty) {
      return counterparty.businessName || counterparty.name;
    }
    return "Transaction Partner";
  };

  const getCounterpartyRole = (conversation: Conversation): string => {
    const counterparty = getCounterpartyDetails(conversation);
    return counterparty?.role || "BUYER";
  };

  const getCounterpartyAvatar = (conversation: Conversation): string => {
    const counterparty = getCounterpartyDetails(conversation);
    return counterparty?.avatar || "";
  };

  const isCounterpartyOnline = (conversation: Conversation): boolean => {
    const counterparty = getCounterpartyDetails(conversation);
    if (!counterparty) return false;
    
    // Check if user was online in the last 5 minutes
    if (counterparty.lastSeen) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return new Date(counterparty.lastSeen) > fiveMinutesAgo;
    }
    return false;
  };

  const getTransactionDescription = (conversation: Conversation): string => {
    if (conversation.transactionDetails) {
      return conversation.transactionDetails.description;
    }
    return `Transaction #${conversation.transactionId.slice(-8)}`;
  };

  if (conversations.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center space-y-4 p-6">
          <MessageCircle className="h-16 w-16 text-muted-foreground/50" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a transaction to begin messaging with other users
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        {(showAll ? conversations : conversations.slice(0, 8)).map((conversation) => {
            const isSelected = conversation.transactionId === selectedTransactionId;
            const hasUnread = conversation.unreadCount > 0;
            const counterpartyName = getCounterpartyName(conversation);
            const counterpartyRole = getCounterpartyRole(conversation);
            const counterpartyAvatar = getCounterpartyAvatar(conversation);
            const isOnline = isCounterpartyOnline(conversation);
            
            return (
              <Button
                key={conversation.id}
                variant="ghost"
                className={`w-full justify-start h-auto p-3 transition-all duration-200 ${
                  isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'
                } ${hasUnread ? 'bg-blue-50/50' : ''}`}
                onClick={() => onSelectConversation(conversation.transactionId)}
              >
                <div className="flex items-center space-x-3 w-full min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={counterpartyAvatar} alt={counterpartyName} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                        {getAvatarFallback(counterpartyName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Online indicator */}
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-medium truncate text-sm ${
                        hasUnread ? 'text-blue-900' : 'text-foreground'
                      }`}>
                        {counterpartyName}
                      </p>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {hasUnread && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastMessage 
                            ? formatLastMessageTime(conversation.lastMessage.timestamp)
                            : formatLastMessageTime(conversation.updatedAt)
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span className="truncate flex-1">
                        {conversation.lastMessage?.content || getTransactionDescription(conversation)}
                      </span>
                    </div>
                    
                    {/* Transaction and role info */}
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
                        {counterpartyRole}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {getTransactionDescription(conversation)}
                      </span>
                    </div>
                  </div>
                  
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </div>
              </Button>
            );
          })}
        
        {/* Show More/Less Button */}
        {conversations.length > 8 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              {showAll ? 'Show Less' : `Show More (${conversations.length - 8} more)`}
            </Button>
          </div>
        )}
      </div>
        </div>
  );
}
