import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Fetch dashboard analytics for Recruiters
router.get(
  '/dashboard',
  protect,
  authorize('Admin', 'Recruiter'),
  analyticsController.getDashboardData
);

// Fetch dashboard analytics for Job Seekers
router.get(
  '/seeker',
  protect,
  authorize('Job Seeker'),
  analyticsController.getSeekerDashboardData
);

export default router;
