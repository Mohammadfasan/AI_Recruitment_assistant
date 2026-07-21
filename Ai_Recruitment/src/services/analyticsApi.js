import api from './api';

export const getDashboardAnalytics = () => 
  api.get('/analytics/dashboard').then(res => res.data);

export const getSeekerAnalytics = () =>
  api.get('/analytics/seeker').then(res => res.data);
