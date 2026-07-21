import Interview from '../models/Interview.js';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import * as notificationService from './notificationService.js';

export const scheduleInterview = async (interviewData) => {
  const { candidateId, jobId, interviewDate, interviewTime, interviewType, meetingLink, interviewer, notes } = interviewData;

  const candidate = await Candidate.findById(candidateId).populate('jobId');
  if (!candidate) {
    const err = new Error('Candidate application not found');
    err.statusCode = 404;
    throw err;
  }

  // 1. Create or update interview record
  let interview = await Interview.findOne({ candidateId, jobId });
  if (interview) {
    interview.interviewDate = interviewDate;
    interview.interviewTime = interviewTime;
    interview.interviewType = interviewType;
    interview.meetingLink = meetingLink;
    interview.interviewer = interviewer;
    interview.notes = notes;
    interview.status = 'Scheduled';
    await interview.save();
  } else {
    interview = await Interview.create({
      candidateId,
      jobId,
      interviewDate,
      interviewTime,
      interviewType,
      meetingLink,
      interviewer,
      notes,
      status: 'Scheduled'
    });
  }

  // 2. Update candidate status to 'Interview Scheduled'
  candidate.status = 'Interview Scheduled';
  await candidate.save();

  // 3. Notify seeker
  const jobTitle = candidate.jobId?.title || 'Job Position';
  const company = candidate.jobId?.company || 'Company';
  
  if (candidate.userId) {
    await notificationService.createNotification({
      userId: candidate.userId,
      title: 'Interview Scheduled',
      message: `An interview (${interviewType}) has been scheduled for "${jobTitle}" at "${company}" on ${interviewDate} at ${interviewTime}. Interviewer: ${interviewer}. Meeting link: ${meetingLink}`,
      type: 'InterviewScheduled'
    });
  }

  return interview;
};

export const evaluateInterview = async (interviewId, evaluationData) => {
  const interview = await Interview.findById(interviewId).populate({
    path: 'candidateId',
    populate: {
      path: 'jobId'
    }
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  // Save evaluation details
  interview.evaluation = {
    technicalKnowledge: Number(evaluationData.technicalKnowledge || 0),
    communicationSkills: Number(evaluationData.communicationSkills || 0),
    problemSolving: Number(evaluationData.problemSolving || 0),
    confidence: Number(evaluationData.confidence || 0),
    overallRating: Number(evaluationData.overallRating || 0),
    finalRecommendation: evaluationData.finalRecommendation || ''
  };
  interview.feedback = evaluationData.feedback || '';
  interview.status = 'Completed';
  await interview.save();

  // Update candidate status based on evaluation recommendation
  const candidate = interview.candidateId;
  if (candidate) {
    candidate.status = 'Interview Completed';
    if (evaluationData.finalRecommendation === 'Hire') {
      candidate.status = 'Selected';
    } else if (evaluationData.finalRecommendation === 'Reject') {
      candidate.status = 'Rejected';
    }
    await candidate.save();

    // Notify seeker
    const jobTitle = candidate.jobId?.title || 'Job Position';
    const company = candidate.jobId?.company || 'Company';
    let message = `Your interview evaluation for "${jobTitle}" at "${company}" has been completed. Recommendation: ${evaluationData.finalRecommendation}.`;
    
    if (evaluationData.finalRecommendation === 'Hire') {
      message = `Congratulations! You have been selected/hired for the "${jobTitle}" position at "${company}"!`;
    } else if (evaluationData.finalRecommendation === 'Reject') {
      message = `Thank you for completing the interview. Unfortunately, after review, we will not be moving forward with your application for "${jobTitle}" at "${company}".`;
    }

    if (candidate.userId) {
      await notificationService.createNotification({
        userId: candidate.userId,
        title: 'Interview Evaluation Submitted',
        message,
        type: 'InterviewCompleted'
      });
    }
  }

  return interview;
};

export const getRecruiterInterviews = async () => {
  return await Interview.find()
    .populate('candidateId')
    .populate('jobId')
    .sort({ createdAt: -1 });
};

export const getSeekerInterviews = async (userId) => {
  const applications = await Candidate.find({ userId });
  const applicationIds = applications.map(a => a._id);

  return await Interview.find({ candidateId: { $in: applicationIds } })
    .populate('candidateId')
    .populate('jobId')
    .sort({ interviewDate: 1, interviewTime: 1 });
};
