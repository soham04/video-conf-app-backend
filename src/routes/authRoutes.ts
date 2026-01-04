import { Router } from 'express';
import {
  authenticateWithFirebase,
  refreshToken,
  getCurrentUser,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/firebase', authenticateWithFirebase);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;

