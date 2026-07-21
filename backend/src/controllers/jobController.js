import * as jobService from '../services/jobService.js';
import * as aiService from '../services/aiService.js';
import * as notificationService from '../services/notificationService.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';

export const create = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const jobs = await jobService.getJobs(req.query);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const result = await jobService.deleteJob(req.params.id);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const toggleFavoriteJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const index = user.favorites.indexOf(jobId);
    if (index > -1) {
      user.favorites.splice(index, 1);
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Job removed from favorites',
        favorites: user.favorites
      });
    } else {
      user.favorites.push(jobId);
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Job added to favorites',
        favorites: user.favorites
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getFavoriteJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: {
        path: 'createdBy',
        select: 'name email'
      }
    });

    res.status(200).json({
      success: true,
      data: user.favorites || []
    });
  } catch (error) {
    next(error);
  }
};

const constructCandidateTextFromUser = (user) => {
  if (user.resumeText && user.resumeText.trim().length > 50) {
    return user.resumeText;
  }
  
  const expStr = Array.isArray(user.experience)
    ? user.experience.map(e => `${e.title} at ${e.company} (${e.duration}): ${e.description}`).join('\n')
    : '';
    
  const eduStr = Array.isArray(user.education)
    ? user.education.map(ed => `${ed.degree} from ${ed.institution} (${ed.year})`).join('\n')
    : '';

  return `
Name: ${user.name}
Phone: ${user.phone}
Email: ${user.email}
Summary: ${user.resumeSummary}
Skills: ${user.skills ? user.skills.join(', ') : ''}
Work Experience:
${expStr}
Education:
${eduStr}
  `.trim();
};

export const applyForJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if user already applied
    const existingApplication = await Candidate.findOne({ jobId, userId: user._id });
    if (existingApplication) {
      return res.status(400).json({ success: false, error: 'You have already applied for this job' });
    }

    // Prepare candidate text
    const candidateText = constructCandidateTextFromUser(user);

    // Call python matching service
    let aiResult = {
      match_score: 0,
      matched_skills: [],
      missing_skills: [],
      reasoning: 'Matching pending / service error',
      compare_skills: '',
      compare_experience: '',
      compare_education: '',
      compare_certifications: '',
      match_explanation: '',
      recommendation: 'Manual Review'
    };

    try {
      aiResult = await aiService.matchCandidate(candidateText, job.description);
    } catch (aiErr) {
      console.error('FastAPI Matching Error:', aiErr.message);
    }

    // Create Candidate Application document
    const candidateApplication = await Candidate.create({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      github: user.github || '',
      linkedin: user.linkedin || '',
      education: user.education || [],
      skills: user.skills || [],
      experience: user.experience || [],
      resumeUrl: user.resumeUrl || '',
      resumeText: user.resumeText || '',
      resumeSummary: user.resumeSummary || '',
      jobId: job._id,
      userId: user._id,
      aiScore: aiResult.match_percentage || aiResult.match_score || 0,
      matchedSkills: aiResult.matched_skills || [],
      missingSkills: aiResult.missing_skills || [],
      reasoning: aiResult.match_explanation || aiResult.reasoning || '',
      compareSkills: aiResult.compare_skills || '',
      compareExperience: aiResult.compare_experience || '',
      compareEducation: aiResult.compare_education || '',
      compareCertifications: aiResult.compare_certifications || '',
      matchExplanation: aiResult.match_explanation || '',
      recommendation: aiResult.recommendation || 'Manual Review',
      status: 'Applied'
    });

    // Notify recruiter
    await notificationService.createNotification({
      userId: job.createdBy,
      title: 'New Job Application',
      message: `${user.name} applied for "${job.title}". AI Match Score: ${candidateApplication.aiScore}%.`,
      type: 'ApplicationStatus'
    });

    // Notify job seeker
    await notificationService.createNotification({
      userId: user._id,
      title: 'Application Submitted',
      message: `Your application for "${job.title}" at "${job.company}" has been successfully submitted. AI Match Score: ${candidateApplication.aiScore}%.`,
      type: 'ApplicationStatus'
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: candidateApplication
    });
  } catch (error) {
    next(error);
  }
};
