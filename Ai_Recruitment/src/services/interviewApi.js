import api from './api';

export const scheduleInterview = (data) =>
  api.post('/interviews/schedule', data).then(res => res.data);

export const evaluateInterview = (id, data) =>
  api.put(`/interviews/${id}/evaluate`, data).then(res => res.data);

export const getRecruiterInterviews = () =>
  api.get('/interviews/recruiter').then(res => res.data);

export const getSeekerInterviews = () =>
  api.get('/interviews/seeker').then(res => res.data);

export const getInterviewByCandidateId = (candidateId) =>
  api.get(`/interviews/candidate/${candidateId}`).then(res => res.data);
