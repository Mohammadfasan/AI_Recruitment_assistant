import * as aiService from '../services/aiService.js';
import * as candidateService from '../services/candidateService.js';
import * as jobService from '../services/jobService.js';
import Candidate from '../models/Candidate.js';
import Interview from '../models/Interview.js';
import Chat from '../models/Chat.js';
import fs from 'fs';

// Helper to construct candidate text for AI processing if raw resumeText is empty
const getCandidateText = (candidate) => {
  if (candidate.resumeText && candidate.resumeText.trim().length > 50) {
    return candidate.resumeText;
  }
  
  const expStr = Array.isArray(candidate.experience)
    ? candidate.experience.map(e => typeof e === 'object' ? `${e.title} at ${e.company} (${e.duration}): ${e.description}` : String(e)).join('\n')
    : String(candidate.experience || '');
    
  const eduStr = Array.isArray(candidate.education)
    ? candidate.education.map(ed => typeof ed === 'object' ? `${ed.degree} from ${ed.institution} (${ed.year})` : String(ed)).join('\n')
    : String(candidate.education || '');

  return `
Name: ${candidate.name}
Phone: ${candidate.phone}
Email: ${candidate.email}
Summary: ${candidate.resumeSummary}
Skills: ${candidate.skills.join(', ')}
Work Experience:
${expStr}
Education:
${eduStr}
  `.trim();
};

