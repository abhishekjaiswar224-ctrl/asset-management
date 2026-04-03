import express from 'express';
import { 
  signup, 
  login, 
  authCheck, 
  logout, 
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  getUserByEmpId,
  resetPasswordAdmin,
  adminCreateUser
} from '../controllers/authController.js';
import { verifyToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/request-reset', requestPasswordReset);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/check-auth', verifyToken, authCheck);
router.post('/logout', verifyToken, logout);

// Admin only routes
router.get('/user/:emp_id', verifyToken, authorizeRole(['admin']), getUserByEmpId);
router.post('/reset-password-admin', verifyToken, authorizeRole(['admin']), resetPasswordAdmin);
router.post('/admin-create-user', verifyToken, authorizeRole(['admin']), adminCreateUser);

export default router;
