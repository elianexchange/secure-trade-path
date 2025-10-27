import express from 'express';
import { z } from 'zod';
import { backendGoogleAuthService } from '../services/googleAuthService';

const router = express.Router();

// Validation schema for Google auth
const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required')
});

// Google OAuth login/signup
router.post('/auth', async (req, res) => {
  try {
    const { idToken } = googleAuthSchema.parse(req.body);

    // Verify Google token
    const googleUser = await backendGoogleAuthService.verifyGoogleToken(idToken);

    // Authenticate or create user
    const result = await backendGoogleAuthService.authenticateOrCreateUser(googleUser);

    return res.json({
      success: true,
      message: 'Google authentication successful',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Google auth error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Google authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check if user has Google account linked
router.get('/linked/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const isLinked = await backendGoogleAuthService.isGoogleLinked(userId);

    return res.json({
      success: true,
      isLinked,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Google link status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check Google link status'
    });
  }
});

// Unlink Google account
router.delete('/unlink/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const success = await backendGoogleAuthService.unlinkGoogleAccount(userId);

    if (success) {
      return res.json({
        success: true,
        message: 'Google account unlinked successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to unlink Google account'
      });
    }
  } catch (error) {
    console.error('Error unlinking Google account:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unlink Google account'
    });
  }
});

export default router;
