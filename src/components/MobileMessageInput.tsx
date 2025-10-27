import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Paperclip, 
  X, 
  Smile,
  Image as ImageIcon,
  File,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMessageInputProps {
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
  isSending: boolean;
  onTypingStart: () => void;
  onTypingStop: () => void;
  className?: string;
}

export default function MobileMessageInput({
  onSendMessage,
  onSendFile,
  isSending,
  onTypingStart,
  onTypingStop,
  className
}: MobileMessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change with typing indicators
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    
    // Handle typing indicators
    if (value.length > 0) {
      onTypingStart();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 2000);
    } else {
      onTypingStop();
    }
  }, [onTypingStart, onTypingStop]);

  // Handle send message
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    onTypingStop();
  }, [message, isSending, onSendMessage, onTypingStop]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setShowAttachments(false);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(() => {
    if (selectedFile) {
      onSendFile(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [selectedFile, onSendFile]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    if (!message.trim()) {
      setIsExpanded(false);
    }
    onTypingStop();
  }, [message, onTypingStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn(
      "bg-white border-t border-gray-200 transition-all duration-200",
      isExpanded ? "pb-4" : "pb-2",
      className
    )}>
      {/* File Selection Display */}
      {selectedFile && (
        <div className="px-4 py-2 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{selectedFile.name}</span>
              <span className="text-sm text-muted-foreground">
                ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
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

      {/* Attachment Options */}
      {showAttachments && (
        <div className="px-4 py-2 bg-gray-50 border-b">
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

      {/* Input Area */}
      <div className="px-4 py-2">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAttachments(!showAttachments)}
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
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Type your message..."
              className="w-full min-h-[40px] max-h-[120px] px-3 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
              rows={1}
            />
          </div>

          {/* Send/Upload Button */}
          {selectedFile ? (
            <Button
              type="button"
              onClick={handleFileUpload}
              disabled={isSending}
              className="h-10 w-10 p-0 flex-shrink-0 bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="sm" 
              disabled={!message.trim() || isSending}
              className="h-10 w-10 p-0 flex-shrink-0"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
