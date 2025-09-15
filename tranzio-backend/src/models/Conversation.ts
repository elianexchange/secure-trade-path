import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  transactionId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  unreadCounts: Map<string, number>; // userId -> unread count
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
    unique: true,
    index: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Virtual for total unread count
ConversationSchema.virtual('totalUnreadCount').get(function() {
  let total = 0;
  this.unreadCounts.forEach((count: number) => {
    total += count;
  });
  return total;
});

// Method to mark messages as read for a user
ConversationSchema.methods.markAsRead = function(userId: string) {
  this.unreadCounts.set(userId, 0);
  return this.save();
};

// Method to increment unread count for a user
ConversationSchema.methods.incrementUnread = function(userId: string) {
  const currentCount = this.unreadCounts.get(userId) || 0;
  this.unreadCounts.set(userId, currentCount + 1);
  return this.save();
};

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
