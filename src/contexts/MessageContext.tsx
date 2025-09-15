import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { useNotifications } from './NotificationContext';
import { 
  Message, 
  Conversation, 
  MessageNotification, 
  ParticipantDetail,
  MessageSearchResult,
  FileUploadProgress
} from '@/types/message';
import { messageAPI } from '@/services/messageAPI';
import { toast } from 'sonner';

interface MessageContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  sendMessage: (transactionId: string, content: string) => Promise<void>;
  sendFileMessage: (transactionId: string, file: File) => Promise<void>;
  loadConversation: (transactionId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (transactionId: string) => Promise<void>;
  loadMessages: (transactionId: string) => Promise<void>;
  loadMoreMessages: (transactionId: string, beforeMessageId?: string) => Promise<void>;
  searchMessages: (query: string, transactionId?: string) => Promise<MessageSearchResult[]>;
  deleteMessage: (messageId: string) => Promise<void>;
  isLoading: boolean;
  uploadProgress: FileUploadProgress[];
  refreshConversations: () => Promise<void>;
  recalculateUnreadCount: () => void;
  startTyping: (transactionId: string) => void;
  stopTyping: (transactionId: string) => void;
  isUserTyping: (transactionId: string, userId: string) => boolean;
  typingUsers: Set<string>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();
  
  // Safely get notifications context with fallback
  let addNotification: ((notification: any) => void) | null = null;
  try {
    const notificationContext = useNotifications();
    addNotification = notificationContext.addNotification;
  } catch (error) {
    // NotificationProvider not available, continue without notifications
    console.warn('NotificationProvider not available, message notifications disabled');
  }
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  // Use ref to track current conversation without causing dependency issues
  const currentConversationRef = useRef<Conversation | null>(null);

  // Load conversations from backend
  const loadConversationsFromAPI = async () => {
    if (!user || !user.id) {
      console.log('No user or user ID, skipping conversation load');
      return;
    }
    
    try {
      const apiConversations = await messageAPI.getConversations();
      setConversations(apiConversations);
      
      // Calculate total unread count
      const totalUnread = apiConversations.reduce(
        (sum: number, conv: Conversation) => sum + conv.unreadCount, 
        0
      );
      setUnreadCount(totalUnread);
      
      // Save to localStorage for offline access
      localStorage.setItem(`tranzio_conversations_${user.id}`, JSON.stringify(apiConversations));
    } catch (error) {
      console.error('Failed to load conversations from API:', error);
      // Fallback to localStorage
      const storedConversations = JSON.parse(
        localStorage.getItem(`tranzio_conversations_${user.id}`) || '[]'
      );
      
      // Convert string timestamps back to Date objects
      const conversationsWithProperDates = storedConversations.map((conv: any) => ({
        ...conv,
        createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
        updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
        lastMessage: conv.lastMessage ? {
          ...conv.lastMessage,
          timestamp: conv.lastMessage.timestamp ? new Date(conv.lastMessage.timestamp) : new Date()
        } : undefined
      }));
      
      setConversations(conversationsWithProperDates);
    }
  };

  // Load participant details for a transaction
  const loadParticipantDetails = async (transactionId: string) => {
    if (!transactionId) {
      console.log('No transaction ID provided, skipping participant details load');
      return;
    }
    
    try {
      // Check if we already have participant details for this transaction
      const existingConversation = conversations.find(c => c.transactionId === transactionId);
      if (existingConversation?.participantDetails && existingConversation.participantDetails.length > 0) {
        return; // Already loaded, don't reload
      }

      const participants = await messageAPI.getParticipantDetails(transactionId);
      
      // Update conversation with participant details
      setConversations(prev => 
        prev.map(conv => 
          conv.transactionId === transactionId 
            ? { ...conv, participantDetails: participants }
            : conv
        )
      );
      
      if (currentConversation?.transactionId === transactionId) {
        setCurrentConversation(prev => 
          prev ? { ...prev, participantDetails: participants } : null
        );
      }
    } catch (error) {
      console.error('Failed to load participant details:', error);
    }
  };

  // Load conversations from localStorage on mount
  useEffect(() => {
    if (user && user.id) {
      loadConversationsFromAPI();
    }
  }, [user]);

  // Update ref when currentConversation changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // WebSocket message handling
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('WebSocket not connected, skipping message handlers');
      return;
    }

    const handleNewMessage = (data: { message: Message; conversation?: Conversation; transactionId?: string }) => {
      try {
        const { message, conversation, transactionId } = data;
        
        console.log('Received new message data:', { message, conversation, transactionId });
        console.log('Current user ID:', user?.id, 'Message sender ID:', message.senderId);
        console.log('Is message from current user?', message.senderId === user?.id);
        
        // Validate that message exists and has required properties
        if (!message || !message.id) {
          console.error('Invalid message data received:', data);
          return;
        }

        // Process all messages but handle notifications differently for sender vs receiver
        const isOwnMessage = message.senderId === user?.id;

        // Handle case where we receive transactionId instead of conversation
        if (transactionId && !conversation) {
          console.log('Looking for conversation with transactionId:', transactionId);
          console.log('Available conversations:', conversations);
          
          // Find existing conversation for this transaction
          const existingConversation = conversations.find(c => c.transactionId === transactionId);
          
          if (existingConversation) {
            console.log('Found existing conversation:', existingConversation);
            // Update the existing conversation
            const updatedConversation = {
              ...existingConversation,
              lastMessage: message,
              updatedAt: new Date(),
              unreadCount: existingConversation.unreadCount + 1
            };
            
            setConversations(prev => 
              prev.map(c => c.id === existingConversation.id ? updatedConversation : c)
            );
            
                    // Update current conversation if it's the active one
        if (currentConversationRef.current?.id === existingConversation.id) {
          console.log('Updating current conversation messages');
          // Ensure message timestamp is a Date object
          const messageWithProperTimestamp = {
            ...message,
            timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
          };
          // Check if message already exists to prevent duplicates
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === message.id);
            if (messageExists) {
              return prev;
            }
            return [...prev, messageWithProperTimestamp];
          });
        }
          } else {
            console.log('Creating new conversation for transactionId:', transactionId);
            // Create a new conversation if none exists
            const newConversation: Conversation = {
              id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              transactionId,
              participants: [message.senderId],
              lastMessage: message,
              unreadCount: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              participantDetails: []
            };
            
            setConversations(prev => [...prev, newConversation]);
          }
        } else if (conversation && conversation.id) {
          // Handle case where we receive full conversation object
      // Update conversations
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === conversation.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = conversation;
          return updated;
        } else {
          return [...prev, conversation];
        }
      });

      // Update current conversation if it's the active one
      if (currentConversationRef.current?.id === conversation.id) {
            // Ensure message timestamp is a Date object
            const messageWithProperTimestamp = {
              ...message,
              timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
            };
            // Check if message already exists to prevent duplicates
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === message.id);
              if (messageExists) {
                return prev;
              }
              return [...prev, messageWithProperTimestamp];
            });
          }
      }

      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Save to localStorage
      if (user) {
        const stored = JSON.parse(
          localStorage.getItem(`tranzio_conversations_${user.id}`) || '[]'
        );
          
          if (conversation && conversation.id) {
            // Update existing conversation
        const existingIndex = stored.findIndex((c: Conversation) => c.id === conversation.id);
        if (existingIndex >= 0) {
          stored[existingIndex] = conversation;
        } else {
          stored.push(conversation);
        }
          } else if (transactionId) {
            // Update conversation by transactionId
            const existingIndex = stored.findIndex((c: Conversation) => c.transactionId === transactionId);
            if (existingIndex >= 0) {
              stored[existingIndex] = {
                ...stored[existingIndex],
                lastMessage: message,
                updatedAt: new Date(),
                unreadCount: (stored[existingIndex].unreadCount || 0) + 1
              };
            }
          }
          
        localStorage.setItem(`tranzio_conversations_${user.id}`, JSON.stringify(stored));
      }

        // Handle notifications based on message sender
        if (!isOwnMessage) {
          // RECEIVER gets notifications
      // Show push notification
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification('New Message', {
          body: message.content,
          icon: '/favicon.ico',
              tag: conversation?.id || transactionId,
            });
          }
          
          // Update global unread count
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification if not in the current conversation
          if (currentConversationRef.current?.transactionId !== transactionId) {
            import('sonner').then(({ toast }) => {
              toast.info(`New message from counterparty`, {
                description: message.content,
                duration: 4000,
              });
            });
            
            // Add to notification system if available (only for the receiver, not sender)
            if (addNotification && !isOwnMessage) {
              addNotification({
                userId: user?.id || '', // This is correct - the current user is the receiver
                transactionId: transactionId,
                type: 'MESSAGE',
                title: 'New Message Received',
                message: `You have a new message: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                isRead: false,
                priority: 'MEDIUM',
                metadata: {
                  counterpartyName: 'Transaction Partner',
                  actionRequired: true
                }
              });
            }
            
            // Play notification sound
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {
                // Ignore errors if audio can't play
              });
            } catch (error) {
              // Ignore audio errors
            }
          }
        } else {
          // SENDER gets confirmation (optional)
          // You can add a subtle confirmation here if needed
          console.log('Message sent successfully');
        }
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    };

    const handleMessageRead = (data: { messageId: string; conversationId?: string; readBy?: string }) => {
      try {
        // Validate that data exists and has required properties
        if (!data || !data.messageId) {
          console.error('Invalid message read data received:', data);
          return;
        }
        
      // Update message read status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );

        // Find the conversation that contains this message
        const message = messages.find(msg => msg.id === data.messageId);
        if (message) {
          // Update conversation unread count by transactionId
      setConversations(prev => 
        prev.map(conv => 
              conv.transactionId === message.transactionId 
            ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) }
            : conv
        )
      );
          
          // Update global unread count
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error handling message read:', error);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    
    // Typing indicator event handlers
    socket.on('typing_start', (data: { transactionId: string; userId: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => new Set(prev).add(`${data.transactionId}-${data.userId}`));
      }
    });

    socket.on('typing_stop', (data: { transactionId: string; userId: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${data.transactionId}-${data.userId}`);
          return newSet;
        });
      }
    });
    
    // Add error handler for WebSocket events
    socket.on('error', (error) => {
      console.error('WebSocket error in MessageContext:', error);
    });

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('error');
    };
  }, [socket, isConnected, user]); // Remove currentConversation from dependencies

  const sendMessage = async (transactionId: string, content: string) => {
    if (!user || !socket || isLoading) return;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionId,
      senderId: user.id,
      receiverId: '', // Not needed in new API
      content,
      timestamp: new Date(),
      isRead: false,
      messageType: 'TEXT'
    };

    try {
      console.log('MessageContext: Attempting to send message:', { transactionId, content });
      // Send to backend first
      const apiMessage = await messageAPI.sendMessage({
        transactionId,
        content
      });
      console.log('MessageContext: Message sent to backend successfully:', apiMessage);

      // Update message with API response
      const updatedMessage = { ...message, apiId: apiMessage.id, isSynced: true };

      // Emit message via WebSocket
      socket.emit('send_message', {
        message: updatedMessage,
        transactionId
      });

      // Optimistically add message to UI (check for duplicates)
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === updatedMessage.id);
        if (messageExists) {
          return prev;
        }
        return [...prev, updatedMessage];
      });

      // Update conversation
      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          lastMessage: updatedMessage,
          updatedAt: new Date()
        };
        setCurrentConversation(updatedConversation);
        
        // Update conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id ? updatedConversation : conv
          )
        );
      }
      
      // Update unread count for the conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.transactionId === transactionId 
            ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
            : conv
        )
      );
    } catch (error) {
      console.error('MessageContext: Failed to send message:', error);
      toast.error('Failed to send message. Please check your connection.');
      // Mark message as failed
      const failedMessage = { ...message, error: 'Failed to send' };
      setMessages(prev => [...prev, failedMessage]);
    }
  };

  const sendFileMessage = async (transactionId: string, file: File) => {
    if (!user || !socket) return;

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to upload progress
    setUploadProgress(prev => [...prev, {
      fileId,
      filename: file.name,
      progress: 0,
      status: 'UPLOADING'
    }]);

    try {
      // Upload file
      const attachment = await messageAPI.uploadFile(
        file, 
        transactionId, 
        (progress) => {
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileId === fileId ? { ...p, progress } : p
            )
          );
        }
      );

      // Update upload progress
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId ? { ...p, status: 'COMPLETED' } : p
        )
      );

      // Create message with attachment
      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId,
        senderId: user.id,
        receiverId: '', // Not needed in new API
        content: `Sent: ${file.name}`,
        timestamp: new Date(),
        isRead: false,
        messageType: 'FILE',
        attachments: [attachment]
      };

      // Send message
      await sendMessage(transactionId, `Sent: ${file.name}`);
      
      // Remove from upload progress after delay
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
      }, 3000);

    } catch (error) {
      console.error('Failed to upload file:', error);
      
      // Update upload progress with error
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId ? { ...p, status: 'FAILED', error: 'Upload failed' } : p
        )
      );
    }
  };

  const loadConversation = async (transactionId: string) => {
    if (!user || isLoading) return;

    // Check if we're already loading this conversation
    if (currentConversation?.transactionId === transactionId && !isLoading) {
      return; // Already loaded, don't reload
    }

    setIsLoading(true);
    try {
      // Find existing conversation
      const conversation = conversations.find(c => c.transactionId === transactionId);
      
      if (conversation) {
        setCurrentConversation(conversation);
        // Only load messages if we don't have them already
        if (messages.length === 0 || messages[0]?.transactionId !== transactionId) {
        await loadMessages(transactionId);
        }
        // Only load participant details if we don't have them already
        if (!conversation.participantDetails || conversation.participantDetails.length === 0) {
        await loadParticipantDetails(transactionId);
        }
        
        // Mark conversation as read when viewed
        if (conversation.unreadCount > 0) {
          await markConversationAsRead(transactionId);
        }
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transactionId,
          participants: [user.id],
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          participantDetails: []
        };
        
        setCurrentConversation(newConversation);
        setConversations(prev => [...prev, newConversation]);
        
        // Load participant details only once for new conversation
        await loadParticipantDetails(transactionId);
        
        // Save to localStorage
        const stored = JSON.parse(
          localStorage.getItem(`tranzio_conversations_${user.id}`) || '[]'
        );
        stored.push(newConversation);
        localStorage.setItem(`tranzio_conversations_${user.id}`, JSON.stringify(stored));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (transactionId: string) => {
    if (!user) return;

    // Check if we already have messages for this transaction
    if (messages.length > 0 && messages[0]?.transactionId === transactionId) {
      return; // Already loaded, don't reload
    }

    try {
      // Try to load from API first
      const apiMessages = await messageAPI.getMessages(transactionId);
      setMessages(apiMessages);
      
      // Save to localStorage
      localStorage.setItem(`tranzio_messages_${transactionId}`, JSON.stringify(apiMessages));
    } catch (error) {
      console.error('Failed to load messages from API:', error);
      // Fallback to localStorage
      const storedMessages = JSON.parse(
        localStorage.getItem(`tranzio_messages_${transactionId}`) || '[]'
      );
      
      // Convert string timestamps back to Date objects
      const messagesWithProperDates = storedMessages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date()
      }));
      
      setMessages(messagesWithProperDates);
    }
  };

  const loadMoreMessages = async (transactionId: string, beforeMessageId?: string) => {
    if (!user) return;

    try {
      // Load more messages from API (you can implement pagination here)
      const moreMessages = await messageAPI.getMessages(transactionId);
      
      // Add to existing messages (avoid duplicates)
      setMessages(prev => {
        const existingIds = new Set(prev.map(msg => msg.id));
        const newMessages = moreMessages.filter(msg => !existingIds.has(msg.id));
        return [...newMessages, ...prev];
      });
      
      // Save to localStorage
      const allMessages = messages.concat(moreMessages);
      localStorage.setItem(`tranzio_messages_${transactionId}`, JSON.stringify(allMessages));
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!socket) return;

    try {
      // Mark as read in backend
      await messageAPI.markAsRead(messageId);
      
      // Emit read status via WebSocket
      socket.emit('mark_message_read', { messageId });

      // Update local state only if not already read
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId && !msg.isRead ? { ...msg, isRead: true } : msg
        )
      );

      // Find the message to get its transactionId
      const message = messages.find(msg => msg.id === messageId);
      if (message && !message.isRead) {
        // Update conversation unread count
        setConversations(prev => 
          prev.map(conv => 
            conv.transactionId === message.transactionId 
              ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) }
              : conv
          )
        );
        
        // Update global unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Recalculate to ensure consistency
        setTimeout(() => recalculateUnreadCount(), 100);
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const markConversationAsRead = async (transactionId: string) => {
    if (!user) return;

    try {
      // Mark all messages in the conversation as read
      setMessages(prev => 
        prev.map(msg => 
          msg.transactionId === transactionId ? { ...msg, isRead: true } : msg
        )
      );

      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.transactionId === transactionId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      // Update global unread count
      const conversation = conversations.find(c => c.transactionId === transactionId);
      if (conversation && conversation.unreadCount > 0) {
        setUnreadCount(prev => Math.max(0, prev - conversation.unreadCount));
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const searchMessages = async (query: string, transactionId?: string): Promise<MessageSearchResult[]> => {
    try {
      const results = await messageAPI.searchMessages(query, transactionId);
      
      // Convert to search results format
      return results.map(message => ({
        message,
        conversation: conversations.find(c => c.transactionId === message.transactionId)!,
        highlight: query,
        relevance: 1.0
      }));
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await messageAPI.deleteMessage(messageId);
      
      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Update conversation last message if needed
      if (currentConversation?.lastMessage?.id === messageId) {
        const remainingMessages = messages.filter(msg => msg.id !== messageId);
        const newLastMessage = remainingMessages[remainingMessages.length - 1];
        
        setCurrentConversation(prev => 
          prev ? { ...prev, lastMessage: newLastMessage } : null
        );
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const refreshConversations = async () => {
    await loadConversationsFromAPI();
  };

  const recalculateUnreadCount = () => {
    if (!user) return;
    
    const totalUnread = conversations.reduce(
      (sum: number, conv: Conversation) => sum + (conv.unreadCount || 0), 
      0
    );
    setUnreadCount(totalUnread);
  };

  // Typing indicator functions
  const startTyping = useCallback((transactionId: string) => {
    if (!user?.id) return;
    
    // Emit typing start event
    if (socket && isConnected) {
      socket.emit('typing_start', { transactionId, userId: user.id });
    }
    
    // Add user to typing users for this transaction
    setTypingUsers(prev => new Set(prev).add(`${transactionId}-${user.id}`));
  }, [socket, isConnected, user?.id]);

  const stopTyping = useCallback((transactionId: string) => {
    if (!user?.id) return;
    
    // Emit typing stop event
    if (socket && isConnected) {
      socket.emit('typing_stop', { transactionId, userId: user.id });
    }
    
    // Remove user from typing users for this transaction
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${transactionId}-${user.id}`);
      return newSet;
    });
  }, [socket, isConnected, user?.id]);

  const isUserTyping = useCallback((transactionId: string, userId: string) => {
    return typingUsers.has(`${transactionId}-${userId}`);
  }, [typingUsers]);

  const value: MessageContextType = {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    sendMessage,
    sendFileMessage,
    loadConversation,
    markAsRead,
    markConversationAsRead,
    loadMessages,
    loadMoreMessages,
    searchMessages,
    deleteMessage,
    isLoading,
    uploadProgress,
    refreshConversations,
    recalculateUnreadCount,
    startTyping,
    stopTyping,
    isUserTyping,
    typingUsers
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
