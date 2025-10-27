import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { Message, MessageAttachment } from '@/types/message';
import { cn } from '@/lib/utils';
import MobileMessageInput from './MobileMessageInput';

interface OptimizedMessageThreadProps {
  transactionId: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyRole: 'BUYER' | 'SELLER';
  className?: string;
}

export default function OptimizedMessageThread({ 
  transactionId, 
  counterpartyId, 
  counterpartyName, 
  counterpartyRole,
  className
}: OptimizedMessageThreadProps) {
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
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const formatMessageTime = useCallback((timestamp: Date | string | undefined) => {
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

  // Load conversation on mount
  useEffect(() => {
    if (transactionId && !isLoading) {
      loadConversation(transactionId);
    }
  }, [transactionId, loadConversation, isLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages.length]);

  // Mark conversation as read when user scrolls
  const handleScroll = useCallback(() => {
    if (transactionId && filteredMessages.length > 0) {
      markConversationAsRead(transactionId);
    }
  }, [transactionId, filteredMessages.length, markConversationAsRead]);

  // Handle typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      startTyping(transactionId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(transactionId);
    }, 2000);
  }, [isTyping, startTyping, stopTyping, transactionId]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    stopTyping(transactionId);
  }, [stopTyping, transactionId]);

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
    setLastMessageId(messageId);
    
    try {
      await sendMessage(transactionId, messageContent);
      setNewMessage('');
      setIsTyping(false);
      stopTyping(transactionId);
      markConversationAsRead(transactionId);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
      setLastMessageId(null);
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

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
      stopTyping(transactionId);
    };
  }, [transactionId, stopTyping]);

  if (isLoading) {
    return (
      <Card className={cn("h-96", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading messages...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-white rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
              {getAvatarFallback(counterpartyName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-sm">{counterpartyName}</h3>
            <p className="text-xs text-muted-foreground capitalize">{counterpartyRole.toLowerCase()}</p>
          </div>
        </div>
        {isOffline && (
          <Badge variant="secondary" className="text-xs">
            Offline ({messageQueue.length})
          </Badge>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={messagesContainerRef} onScroll={handleScroll}>
        <div className="space-y-4">
          {/* Load More Button */}
          {hasMoreMessages && filteredMessages.length > 0 && (
            <div className="flex justify-center">
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
          {filteredMessages.map((message) => {
            const isOwn = isOwnMessage(message);
            const senderName = isOwn 
              ? `${user?.firstName} ${user?.lastName}` 
              : counterpartyName;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-end space-x-2",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                {!isOwn && (
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {getAvatarFallback(counterpartyName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn(
                  "flex flex-col max-w-[80%] sm:max-w-[60%]",
                  isOwn ? "items-end" : "items-start"
                )}>
                  {/* Sender Name */}
                  <p className={cn(
                    "text-xs font-medium mb-1 px-1",
                    isOwn ? "text-right" : "text-left"
                  )}>
                    {senderName}
                  </p>
                  
                  {/* Message Bubble */}
                  <div className={cn(
                    "rounded-2xl px-4 py-2 shadow-sm",
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
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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

      {/* File Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/20">
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

      {/* Message Input */}
      {isMobile ? (
        <MobileMessageInput
          onSendMessage={(content) => {
            handleSendMessage({ preventDefault: () => {} } as React.FormEvent);
            setNewMessage(content);
          }}
          onSendFile={handleFileUpload}
          isSending={isSending}
          onTypingStart={() => startTyping(transactionId)}
          onTypingStop={() => stopTyping(transactionId)}
          className="border-t"
        />
      ) : (
        <div className="p-4 border-t bg-white">
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
              onClick={() => fileInputRef.current?.click()}
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
              <Input
                value={newMessage}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim() && !isSending) {
                      handleSendMessage(e);
                    }
                  }
                }}
                placeholder="Type your message..."
                className="h-10 pr-12 resize-none"
                disabled={isSending}
              />
            </div>

            {/* Send/Upload Button */}
            {selectedFile ? (
              <Button
                type="button"
                onClick={handleFileUpload}
                disabled={isSending}
                className="h-10 px-4 flex-shrink-0 bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Upload'
                )}
              </Button>
            ) : (
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
            )}
          </form>
        </div>
      )}
    </div>
  );
}
