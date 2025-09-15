import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { ChatbotService, ChatbotContext } from '../services/chatbotService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  context: z.object({
    currentPage: z.string().optional(),
    userPreferences: z.object({
      language: z.string().optional(),
      timezone: z.string().optional()
    }).optional()
  }).optional()
});

// Send message to chatbot
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const validatedData = chatMessageSchema.parse(req.body);

    // Get user information for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        verificationLevel: true,
        trustScore: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get conversation history (last 10 messages)
    const conversationHistory = await ChatbotService.getConversationHistory(userId);

    // Create chatbot context
    const context: ChatbotContext = {
      userId,
      userRole: user.role,
      currentPage: validatedData.context?.currentPage,
      conversationHistory,
      userPreferences: validatedData.context?.userPreferences || undefined
    };

    // Process message with chatbot service
    const botResponse = await ChatbotService.processMessage(validatedData.message, context);

    // Save conversation to database
    await ChatbotService.saveConversation(userId, validatedData.message, botResponse);

    return res.json({
      success: true,
      data: {
        response: botResponse,
        timestamp: new Date().toISOString(),
        conversationId: `conv_${userId}_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Chatbot chat error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send message to chatbot (no authentication required for public queries)
router.post('/chat/public', async (req, res) => {
  try {
    const validatedData = chatMessageSchema.parse(req.body);

    // Create basic context for public users
    const context: ChatbotContext = {
      currentPage: validatedData.context?.currentPage,
      conversationHistory: [],
      userPreferences: validatedData.context?.userPreferences || undefined
    };

    // Process message with chatbot service
    const botResponse = await ChatbotService.processMessage(validatedData.message, context);

    return res.json({
      success: true,
      data: {
        response: botResponse,
        timestamp: new Date().toISOString(),
        conversationId: `public_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Public chatbot chat error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get conversation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const conversationHistory = await ChatbotService.getConversationHistory(userId);

    return res.json({
      success: true,
      data: {
        messages: conversationHistory,
        totalMessages: conversationHistory.length
      }
    });

  } catch (error) {
    console.error('Get conversation history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chatbot status and capabilities
router.get('/status', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        status: 'online',
        capabilities: [
          'Transaction assistance',
          'Payment guidance',
          'Verification help',
          'Fee calculation',
          'Security information',
          'Technical support',
          'General platform questions'
        ],
        languages: ['English'],
        responseTime: '< 1 second',
        availability: '24/7',
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Get chatbot status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get quick help topics
router.get('/help/topics', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        topics: [
          {
            category: 'Getting Started',
            questions: [
              'How do I create a transaction?',
              'How do I join a transaction?',
              'What is an invitation code?',
              'How do I get started?'
            ]
          },
          {
            category: 'Transactions',
            questions: [
              'How to check transaction status?',
              'What are transaction requirements?',
              'How to update transaction details?',
              'Transaction troubleshooting'
            ]
          },
          {
            category: 'Payments',
            questions: [
              'How do escrow payments work?',
              'What are the fees?',
              'When are payments released?',
              'Payment methods available'
            ]
          },
          {
            category: 'Verification',
            questions: [
              'How does identity verification work?',
              'What documents do I need?',
              'Verification benefits',
              'How to increase trust score'
            ]
          },
          {
            category: 'Security',
            questions: [
              'Is Tranzio secure?',
              'How is my data protected?',
              'Fraud protection',
              'Report suspicious activity'
            ]
          },
          {
            category: 'Technical',
            questions: [
              'Page not loading',
              'Login problems',
              'Mobile app issues',
              'Browser compatibility'
            ]
          }
        ]
      }
    });
  } catch (error) {
    console.error('Get help topics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Submit feedback about chatbot
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { rating, feedback, conversationId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // In a real implementation, you would save feedback to database
    console.log('Chatbot feedback:', {
      userId: req.user.id,
      rating,
      feedback,
      conversationId,
      timestamp: new Date()
    });

    return res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
