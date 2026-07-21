import pythonAiClient from '../config/axios.js';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Uploads a local resume file to Python FastAPI AI service for parsing
 * @param {string} filePath - Local path to the uploaded file
 * @returns {Promise<Object>} The parsed resume data
 */
export const parseResume = async (filePath) => {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await pythonAiClient.post('/resume/upload', form, {
    headers: {
      ...form.getHeaders()
    }
  });

  return response.data;
};

/**
 * Matches a candidate's text against a job description
 * @param {string} candidateText - Complete text/resume contents of candidate
 * @param {string} jobDescription - Job description
 * @param {string} [candidateId] - Associated Candidate MongoDB ID
 * @param {string} [jobId] - Associated Job MongoDB ID
 * @returns {Promise<Object>} The match score, matched/missing skills, reasoning
 */
export const matchCandidate = async (candidateText, jobDescription, candidateId, jobId) => {
  const response = await pythonAiClient.post('/matching/job', {
    candidate_text: candidateText,
    job_description: jobDescription,
    candidate_id: candidateId || undefined,
    job_id: jobId || undefined
  });

  return response.data;
};

/**
 * Ranks multiple candidates for a single job description
 * @param {string} jobDescription - Job description
 * @param {Array<{id: string, text: string, name: string}>} candidates - List of candidates
 * @returns {Promise<Object>} List of ranked candidates with scores, strengths, weaknesses, recommendation
 */
export const rankCandidates = async (jobDescription, candidates) => {
  const response = await pythonAiClient.post('/ranking/candidates', {
    job_description: jobDescription,
    candidates
  });

  return response.data;
};

/**
 * Generates technical, behavioral, scenario, and coding questions based on job requirements and candidate resume
 * @param {string} jobTitle - Job title
 * @param {string} requiredSkills - Comma-separated required skills
 * @param {string} candidateResume - Full resume text
 * @returns {Promise<Object>} Categorized question lists
 */
export const generateQuestions = async (jobTitle, requiredSkills, candidateResume) => {
  const response = await pythonAiClient.post('/interview/generate', {
    job_title: jobTitle,
    required_skills: requiredSkills || '',
    candidate_resume: candidateResume || ''
  });

  return response.data;
};

/**
 * Chat with AI Recruitment Assistant
 * @param {string} question - Recruiter's question
 * @param {string} [candidateContext] - Optional context about a candidate
 * @param {string} [jobContext] - Optional context about a job
 * @returns {Promise<Object>} Question and AI answer
 */
export const chatWithAssistant = async (question, candidateContext, jobContext) => {
  const response = await pythonAiClient.post('/chat/', {
    question,
    candidate_context: candidateContext || undefined,
    job_context: jobContext || undefined
  });

  return response.data;
};
