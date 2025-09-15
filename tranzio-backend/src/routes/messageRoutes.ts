import express from 'express';
import { MessageController } from '../controllers/messageController';
import { uploadSingle } from '../services/fileService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get conversations for authenticated user
router.get('/conversations', MessageController.getConversations);

// Get messages for a specific transaction
router.get('/transactions/:transactionId', MessageController.getMessages);

// Send a message
router.post('/', MessageController.sendMessage);

// Mark message as read
router.put('/:messageId/read', MessageController.markAsRead);

// Upload file attachment
router.post('/upload', uploadSingle, MessageController.uploadFile);

// Search messages
router.get('/search', MessageController.searchMessages);

// Get unread message count
router.get('/unread-count', MessageController.getUnreadCount);

// Delete message (only for sender)
router.delete('/:messageId', MessageController.deleteMessage);

export default router;
