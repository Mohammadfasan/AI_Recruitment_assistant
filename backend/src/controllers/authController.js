import * as authService from '../services/authService.js';
import * as aiService from '../services/aiService.js';
import * as candidateService from '../services/candidateService.js';
import User from '../models/User.js';
import fs from 'fs';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.registerUser({ name, email, password, role });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const result = await authService.getUserProfile(req.user._id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateUserProfile(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const resetToken = await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully (check logs/response)',
      token: resetToken
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const uploadResumeAndAnalyze = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No resume file uploaded' });
  }

  const filePath = req.file.path;

  try {
    // 1. Parse resume using python AI service
    const aiResponse = await aiService.parseResume(filePath);
    const parsedData = aiResponse.parsed_data || {};

    // 2. Upload file to Cloudinary
    const resumeUrl = await candidateService.uploadResumeToCloudinary(filePath);

    // 3. Update User profile with parsed details
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        resumeUrl,
        resumeText: parsedData.raw_text || '',
        resumeSummary: parsedData.summary || '',
        resumeScore: parsedData.resume_score || 0,
        resumeSuggestions: parsedData.suggestions || [],
        missingSkills: parsedData.missing_skills || [],
        skills: parsedData.skills || [],
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        phone: parsedData.phone || req.user.phone || '',
        linkedin: parsedData.linkedin || req.user.linkedin || '',
        github: parsedData.github || req.user.github || ''
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  } finally {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting local file:', err.message);
      }
    }
  }
};
