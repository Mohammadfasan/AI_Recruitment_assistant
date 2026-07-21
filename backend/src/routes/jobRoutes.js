import express from 'express';
import { body } from 'express-validator';
import * as jobController from '../controllers/jobController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get favorite jobs (placed before :id to prevent parameter capture)
router.get('/favorites', protect, jobController.getFavoriteJobs);

// Public route to get all jobs
router.get('/', jobController.getAll);

// Public route to get single job details
router.get('/:id', jobController.getById);

// All operations below require authentication
router.use(protect);

// Apply for a job
router.post('/:id/apply', jobController.applyForJob);

// Toggle job as favorite
router.post('/:id/favorite', jobController.toggleFavoriteJob);

router.post(
  '/',
  authorize('Admin', 'Recruiter'),
  [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('description').trim().notEmpty().withMessage('Job description is required'),
    body('requiredSkills').isArray({ min: 1 }).withMessage('At least one required skill must be specified in an array'),
    body('experience').isInt({ min: 0 }).withMessage('Experience required must be a non-negative integer'),
    body('salary').trim().notEmpty().withMessage('Salary field is required'),
    body('employmentType').trim().notEmpty().withMessage('Employment type is required'),
    body('location').trim().notEmpty().withMessage('Location is required')
  ],
  validateRequest,
  jobController.create
);

router.put(
  '/:id',
  protect,
  authorize('Admin', 'Recruiter'),
  jobController.update
);

router.delete(
  '/:id',
  protect,
  authorize('Admin', 'Recruiter'),
  jobController.deleteJob
);

export default router;
