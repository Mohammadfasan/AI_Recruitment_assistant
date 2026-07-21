import React, { useEffect, useState } from 'react';
import { getJobs, toggleFavoriteJob, applyForJob } from '../services/jobApi';
import { getMyApplications } from '../services/candidateApi';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Users,
  FileText,
  ChevronRight,
  Heart,
  Star,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const JobSearch = () => {
  const { user, setUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');

  // Selected job modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);

  // AI Matching result
  const [matchingResult, setMatchingResult] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchRequested, setMatchRequested] = useState(false);

  // Load jobs and seeker applications
  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes] = await Promise.all([
        getJobs(),
        getMyApplications()
      ]);
      
      if (jobsRes.success) {
        setJobs(jobsRes.data);
      }
      if (appsRes.success) {
        setApplications(appsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load jobs data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFavoriteToggle = async (jobId, e) => {
    e.stopPropagation();
    try {
      const res = await toggleFavoriteJob(jobId);
      if (res.success) {
        toast.success(res.message);
        // Update user favorites context
        if (user) {
          const index = user.favorites.indexOf(jobId);
          const updatedFavs = [...user.favorites];
          if (index > -1) {
            updatedFavs.splice(index, 1);
          } else {
            updatedFavs.push(jobId);
          }
          setUser({ ...user, favorites: updatedFavs });
        }
      }
    } catch (err) {
      toast.error('Failed to toggle favorite');
    }
  };

  const handleApply = async (jobId) => {
    setApplying(true);
    try {
      const res = await applyForJob(jobId);
      if (res.success) {
        toast.success('Applied successfully! AI match evaluated.');
        setDetailsModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  // Run AI matching for the selected job
  const handleCalculateMatch = async (jobId) => {
    setLoadingMatch(true);
    setMatchRequested(true);
    try {
      // Find candidate application if exists
      const hasApplied = applications.find(a => a.jobId?._id === jobId);
      
      if (hasApplied && hasApplied.aiScore > 0) {
        // If already applied, retrieve stored match result
        setMatchingResult({
          match_score: hasApplied.aiScore,
          matched_skills: hasApplied.matchedSkills || [],
          missing_skills: hasApplied.missingSkills || [],
          reasoning: hasApplied.matchExplanation || hasApplied.reasoning || '',
          compare_skills: hasApplied.compareSkills || '',
          compare_experience: hasApplied.compareExperience || '',
          compare_education: hasApplied.compareEducation || '',
          compare_certifications: hasApplied.compareCertifications || '',
          match_explanation: hasApplied.matchExplanation || '',
          recommendation: hasApplied.recommendation || 'Manual Review'
        });
      } else {
        // Call backend API /api/ai/match
        const userText = constructUserText(user);
        const job = jobs.find(j => j._id === jobId);
        
        const res = await api.post('/ai/match', {
          candidateId: '000000000000000000000000', // Mock placeholder if not candidate document
          jobId: jobId
        });
        
        if (res.data && res.data.success) {
          setMatchingResult(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to perform AI job matching. Make sure your profile resume is uploaded.');
    } finally {
      setLoadingMatch(false);
    }
  };

  const constructUserText = (usr) => {
    if (!usr) return '';
    return `${usr.resumeText || ''} ${usr.skills?.join(', ') || ''} ${(usr.experience || []).map(e => e.title).join(', ')}`;
  };

  // Filter jobs based on states
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    
    const matchesLoc = locFilter ? job.location.toLowerCase() === locFilter.toLowerCase() : true;
    const matchesType = typeFilter ? job.employmentType.toLowerCase() === typeFilter.toLowerCase() : true;
    
    // Filter experience required <= selection
    const matchesExp = expFilter ? job.experience <= parseInt(expFilter, 10) : true;
    
    return matchesSearch && matchesLoc && matchesType && matchesExp && job.status === 'Open';
  });

  const handleOpenJob = (job) => {
    setSelectedJob(job);
    setMatchingResult(null);
    setMatchRequested(false);
    setDetailsModalOpen(true);
  };

  if (loading && jobs.length === 0) return <LoadingSpinner size="lg" />;

  const isFavorite = (jobId) => user?.favorites?.includes(jobId);
  const getAppliedInfo = (jobId) => applications.find(a => a.jobId?._id === jobId);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 60) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
    return 'text-red-605 bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50">Find Jobs</h1>
        <p className="text-zinc-650 dark:text-zinc-400 mt-1 text-sm font-semibold">
          Search job postings, check instant AI matching, save jobs, and apply instantly.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search titles, companies, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
          />
        </div>

        {/* Location filter */}
        <div className="w-full md:w-44">
          <select
            value={locFilter}
            onChange={(e) => setLocFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>

        {/* Job Type Filter */}
        <div className="w-full md:w-44">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* Exp Filter */}
        <div className="w-full md:w-44">
          <select
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
          >
            <option value="">Max Experience</option>
            <option value="0">Entry Level (0 yrs)</option>
            <option value="2">Junior (Up to 2 yrs)</option>
            <option value="5">Mid-Senior (Up to 5 yrs)</option>
            <option value="10">Senior (Up to 10 yrs)</option>
          </select>
        </div>
      </div>

      {/* Job listings grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const hasApplied = getAppliedInfo(job._id);
            const isFav = isFavorite(job._id);

            return (
              <div
                key={job._id}
                onClick={() => handleOpenJob(job)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-505 dark:hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
                      {job.employmentType}
                    </span>
                    
                    <button
                      onClick={(e) => handleFavoriteToggle(job._id, e)}
                      className="p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Heart className={`w-4.5 h-4.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 mt-3 hover:text-indigo-650 transition-colors truncate">
                    {job.title}
                  </h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold">{job.company}</p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <span className="flex items-center text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-md font-medium">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center text-[10px] text-zinc-505 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-md font-medium">
                      <DollarSign className="w-3 h-3 text-zinc-400" />
                      {job.salary}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    {job.experience > 0 ? `${job.experience}+ years experience` : 'Entry level'}
                  </span>
                  
                  {hasApplied ? (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded font-bold">
                      Applied ({hasApplied.status})
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                      <span>Details & Apply</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs">
          <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">No Jobs Found</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            There are currently no job positions matching your search filters.
          </p>
        </div>
      )}

      {/* JOB DETAIL & APPLY MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedJob ? `${selectedJob.title} - ${selectedJob.company}` : ''}
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Meta attributes */}
            <div className="flex flex-wrap gap-2.5">
              <span className="flex items-center text-xs text-zinc-650 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md font-medium">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {selectedJob.location}
              </span>
              <span className="flex items-center text-xs text-zinc-650 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md font-medium">
                <Briefcase className="w-3.5 h-3.5 mr-1" />
                {selectedJob.employmentType}
              </span>
              <span className="flex items-center text-xs text-zinc-650 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md font-medium">
                <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                {selectedJob.salary}
              </span>
              <span className="flex items-center text-xs text-zinc-650 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md font-medium">
                {selectedJob.experience > 0 ? `${selectedJob.experience}+ years experience` : 'Entry level'}
              </span>
            </div>

            {/* Job Description */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-2">Job Description</h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-850 rounded-xl font-medium">
                {selectedJob.description}
              </p>
            </div>

            {/* Job Required Skills */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedJob.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* AI MATCHING EXPANSION BAR */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-850">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">AI Job Match Score</span>
                </div>
                {!matchRequested && (
                  <button
                    onClick={() => handleCalculateMatch(selectedJob._id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Check Fit Score
                  </button>
                )}
              </div>

              {loadingMatch && (
                <div className="p-8 flex flex-col items-center justify-center space-y-2">
                  <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-650 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500 font-medium">Gemini is analyzing your compatibility...</span>
                </div>
              )}

              {!loadingMatch && matchingResult && (
                <div className="p-5 space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-4">
                    {/* Score badge */}
                    <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center font-black ${getScoreColor(matchingResult.match_score)}`}>
                      <span className="text-lg leading-none">{matchingResult.match_score}%</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Matching Explanation</h5>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal font-medium">{matchingResult.reasoning || matchingResult.match_explanation}</p>
                    </div>
                  </div>

                  {/* Comparisons tabs details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-850 text-xs">
                    {matchingResult.compare_skills && (
                      <div className="space-y-1">
                        <span className="font-bold text-zinc-400 uppercase tracking-wider block">Skills Fit</span>
                        <p className="text-zinc-650 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-150/40">{matchingResult.compare_skills}</p>
                      </div>
                    )}
                    {matchingResult.compare_experience && (
                      <div className="space-y-1">
                        <span className="font-bold text-zinc-400 uppercase tracking-wider block">Experience Fit</span>
                        <p className="text-zinc-650 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-150/40">{matchingResult.compare_experience}</p>
                      </div>
                    )}
                    {matchingResult.compare_education && (
                      <div className="space-y-1">
                        <span className="font-bold text-zinc-400 uppercase tracking-wider block">Education Fit</span>
                        <p className="text-zinc-650 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-150/40">{matchingResult.compare_education}</p>
                      </div>
                    )}
                    {matchingResult.compare_certifications && (
                      <div className="space-y-1">
                        <span className="font-bold text-zinc-400 uppercase tracking-wider block">Certifications Fit</span>
                        <p className="text-zinc-650 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-150/40">{matchingResult.compare_certifications}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommendation banner */}
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">AI Recommendation:</span>
                    <span className="font-black bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                      {matchingResult.recommendation}
                    </span>
                  </div>

                  {/* Matched vs Missing Skills list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1 mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Matched Skills ({matchingResult.matched_skills?.length || 0})</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {matchingResult.matched_skills?.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded text-xs font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-red-650 dark:text-red-400 uppercase tracking-wider flex items-center space-x-1 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Missing Skills ({matchingResult.missing_skills?.length || 0})</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {matchingResult.missing_skills?.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-450 rounded text-xs font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-5 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={(e) => handleFavoriteToggle(selectedJob._id, e)}
                className={`inline-flex items-center space-x-2 px-4 py-2 border rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isFavorite(selectedJob._id)
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-850'
                }`}
              >
                <Heart className={`w-4.5 h-4.5 ${isFavorite(selectedJob._id) ? 'fill-rose-500' : ''}`} />
                <span>{isFavorite(selectedJob._id) ? 'Saved' : 'Save Job'}</span>
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-750 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-850 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                {getAppliedInfo(selectedJob._id) ? (
                  <button
                    disabled={true}
                    className="px-5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-xl text-sm font-semibold cursor-not-allowed"
                  >
                    Already Applied
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(selectedJob._id)}
                    disabled={applying}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer flex items-center justify-center"
                  >
                    {applying ? (
                      <>
                        <span className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin mr-2" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <span>Apply For Job</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobSearch;
