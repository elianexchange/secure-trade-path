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
  loadMessages: (transactionId: string, page?: number, reset?: boolean) => Promise<void>;
  loadMoreMessages: (transactionId: string, beforeMessageId?: string) => Promise<void>;
  searchMessages: (query: string, transactionId?: string) => Promise<MessageSearchResult[]>;
  deleteMessage: (messageId: string) => Promise<void>;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  uploadProgress: FileUploadProgress[];
  refreshConversations: () => Promise<void>;
  recalculateUnreadCount: () => void;
  startTyping: (transactionId: string) => void;
  stopTyping: (transactionId: string) => void;
  isUserTyping: (transactionId: string, userId: string) => boolean;
  typingUsers: Set<string>;
  isOffline: boolean;
  messageQueue: Message[];
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineMessages, setOfflineMessages] = useState<Message[]>([]);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const MESSAGES_PER_PAGE = 50;
  
  // Use ref to track current conversation without causing dependency issues
  const currentConversationRef = useRef<Conversation | null>(null);

  // Offline support
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Process queued messages when coming back online
      processMessageQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queued messages when back online
  const processMessageQueue = async () => {
    if (messageQueue.length === 0) return;

    console.log('Processing queued messages:', messageQueue.length);
    
    for (const message of messageQueue) {
      try {
        await messageAPI.sendMessage({
          transactionId: message.transactionId,
          content: message.content
        });
        
        // Remove from queue on success
        setMessageQueue(prev => prev.filter(m => m.id !== message.id));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        // Keep in queue for retry
      }
    }
  };

  // Load conversations from backend with retry logic
  const loadConversationsFromAPI = useCallback(async (retryCount = 0) => {
    if (!user || !user.id) {
      console.log('No user or user ID, skipping conversation load');
      return;
    }
    
    try {
      console.log('MessageContext: Loading conversations from API, attempt:', retryCount + 1);
      const apiConversations = await messageAPI.getConversations();
      console.log('MessageContext: Loaded conversations:', apiConversations.length);
      
      setConversations(apiConversations);
      
      // Calculate total unread count
      const totalUnread = apiConversations.reduce(
        (sum: number, conv: Conversation) => sum + conv.unreadCount, 
        0
      );
      setUnreadCount(totalUnread);
      
      // Save to localStorage for offline access
      localStorage.setItem(`tranzio_conversations_${user.id}`, JSON.stringify(apiConversations));
      console.log('MessageContext: Conversations saved to localStorage');
    } catch (error) {
      console.error('Failed to load conversations from API:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && (error instanceof TypeError || error.message.includes('fetch'))) {
        console.log('MessageContext: Retrying conversation load in 2 seconds...');
        setTimeout(() => loadConversationsFromAPI(retryCount + 1), 2000);
        return;
      }
      
      // Fallback to localStorage
      console.log('MessageContext: Falling back to localStorage conversations');
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
      console.log('MessageContext: Loaded conversations from localStorage:', conversationsWithProperDates.length);
    }
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

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

  // Load conversations when user logs in
  useEffect(() => {
    if (user && user.id) {
      console.log('MessageContext: User logged in, loading conversations for user:', user.id);
      loadConversationsFromAPI();
    } else {
      console.log('MessageContext: No user, clearing conversations');
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user?.id, loadConversationsFromAPI]); // Include loadConversationsFromAPI in dependencies

  // Update refs when state changes
  const conversationsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<Message[]>([]);
  
  useEffect(() => {
    currentConversationRef.current = currentConversation;
    conversationsRef.current = conversations;
    messagesRef.current = messages;
  }, [currentConversation, conversations, messages]);

  // WebSocket message handling
  useEffect(() => {
    if (!socket || !isConnected || !user) {
      console.log('WebSocket not connected or no user, skipping message handlers');
      return;
    }

    console.log('Setting up WebSocket message handlers for user:', user.id);

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

        // Enhanced deduplication: Check for existing message by ID, content, and timestamp
        const messageExists = messagesRef.current.some(existingMsg => 
          existingMsg.id === message.id || 
          existingMsg.apiId === message.id ||
          (existingMsg.content === message.content && 
           existingMsg.senderId === message.senderId && 
           Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
        );
        
        if (messageExists) {
          console.log('Duplicate message detected, skipping:', message.id);
          return;
        }

        setMessages(prev => {
          
          // Add new message with proper timestamp handling and all fields
          const messageWithProperTimestamp = {
            ...message,
            timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
            isSynced: true,
            messageType: message.messageType || 'TEXT',
            isEdited: message.isEdited || false,
            editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
            replyToId: message.replyToId,
            metadata: message.metadata,
            attachments: message.attachments || [],
            sender: message.sender
          };
          
          return [...prev, messageWithProperTimestamp];
        });

        // Handle case where we receive transactionId instead of conversation
        if (transactionId && !conversation) {
          console.log('Looking for conversation with transactionId:', transactionId);
          console.log('Available conversations:', conversationsRef.current);
          
          // Find existing conversation for this transaction
          const existingConversation = conversationsRef.current.find(c => c.transactionId === transactionId);
          
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
              id: `conv_${transactionId}`, // Use transactionId as conversation ID to prevent duplicates
              transactionId,
              participants: [message.senderId],
              lastMessage: message,
              unreadCount: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              participantDetails: []
            };
            
            setConversations(prev => {
              // Check if conversation already exists to prevent duplicates
              const existingConv = conversationsRef.current.find(c => c.transactionId === transactionId);
              if (existingConv) {
                console.log('Conversation already exists, updating instead of creating new one');
                return prev.map(conv => 
                  conv.transactionId === transactionId 
                    ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
                    : conv
                );
              }
              console.log('Adding new conversation to state');
              return [...prev, newConversation];
            });
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
          
          // Update conversation unread count (not global)
          setConversations(prev => {
            return prev.map(conv => {
              if (conv.transactionId === transactionId) {
                return {
                  ...conv,
                  unreadCount: conv.unreadCount + 1,
                  lastMessage: message
                };
              }
              return conv;
            });
          });
          
          // Recalculate total unread count
          recalculateUnreadCount();
          
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
    socket.on('user_typing', (data: { transactionId: string; userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set(prev).add(`${data.transactionId}-${data.userId}`));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(`${data.transactionId}-${data.userId}`);
            return newSet;
          });
        }
      }
    });

    // Handle message read receipts
    socket.on('message_read_receipt', (data: { messageId: string; readBy: string; transactionId: string; readAt: Date }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, isRead: true, readAt: new Date(data.readAt) }
            : msg
        )
      );
    });

    // Handle conversation read receipts
    socket.on('conversation_read_receipt', (data: { transactionId: string; readBy: string; readAt: Date }) => {
      // Mark all messages in this conversation as read
      setMessages(prev => 
        prev.map(msg => 
          msg.transactionId === data.transactionId && msg.senderId !== data.readBy
            ? { ...msg, isRead: true, readAt: new Date(data.readAt) }
            : msg
        )
      );
    });
    
    // Add error handler for WebSocket events
    socket.on('error', (error) => {
      console.error('WebSocket error in MessageContext:', error);
    });

    return () => {
      console.log('Cleaning up WebSocket message handlers for user:', user?.id);
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing');
      socket.off('message_read_receipt');
      socket.off('conversation_read_receipt');
      socket.off('error');
    };
  }, [socket, isConnected, user]); // Remove currentConversation from dependencies

  const sendMessage = async (transactionId: string, content: string) => {
    if (!user || isLoading) return;

    // Generate a unique temporary ID for optimistic updates
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: Message = {
      id: tempId,
      transactionId,
      senderId: user.id,
      receiverId: '', // Not needed in new API
      content,
      timestamp: new Date(),
      isRead: false,
      messageType: 'TEXT',
      isSynced: false
    };

    // Optimistically add message to UI immediately
    setMessages(prev => {
      // Check for duplicates using both temp ID and content
      const messageExists = prev.some(msg => 
        msg.id === tempId || 
        (msg.content === content && msg.senderId === user.id && 
         Math.abs(new Date(msg.timestamp).getTime() - new Date().getTime()) < 5000)
      );
      if (messageExists) {
        return prev;
      }
      return [...prev, message];
    });

    // Handle offline mode
    if (isOffline || !socket) {
      console.log('Offline mode: Queuing message for later sending');
      setMessageQueue(prev => [...prev, message]);
      setOfflineMessages(prev => [...prev, message]);
      
      // Update conversation for offline message
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
      
      toast.info('Message queued for sending when connection is restored');
      return;
    }

    try {
      console.log('MessageContext: Attempting to send message:', { transactionId, content });
      
      // Send to backend
      const apiMessage = await messageAPI.sendMessage({
        transactionId,
        content
      });
      console.log('MessageContext: Message sent to backend successfully:', apiMessage);

      // Update message with API response and mark as synced
      const updatedMessage = { 
        ...message, 
        id: apiMessage.id, // Use backend ID
        apiId: apiMessage.id, 
        isSynced: true,
        timestamp: new Date((apiMessage as any).createdAt || apiMessage.timestamp),
        messageType: apiMessage.messageType || 'TEXT',
        isEdited: apiMessage.isEdited || false,
        editedAt: apiMessage.editedAt ? new Date(apiMessage.editedAt) : undefined,
        replyToId: apiMessage.replyToId,
        metadata: apiMessage.metadata,
        attachments: apiMessage.attachments || [],
        sender: apiMessage.sender
      };

      // Update the message in the UI with the real ID
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? updatedMessage : msg
        )
      );

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

      // Emit message via WebSocket for real-time delivery
      if (socket && isConnected) {
        socket.emit('send_message', {
          message: updatedMessage,
          transactionId,
          receiverId: currentConversation?.participants.find(p => p !== user.id) || ''
        });
        console.log('MessageContext: Message emitted via WebSocket for real-time delivery');
      }
    } catch (error) {
      console.error('MessageContext: Failed to send message:', error);
      
      // If network error, queue for retry
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error: Queuing message for retry');
        setMessageQueue(prev => [...prev, message]);
        toast.warning('Message queued for retry when connection is restored');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
      
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, error: 'Failed to send', isSynced: false } : msg
        )
      );
    }
  };

  const sendFileMessage = async (transactionId: string, file: File) => {
    if (!user) return;

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to upload progress
    setUploadProgress(prev => [...prev, {
      fileId,
      filename: file.name,
      progress: 0,
      status: 'UPLOADING'
    }]);

    // Handle offline mode for file uploads
    if (isOffline || !socket) {
      console.log('Offline mode: Queuing file for later upload');
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId ? { ...p, status: 'FAILED', error: 'Offline - will retry when online' } : p
        )
      );
      toast.warning('File upload queued for when connection is restored');
      return;
    }

    try {
      // Upload file with progress tracking
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

      // Update upload progress to completed
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId ? { ...p, progress: 100, status: 'COMPLETED' } : p
        )
      );

      // Create message with attachment
      const message: Message = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId,
        senderId: user.id,
        receiverId: '', // Not needed in new API
        content: `Sent: ${file.name}`,
        timestamp: new Date(),
        isRead: false,
        messageType: 'FILE',
        attachments: [attachment],
        isSynced: false
      };

      // Send message via API
      try {
        const apiMessage = await messageAPI.sendMessage({
          transactionId,
          content: `Sent: ${file.name}`
        });

        // Update message with API response
        const updatedMessage = { 
          ...message, 
          id: apiMessage.id,
          apiId: apiMessage.id, 
          isSynced: true,
          timestamp: new Date((apiMessage as any).createdAt || apiMessage.timestamp)
        };

        // Add to messages
        setMessages(prev => [...prev, updatedMessage]);

        // Update conversation
        if (currentConversation) {
          const updatedConversation = {
            ...currentConversation,
            lastMessage: updatedMessage,
            updatedAt: new Date()
          };
          setCurrentConversation(updatedConversation);
          
          setConversations(prev => 
            prev.map(conv => 
              conv.id === currentConversation.id ? updatedConversation : conv
            )
          );
        }

        toast.success('File sent successfully');
      } catch (error) {
        console.error('Failed to send file message:', error);
        toast.error('Failed to send file message');
      }
      
      // Remove from upload progress after delay
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
      }, 3000);

    } catch (error) {
      console.error('Failed to upload file:', error);
      
      // Update upload progress with error
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId ? { 
            ...p, 
            status: 'FAILED', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : p
        )
      );
      
      toast.error('Failed to upload file');
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
      // Join transaction room for real-time updates
      if (socket && isConnected) {
        socket.emit('join_transaction_room', { transactionId });
        console.log(`MessageContext: Joined transaction room ${transactionId}`);
      }

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
        
        // Don't automatically mark as read - let user explicitly open conversation
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

  const loadMessages = async (transactionId: string, page: number = 1, reset: boolean = true) => {
    if (!user) return;

    // Check if we already have messages for this transaction and not resetting
    if (!reset && messages.length > 0 && messages[0]?.transactionId === transactionId) {
      return; // Already loaded, don't reload
    }

    if (reset) {
      setMessagePage(1);
      setHasMoreMessages(false);
    }

    try {
      // Try to load from API first
      const apiMessages = await messageAPI.getMessages(transactionId);
      
      if (reset) {
        setMessages(apiMessages);
      } else {
        // Add to existing messages (avoid duplicates)
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = apiMessages.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...newMessages];
        });
      }
      
      // Check if there are more messages
      setHasMoreMessages(apiMessages.length === MESSAGES_PER_PAGE);
      
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
      
      if (reset) {
        setMessages(messagesWithProperDates);
      } else {
        setMessages(prev => [...prev, ...messagesWithProperDates]);
      }
    }
  };

  const loadMoreMessages = async (transactionId: string, beforeMessageId?: string) => {
    if (!user || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      const nextPage = messagePage + 1;
      await loadMessages(transactionId, nextPage, false);
      setMessagePage(nextPage);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!socket) return;

    try {
      // Mark as read in backend
      await messageAPI.markAsRead(messageId);
      
      // Emit read status via WebSocket
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        socket.emit('message_read', { 
          messageId, 
          transactionId: message.transactionId 
        });
      }

      // Update local state only if not already read
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId && !msg.isRead ? { ...msg, isRead: true } : msg
        )
      );

      // Use the message we already found
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
      // Call backend API to mark conversation as read
      await messageAPI.markConversationAsRead(transactionId);

      // Emit conversation read via WebSocket
      if (socket && isConnected) {
        socket.emit('conversation_read', { transactionId });
      }

      // Mark all messages in the conversation as read locally
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
    isLoadingMore,
    hasMoreMessages,
    uploadProgress,
    refreshConversations,
    recalculateUnreadCount,
    startTyping,
    stopTyping,
    isUserTyping,
    typingUsers,
    isOffline,
    messageQueue
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
