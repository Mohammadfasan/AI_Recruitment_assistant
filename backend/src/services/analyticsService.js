import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const getDashboardStats = async () => {
  // 1. Total Jobs count
  const totalJobs = await Job.countDocuments();

  // 2. Active Jobs count
  const activeJobs = await Job.countDocuments({ status: 'Open' });

  // 3. Total Candidates count (Applications)
  const totalCandidates = await Candidate.countDocuments();

  // 4. Shortlisted Candidates count
  const shortlistedCount = await Candidate.countDocuments({ status: 'Shortlisted' });

  // 5. Selected Candidates count
  const selectedCount = await Candidate.countDocuments({ status: 'Selected' });

  // 6. Average AI Match Score
  const avgAiScoreResult = await Candidate.aggregate([
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$aiScore' }
      }
    }
  ]);
  const averageAiScore = avgAiScoreResult.length > 0 ? Math.round(avgAiScoreResult[0].averageScore * 10) / 10 : 0;

  // 7. Top Skills in the candidate database
  const topSkills = await Candidate.aggregate([
    { $unwind: '$skills' },
    {
      $group: {
        _id: { $trim: { input: '$skills' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        skill: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // 8. Most Applied Jobs
  const mostAppliedJobs = await Candidate.aggregate([
    {
      $group: {
        _id: '$jobId',
        applicationsCount: { $sum: 1 }
      }
    },
    { $sort: { applicationsCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'jobs',
        localField: '_id',
        foreignField: '_id',
        as: 'jobInfo'
      }
    },
    { $unwind: '$jobInfo' },
    {
      $project: {
        jobId: '$_id',
        title: '$jobInfo.title',
        company: '$jobInfo.company',
        applicationsCount: 1,
        _id: 0
      }
    }
  ]);

  // 9. Interview Statistics
  const totalInterviews = await Interview.countDocuments();

  const avgInterviewScoreResult = await Interview.aggregate([
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' }
      }
    }
  ]);
  const averageInterviewScore = avgInterviewScoreResult.length > 0 ? Math.round(avgInterviewScoreResult[0].averageScore * 10) / 10 : 0;

  const candidateStatusDistribution = await Candidate.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  return {
    totalJobs,
    activeJobs,
    totalCandidates,
    shortlistedCount,
    selectedCount,
    averageAiScore,
    topSkills,
    mostAppliedJobs,
    interviewStats: {
      totalInterviews,
      averageInterviewScore
    },
    candidateStatusDistribution
  };
};

export const getSeekerDashboardStats = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Seeker applications
  const applications = await Candidate.find({ userId }).populate('jobId');
  const appliedCount = applications.length;

  // Saved jobs count & list
  const favoritesCount = user.favorites ? user.favorites.length : 0;
  const savedJobs = await Job.find({ _id: { $in: user.favorites } }).limit(3);

  // Upcoming interviews
  const applicationIds = applications.map(a => a._id);
  const interviewsCount = await Interview.countDocuments({
    candidateId: { $in: applicationIds },
    status: 'Scheduled'
  });

  // Next upcoming interview detail
  const nextInterview = await Interview.findOne({
    candidateId: { $in: applicationIds },
    status: 'Scheduled'
  })
    .sort({ interviewDate: 1, interviewTime: 1 })
    .populate('jobId')
    .populate('candidateId');

  // Recent notifications
  const recentNotifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(5);

  // Resume status info
  const resumeScore = user.resumeScore || 0;
  const resumeSuggestions = user.resumeSuggestions || [];
  const missingSkills = user.missingSkills || [];

  return {
    resumeScore,
    resumeSuggestions,
    missingSkills,
    appliedCount,
    favoritesCount,
    interviewsCount,
    nextInterview,
    savedJobs,
    recentNotifications,
    applications: applications.map(app => ({
      _id: app._id,
      jobId: app.jobId?._id,
      jobTitle: app.jobId?.title || 'Job Position',
      company: app.jobId?.company || 'Company',
      status: app.status,
      aiScore: app.aiScore,
      appliedAt: app.createdAt
    }))
  };
};