export const parseResumeStandalone = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No resume file uploaded' });
  }

  const { candidateId, jobId } = req.body;
  const filePath = req.file.path;

  try {
    const aiResponse = await aiService.parseResume(filePath);
    const parsedData = aiResponse.parsed_data || {};

    let candidate;

    if (candidateId) {
      // Update existing candidate
      candidate = await candidateService.updateCandidate(candidateId, {
        name: parsedData.name || undefined,
        email: parsedData.email || undefined,
        phone: parsedData.phone || undefined,
        github: parsedData.github || undefined,
        linkedin: parsedData.linkedin || undefined,
        skills: parsedData.skills || [],
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        resumeSummary: parsedData.summary || '',
        resumeText: parsedData.raw_text || ''
      });
    } else if (jobId) {
      // Create new candidate associated with job
      const resumeUrl = await candidateService.uploadResumeToCloudinary(filePath);
      candidate = await Candidate.create({
        name: parsedData.name || 'Parsing Pending',
        email: parsedData.email || 'parsing@pending.com',
        phone: parsedData.phone || '',
        github: parsedData.github || '',
        linkedin: parsedData.linkedin || '',
        jobId,
        resumeUrl,
        skills: parsedData.skills || [],
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        resumeSummary: parsedData.summary || '',
        resumeText: parsedData.raw_text || '',
        status: 'Applied'
      });
    } else {
      // Create independent candidate record
      candidate = await Candidate.create({
        name: parsedData.name || 'Parsing Pending',
        email: parsedData.email || 'parsing@pending.com',
        phone: parsedData.phone || '',
        github: parsedData.github || '',
        linkedin: parsedData.linkedin || '',
        skills: parsedData.skills || [],
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        resumeSummary: parsedData.summary || '',
        resumeText: parsedData.raw_text || '',
        status: 'Applied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume parsed and saved successfully',
      data: {
        candidate,
        raw_ai_output: aiResponse
      }
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

export const matchCandidateToJob = async (req, res, next) => {
  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ success: false, error: 'candidateId and jobId are required' });
    }

    const candidate = await candidateService.getCandidateById(candidateId);
    const job = await jobService.getJobById(jobId);

    const candidateText = getCandidateText(candidate);
    const jobDescription = job.description;

    // Call FastAPI Match Service
    const aiResult = await aiService.matchCandidate(
      candidateText,
      jobDescription,
      candidateId,
      jobId
    );

    // Save match score to Candidate document
    candidate.aiScore = aiResult.match_score;
    await candidate.save();

    res.status(200).json({
      success: true,
      message: 'Matching completed successfully',
      data: {
        matchScore: aiResult.match_score,
        matchedSkills: aiResult.matched_skills,
        missingSkills: aiResult.missing_skills,
        reasoning: aiResult.reasoning,
        candidateId,
        jobId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const rankCandidatesForJob = async (req, res, next) => {
  try {
    const { jobId, candidateIds } = req.body;

    if (!jobId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'jobId and a non-empty array of candidateIds are required'
      });
    }

    const job = await jobService.getJobById(jobId);
    const candidates = await Candidate.find({ _id: { $in: candidateIds } });

    if (candidates.length === 0) {
      return res.status(404).json({ success: false, error: 'No matching candidates found' });
    }

    // Format candidate list for FastAPI
    const formattedCandidates = candidates.map(c => ({
      id: String(c._id),
      name: c.name,
      text: getCandidateText(c)
    }));

    // Call FastAPI Ranking Service
    const aiResult = await aiService.rankCandidates(job.description, formattedCandidates);
    const rankings = aiResult.rankings || [];

    // Save each candidate's ranking results in MongoDB
    const updatedCandidates = [];
    for (const rankInfo of rankings) {
      const dbCandidate = candidates.find(c => String(c._id) === rankInfo.candidate_id);
      if (dbCandidate) {
        dbCandidate.ranking = rankInfo.rank;
        dbCandidate.aiScore = rankInfo.score;
        dbCandidate.strengths = rankInfo.strengths || [];
        dbCandidate.weaknesses = rankInfo.weaknesses || [];
        dbCandidate.recommendation = rankInfo.recommendation || '';
        await dbCandidate.save();
        updatedCandidates.push(dbCandidate);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Candidates ranked successfully',
      data: {
        rankings,
        totalRanked: rankings.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateInterviewQuestions = async (req, res, next) => {
  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ success: false, error: 'candidateId and jobId are required' });
    }

    const candidate = await candidateService.getCandidateById(candidateId);
    const job = await jobService.getJobById(jobId);

    // Call FastAPI generator
    const aiResult = await aiService.generateQuestions(job.description, job.title);

    // Prepare questions schema for Mongoose
    const questions = [];
    
    if (Array.isArray(aiResult.technical_questions)) {
      aiResult.technical_questions.forEach(q => {
        questions.push({
          question: q.question,
          tests: q.tests,
          expectedKeyPoints: q.expected_key_points || [],
          category: 'Technical'
        });
      });
    }

    if (Array.isArray(aiResult.behavioral_questions)) {
      aiResult.behavioral_questions.forEach(q => {
        questions.push({
          question: q.question,
          tests: q.tests,
          expectedKeyPoints: q.expected_key_points || [],
          category: 'Behavioral'
        });
      });
    }

    if (Array.isArray(aiResult.advanced_questions)) {
      aiResult.advanced_questions.forEach(q => {
        questions.push({
          question: q.question,
          tests: q.tests,
          expectedKeyPoints: q.expected_key_points || [],
          category: 'Advanced'
        });
      });
    }

    // Save Questions in MongoDB (check if interview exists first, else create)
    let interview = await Interview.findOne({ candidateId, jobId });
    
    if (interview) {
      interview.questions = questions;
      await interview.save();
    } else {
      interview = await Interview.create({
        candidateId,
        jobId,
        questions,
        answers: [],
        feedback: '',
        score: 0
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interview questions generated and saved successfully',
      data: interview
    });
  } catch (error) {
    next(error);
  }
};

export const chatWithAssistant = async (req, res, next) => {
  try {
    const { question, candidateId, jobId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    let candidateContext = '';
    if (candidateId) {
      const candidate = await Candidate.findById(candidateId);
      if (candidate) {
        candidateContext = getCandidateText(candidate);
      }
    }

    let jobContext = '';
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        jobContext = `Job Title: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description}\nSkills Required: ${job.requiredSkills.join(', ')}`;
      }
    }

    // Call FastAPI chat
    const aiResult = await aiService.chatWithAssistant(question, candidateContext, jobContext);

    // Save chat output in MongoDB Chat collection
    const chatLog = await Chat.create({
      question,
      answer: aiResult.answer,
      candidateId: candidateId || undefined,
      jobId: jobId || undefined
    });

    res.status(200).json({
      success: true,
      data: chatLog
    });
  } catch (error) {
    next(error);
  }
};
