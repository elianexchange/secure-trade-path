import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { emailService } from '../services/emailService';

const router = express.Router();

// Test email configuration (public endpoint for testing)
router.post('/test', async (req, res) => {
  try {
    const result = await emailService.testEmailConfiguration();
    
    if (result) {
      return res.json({
        success: true,
        message: 'Email configuration test successful'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Email configuration test failed'
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send custom email (for testing)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'To, subject, and message are required'
      });
    }

    const result = await emailService.sendNotificationEmail(to, {
      title: subject,
      message: message
    });

    if (result) {
      return res.json({
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
