import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      enum: ['Job Seeker', 'Recruiter', 'Admin'],
      default: 'Job Seeker'
    },
    profileImage: {
      type: String,
      default: ''
    },
    // Seeker Profile
    phone: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    address: { type: String, default: '' },
    country: { type: String, default: '' },
    education: { type: [mongoose.Schema.Types.Mixed], default: [] },
    experience: { type: [mongoose.Schema.Types.Mixed], default: [] },
    skills: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolioWebsite: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeText: { type: String, default: '' },
    resumeSummary: { type: String, default: '' },
    resumeScore: { type: Number, default: 0 },
    resumeSuggestions: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    // Recruiter Company Details
    company: {
      name: { type: String, default: '' },
      logo: { type: String, default: '' },
      industry: { type: String, default: '' },
      website: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    // Reset Password
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
  },
  {
    timestamps: true
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
