import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  X, 
  ImageIcon, 
  FileText, 
  File, 
  Download,
  AlertCircle,
  Loader2,
  Check,
  CheckCheck,
  Clock,
  Smile,
  Mic,
  MoreVertical,
  Reply,
  Forward,
  Copy,
  Trash2,
  Circle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { Message, MessageAttachment } from '@/types/message';
import { cn } from '@/lib/utils';

interface EnhancedMessageThreadProps {
  transactionId: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyRole: 'BUYER' | 'SELLER';
  className?: string;
  onClose?: () => void;
}

export default function EnhancedMessageThread({ 
  transactionId, 
  counterpartyId, 
  counterpartyName, 
  counterpartyRole,
  className,
  onClose
}: EnhancedMessageThreadProps) {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    sendFileMessage,
    loadConversation, 
    markAsRead, 
    markConversationAsRead,
    loadMoreMessages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    uploadProgress,
    startTyping,
    stopTyping,
    typingUsers,
    currentConversation,
    isOffline,
    messageQueue
  } = useMessages();

  // State management
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<{ [key: string]: { isOnline: boolean; lastSeen: Date } }>({});
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Memoized values
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      try {
        return message && 
               message.id && 
               message.content && 
               message.senderId && 
               message.timestamp &&
               ['TEXT', 'FILE', 'SYSTEM'].includes(message.messageType || 'TEXT');
      } catch (error) {
        console.warn('Invalid message filtered out:', message);
        return false;
      }
    });
  }, [messages]);

  const isOwnMessage = useCallback((message: Message) => {
    return message.senderId === user?.id;
  }, [user?.id]);

  const getAvatarFallback = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const formatMessageTime = useCallback((timestamp: Date | string | undefined | null) => {
    try {
      if (!timestamp) return 'Just now';
      
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Just now';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
      }
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } catch (error) {
      console.warn('Error formatting message time:', error);
      return 'Just now';
    }
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.startsWith('text/')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  }, []);

  const getMessageStatus = useCallback((message: Message) => {
    if (message.error) return <AlertCircle className="h-3 w-3 text-red-500" />;
    if (message.isRead) return <CheckCheck className="h-3 w-3 text-blue-500" />;
    if (message.isSynced) return <Check className="h-3 w-3 text-gray-400" />;
    return <Clock className="h-3 w-3 text-gray-400" />;
  }, []);

  const getOnlineStatus = useCallback((userId: string) => {
    const status = onlineStatus[userId];
    if (!status) return { isOnline: false, lastSeen: null };
    return status;
  }, [onlineStatus]);

  const formatLastSeen = useCallback((lastSeen: Date | null | undefined) => {
    if (!lastSeen) return 'Never';
    
    try {
      const now = new Date();
      const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
      
      if (isNaN(lastSeenDate.getTime())) return 'Never';
      
      const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ago`;
      }
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    } catch (error) {
      console.warn('Error formatting last seen:', error);
      return 'Unknown';
    }
  }, []);

  // Load conversation on mount
  useEffect(() => {
    if (transactionId && !isLoading) {
      loadConversation(transactionId);
    }
  }, [transactionId, loadConversation, isLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages.length, isScrolledToBottom]);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsScrolledToBottom(isAtBottom);

    if (transactionId && filteredMessages.length > 0) {
      markConversationAsRead(transactionId);
    }
  }, [transactionId, filteredMessages.length, markConversationAsRead]);

  // Handle input change with typing indicators
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    
    // Handle typing indicators
    if (value.length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(transactionId);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(transactionId);
      }, 2000);
    } else {
      setIsTyping(false);
      stopTyping(transactionId);
    }
  }, [isTyping, startTyping, stopTyping, transactionId]);

  // Handle send message with duplicate prevention
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || isSending) return;
    
    const messageContent = newMessage.trim();
    const messageId = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check for duplicate message
    const isDuplicate = filteredMessages.some(msg => 
      msg.content === messageContent && 
      msg.senderId === user.id && 
      Math.abs(new Date(msg.timestamp).getTime() - Date.now()) < 5000
    );
    
    if (isDuplicate) {
      console.warn('Duplicate message prevented');
      return;
    }

    setIsSending(true);
    
    try {
      await sendMessage(transactionId, messageContent);
      setNewMessage('');
      setIsTyping(false);
      stopTyping(transactionId);
      markConversationAsRead(transactionId);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, user, isSending, filteredMessages, sendMessage, transactionId, stopTyping, markConversationAsRead]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setShowFileOptions(false);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async () => {
    if (!selectedFile || !user || isSending) return;

    setIsSending(true);
    try {
      await sendFileMessage(transactionId, selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsSending(false);
    }
  }, [selectedFile, user, isSending, sendFileMessage, transactionId]);

  // Handle load more messages
  const handleLoadMore = useCallback(async () => {
    if (filteredMessages.length > 0 && !isLoadingMore && hasMoreMessages) {
      try {
        const oldestMessageId = filteredMessages[filteredMessages.length - 1]?.id;
        await loadMoreMessages(transactionId, oldestMessageId);
      } catch (error) {
        console.error('Error loading more messages:', error);
      }
    }
  }, [filteredMessages, isLoadingMore, hasMoreMessages, loadMoreMessages, transactionId]);

  // Handle message actions
  const handleMessageAction = useCallback((action: string, message: Message) => {
    switch (action) {
      case 'reply':
        setReplyTo(message);
        break;
      case 'forward':
        // Implement forward functionality
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      case 'delete':
        // Implement delete functionality
        break;
    }
    setSelectedMessage(null);
  }, []);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      stopTyping(transactionId);
    };
  }, [transactionId, stopTyping]);

  // Stable online status (no fluctuation)
  useEffect(() => {
    // Set a stable online status
    setOnlineStatus(prev => ({
      ...prev,
      [counterpartyId]: {
        isOnline: true, // Keep it stable for demo
        lastSeen: new Date()
      }
    }));
  }, [counterpartyId]);

  if (isLoading) {
    return (
      <div className={cn("h-full flex flex-col bg-white", className)}>
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading messages...</span>
          </div>
        </div>
      </div>
    );
  }

  const counterpartyStatus = getOnlineStatus(counterpartyId);

  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* Sticky Header */}
      <div className="flex-shrink-0 p-3 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile back button */}
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {getAvatarFallback(counterpartyName)}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                counterpartyStatus.isOnline ? "bg-green-500" : "bg-gray-400"
              )} />
            </div>
            <div>
              <h3 className="font-medium text-sm">{counterpartyName}</h3>
              <p className="text-xs text-muted-foreground">
                {counterpartyStatus.isOnline 
                  ? 'Online' 
                  : `Last seen ${formatLastSeen(counterpartyStatus.lastSeen || null)}`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isOffline && (
              <Badge variant="secondary" className="text-xs">
                Offline ({messageQueue.length})
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea 
          className="h-full" 
          ref={scrollAreaRef}
          onScrollCapture={handleScroll}
        >
          <div className="p-3 space-y-1">
            {/* Load More Button */}
            {hasMoreMessages && filteredMessages.length > 0 && (
              <div className="flex justify-center pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-xs"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : null}
                  Load more messages
                </Button>
              </div>
            )}

            {/* Messages */}
            {filteredMessages.map((message, index) => {
              const isOwn = isOwnMessage(message);
              const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
              
              // Safe timestamp comparison
              let isConsecutive = false;
              try {
                if (prevMessage && message.timestamp && prevMessage.timestamp) {
                  const messageTime = new Date(message.timestamp).getTime();
                  const prevMessageTime = new Date(prevMessage.timestamp).getTime();
                  
                  if (!isNaN(messageTime) && !isNaN(prevMessageTime)) {
                    isConsecutive = prevMessage.senderId === message.senderId && 
                      Math.abs(messageTime - prevMessageTime) < 300000; // 5 minutes
                  }
                }
              } catch (error) {
                console.warn('Error comparing message timestamps:', error);
                isConsecutive = false;
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end space-x-2 group",
                    isOwn ? "justify-end" : "justify-start",
                    isConsecutive ? "mt-0.5" : "mt-2"
                  )}
                >
                  {!isOwn && !isConsecutive && (
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getAvatarFallback(counterpartyName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {!isOwn && isConsecutive && (
                    <div className="w-6" /> // Spacer for consecutive messages
                  )}
                  
                  <div className={cn(
                    "flex flex-col max-w-[80%] sm:max-w-[60%]",
                    isOwn ? "items-end" : "items-start"
                  )}>
                    {/* Message Bubble */}
                    <div className={cn(
                      "rounded-2xl px-4 py-2 shadow-sm relative group/message",
                      isOwn 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      
                      {/* File Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className={cn(
                                "flex items-center space-x-2 p-2 rounded-lg",
                                isOwn ? "bg-blue-400/20" : "bg-white/50"
                              )}
                            >
                              {getFileIcon(attachment.mimeType)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {attachment.filename}
                                </p>
                                <p className="text-xs opacity-75">
                                  {formatFileSize(attachment.fileSize)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(attachment.fileUrl, '_blank')}
                                className="h-6 w-6 p-0"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Actions (on hover) */}
                      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 bg-white shadow-md"
                          onClick={() => setSelectedMessage(message)}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Message Status and Time */}
                    <div className={cn(
                      "flex items-center space-x-1 mt-1 px-1",
                      isOwn ? "justify-end" : "justify-start"
                    )}>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {isOwn && getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUsers[transactionId] && typingUsers[transactionId].length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs">
                  {counterpartyName} is typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* File Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t bg-muted/20">
          <div className="space-y-2">
            {uploadProgress.map((progress) => (
              <div key={progress.fileId} className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{progress.filename}</span>
                    <span>{Math.round(progress.progress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        progress.status === 'COMPLETED' && 'bg-green-500',
                        progress.status === 'FAILED' && 'bg-red-500',
                        progress.status === 'UPLOADING' && 'bg-primary'
                      )}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
                {progress.status === 'FAILED' && (
                  <span className="text-xs text-red-500">{progress.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Message Input */}
      <div className="flex-shrink-0 p-3 border-t bg-white">
        {/* Reply Indicator */}
        {replyTo && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-700">Replying to {replyTo.senderId === user?.id ? 'yourself' : counterpartyName}</p>
                <p className="text-xs text-blue-600 truncate">{replyTo.content}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* File Selection Display */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          {/* File Upload Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFileOptions(!showFileOptions)}
            className="h-10 w-10 p-0 flex-shrink-0"
            disabled={isSending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newMessage.trim() && !isSending) {
                    handleSendMessage(e);
                  }
                }
              }}
              placeholder="Type your message..."
              className="min-h-[40px] max-h-[120px] resize-none pr-12"
              disabled={isSending}
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newMessage.trim() || isSending}
            className="h-10 w-10 p-0 flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* File Options */}
        {showFileOptions && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Photo</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <File className="h-4 w-4" />
                <span>File</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Mic className="h-4 w-4" />
                <span>Voice</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Message Actions Menu */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full mx-4">
            <h3 className="font-medium mb-4">Message Actions</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMessageAction('reply', selectedMessage)}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMessageAction('forward', selectedMessage)}
              >
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMessageAction('copy', selectedMessage)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600"
                onClick={() => handleMessageAction('delete', selectedMessage)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setSelectedMessage(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}