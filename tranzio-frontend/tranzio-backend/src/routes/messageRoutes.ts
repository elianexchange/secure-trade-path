import express from 'express';
import messageController from '../controllers/messageController';
import { uploadSingle } from '../services/fileService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get conversations for authenticated user
router.get('/conversations', messageController.getConversations);

// Get messages for a specific transaction
router.get('/transactions/:transactionId', messageController.getMessages);

// Send a message
router.post('/', messageController.sendMessage);

// Mark message as read
router.put('/:messageId/read', messageController.markAsRead);

// Mark all messages in a conversation as read
router.put('/conversations/:transactionId/read', messageController.markConversationAsRead);

// Upload file attachment
router.post('/upload', uploadSingle, messageController.uploadFile);

// Search messages
router.get('/search', messageController.searchMessages);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Delete message (only for sender)
router.delete('/:messageId', messageController.deleteMessage);

export default router;
