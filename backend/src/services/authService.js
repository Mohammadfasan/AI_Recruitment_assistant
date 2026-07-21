import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import crypto from 'crypto';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    env.jwtSecret,
    { expiresIn: '30d' }
  );
};

export const registerUser = async ({ name, email, password, role }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error('User already exists');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Job Seeker'
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('User not found with this email');
    err.statusCode = 404;
    throw err;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (1 hour)
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  await user.save();

  console.log(`Password reset token for ${email}: ${resetToken}`);

  return resetToken;
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    const err = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    throw err;
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  return user;
};

export const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // List of allowed fields to update directly on User (Job Seeker fields)
  const allowedFields = [
    'name', 'phone', 'dob', 'gender', 'address', 'country', 
    'education', 'experience', 'skills', 'languages', 'certifications', 
    'linkedin', 'github', 'portfolioWebsite', 'profileImage'
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  // Handle nested company object updates for recruiters
  if (updateData.company && typeof updateData.company === 'object') {
    const companyFields = ['name', 'logo', 'industry', 'website', 'email', 'phone', 'address', 'description'];
    companyFields.forEach((field) => {
      if (updateData.company[field] !== undefined) {
        user.company[field] = updateData.company[field];
      }
    });
  }

  await user.save();
  
  // Return updated user profile
  return await User.findById(userId).select('-password');
};
