import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const getCandidates = async (query = {}) => {
  const filters = {};
  if (query.jobId) {
    filters.jobId = query.jobId;
  }
  if (query.status) {
    filters.status = query.status;
  }
  
  return await Candidate.find(filters)
    .populate('jobId', 'title company')
    .sort({ aiScore: -1 });
};

export const getCandidateById = async (id) => {
  const candidate = await Candidate.findById(id).populate('jobId', 'title company');
  if (!candidate) {
    const err = new Error('Candidate not found');
    err.statusCode = 404;
    throw err;
  }
  return candidate;
};

export const createCandidate = async (candidateData) => {
  const job = await Job.findById(candidateData.jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }
  return await Candidate.create(candidateData);
};

export const updateCandidate = async (id, candidateData) => {
  const candidate = await Candidate.findById(id);
  if (!candidate) {
    const err = new Error('Candidate not found');
    err.statusCode = 404;
    throw err;
  }
  return await Candidate.findByIdAndUpdate(id, candidateData, {
    new: true,
    runValidators: true
  });
};

export const deleteCandidate = async (id) => {
  const candidate = await Candidate.findById(id);
  if (!candidate) {
    const err = new Error('Candidate not found');
    err.statusCode = 404;
    throw err;
  }
  await Candidate.findByIdAndDelete(id);
  return { message: 'Candidate deleted successfully' };
};

// Helper: Upload local file to Cloudinary
export const uploadResumeToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'resumes',
      resource_type: 'auto' // Cloudinary will automatically identify PDF/DOCX
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error(`Failed to upload resume to Cloudinary: ${error.message}`);
  } finally {
    // Delete the local file after Cloudinary upload is completed/attempted
    // If the local file still exists, it is deleted.
    // However, wait! In our integration flow, the python AI might need the file locally.
    // So we will delete the local file in the controller/service AFTER python AI completes.
  }
};
