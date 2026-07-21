import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  tests: {
    type: String
  },
  expectedKeyPoints: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: ['Technical', 'Behavioral', 'Advanced']
  }
});

const interviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  questions: {
    type: [questionSchema],
    default: []
  },
  answers: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  feedback: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  },
  interviewDate: {
    type: String,
    default: ''
  },
  interviewTime: {
    type: String,
    default: ''
  },
  interviewType: {
    type: String,
    default: 'Technical'
  },
  meetingLink: {
    type: String,
    default: ''
  },
  interviewer: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed'],
    default: 'Scheduled'
  },
  evaluation: {
    technicalKnowledge: { type: Number, default: 0 },
    communicationSkills: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    overallRating: { type: Number, default: 0 },
    finalRecommendation: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
