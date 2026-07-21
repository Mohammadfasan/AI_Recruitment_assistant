import api from './api';

export const getCandidates = (params = {}) => 
  api.get('/candidates', { params }).then(res => res.data);

export const getCandidateById = (id) => 
  api.get(`/candidates/${id}`).then(res => res.data);

export const createCandidate = (data) => 
  api.post('/candidates', data).then(res => res.data);

export const updateCandidate = (id, data) => 
  api.put(`/candidates/${id}`, data).then(res => res.data);

export const deleteCandidate = (id) => 
  api.delete(`/candidates/${id}`).then(res => res.data);

export const uploadCandidateResume = (formData, onUploadProgress) => 
  api.post('/candidates/upload-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress
  }).then(res => res.data);

export const getMyApplications = () =>
  api.get('/candidates/my-applications').then(res => res.data);
