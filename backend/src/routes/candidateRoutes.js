import express from 'express';
import { body } from 'express-validator';
import * as candidateController from '../controllers/candidateController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All candidate endpoints require authentication
router.use(protect);

router.get('/my-applications', candidateController.getMyApplications);
router.get('/', candidateController.getAll);
router.get('/:id', candidateController.getById);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Candidate name is required'),
    body('email').trim().isEmail().withMessage('Valid candidate email is required'),
    body('jobId').isMongoId().withMessage('A valid job ID must be supplied')
  ],
  validateRequest,
  candidateController.create
);

router.put('/:id', candidateController.update);
router.delete('/:id', candidateController.deleteCandidate);

// Route for candidate resume upload & parse flow
router.post(
  '/upload-resume',
  upload.single('resume'),
  candidateController.uploadResume
);

export default router;
