import * as candidateService from '../services/candidateService.js';
import * as aiService from '../services/aiService.js';
import * as notificationService from '../services/notificationService.js';
import Candidate from '../models/Candidate.js';
import fs from 'fs';

export const create = async (req, res, next) => {
  try {
    const candidate = await candidateService.createCandidate(req.body);
    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: candidate
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const candidates = await candidateService.getCandidates(req.query);
    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const candidate = await candidateService.getCandidateById(req.params.id);
    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const oldCandidate = await Candidate.findById(req.params.id).populate('jobId');
    if (!oldCandidate) {
      return res.status(404).json({ success: false, error: 'Candidate application not found' });
    }

    const candidate = await candidateService.updateCandidate(req.params.id, req.body);

    // If status has changed, trigger notification
    if (req.body.status && req.body.status !== oldCandidate.status) {
      const jobTitle = oldCandidate.jobId?.title || 'Job Position';
      const company = oldCandidate.jobId?.company || 'Company';
      const newStatus = req.body.status;
      let message = `Your application status for "${jobTitle}" at "${company}" has been updated to ${newStatus}.`;

      if (newStatus === 'Shortlisted') {
        message = `Congratulations! You have been shortlisted for "${jobTitle}" at "${company}".`;
      } else if (newStatus === 'Interview Scheduled') {
        message = `An interview has been scheduled for your application for "${jobTitle}" at "${company}".`;
      } else if (newStatus === 'Interview Completed') {
        message = `Your interview evaluation for "${jobTitle}" at "${company}" has been completed.`;
      } else if (newStatus === 'Selected') {
        message = `Congratulations! You have been selected/hired for "${jobTitle}" at "${company}"!`;
      } else if (newStatus === 'Rejected') {
        message = `Thank you for applying. Unfortunately, your application for "${jobTitle}" at "${company}" will not be moving forward.`;
      }

      if (candidate.userId) {
        await notificationService.createNotification({
          userId: candidate.userId,
          title: 'Application Status Updated',
          message,
          type: 'ApplicationStatus'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: candidate
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCandidate = async (req, res, next) => {
  try {
    const result = await candidateService.deleteCandidate(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const uploadResume = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No resume file uploaded. Please upload a PDF or DOCX file.'
    });
  }

  const { jobId, name, email, phone } = req.body;
  const filePath = req.file.path;

  if (!jobId) {
    // Clean up file if validation fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(400).json({
      success: false,
      error: 'jobId is required to map the candidate to a job position.'
    });
  }

  try {
    // 1. Upload local file to Cloudinary
    const resumeUrl = await candidateService.uploadResumeToCloudinary(filePath);

    // 2. Save candidate to MongoDB with initial details
    const candidate = await candidateService.createCandidate({
      name: name || 'Parsing Pending',
      email: email || 'parsing@pending.com',
      phone: phone || '',
      jobId,
      resumeUrl,
      status: 'Applied'
    });

    // 3. Call Python AI to parse resume using the local file
    let aiResponse;
    try {
      aiResponse = await aiService.parseResume(filePath);
    } catch (aiError) {
      console.error('Python AI Service Error during parsing:', aiError.message);
      // Fallback: Return created candidate without parsing details if FastAPI is down/fails
      return res.status(202).json({
        success: true,
        message: 'Resume uploaded but AI parsing failed. Candidate created without AI analysis.',
        data: candidate
      });
    }

    // 4. Extract details from AI response and update Candidate in MongoDB
    const parsedData = aiResponse.parsed_data || {};
    
    const updatedCandidate = await candidateService.updateCandidate(candidate._id, {
      name: name || parsedData.name || candidate.name,
      email: email || parsedData.email || candidate.email,
      phone: phone || parsedData.phone || candidate.phone,
      github: parsedData.github || '',
      linkedin: parsedData.linkedin || '',
      skills: parsedData.skills || [],
      education: parsedData.education || [],
      experience: parsedData.experience || [],
      resumeSummary: parsedData.summary || '',
      resumeText: parsedData.raw_text || ''
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: updatedCandidate
    });
  } catch (error) {
    next(error);
  } finally {
    // 5. Delete local file after upload is complete
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting local file:', err.message);
      }
    }
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Candidate.find({ userId: req.user._id }).populate('jobId');
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};
