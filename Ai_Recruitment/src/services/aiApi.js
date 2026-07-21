import api from './api';

export const parseResumeStandalone = (formData, onUploadProgress) => 
  api.post('/ai/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress
  }).then(res => res.data);

export const matchCandidateToJob = (candidateId, jobId) => 
  api.post('/ai/match', { candidateId, jobId }).then(res => res.data);

export const rankCandidatesForJob = (jobId, candidateIds) => 
  api.post('/ai/rank', { jobId, candidateIds }).then(res => res.data);

export const generateInterviewQuestions = (candidateId, jobId) => 
  api.post('/ai/interview', { candidateId, jobId }).then(res => res.data);

export const chatWithAssistant = (question, candidateId = null, jobId = null) => 
  api.post('/ai/chat', { 
    question, 
    candidateId: candidateId || undefined, 
    jobId: jobId || undefined 
  }).then(res => res.data);
