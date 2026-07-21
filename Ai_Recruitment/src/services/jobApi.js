import api from './api';

export const getJobs = (params) => 
  api.get('/jobs', { params }).then(res => res.data);

export const getJobById = (id) => 
  api.get(`/jobs/${id}`).then(res => res.data);

export const createJob = (jobData) => 
  api.post('/jobs', jobData).then(res => res.data);

export const updateJob = (id, jobData) => 
  api.put(`/jobs/${id}`, jobData).then(res => res.data);

export const deleteJob = (id) => 
  api.delete(`/jobs/${id}`).then(res => res.data);

export const toggleFavoriteJob = (id) =>
  api.post(`/jobs/${id}/favorite`).then(res => res.data);

export const getFavoriteJobs = () =>
  api.get('/jobs/favorites').then(res => res.data);

export const applyForJob = (id) =>
  api.post(`/jobs/${id}/apply`).then(res => res.data);
