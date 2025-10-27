import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { messageAPI } from '@/services/messageAPI';
import { Message, MessageAttachment } from '@/types/message';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  transactionId: string;
  participants: string[];
  participantDetails: Array<{
    userId: string;
    name: string;
    role: 'BUYER' | 'SELLER';
  }>;
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  updatedAt: Date;
}

interface MessageContextType {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  uploadProgress: Array<{
    fileId: string;
    filename: string;
    progress: number;
    status: 'UPLOADING' | 'COMPLETED' | 'FAILED';
    error?: string;
  }>;
  typingUsers: Record<string, string[]>;
  isOffline: boolean;
  messageQueue: Message[];

  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (transactionId: string) => Promise<void>;
  sendMessage: (transactionId: string, content: string) => Promise<void>;
  sendFileMessage: (transactionId: string, file: File) => Promise<void>;
  loadMessages: (transactionId: string, page?: number, reset?: boolean) => Promise<void>;
  loadMoreMessages: (transactionId: string, beforeMessageId?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (transactionId: string) => Promise<void>;
  startTyping: (transactionId: string) => void;
  stopTyping: (transactionId: string) => void;
  retryFailedMessages: () => Promise<void>;
  clearMessageQueue: () => void;
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
  children: React.ReactNode;
}

const MESSAGES_PER_PAGE = 50;
const TYPING_TIMEOUT = 3000;
const RETRY_DELAY = 5000;

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Array<{
    fileId: string;
    filename: string;
    progress: number;
    status: 'UPLOADING' | 'COMPLETED' | 'FAILED';
    error?: string;
  }>>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [isOffline, setIsOffline] = useState(false);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);

  // Refs for deduplication
  const sentMessageIds = useRef<Set<string>>(new Set());
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const retryTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Calculate unread count
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    setUnreadCount(totalUnread);
  }, [conversations]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleMessage = (data: { message: Message; transactionId: string }) => {
      console.log('MessageContext: Received message via WebSocket:', data);
      
      // Check if message is already processed
      if (sentMessageIds.current.has(data.message.id)) {
        console.log('MessageContext: Duplicate message ignored:', data.message.id);
        return;
      }

      // Mark as processed
      sentMessageIds.current.add(data.message.id);

      // Add to messages if it's for the current conversation
      if (currentConversation && data.transactionId === currentConversation.transactionId) {
        setMessages(prev => {
          // Check for duplicates
          const exists = prev.some(msg => msg.id === data.message.id);
          if (exists) return prev;
          
          return [data.message, ...prev];
        });
      }

      // Update conversation
      setConversations(prev => 
        prev.map(conv => {
          if (conv.transactionId === data.transactionId) {
            return {
              ...conv,
              lastMessage: data.message,
              updatedAt: new Date(),
              unreadCount: conv.unreadCount + 1
            };
          }
          return conv;
        })
      );
    };

    const handleTyping = (data: { transactionId: string; userId: string; isTyping: boolean }) => {
      if (data.userId === user.id) return; // Don't show own typing

      setTypingUsers(prev => {
        const current = prev[data.transactionId] || [];
        if (data.isTyping) {
          return {
            ...prev,
            [data.transactionId]: [...current.filter(id => id !== data.userId), data.userId]
          };
        } else {
          return {
            ...prev,
            [data.transactionId]: current.filter(id => id !== data.userId)
          };
        }
      });
    };

    const handleConnectionStatus = (status: boolean) => {
      setIsOffline(!status);
      if (status) {
        // Retry failed messages when connection is restored
        retryFailedMessages();
      }
    };

    // Register event listeners
    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('connection_status', handleConnectionStatus);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('connection_status', handleConnectionStatus);
    };
  }, [socket, isConnected, user, currentConversation]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const apiConversations = await messageAPI.getConversations();
      
      // Transform API data to our format
      const transformedConversations: Conversation[] = apiConversations.map(conv => ({
        id: conv.id,
        transactionId: conv.transactionId,
        participants: conv.participants || [],
        participantDetails: conv.participantDetails || [],
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount || 0,
        isActive: conv.isActive || false,
        updatedAt: new Date(conv.updatedAt || conv.createdAt)
      }));

      setConversations(transformedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load specific conversation
  const loadConversation = useCallback(async (transactionId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Find conversation
      const conversation = conversations.find(conv => conv.transactionId === transactionId);
      if (conversation) {
        setCurrentConversation(conversation);
      }

      // Load messages
      await loadMessages(transactionId, 1, true);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [user, conversations]);

  // Load messages with deduplication
  const loadMessages = useCallback(async (transactionId: string, page: number = 1, reset: boolean = true) => {
    if (!user) return;

    try {
      if (reset) {
        setMessages([]);
        setHasMoreMessages(false);
      }

      const apiMessages = await messageAPI.getMessages(transactionId);
      
      // Filter out already processed messages
      const newMessages = apiMessages.filter(msg => !sentMessageIds.current.has(msg.id));
      
      // Mark as processed
      newMessages.forEach(msg => sentMessageIds.current.add(msg.id));

      if (reset) {
        setMessages(newMessages);
      } else {
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...uniqueNewMessages];
        });
      }

      setHasMoreMessages(apiMessages.length === MESSAGES_PER_PAGE);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  }, [user]);

  // Send message with proper deduplication
  const sendMessage = useCallback(async (transactionId: string, content: string) => {
    if (!user || isLoading) return;

    // Generate unique message ID
    const messageId = `msg_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check for duplicate
    if (sentMessageIds.current.has(messageId)) {
      console.warn('Duplicate message prevented:', messageId);
      return;
    }

    const message: Message = {
      id: messageId,
      transactionId,
      senderId: user.id,
      receiverId: '',
      content,
      timestamp: new Date(),
      isRead: false,
      messageType: 'TEXT',
      isSynced: false
    };

    // Mark as sent
    sentMessageIds.current.add(messageId);

    // Add to UI immediately (optimistic update)
    setMessages(prev => [message, ...prev]);

    // Update conversation
    if (currentConversation) {
      const updatedConversation = {
        ...currentConversation,
        lastMessage: message,
        updatedAt: new Date()
      };
      setCurrentConversation(updatedConversation);
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id ? updatedConversation : conv
        )
      );
    }

    try {
      // Send to backend
      const apiMessage = await messageAPI.sendMessage({
        transactionId,
        content
      });

      // Update message with API response
      const updatedMessage = {
        ...message,
        id: apiMessage.id,
        isSynced: true,
        timestamp: new Date(apiMessage.createdAt || apiMessage.timestamp)
      };

      // Update in UI
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );

      // Send via WebSocket for real-time delivery
      if (socket && isConnected) {
        socket.emit('send_message', {
          message: updatedMessage,
          transactionId
        });
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Mark as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, error: 'Failed to send', isSynced: false } : msg
        )
      );

      // Queue for retry
      setMessageQueue(prev => [...prev, message]);
      toast.error('Failed to send message. Will retry when connection is restored.');
    }
  }, [user, isLoading, currentConversation, socket, isConnected]);

  // Send file message
  const sendFileMessage = useCallback(async (transactionId: string, file: File) => {
    if (!user) return;

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to upload progress
    setUploadProgress(prev => [...prev, {
      fileId,
      filename: file.name,
      progress: 0,
      status: 'UPLOADING'
    }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('transactionId', transactionId);

      const response = await messageAPI.sendFileMessage(formData);
      
      // Update progress
      setUploadProgress(prev => 
        prev.map(p => p.fileId === fileId ? { ...p, progress: 100, status: 'COMPLETED' } : p)
      );

      // Add message to UI
      const message: Message = {
        id: response.id,
        transactionId,
        senderId: user.id,
        receiverId: '',
        content: `Sent ${file.name}`,
        timestamp: new Date(),
        isRead: false,
        messageType: 'FILE',
        isSynced: true,
        attachments: [{
          id: response.attachmentId,
          filename: file.name,
          fileUrl: response.fileUrl,
          fileSize: file.size,
          mimeType: file.type
        }]
      };

      setMessages(prev => [message, ...prev]);

      // Send via WebSocket
      if (socket && isConnected) {
        socket.emit('send_message', {
          message,
          transactionId
        });
      }

    } catch (error) {
      console.error('Failed to send file:', error);
      
      // Update progress with error
      setUploadProgress(prev => 
        prev.map(p => p.fileId === fileId ? { 
          ...p, 
          status: 'FAILED', 
          error: 'Upload failed' 
        } : p)
      );
      
      toast.error('Failed to send file');
    }
  }, [user, socket, isConnected]);

  // Load more messages
  const loadMoreMessages = useCallback(async (transactionId: string, beforeMessageId?: string) => {
    if (isLoadingMore || !hasMoreMessages) return;

    try {
      setIsLoadingMore(true);
      await loadMessages(transactionId, 1, false);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreMessages, loadMessages]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await messageAPI.markAsRead(messageId);
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, isRead: true } : msg)
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (transactionId: string) => {
    try {
      await messageAPI.markConversationAsRead(transactionId);
      
      setConversations(prev => 
        prev.map(conv => 
          conv.transactionId === transactionId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      setMessages(prev => 
        prev.map(msg => 
          msg.transactionId === transactionId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, []);

  // Start typing
  const startTyping = useCallback((transactionId: string) => {
    if (!socket || !isConnected || !user) return;

    // Clear existing timeout
    if (typingTimeouts.current[transactionId]) {
      clearTimeout(typingTimeouts.current[transactionId]);
    }

    // Emit typing event
    socket.emit('typing', {
      transactionId,
      userId: user.id,
      isTyping: true
    });

    // Set timeout to stop typing
    typingTimeouts.current[transactionId] = setTimeout(() => {
      stopTyping(transactionId);
    }, TYPING_TIMEOUT);
  }, [socket, isConnected, user]);

  // Stop typing
  const stopTyping = useCallback((transactionId: string) => {
    if (!socket || !isConnected || !user) return;

    // Clear timeout
    if (typingTimeouts.current[transactionId]) {
      clearTimeout(typingTimeouts.current[transactionId]);
      delete typingTimeouts.current[transactionId];
    }

    // Emit stop typing event
    socket.emit('typing', {
      transactionId,
      userId: user.id,
      isTyping: false
    });
  }, [socket, isConnected, user]);

  // Retry failed messages
  const retryFailedMessages = useCallback(async () => {
    if (messageQueue.length === 0) return;

    const failedMessages = [...messageQueue];
    setMessageQueue([]);

    for (const message of failedMessages) {
      try {
        await sendMessage(message.transactionId, message.content);
      } catch (error) {
        console.error('Failed to retry message:', error);
        // Re-queue if still failing
        setMessageQueue(prev => [...prev, message]);
      }
    }
  }, [messageQueue, sendMessage]);

  // Clear message queue
  const clearMessageQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
      Object.values(retryTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const value: MessageContextType = {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    uploadProgress,
    typingUsers,
    isOffline,
    messageQueue,
    loadConversations,
    loadConversation,
    sendMessage,
    sendFileMessage,
    loadMessages,
    loadMoreMessages,
    markAsRead,
    markConversationAsRead,
    startTyping,
    stopTyping,
    retryFailedMessages,
    clearMessageQueue
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
