import React, { useEffect, useState } from 'react';
import { getJobs } from '../services/jobApi';
import { getCandidates } from '../services/candidateApi';
import { rankCandidatesForJob } from '../services/aiApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Award, Briefcase, Search, Star, Users, ShieldAlert, Check, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateRankings = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobCandidates, setJobCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  
  // Rankings state
  const [rankingList, setRankingList] = useState([]);
  const [loadingRank, setLoadingRank] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [scoreThreshold, setScoreThreshold] = useState(0);

  // Fetch jobs on mount
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
        console.error(err);
      }
    };
    loadJobs();
  }, []);

  // Fetch candidates mapped to selected job
  const loadJobCandidates = async (jobId) => {
    if (!jobId) return;
    try {
      setLoadingCandidates(true);
      setRankingList([]); // Clear previous rankings on job change
      const res = await getCandidates({ jobId });
      if (res.success) {
        setJobCandidates(res.data);
        
        // If candidates already have ranking values in DB, pre-populate them!
        const preRanked = res.data
          .filter(c => c.ranking !== undefined)
          .sort((a, b) => a.ranking - b.ranking);
        
        if (preRanked.length > 0) {
          // Map DB candidate structure to look like ranking endpoint response
          const mappedPreRanked = preRanked.map(c => ({
            candidate_id: c._id,
            name: c.name,
            score: c.aiScore,
            rank: c.ranking,
            recommendation: c.recommendation,
            strengths: c.strengths,
            weaknesses: c.weaknesses
          }));
          setRankingList(mappedPreRanked);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      loadJobCandidates(selectedJobId);
    }
  }, [selectedJobId]);

  // Execute AI Ranking
  const handleGenerateRankings = async () => {
    if (!selectedJobId) return;
    if (jobCandidates.length === 0) {
      toast.error('No candidates applied to this job to rank.');
      return;
    }

    const candidateIds = jobCandidates.map(c => c._id);

    try {
      setLoadingRank(true);
      setRankingList([]);
      const res = await rankCandidatesForJob(selectedJobId, candidateIds);
      if (res.success) {
        toast.success('Candidates ranked successfully!');
        
        // Map output rankings. Note: rank endpoint returns data: { rankings: [...] }
        const rankings = res.data.rankings || [];
        
        // Merge candidate names from our state
        const mergedRankings = rankings.map(r => {
          const matchCand = jobCandidates.find(c => c._id === r.candidate_id);
          return {
            ...r,
            name: matchCand ? matchCand.name : 'Unknown Candidate'
          };
        }).sort((a, b) => a.rank - b.rank);

        setRankingList(mergedRankings);
        
        // Reload candidate list in background to sync MongoDB states
        loadJobCandidates(selectedJobId);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'AI candidate ranking calculation failed.');
    } finally {
      setLoadingRank(false);
    }
  };

  const currentJob = jobs.find(j => j._id === selectedJobId);

  // Filter rankings locally
  const filteredRankings = rankingList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesScore = item.score >= scoreThreshold;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">AI Candidate Rankings</h1>
        <p className="text-zinc-650 dark:text-zinc-400 mt-1 text-sm font-medium">
          Select a job position. Gemini AI will rank all associated applicants relative to each other based on job requirements.
        </p>
      </div>

      {/* Selector Widget */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="w-full sm:max-w-md space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-zinc-400" />
            <span>Select Job Open Position</span>
          </label>
          {jobs.length > 0 ? (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-805 dark:text-zinc-200 focus:outline-hidden"
            >
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} at {j.company}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-red-500 py-1">No open jobs available.</p>
          )}
        </div>

        <div className="flex items-center space-x-4 self-stretch sm:self-auto justify-end">
          <div className="text-right hidden md:block">
            <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold">Candidates Mapped</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{jobCandidates.length} applicants</p>
          </div>
          <button
            onClick={handleGenerateRankings}
            disabled={loadingRank || loadingCandidates || jobCandidates.length === 0}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loadingRank ? (
              <>
                <span className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin mr-1.5" />
                <span>Ranking AI...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>Generate AI Rankings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* If loading candidates */}
      {loadingCandidates && <LoadingSpinner size="md" />}

      {/* Main Leaderboard Rankings list */}
      {!loadingCandidates && rankingList.length > 0 ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Filters for ranked list */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ranked candidate name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-hidden"
              />
            </div>
            
            <div className="w-full sm:w-48">
              <select
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
              >
                <option value="0">All Scores</option>
                <option value="90">90% and above</option>
                <option value="80">80% and above</option>
                <option value="70">70% and above</option>
                <option value="50">50% and above</option>
              </select>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-4">
            {filteredRankings.length > 0 ? (
              filteredRankings.map((item, index) => {
                // Rank color indicators
                const rankBadges = [
                  'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900', // 1
                  'bg-slate-100 text-slate-800 border-slate-300 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700', // 2
                  'bg-orange-100 text-orange-850 border-orange-250 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900', // 3
                ];
                const rankClass = rankBadges[item.rank - 1] || 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-850';

                return (
                  <div
                    key={item.candidate_id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs flex flex-col lg:flex-row gap-6 justify-between items-start"
                  >
                    {/* Left: Rank, Name, Details */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Rank Number Circle Badge */}
                      <span className={`w-10 h-10 border rounded-lg flex items-center justify-center font-bold text-base shrink-0 ${rankClass}`}>
                        #{item.rank}
                      </span>
                      
                      <div className="space-y-3 flex-1 min-w-0">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 hover:underline">
                              <Link to={`/candidates`}>{item.name}</Link>
                            </h3>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md flex items-center space-x-1 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
                              <span>{item.score}% Match</span>
                            </span>
                          </div>
                        </div>

                        {/* Recommendation Reasoning */}
                        {item.recommendation && (
                          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/80 rounded-lg p-3.5">
                            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center">
                              <ShieldAlert className="w-4 h-4 mr-1 text-zinc-450" />
                              <span>AI Candidate Fit Analysis</span>
                            </p>
                            <p className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed">
                              {item.recommendation}
                            </p>
                          </div>
                        )}

                        {/* Strengths & Weaknesses checklists */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {item.strengths && item.strengths.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Strengths</span>
                              <ul className="space-y-1">
                                {item.strengths.slice(0, 3).map((st, i) => (
                                  <li key={i} className="text-xs text-zinc-650 dark:text-zinc-355 flex items-start space-x-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-550 shrink-0 mt-0.5" />
                                    <span className="truncate">{st}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {item.weaknesses && item.weaknesses.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Areas of Concern</span>
                              <ul className="space-y-1">
                                {item.weaknesses.slice(0, 3).map((wk, i) => (
                                  <li key={i} className="text-xs text-zinc-650 dark:text-zinc-355 flex items-start space-x-1.5">
                                    <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="truncate">{wk}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No ranked candidates match your filter criteria.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Empty / Parse pending state */
        !loadingRank && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center shadow-xs">
            <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">No Rankings Computed</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
              Select a job position and click "Generate AI Rankings" to compare candidate compatibility and select the top fits.
            </p>
          </div>
        )
      )}

      {/* Loading overlay for rank computation */}
      {loadingRank && (
        <div className="py-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-650 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Running LLM comparisons across all candidates...
          </p>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 italic max-w-xs text-center">
            * Note: Gemini processes candidates in a single batch, extracting key fit recommendations. This may take a few seconds.
          </p>
        </div>
      )}
    </div>
  );
};

export default CandidateRankings;
