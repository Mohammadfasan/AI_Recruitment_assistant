import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more characters'),
    body('role').optional().isIn(['Admin', 'Recruiter', 'Job Seeker']).withMessage('Invalid role')
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  validateRequest,
  authController.login
);

router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please include a valid email')],
  validateRequest,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more characters')
  ],
  validateRequest,
  authController.resetPassword
);

router.post('/resume', protect, upload.single('resume'), authController.uploadResumeAndAnalyze);

export default router;
