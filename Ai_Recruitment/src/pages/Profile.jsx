import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadResume } from '../services/authApi';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Upload,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  Lightbulb,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

const GithubIconLocal = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIconLocal = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details | resume

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dob: '',
      gender: 'Male',
      address: '',
      country: '',
      skills: '',
      languages: '',
      certifications: '',
      linkedin: '',
      github: '',
      portfolioWebsite: '',
      education: [],
      experience: []
    }
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: 'education'
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: 'experience'
  });

  // Populate form with user profile details
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob || '',
        gender: user.gender || 'Male',
        address: user.address || '',
        country: user.country || '',
        skills: user.skills ? user.skills.join(', ') : '',
        languages: user.languages ? user.languages.join(', ') : '',
        certifications: user.certifications ? user.certifications.join(', ') : '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        portfolioWebsite: user.portfolioWebsite || '',
        education: user.education || [],
        experience: user.experience || []
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Format skills, languages, certifications from comma-separated string to arrays
      const formattedSkills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      const formattedLanguages = data.languages ? data.languages.split(',').map(s => s.trim()).filter(Boolean) : [];
      const formattedCertifications = data.certifications ? data.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];

      const payload = {
        ...data,
        skills: formattedSkills,
        languages: formattedLanguages,
        certifications: formattedCertifications
      };

      const res = await updateUserProfile(payload);
      if (res.success) {
        toast.success('Profile updated successfully!');
        setUser(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.name.split('.').pop().toLowerCase() !== 'docx') {
      toast.error('Only PDF and DOCX files are allowed');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await uploadResume(formData);
      if (res.success) {
        toast.success('Resume uploaded and parsed successfully!');
        setUser(res.data);
        setActiveTab('resume'); // switch to resume view to see AI feedback
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to upload and parse resume');
    } finally {
      setUploading(false);
    }
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20';
    if (score >= 60) return 'text-amber-500 border-amber-500 bg-amber-50/30 dark:bg-amber-950/20';
    return 'text-red-500 border-red-500 bg-red-50/30 dark:bg-red-950/20';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-black shadow-inner shrink-0 uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-50">{user?.name}</h1>
            <p className="text-xs text-zinc-505 dark:text-zinc-400 font-semibold">{user?.email} • Job Seeker Profile</p>
          </div>
        </div>
        
        {/* Resume Uploader widget */}
        <div className="shrink-0 w-full md:w-auto">
          <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm">
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin mr-2" />
                <span>AI Parsing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Resume (PDF/DOCX)</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleResumeUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('resume')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'resume'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>AI Resume Analysis</span>
        </button>
      </div>

      {/* Details Form View */}
      {activeTab === 'details' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Personal Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Full Name *</label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                />
                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    {...register('phone')}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Date of birth */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    {...register('dob')}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Gender */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Gender</label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="123 Main St, Suite 4B"
                    {...register('address')}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="United States"
                    {...register('country')}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Social Links */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider flex items-center space-x-1.5">
              <LinkIcon className="w-4 h-4" />
              <span>Links & Profiles</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* LinkedIn */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">LinkedIn URL</label>
                <div className="relative">
                  <LinkedinIconLocal className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="linkedin.com/in/username"
                    {...register('linkedin')}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">GitHub URL</label>
                <div className="relative">
                  <GithubIconLocal className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="github.com/username"
                    {...register('github')}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Portfolio Website */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Portfolio Website</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="mywebsite.com"
                    {...register('portfolioWebsite')}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Skills & Attributes */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider flex items-center space-x-1.5">
              <Award className="w-4 h-4" />
              <span>Skills, Languages & Certifications</span>
            </h3>

            {/* Skills */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, Python, TailwindCSS, Communication"
                {...register('skills')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Languages */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Languages (comma-separated)</label>
                <input
                  type="text"
                  placeholder="English, Spanish, French"
                  {...register('languages')}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                />
              </div>

              {/* Certifications */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Certifications (comma-separated)</label>
                <input
                  type="text"
                  placeholder="AWS Cloud Practitioner, Professional Scrum Master"
                  {...register('certifications')}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Work Experience */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4" />
                <span>Work Experience</span>
              </h3>
              <button
                type="button"
                onClick={() => appendExp({ title: '', company: '', duration: '', description: '' })}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Job</span>
              </button>
            </div>

            {expFields.map((field, index) => (
              <div key={field.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeExp(index)}
                  className="absolute right-3 top-3 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-650">Job Title</label>
                    <input
                      type="text"
                      placeholder="Senior Developer"
                      {...register(`experience.${index}.title`, { required: true })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-655">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      {...register(`experience.${index}.company`, { required: true })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-655">Duration</label>
                    <input
                      type="text"
                      placeholder="2021 - Present"
                      {...register(`experience.${index}.duration`, { required: true })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-655">Description / Achievements</label>
                  <textarea
                    rows="3"
                    placeholder="Describe your role and key accomplishments..."
                    {...register(`experience.${index}.description`)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section: Education */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>Education</span>
              </h3>
              <button
                type="button"
                onClick={() => appendEdu({ degree: '', institution: '', year: '' })}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Degree</span>
              </button>
            </div>

            {eduFields.map((field, index) => (
              <div key={field.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeEdu(index)}
                  className="absolute right-3 top-3 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-655">Degree</label>
                    <input
                      type="text"
                      placeholder="B.S. in Computer Science"
                      {...register(`education.${index}.degree`, { required: true })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-655">Institution</label>
                    <input
                      type="text"
                      placeholder="MIT"
                      {...register(`education.${index}.institution`, { required: true })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-655">Graduation Year</label>
                    <input
                      type="text"
                      placeholder="2020"
                      {...register(`education.${index}.year`)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form Submit Footer */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin mr-2" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* AI Resume Analysis Panel View */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {user?.resumeScore > 0 ? (
            <>
              {/* Column 1: Circle Gauge & Summary */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6 flex flex-col items-center text-center">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Resume Strength</h3>
                
                {/* Visual Circular gauge */}
                <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${getScoreColorClass(user.resumeScore)}`}>
                  <span className="text-4xl font-black">{user.resumeScore}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Rating</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {user.resumeScore >= 80 ? 'Highly Competitive' : user.resumeScore >= 60 ? 'Needs Refinements' : 'High Priority Improvement'}
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                    This score evaluates section completion, work description depth, certifications presence, and formatting guidelines.
                  </p>
                </div>

                {user.resumeUrl && (
                  <a
                    href={user.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View uploaded document</span>
                  </a>
                )}
              </div>

              {/* Column 2: Suggestions & missing skills */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Suggestions card */}
                {user.resumeSuggestions && user.resumeSuggestions.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                      <span>Resume Improvement Suggestions</span>
                    </h3>
                    
                    <ul className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {user.resumeSuggestions.map((sug, i) => (
                        <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 pt-3 first:pt-0 leading-relaxed flex items-start space-x-2.5">
                          <span className="w-5 h-5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Skills card */}
                {user.missingSkills && user.missingSkills.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Missing Industry Skills</span>
                    </h3>
                    
                    <p className="text-xs text-zinc-500 leading-normal">
                      Based on standard profiles matching your experiences, the AI identifies these keywords/skills as commonly sought after but missing in your profile:
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {user.missingSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-450 border border-red-100/50 dark:border-red-900/30 rounded-md text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Parse Summary */}
                {user.resumeSummary && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">AI Generated Summary</h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-150 rounded-xl">
                      {user.resumeSummary}
                    </p>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center space-y-4 shadow-xs">
              <Sparkles className="w-14 h-14 text-indigo-500 mx-auto animate-pulse" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No Resume Uploaded Yet</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Upload your resume PDF/DOCX using the uploader above. The AI Recruiter will parse it, populate your profile, calculate a strength score, and give suggestions!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
