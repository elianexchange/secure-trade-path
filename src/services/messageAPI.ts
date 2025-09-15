import { Message, Conversation, MessageAttachment, ParticipantDetail } from '@/types/message';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.63.1:4000';

class MessageAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Get conversations for a user
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/messages/conversations');
  }

  // Get messages for a specific transaction
  async getMessages(transactionId: string): Promise<Message[]> {
    return this.request<Message[]>(`/api/messages/transactions/${transactionId}`);
  }

  // Send a message
  async sendMessage(message: { transactionId: string; content: string }): Promise<Message> {
    return this.request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    return this.request<void>(`/api/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  // Get participant details for a transaction
  async getParticipantDetails(transactionId: string): Promise<ParticipantDetail[]> {
    return this.request<ParticipantDetail[]>(`/api/transactions/${transactionId}/participants`);
  }

  // Upload file attachment
  async uploadFile(
    file: File,
    transactionId: string,
    onProgress?: (progress: number) => void
  ): Promise<MessageAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transactionId', transactionId);

    const token = localStorage.getItem('authToken');
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/messages/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  // Search messages
  async searchMessages(query: string, transactionId?: string): Promise<Message[]> {
    const params = new URLSearchParams({ q: query });
    if (transactionId) {
      params.append('transactionId', transactionId);
    }
    
    return this.request<Message[]>(`/api/messages/search?${params}`);
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    const response = await this.request<{ count: number }>('/api/messages/unread-count');
    return response.count;
  }

  // Delete message (only for sender)
  async deleteMessage(messageId: string): Promise<void> {
    return this.request<void>(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Get message statistics
  async getMessageStats(): Promise<{
    totalMessages: number;
    unreadMessages: number;
    conversationsCount: number;
  }> {
    return this.request('/api/messages/stats');
  }
}

export const messageAPI = new MessageAPI();
