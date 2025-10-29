import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Users route - to be implemented',
    timestamp: new Date().toISOString()
  });
});

export default router;
