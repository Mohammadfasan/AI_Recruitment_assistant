import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Job description is required']
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    experience: {
      type: Number, // in years
      required: [true, 'Experience required in years is required']
    },
    salary: {
      type: String,
      required: [true, 'Salary is required']
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required']
    },
    location: {
      type: String,
      required: [true, 'Location is required']
    },
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Draft'],
      default: 'Open'
    },
    deadline: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.model('Job', jobSchema);
export default Job;
