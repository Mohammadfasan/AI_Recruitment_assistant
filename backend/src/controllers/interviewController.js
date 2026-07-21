import * as interviewService from '../services/interviewService.js';
import Interview from '../models/Interview.js';

export const schedule = async (req, res, next) => {
  try {
    const interview = await interviewService.scheduleInterview(req.body);
    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: interview
    });
  } catch (error) {
    next(error);
  }
};

export const evaluate = async (req, res, next) => {
  try {
    const interview = await interviewService.evaluateInterview(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Interview evaluated successfully',
      data: interview
    });
  } catch (error) {
    next(error);
  }
};

export const getRecruiterInterviews = async (req, res, next) => {
  try {
    const interviews = await interviewService.getRecruiterInterviews();
    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    next(error);
  }
};

export const getSeekerInterviews = async (req, res, next) => {
  try {
    const interviews = await interviewService.getSeekerInterviews(req.user._id);
    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewByCandidateId = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ candidateId: req.params.candidateId })
      .populate('candidateId')
      .populate('jobId');

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
};
