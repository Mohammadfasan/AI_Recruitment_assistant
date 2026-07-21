import express from 'express';
import { body } from 'express-validator';
import * as aiController from '../controllers/aiController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All AI endpoints require authentication
router.use(protect);

// Upload & parse resume
router.post('/resume', upload.single('resume'), aiController.parseResumeStandalone);

// Calculate match score
router.post(
  '/match',
  [
    body('candidateId').isMongoId().withMessage('candidateId must be a valid Mongo ID'),
    body('jobId').isMongoId().withMessage('jobId must be a valid Mongo ID')
  ],
  validateRequest,
  aiController.matchCandidateToJob
);

// Rank batch of candidates
router.post(
  '/rank',
  [
    body('jobId').isMongoId().withMessage('jobId must be a valid Mongo ID'),
    body('candidateIds').isArray({ min: 1 }).withMessage('candidateIds must be a non-empty array'),
    body('candidateIds.*').isMongoId().withMessage('Each candidate ID must be a valid Mongo ID')
  ],
  validateRequest,
  aiController.rankCandidatesForJob
);

// Generate interview questions
router.post(
  '/interview',
  [
    body('candidateId').isMongoId().withMessage('candidateId must be a valid Mongo ID'),
    body('jobId').isMongoId().withMessage('jobId must be a valid Mongo ID')
  ],
  validateRequest,
  aiController.generateInterviewQuestions
);

// Chat with AI Recruiter Assistant
router.post(
  '/chat',
  [
    body('question').trim().notEmpty().withMessage('question cannot be empty'),
    body('candidateId').optional().isMongoId().withMessage('candidateId must be a valid Mongo ID'),
    body('jobId').optional().isMongoId().withMessage('jobId must be a valid Mongo ID')
  ],
  validateRequest,
  aiController.chatWithAssistant
);

export default router;
