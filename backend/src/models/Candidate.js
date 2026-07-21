import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      trim: true
    },
    phone: {
      type: String,
      default: ''
    },
    github: {
      type: String,
      default: ''
    },
    linkedin: {
      type: String,
      default: ''
    },
    education: {
      type: [mongoose.Schema.Types.Mixed], // Handles both strings and structured objects from parser
      default: []
    },
    skills: {
      type: [String],
      default: []
    },
    experience: {
      type: [mongoose.Schema.Types.Mixed], // Handles both strings and structured objects from parser
      default: []
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    resumeText: {
      type: String,
      default: ''
    },
    resumeSummary: {
      type: String,
      default: ''
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    aiScore: {
      type: Number,
      default: 0
    },
    ranking: {
      type: Number
    },
    strengths: {
      type: [String],
      default: []
    },
    weaknesses: {
      type: [String],
      default: []
    },
    recommendation: {
      type: String,
      default: ''
    },
    compareSkills: {
      type: String,
      default: ''
    },
    compareExperience: {
      type: String,
      default: ''
    },
    compareEducation: {
      type: String,
      default: ''
    },
    compareCertifications: {
      type: String,
      default: ''
    },
    matchExplanation: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected'],
      default: 'Applied'
    }
  },
  {
    timestamps: true
  }
);

const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;
