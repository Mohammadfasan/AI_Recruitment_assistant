import api from './api';

export const loginUser = (email, password) => 
  api.post('/auth/login', { email, password }).then(res => res.data);

export const registerUser = (name, email, password, role) => 
  api.post('/auth/register', { name, email, password, role }).then(res => res.data);

export const getUserProfile = () => 
  api.get('/auth/profile').then(res => res.data);

export const updateUserProfile = (profileData) =>
  api.put('/auth/profile', profileData).then(res => res.data);

export const uploadResume = (formData) =>
  api.post('/auth/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data);

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then(res => res.data);

export const resetPassword = (token, password) =>
  api.post('/auth/reset-password', { token, password }).then(res => res.data);
