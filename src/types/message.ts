export interface Message {
  id: string;
  transactionId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'TEXT' | 'FILE' | 'SYSTEM';
  attachments?: MessageAttachment[];
  // Backend integration fields
  apiId?: string;
  isSynced?: boolean;
  error?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  // Backend integration fields
  apiId?: string;
  uploadProgress?: number;
  uploadStatus: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
}

export interface Conversation {
  id: string;
  transactionId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  // User identification fields
  participantDetails: ParticipantDetail[];
  transactionDetails?: TransactionDetail;
}

export interface ParticipantDetail {
  userId: string;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER';
  avatar?: string;
  businessName?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface TransactionDetail {
  id: string;
  description: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: Date;
}

export interface MessageNotification {
  id: string;
  userId: string;
  messageId: string;
  transactionId: string;
  type: 'NEW_MESSAGE' | 'MESSAGE_READ' | 'SYSTEM_UPDATE';
  isRead: boolean;
  createdAt: Date;
}

export interface MessageSearchResult {
  message: Message;
  conversation: Conversation;
  highlight: string;
  relevance: number;
}

export interface FileUploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'UPLOADING' | 'COMPLETED' | 'FAILED';
  error?: string;
}
