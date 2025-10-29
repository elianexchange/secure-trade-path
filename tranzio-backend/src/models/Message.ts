import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  transactionId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  messageType: 'TEXT' | 'FILE' | 'SYSTEM';
  attachments?: Array<{
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    originalName: string;
  }>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['TEXT', 'FILE', 'SYSTEM'],
    default: 'TEXT'
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MessageSchema.index({ transactionId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ isRead: 1, receiverId: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
