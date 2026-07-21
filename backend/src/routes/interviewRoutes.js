import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as interviewController from '../controllers/interviewController.js';

const router = express.Router();

// Require JWT authorization for all interview endpoints
router.use(protect);

router.post('/schedule', interviewController.schedule);
router.put('/:id/evaluate', interviewController.evaluate);
router.get('/recruiter', interviewController.getRecruiterInterviews);
router.get('/seeker', interviewController.getSeekerInterviews);
router.get('/candidate/:candidateId', interviewController.getInterviewByCandidateId);

export default router;
