import React, { useEffect, useState } from 'react';
import { getCandidates, updateCandidate, deleteCandidate } from '../services/candidateApi';
import { getJobs } from '../services/jobApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { Search, Filter, Trash2, Edit2, FileText, Download, Briefcase, GraduationCap, Calendar, Check, X, Star } from 'lucide-react';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, name, score

  // Candidate Details Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Delete Candidate Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, jobsRes] = await Promise.all([
        getCandidates(),
        getJobs()
      ]);

      if (candidatesRes.success) {
        setCandidates(candidatesRes.data);
      }
      if (jobsRes.success) {
        setJobs(jobsRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch candidate directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update candidate status
  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      const res = await updateCandidate(candidateId, { status: newStatus });
      if (res.success) {
        toast.success(`Candidate status updated to ${newStatus}`);
        setCandidates((prev) =>
          prev.map((c) => (c._id === candidateId ? { ...c, status: newStatus } : c))
        );
        if (selectedCandidate && selectedCandidate._id === candidateId) {
          setSelectedCandidate((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update candidate status.');
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (candidate, e) => {
    e.stopPropagation();
    setCandidateToDelete(candidate);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete candidate
  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;
    try {
      const res = await deleteCandidate(candidateToDelete._id);
      if (res.success) {
        toast.success('Candidate profile deleted successfully.');
        setDeleteConfirmOpen(false);
        if (selectedCandidate && selectedCandidate._id === candidateToDelete._id) {
          setDetailModalOpen(false);
          setSelectedCandidate(null);
        }
        setCandidateToDelete(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete candidate.');
    }
  };

  // Select candidate for profile detail modal
  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setDetailModalOpen(true);
  };

  // Filter & Sort candidates
  const processedCandidates = candidates
    .filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchesJob = jobFilter ? c.jobId === jobFilter || (c.jobId && c.jobId._id === jobFilter) : true;
      const matchesStatus = statusFilter ? c.status === statusFilter : true;
      return matchesSearch && matchesJob && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'score') {
        return b.aiScore - a.aiScore;
      }
      return 0;
    });

  // Render Mix-type (Object or String) helper functions
  const renderEducation = (edu) => {
    if (typeof edu === 'object' && edu !== null) {
      return (
        <div className="flex items-start space-x-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-lg">
          <GraduationCap className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{edu.degree || 'Degree'}</h5>
            <p className="text-xs text-zinc-650 dark:text-zinc-400 mt-0.5">
              {edu.institution || 'University'} {edu.year ? `(${edu.year})` : ''}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start space-x-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-lg">
        <GraduationCap className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <span className="text-xs text-zinc-700 dark:text-zinc-300">{String(edu)}</span>
      </div>
    );
  };

  const renderExperience = (exp) => {
    if (typeof exp === 'object' && exp !== null) {
      return (
        <div className="relative pl-6 pb-6 border-l border-indigo-150 dark:border-indigo-900/50 last:border-0 last:pb-0">
          {/* timeline node dot */}
          <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900" />
          <h5 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{exp.title}</h5>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            {exp.company} {exp.duration ? `(${exp.duration})` : ''}
          </p>
          {exp.description && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-md leading-relaxed">
              {exp.description}
            </p>
          )}
        </div>
      );
    }
    return (
      <div className="relative pl-6 pb-6 border-l border-indigo-150 dark:border-indigo-900/50 last:border-0 last:pb-0">
        <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900" />
        <p className="text-xs text-zinc-750 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-md">
          {String(exp)}
        </p>
      </div>
    );
  };

  if (loading && candidates.length === 0) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">Candidates Pool</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-sm font-medium">
          Manage parsed resumes, check AI matching scores, and schedule interviews.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col lg:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm placeholder-zinc-400 focus:outline-hidden"
          />
        </div>

        {/* Mapped Job Position Filter */}
        <div className="w-full lg:w-48">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
          >
            <option value="">All Job Positions</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        {/* Candidate Status Filter */}
        <div className="w-full lg:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Sort select */}
        <div className="w-full lg:w-44">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
          >
            <option value="newest">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="score">AI Match Score</option>
          </select>
        </div>
      </div>

      {/* Candidate Grid */}
      {processedCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedCandidates.map((candidate) => {
            const mappedJob = jobs.find(
              (j) => j._id === candidate.jobId || (candidate.jobId && j._id === candidate.jobId._id)
            );
            return (
              <div
                key={candidate._id}
                onClick={() => handleSelectCandidate(candidate)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center uppercase shrink-0">
                        {candidate.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 hover:text-indigo-600 transition-colors">
                          {candidate.name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[150px]">
                          {candidate.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => handleOpenDelete(candidate, e)}
                        className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {mappedJob && (
                    <div className="mt-4 flex items-center text-xs text-zinc-600 dark:text-zinc-400">
                      <Briefcase className="w-3.5 h-3.5 mr-1.5 text-zinc-450 shrink-0" />
                      <span className="truncate">Applied for: <span className="font-semibold">{mappedJob.title}</span></span>
                    </div>
                  )}

                  {/* Skills summary tags */}
                  <div className="flex flex-wrap gap-1 mt-4">
                    {candidate.skills.slice(0, 4).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 rounded-md text-[10px] font-semibold text-zinc-600 dark:text-zinc-400"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 4 && (
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-md text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        +{candidate.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    candidate.status === 'Hired'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : candidate.status === 'Rejected'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                      : 'bg-zinc-100 dark:bg-zinc-805 text-zinc-700 dark:text-zinc-350'
                  }`}>
                    {candidate.status}
                  </span>
                  {candidate.aiScore > 0 ? (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-md flex items-center space-x-1 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
                      <span>{candidate.aiScore}% Match</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      AI score pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center shadow-xs">
          <GraduationCap className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">No Candidates Found</h3>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            We couldn't find any candidate matching your filters. Upload resumes to parse candidate information.
          </p>
        </div>
      )}

      {/* CANDIDATE PROFILE DETAILS MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedCandidate ? `Candidate: ${selectedCandidate.name}` : ''}
        size="xl"
      >
        {selectedCandidate && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 dark:border-zinc-800 pb-5 gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-lg flex items-center justify-center uppercase shrink-0">
                  {selectedCandidate.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{selectedCandidate.name}</h4>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                    Email: {selectedCandidate.email} {selectedCandidate.phone ? `• Phone: ${selectedCandidate.phone}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 self-start sm:self-auto">
                {/* Resume download */}
                {selectedCandidate.resumeUrl && (
                  <a
                    href={selectedCandidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-350 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View Resume</span>
                  </a>
                )}
                
                {/* Status Selection Dropdown */}
                <div>
                  <select
                    value={selectedCandidate.status}
                    onChange={(e) => handleStatusChange(selectedCandidate._id, e.target.value)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main grid columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left pane: Resume Summary, Skills, AI match stats (7 cols) */}
              <div className="md:col-span-7 space-y-6">
                
                {/* AI Score panel if evaluated */}
                {selectedCandidate.aiScore > 0 && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-400">AI Match Evaluation</h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">Calculated by Gemini Resume Job Matcher</p>
                      </div>
                      <span className="text-xl font-bold text-emerald-800 dark:text-emerald-350 bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-lg">
                        {selectedCandidate.aiScore}% Match
                      </span>
                    </div>
                    {selectedCandidate.recommendation && (
                      <div className="mt-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/30">
                        <h5 className="text-xs font-semibold text-emerald-850 dark:text-emerald-300">Recommendation Reasoning</h5>
                        <p className="text-xs text-emerald-700 dark:text-emerald-450 mt-1 leading-relaxed">{selectedCandidate.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary section */}
                {selectedCandidate.resumeSummary && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Resume Summary</h4>
                    <p className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                      {selectedCandidate.resumeSummary}
                    </p>
                  </div>
                )}

                {/* Skills section */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">Skills ({selectedCandidate.skills.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-md text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses (AI ranking output) */}
                {(selectedCandidate.strengths?.length > 0 || selectedCandidate.weaknesses?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {selectedCandidate.strengths?.length > 0 && (
                      <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-4">
                        <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center space-x-1">
                          <Check className="w-4.5 h-4.5 mr-1" />
                          <span>Candidate Strengths</span>
                        </h5>
                        <ul className="list-disc list-inside text-xs text-emerald-700 dark:text-emerald-450 mt-2 space-y-1.5 pl-1.5">
                          {selectedCandidate.strengths.map((str, idx) => (
                            <li key={idx} className="leading-relaxed">{str}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedCandidate.weaknesses?.length > 0 && (
                      <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                        <h5 className="text-xs font-bold text-red-800 dark:text-red-400 flex items-center space-x-1">
                          <X className="w-4.5 h-4.5 mr-1" />
                          <span>Identified Gaps</span>
                        </h5>
                        <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-455 mt-2 space-y-1.5 pl-1.5">
                          {selectedCandidate.weaknesses.map((wk, idx) => (
                            <li key={idx} className="leading-relaxed">{wk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right pane: Experience Timeline & Education (5 cols) */}
              <div className="md:col-span-5 space-y-6">
                
                {/* Work Experience */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-zinc-450" />
                    <span>Work Experience</span>
                  </h4>
                  {selectedCandidate.experience && selectedCandidate.experience.length > 0 ? (
                    <div className="mt-2 space-y-0.5">
                      {selectedCandidate.experience.map((exp, idx) => (
                        <div key={idx}>
                          {renderExperience(exp)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-450 py-3 bg-zinc-50 dark:bg-zinc-950 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
                      No parsed work experience found.
                    </p>
                  )}
                </div>

                {/* Education */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <GraduationCap className="w-4 h-4 text-zinc-450" />
                    <span>Education</span>
                  </h4>
                  {selectedCandidate.education && selectedCandidate.education.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCandidate.education.map((edu, idx) => (
                        <div key={idx}>
                          {renderEducation(edu)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-450 py-3 bg-zinc-50 dark:bg-zinc-950 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
                      No parsed education details found.
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-end space-x-3 pt-5 border-t border-zinc-150 dark:border-zinc-800">
              <button
                onClick={(e) => handleOpenDelete(selectedCandidate, e)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 hover:text-red-700 text-red-655 border border-transparent rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Candidate</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Candidate Profile"
        message={`Are you sure you want to delete the candidate profile for "${candidateToDelete?.name}"? All analysis scores, matching results, and chat history for this candidate will be deleted.`}
        confirmText="Delete Candidate"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Candidates;
