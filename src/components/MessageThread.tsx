import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  MessageCircle, 
  Clock, 
  Check, 
  CheckCheck, 
  Paperclip, 
  X, 
  Download,
  FileText,
  Image as ImageIcon,
  File,
  AlertCircle
} from 'lucide-react';
import { useMessages } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Message, MessageAttachment } from '@/types/message';

interface MessageThreadProps {
  transactionId: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyRole: 'BUYER' | 'SELLER';
}

export default function MessageThread({ 
  transactionId, 
  counterpartyId, 
  counterpartyName, 
  counterpartyRole 
}: MessageThreadProps) {
  const { 
    messages, 
    sendMessage, 
    sendFileMessage,
    loadConversation, 
    markAsRead, 
    markConversationAsRead,
    loadMoreMessages,
    isLoading,
    uploadProgress,
    startTyping,
    stopTyping,
    typingUsers,
    currentConversation
  } = useMessages();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadConversationStable = useCallback((id: string) => {
    if (!isLoading && id) {
      loadConversation(id);
    }
  }, [loadConversation, isLoading]);

  // Check if there are more messages than can be displayed
  const checkForMoreMessages = useCallback(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      // Check if the container is scrollable (has more content than visible)
      const isScrollable = container.scrollHeight > container.clientHeight;
      // Also check if we're not at the top (meaning there might be more messages above)
      const isNotAtTop = container.scrollTop > 0;
      // Show load more if container is scrollable or if we're not at the top
      setHasMoreMessages(isScrollable || isNotAtTop);
    } else {
      setHasMoreMessages(false);
    }
  }, [messages.length]);

  // Handle loading more messages
  const handleLoadMoreMessages = useCallback(async () => {
    if (messages.length > 0 && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        const oldestMessageId = messages[messages.length - 1]?.id;
        await loadMoreMessages(transactionId, oldestMessageId);
      } catch (error) {
        console.error('Error loading more messages:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [messages, isLoadingMore, loadMoreMessages, transactionId]);

  useEffect(() => {
    if (transactionId && !isLoading) {
      loadConversationStable(transactionId);
    }
  }, [transactionId]); // Only depend on transactionId, not on loadConversationStable

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Check for more messages after messages are loaded
    const timer = setTimeout(() => {
      checkForMoreMessages();
    }, 100); // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timer);
  }, [messages, checkForMoreMessages]);

  useEffect(() => {
    // Check for more messages when component mounts
    checkForMoreMessages();
  }, [checkForMoreMessages]);

  useEffect(() => {
    // Add scroll event listener to check for more messages when scrolling
    const container = messagesContainerRef.current;
    if (container) {
      const handleScroll = () => {
        checkForMoreMessages();
      };
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [checkForMoreMessages]);

  useEffect(() => {
    // Mark messages as read when viewing (only once when component mounts)
    const unreadMessages = messages.filter(message => 
      message.senderId !== user?.id && !message.isRead
    );
    
    if (unreadMessages.length > 0) {
      // Mark all unread messages as read in batch
      unreadMessages.forEach(message => {
        markAsRead(message.id);
      });
      
      // Also mark the conversation as read
      if (transactionId) {
        markConversationAsRead(transactionId);
      }
    }
  }, [transactionId, markConversationAsRead]); // Include dependencies

  // No cleanup needed for typing indicators

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(transactionId, newMessage.trim());
      setNewMessage('');
      
      // Stop typing indicator when message is sent
      stopTyping(transactionId);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

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
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAvatarFallback = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const validateMessage = (message: any) => {
    // Ensure message has required properties and valid timestamp
    if (!message || !message.id || !message.content) {
      return false;
    }
    
    // Validate timestamp
    try {
      if (message.timestamp) {
        const date = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);
        if (isNaN(date.getTime())) {
          console.warn('Message has invalid timestamp:', message);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error validating message:', error, message);
      return false;
    }
  };

  const formatMessageTime = (timestamp: Date | string | undefined) => {
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
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting message time:', error, 'Timestamp:', timestamp);
      return 'Just now';
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.startsWith('text/')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = (attachment: MessageAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

    try {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 pb-2 space-y-2 relative messages-area bg-gray-50/30" 
          style={{ 
            scrollBehavior: 'smooth',
            maxHeight: 'calc(100vh - 280px)'
          }}
        >
          {/* Load More Button - Only show when there are more messages */}
          {hasMoreMessages && messages.length > 0 && (
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-2 mb-4 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleLoadMoreMessages}
                  disabled={isLoadingMore}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading...' : 'Load More Messages'}
                </button>
                <button
                  onClick={() => {
                    if (messagesContainerRef.current) {
                      messagesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  title="Scroll to top"
                >
                  ↑ Top
                </button>
              </div>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start the conversation with {counterpartyName}
              </p>
            </div>
          ) : (
            messages.filter(validateMessage).map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              const senderName = isOwnMessage ? `${user?.firstName} ${user?.lastName}` : counterpartyName;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwnMessage && (
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {getAvatarFallback(counterpartyName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`rounded-lg px-3 py-2 shadow-sm max-w-xs lg:max-w-md ${
                      isOwnMessage 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {/* Sender Name */}
                      <p className={`text-xs font-medium mb-1 ${
                        isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {senderName}
                      </p>
                      
                      {/* Message Content */}
                      <p className="text-sm">{message.content}</p>
                      
                      {/* File Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div 
                              key={attachment.id}
                              className={`p-2 rounded border ${
                                isOwnMessage 
                                  ? 'bg-primary-foreground/10 border-primary-foreground/20' 
                                  : 'bg-background border-border'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {getFileIcon(attachment.mimeType)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {attachment.filename}
                                  </p>
                                  <p className="text-xs opacity-70">
                                    {formatFileSize(attachment.fileSize)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadFile(attachment)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Message Status */}
                      <div className={`flex items-center space-x-1 mt-1 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {isOwnMessage && (
                          <span className="text-xs opacity-70">
                            {message.error ? (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            ) : message.isRead ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {/* Typing Indicator - Show when other users are typing */}
          {(() => {
            const otherTypingUsers = Array.from(typingUsers).filter(key => {
              const [txId, userId] = key.split('-') as [string, string];
              return txId === transactionId && userId !== user?.id;
            });
            
            if (otherTypingUsers.length > 0) {
              const typingUserIds = otherTypingUsers.map(key => key.split('-')[1]);
              const typingNames = typingUserIds.map(userId => {
                const participant = currentConversation?.participantDetails?.find(p => p.userId === userId);
                return participant ? participant.name : 'Someone';
              });
              
              return (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs">
                    {typingNames.length === 1 
                      ? `${typingNames[0]} is typing...`
                      : `${typingNames.slice(0, -1).join(', ')} and ${typingNames[typingNames.length - 1]} are typing...`
                    }
                  </span>
                </div>
              );
            }
            return null;
          })()}
          
          <div ref={messagesEndRef} />
        </div>

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
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          progress.status === 'COMPLETED' 
                            ? 'bg-green-500' 
                            : progress.status === 'FAILED'
                            ? 'bg-red-500'
                            : 'bg-primary'
                        }`}
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
        <div className="p-3 pb-20 border-t bg-white flex-shrink-0">
          {/* File Selection Display */}
          {selectedFile && (
            <div className="mb-2 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedFile}
                  className="h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex space-x-2">
            {/* File Upload Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 h-9"
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
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                
                // Start typing indicator for other users
                if (e.target.value.length > 0) {
                  startTyping(transactionId);
                  
                  // Auto-stop typing after 3 seconds of no input
                  setTimeout(() => {
                    if (e.target.value === newMessage) {
                      stopTyping(transactionId);
                    }
                  }, 3000);
                } else {
                  stopTyping(transactionId);
                }
              }}
              onKeyDown={() => {
                // Start typing indicator when key is pressed
                if (newMessage.length === 0) {
                  startTyping(transactionId);
                }
              }}
              onBlur={() => {
                // Stop typing indicator when input loses focus
                stopTyping(transactionId);
              }}
              placeholder="Type your message..."
              className="flex-1 h-9"
              disabled={isSending}
            />

            {/* Send Button */}
            <Button 
              type="submit" 
              size="sm" 
              disabled={(!newMessage.trim() && !selectedFile) || isSending}
              className="px-3 h-9"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

            {/* File Upload Button (if file is selected) */}
            {selectedFile && (
              <Button
                type="button"
                onClick={handleFileUpload}
                disabled={isSending}
                className="px-3 h-9 bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Upload'
                )}
              </Button>
            )}
          </form>
        </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering MessageThread:', error);
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-red-600 font-medium">Something went wrong</p>
            <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
          </div>
      </CardContent>
    </Card>
  );
  }
}
