import React, { useEffect, useState } from 'react';
import { getJobs } from '../services/jobApi';
import { uploadCandidateResume } from '../services/candidateApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, CheckCircle2, ChevronRight, Briefcase, User, Mail, Phone, List, Award, Link2 } from 'lucide-react';

const Github = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import { Link } from 'react-router-dom';

const ResumeUpload = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Progress & loading
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedCandidate, setParsedCandidate] = useState(null);

  // Load jobs list for dropdown selection
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await getJobs();
        if (res.success) {
          const openJobs = res.data.filter(j => j.status === 'Open' || j.status === 'Draft');
          setJobs(openJobs);
          if (openJobs.length > 0) {
            setSelectedJobId(openJobs[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load jobs list:', err);
      }
    };
    loadJobs();
  }, []);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop events
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith('.docx')) {
        setFile(droppedFile);
      } else {
        toast.error('Only PDF or DOCX resume formats are supported.');
      }
    }
  };

  // Handle file select click
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Submit and upload resume
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedJobId) {
      toast.error('Please select a job position to map candidate to.');
      return;
    }
    if (!file) {
      toast.error('Please choose a resume file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobId', selectedJobId);

    try {
      setUploading(true);
      setProgress(0);

      const res = await uploadCandidateResume(formData, (progressEvent) => {
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentage);
      });

      if (res.success) {
        toast.success('Resume uploaded and parsed successfully!');
        setParsedCandidate(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to parse resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedCandidate(null);
    setProgress(0);
  };

  const renderExperience = (exp) => {
    if (typeof exp === 'object' && exp !== null) {
      return (
        <div className="relative pl-5 pb-4 border-l border-zinc-200 dark:border-zinc-800 last:border-0 last:pb-0">
          <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900" />
          <h5 className="font-semibold text-xs text-zinc-900 dark:text-zinc-50">{exp.title || 'Role'}</h5>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 font-medium">
            {exp.company || 'Company'} {exp.duration ? `(${exp.duration})` : ''}
          </p>
          {exp.description && (
            <p className="text-[11px] text-zinc-650 dark:text-zinc-450 mt-1 leading-relaxed">
              {exp.description}
            </p>
          )}
        </div>
      );
    }
    return (
      <div className="relative pl-5 pb-4 border-l border-zinc-200 dark:border-zinc-800 last:border-0 last:pb-0">
        <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900" />
        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {String(exp)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">Upload Resumes</h1>
        <p className="text-zinc-650 dark:text-zinc-400 mt-1 text-sm font-medium">
          Upload PDF or DOCX resumes. Gemini AI will automatically extract and structure skills, work history, and contact details.
        </p>
      </div>

      {!parsedCandidate ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 shadow-xs">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Job Select */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                1. Select Target Job Position
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-450">
                Parsed candidates will be linked to this opening for match scoring.
              </p>
              {jobs.length > 0 ? (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full max-w-md px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                >
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title} at {j.company}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-55/20 border border-amber-200/50 rounded-lg p-3 max-w-md">
                  No active job positions available. Please create a job position in the{' '}
                  <Link to="/jobs" className="underline font-semibold">Jobs Board</Link> first.
                </p>
              )}
            </div>

            {/* File Dropzone */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                2. Choose Resume Document
              </label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative min-h-[220px] ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <input
                  type="file"
                  id="resume-file"
                  onChange={handleFileChange}
                  accept=".pdf, .docx, application/pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                <UploadCloud className="w-10 h-10 text-indigo-500 mb-4" />
                <span className="font-semibold text-sm text-zinc-850 dark:text-zinc-150">
                  {file ? file.name : 'Drag & drop resume here, or click to browse'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Supports PDF or Word documents (Max 10MB)
                </span>
              </div>
            </div>

            {/* Upload progress & controls */}
            {uploading ? (
              <div className="space-y-2 max-w-md">
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Uploading & Parsing Resume...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic mt-1">
                  * Note: Standalone AI parsing can take up to 10-15 seconds to extract summary and work histories.
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!file || !selectedJobId}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <FileText className="w-4.5 h-4.5" />
                <span>Upload & Parse Resume</span>
              </button>
            )}
          </form>
        </div>
      ) : (
        /* Success view showing parsed candidate details */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 dark:border-zinc-800 pb-5 gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Resume Parsing Successful!</h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">Candidate profile created in database.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Upload Another
                </button>
                <Link
                  to="/candidates"
                  className="inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Go to Candidates Pool</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Grid of Parsed items */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Profile card metadata (5 cols) */}
              <div className="md:col-span-5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Contact details</h4>
                
                {/* Name */}
                <div className="flex items-start space-x-2.5 text-sm text-zinc-800 dark:text-zinc-250">
                  <User className="w-4.5 h-4.5 text-zinc-450 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Name</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{parsedCandidate.name || 'Not found'}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-2.5 text-sm text-zinc-800 dark:text-zinc-250">
                  <Mail className="w-4.5 h-4.5 text-zinc-450 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Email</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{parsedCandidate.email || 'Not found'}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-2.5 text-sm text-zinc-800 dark:text-zinc-250">
                  <Phone className="w-4.5 h-4.5 text-zinc-450 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Phone</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{parsedCandidate.phone || 'Not found'}</p>
                  </div>
                </div>

                {/* GitHub */}
                <div className="flex items-start space-x-2.5 text-sm text-zinc-800 dark:text-zinc-250">
                  <Github className="w-4.5 h-4.5 text-zinc-450 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">GitHub</p>
                    {parsedCandidate.github ? (
                      <a 
                        href={parsedCandidate.github.startsWith('http') ? parsedCandidate.github : `https://${parsedCandidate.github}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold text-xs text-indigo-650 dark:text-indigo-400 hover:underline break-all"
                      >
                        {parsedCandidate.github}
                      </a>
                    ) : (
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">Not found</p>
                    )}
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="flex items-start space-x-2.5 text-sm text-zinc-800 dark:text-zinc-250">
                  <Linkedin className="w-4.5 h-4.5 text-zinc-450 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">LinkedIn</p>
                    {parsedCandidate.linkedin ? (
                      <a 
                        href={parsedCandidate.linkedin.startsWith('http') ? parsedCandidate.linkedin : `https://${parsedCandidate.linkedin}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold text-xs text-indigo-650 dark:text-indigo-400 hover:underline break-all"
                      >
                        {parsedCandidate.linkedin}
                      </a>
                    ) : (
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">Not found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Parsed Summary, Skills, and Experience (7 cols) */}
              <div className="md:col-span-7 space-y-5">
                
                {/* Summary */}
                {parsedCandidate.resumeSummary && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">AI Generated Summary</h4>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-900 rounded-lg">
                      {parsedCandidate.resumeSummary}
                    </p>
                  </div>
                )}

                {/* Skills parsed list */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Skills Extracted ({parsedCandidate.skills?.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedCandidate.skills && parsedCandidate.skills.length > 0 ? (
                      parsedCandidate.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-550 dark:text-zinc-400">No skills parsed from document.</span>
                    )}
                  </div>
                </div>

                {/* Work Experience */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Work Experience</h4>
                  {parsedCandidate.experience && parsedCandidate.experience.length > 0 ? (
                    <div className="space-y-3.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-900 rounded-xl p-4">
                      {parsedCandidate.experience.map((exp, idx) => (
                        <div key={idx}>
                          {renderExperience(exp)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
                      No parsed work experience found.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
