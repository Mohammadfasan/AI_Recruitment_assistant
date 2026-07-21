import React, { useEffect, useState } from 'react';
import { getJobs } from '../services/jobApi';
import { getCandidates } from '../services/candidateApi';
import { matchCandidateToJob } from '../services/aiApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Percent, Briefcase, User, Star, CheckCircle, AlertTriangle, Lightbulb, Check, X, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

// Score circular SVG progress bar component
const CircularProgress = ({ value, label, size = 100, strokeWidth = 6, color = 'stroke-indigo-600' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-zinc-100 dark:text-zinc-800 stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`transition-all duration-1000 ease-out ${color} stroke-current`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400 text-center">{label}</span>
    </div>
  );
};

const AiMatching = () => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  
  // Match results state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Load jobs list on mount
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

  // Fetch candidates mapped to selected job
  const loadJobCandidates = async (jobId) => {
    if (!jobId) return;
    try {
      setLoadingCandidates(true);
      setResult(null); // Clear previous results
      const res = await getCandidates({ jobId });
      if (res.success) {
        setCandidates(res.data);
        if (res.data.length > 0) {
          setSelectedCandidateId(res.data[0]._id);
        } else {
          setSelectedCandidateId('');
        }
      }
    } catch (err) {
      console.error('Failed to load job candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      loadJobCandidates(selectedJobId);
    }
  }, [selectedJobId]);

  // Evaluate candidate match fit
  const handleEvaluate = async (candidateId) => {
    if (!selectedJobId || !candidateId) {
      toast.error('Please select both a job position and a candidate.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setSelectedCandidateId(candidateId);
      
      const res = await matchCandidateToJob(candidateId, selectedJobId);
      if (res.success) {
        toast.success('AI Matching completed successfully!');
        setResult(res.data);
        
        // Update local candidates state with the new match score
        setCandidates(prev => 
          prev.map(c => c._id === candidateId ? { ...c, aiScore: res.data.matchScore } : c)
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'AI matching computation failed.');
    } finally {
      setLoading(false);
    }
  };

  const currentJob = jobs.find(j => j._id === selectedJobId);
  const currentCandidate = candidates.find(c => c._id === selectedCandidateId);

  // Calculate dynamic sub-scores for presentation
  const getSubScores = () => {
    if (!result || !currentCandidate || !currentJob) return { skillScore: 0, expScore: 0, eduScore: 0 };
    
    // 1. Skill Match Score
    const matchedCount = result.matchedSkills?.length || 0;
    const missingCount = result.missingSkills?.length || 0;
    const skillScore = Math.round((matchedCount / (matchedCount + missingCount || 1)) * 100);

    // 2. Experience Match Score
    let candidateYears = 0;
    if (currentCandidate.experience && currentCandidate.experience.length > 0) {
      candidateYears = currentCandidate.experience.length * 2.5; 
    }
    const requiredYears = currentJob.experience || 1;
    const expScore = Math.min(100, Math.round((candidateYears / requiredYears) * 100)) || 75;

    // 3. Education Match Score
    const hasEdu = currentCandidate.education && currentCandidate.education.length > 0;
    const eduScore = hasEdu ? 95 : 60;

    return { skillScore, expScore, eduScore };
  };

  const { skillScore, expScore, eduScore } = getSubScores();



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">AI Job Matching</h1>
        <p className="text-zinc-650 dark:text-zinc-400 mt-1 text-sm font-medium">
          Analyze and rank candidate compatibility. Select a job position to view and match all applicants.
        </p>
      </div>

      {/* Select Box */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
        <div className="w-full max-w-md space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-zinc-400" />
            <span>Select Job Open Position</span>
          </label>
          {jobs.length > 0 ? (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-805 dark:text-zinc-200 focus:outline-hidden"
            >
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} at {j.company} ({j.status})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-red-500 py-1">No open jobs available.</p>
          )}
        </div>
      </div>

      {/* Main Grid split screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: candidates list */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Applicants Mapped ({candidates.length})</h3>
              {loadingCandidates && <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-650 rounded-full animate-spin" />}
            </div>

            {loadingCandidates ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : candidates.length > 0 ? (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {candidates.map((cand) => {
                  const isSelected = cand._id === selectedCandidateId;
                  const hasScore = cand.aiScore > 0;
                  
                  // Score color class
                  let scoreBadgeClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400";
                  if (hasScore) {
                    if (cand.aiScore >= 80) {
                      scoreBadgeClass = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50";
                    } else if (cand.aiScore >= 50) {
                      scoreBadgeClass = "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50";
                    } else {
                      scoreBadgeClass = "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50";
                    }
                  }

                  return (
                    <div
                      key={cand._id}
                      onClick={() => setSelectedCandidateId(cand._id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                          : 'border-zinc-150 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{cand.name}</h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                            cand.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                            cand.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
                            'bg-zinc-100 text-zinc-655 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {cand.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate pl-5.5">{cand.email}</p>
                        
                        {cand.skills && cand.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5 pl-5.5">
                            {cand.skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {cand.skills.length > 3 && (
                              <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold px-0.5 mt-0.5">
                                +{cand.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-2">
                        {/* Match Score Badge */}
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${scoreBadgeClass}`}>
                          {hasScore ? `${cand.aiScore}% Match` : 'Pending'}
                        </div>
                        
                        {/* Evaluate Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEvaluate(cand._id);
                          }}
                          disabled={loading && isSelected}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-md text-[10px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          {loading && isSelected ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>{hasScore ? 'Re-Evaluate' : 'Evaluate'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">No applicants for this position</p>
                <p className="text-[10px] text-zinc-500">Upload candidate resumes and select this job mapping first.</p>
                <Link to="/upload" className="inline-block text-[10px] font-bold text-indigo-650 hover:underline">
                  Upload Resumes &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column: detailed match report */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 space-y-6 shadow-xs animate-pulse">
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3" />
              <div className="flex justify-around py-4">
                <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-4/5" />
            </div>
          ) : result && currentCandidate ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6 shadow-xs space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-150 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">Match Comparison Report</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-semibold">
                    Candidate: <span className="text-indigo-600 dark:text-indigo-400">{currentCandidate.name}</span> • Position:{' '}
                    <span className="text-indigo-600 dark:text-indigo-400">{currentJob?.title}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200/50">
                  <Star className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
                  <span>Overall Match Fit: {result.matchScore}%</span>
                </div>
              </div>

              {/* circular progress grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-zinc-150 dark:border-zinc-800">
                <CircularProgress
                  value={result.matchScore}
                  label="Compatibility"
                  color="stroke-indigo-600 dark:stroke-indigo-500"
                />
                <CircularProgress
                  value={skillScore}
                  label="Skill Fit"
                  color="stroke-blue-600 dark:stroke-blue-500"
                />
                <CircularProgress
                  value={expScore}
                  label="Experience"
                  color="stroke-amber-500 dark:stroke-amber-500"
                />
                <CircularProgress
                  value={eduScore}
                  label="Education"
                  color="stroke-emerald-600 dark:stroke-emerald-500"
                />
              </div>

              {/* details columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                <div className="md:col-span-5 space-y-5">
                  {/* Matched Skills */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Matched Skills ({result.matchedSkills?.length || 0})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {result.matchedSkills && result.matchedSkills.length > 0 ? (
                        result.matchedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-semibold flex items-center space-x-0.5"
                          >
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{sk}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-550">No matching skills found.</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Missing / Gaps ({result.missingSkills?.length || 0})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {result.missingSkills && result.missingSkills.length > 0 ? (
                        result.missingSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-750 dark:text-amber-450 rounded-md text-[10px] font-semibold flex items-center space-x-0.5"
                          >
                            <X className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{sk}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1" /> Perfect skill coverage!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4">
                  {/* Reasoning */}
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1 text-zinc-450" />
                      <span>AI Reasoning Analysis</span>
                    </h4>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3.5 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                      {result.reasoning || 'No analysis details provided.'}
                    </p>
                  </div>

                  {/* Fallback Strengths/Weaknesses from MongoDB */}
                  {(currentCandidate.strengths?.length > 0 || currentCandidate.weaknesses?.length > 0) && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-lg p-3.5 space-y-2">
                      <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center">
                        <Lightbulb className="w-3.5 h-3.5 mr-1 text-zinc-450" />
                        <span>Strengths & Improvement Points</span>
                      </h4>
                      {currentCandidate.strengths?.length > 0 && (
                        <div>
                          <span className="text-[9px] text-zinc-400 font-semibold uppercase">Candidate Strengths</span>
                          <ul className="list-disc list-inside text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 pl-1 space-y-0.5">
                            {currentCandidate.strengths.slice(0, 3).map((st, i) => (
                              <li key={i}>{st}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentCandidate.weaknesses?.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[9px] text-zinc-400 font-semibold uppercase">Improvement Gaps</span>
                          <ul className="list-disc list-inside text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 pl-1 space-y-0.5">
                            {currentCandidate.weaknesses.slice(0, 3).map((wk, i) => (
                              <li key={i}>{wk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : currentCandidate ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto animate-pulse" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Ready to Match: {currentCandidate.name}</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Evaluate this candidate's resume semantic alignment with the {currentJob?.title} requirements.
              </p>
              <button
                onClick={() => handleEvaluate(currentCandidate._id)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluate Compatibility Fit</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs">
              Select a candidate from the left panel to begin semantic evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiMatching;
