import React, { useEffect, useState } from 'react';
import { getDashboardAnalytics, getSeekerAnalytics } from '../services/analyticsApi';
import { getCandidates } from '../services/candidateApi';
import { getJobs } from '../services/jobApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Star,
  User,
  Bell,
  Heart,
  FileText,
  AlertTriangle,
  Lightbulb,
  MapPin,
  DollarSign,
  Video,
  Clock,
  Sparkles,
  Award,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recruiter state
  const [recruiterStats, setRecruiterStats] = useState(null);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);

  // Seeker state
  const [seekerStats, setSeekerStats] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.role === 'Job Seeker') {
        const res = await getSeekerAnalytics();
        if (res.success) {
          setSeekerStats(res.data);
        }
      } else {
        const [statsRes, candidatesRes, jobsRes] = await Promise.all([
          getDashboardAnalytics(),
          getCandidates({ limit: 5 }),
          getJobs()
        ]);

        if (statsRes.success) {
          setRecruiterStats(statsRes.data);
        }
        
        if (candidatesRes.success) {
          const sortedCandidates = [...candidatesRes.data]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
          setRecentCandidates(sortedCandidates);
        }

        if (jobsRes.success) {
          const sortedJobs = [...jobsRes.data]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
          setRecentJobs(sortedJobs);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Could not connect to backend APIs. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Profile completion calculator
  const calculateProfileCompletion = (u) => {
    if (!u) return 0;
    let score = 0;
    const total = 8;
    if (u.name) score++;
    if (u.phone) score++;
    if (u.dob) score++;
    if (u.address) score++;
    if (u.skills && u.skills.length > 0) score++;
    if (u.education && u.education.length > 0) score++;
    if (u.experience && u.experience.length > 0) score++;
    if (u.resumeUrl) score++;
    return Math.round((score / total) * 100);
  };

  if (loading) return <LoadingSpinner fullPage={false} size="lg" />;

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6 text-center max-w-xl mx-auto mt-12">
        <h3 className="text-red-800 dark:text-red-400 font-semibold text-lg mb-2">Connection Error</h3>
        <p className="text-red-600 dark:text-red-300 text-sm mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- JOB SEEKER VIEW ---
  if (user?.role === 'Job Seeker') {
    const sStats = seekerStats || {
      resumeScore: 0,
      resumeSuggestions: [],
      missingSkills: [],
      appliedCount: 0,
      favoritesCount: 0,
      interviewsCount: 0,
      nextInterview: null,
      savedJobs: [],
      applications: [],
      recentNotifications: []
    };

    const completion = calculateProfileCompletion(user);

    const seekerCards = [
      {
        title: 'Resume score',
        value: sStats.resumeScore ? `${sStats.resumeScore}%` : 'N/A',
        icon: User,
        color: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
        desc: 'AI Resume Quality Index'
      },
      {
        title: 'Applied Jobs',
        value: sStats.appliedCount,
        icon: Briefcase,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
        desc: 'Submitted job applications'
      },
      {
        title: 'Saved Jobs',
        value: sStats.favoritesCount,
        icon: Heart,
        color: 'text-rose-605 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
        desc: 'Starred job listings'
      },
      {
        title: 'Interviews Scheduled',
        value: sStats.interviewsCount,
        icon: Calendar,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
        desc: 'Upcoming interview rounds'
      }
    ];

    const getScoreColor = (score) => {
      if (score >= 80) return 'text-emerald-500 border-emerald-500 dark:text-emerald-455';
      if (score >= 60) return 'text-amber-500 border-amber-500 dark:text-amber-455';
      return 'text-red-500 border-red-500 dark:text-red-455';
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* 1. Welcome Card & Profile Completion Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-6 translate-x-6" />
            <div className="space-y-2.5">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Welcome back, {user.name}!</h1>
              <p className="text-indigo-100 text-sm max-w-md font-medium leading-relaxed">
                Ready to find your next career breakthrough? Browse AI-matched job openings, track application timeline milestones, and practice interviews.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/jobs"
                className="px-4 py-2 bg-white text-indigo-700 hover:bg-zinc-55 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Find Jobs
              </Link>
              <Link
                to="/profile"
                className="px-4 py-2 bg-white/15 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold transition-all"
              >
                Update Profile
              </Link>
            </div>
          </div>

          {/* Profile Completion Box */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Profile Setup</h3>
              <p className="text-xs text-zinc-500 font-medium">Keep your details updated for recruiter shortlists.</p>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-700 dark:text-zinc-350">
                <span>Setup Completion</span>
                <span>{completion}%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-zinc-450 dark:text-zinc-505 leading-normal mt-4">
              {completion < 100
                ? 'Tip: Add your education records, work experience, and upload a parsed resume PDF to reach 100%!'
                : 'Excellent! Your profile details are fully complete.'}
            </p>
          </div>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {seekerCards.map((card, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{card.value}</h3>
                <span className="text-[10px] text-zinc-505 dark:text-zinc-400 font-medium block mt-1">{card.desc}</span>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon className="w-5.5 h-5.5" />
              </div>
            </div>
          ))}
        </div>

        {/* 3. Main Dashboard Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Recent Applications list */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-zinc-955 dark:text-zinc-50 text-base">Recent Applications</h3>
                <Link to="/applications" className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center space-x-1">
                  <span>Track all applications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sStats.applications && sStats.applications.length > 0 ? (
                  sStats.applications.slice(0, 4).map((app) => (
                    <div key={app._id} className="p-5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <div className="min-w-0 pr-4">
                        <Link to={`/jobs`} className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-indigo-605 dark:hover:text-indigo-455 transition-colors block truncate">
                          {app.jobTitle}
                        </Link>
                        <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">{app.company}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 rounded-md font-bold">
                            {app.status}
                          </span>
                          <span className="text-[10px] text-zinc-405 dark:text-zinc-505">
                            Applied: {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {app.aiScore > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-705 dark:text-emerald-455 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-455" />
                          <span>{app.aiScore}% Match</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center">
                    <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <p className="text-sm text-zinc-505 dark:text-zinc-400 font-semibold">You haven't applied for any positions yet.</p>
                    <Link to="/jobs" className="text-indigo-650 dark:text-indigo-400 hover:underline text-xs font-bold mt-2 inline-block">
                      Browse Openings
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Jobs (Quick apply bookmarks) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-zinc-955 dark:text-zinc-50 text-base">Saved Openings</h3>
                <Link to="/jobs" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1">
                  <span>Browse favorites</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sStats.savedJobs && sStats.savedJobs.length > 0 ? (
                  sStats.savedJobs.map((job) => (
                    <div key={job._id} className="p-5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <div className="min-w-0 pr-4">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {job.title}
                        </h4>
                        <p className="text-xs text-zinc-505 mt-0.5">{job.company}</p>
                        
                        <div className="flex items-center space-x-3 mt-2 text-[10px] text-zinc-400 font-semibold">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-0.5" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-0.5" />
                            {job.salary}
                          </span>
                        </div>
                      </div>
                      
                      <Link
                        to="/jobs"
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors shrink-0"
                      >
                        Apply Now
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-zinc-505 dark:text-zinc-400 text-sm">
                    No bookmarked jobs. Click the heart icon on job listings to save them!
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Next Interview Banner */}
            {sStats.nextInterview && (
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] uppercase tracking-wider font-bold">
                    Next Interview
                  </span>
                  <Calendar className="w-5 h-5 text-white/80" />
                </div>
                
                <div>
                  <h4 className="font-black text-base">{sStats.nextInterview.jobId?.title}</h4>
                  <p className="text-xs text-amber-100 mt-0.5">{sStats.nextInterview.jobId?.company}</p>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-white/10 text-xs font-semibold">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-white/85" />
                    <span>{sStats.nextInterview.interviewDate} at {sStats.nextInterview.interviewTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-white/85" />
                    <span>Interviewer: {sStats.nextInterview.interviewer}</span>
                  </div>
                  {sStats.nextInterview.meetingLink && (
                    <a
                      href={sStats.nextInterview.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-amber-800 rounded-lg text-[10px] font-bold mt-2 hover:bg-zinc-50 transition-colors shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meeting Link</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* AI Resume Analyzer Widget */}
            {sStats.resumeScore > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                <h3 className="font-bold text-zinc-950 dark:text-zinc-50 text-base mb-4 flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>AI Resume Score</span>
                </h3>
                
                <div className="flex items-center space-x-6">
                  {/* Circle score gauge */}
                  <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${getScoreColor(sStats.resumeScore)}`}>
                    <span className="text-xl font-black">{sStats.resumeScore}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-85">Rating</span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-805 dark:text-zinc-200">Resume Strength</h4>
                    <p className="text-xs text-zinc-500 leading-normal font-medium">
                      {sStats.resumeScore >= 80
                        ? 'Excellent formatting and vocabulary. Ready to submit!'
                        : sStats.resumeScore >= 60
                        ? 'Good base, but some gaps remain. Review suggestions.'
                        : 'Lacks details. Please upload an expanded profile resume.'}
                    </p>
                  </div>
                </div>

                {/* Suggestions List */}
                {sStats.resumeSuggestions && sStats.resumeSuggestions.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-zinc-150 dark:border-zinc-800/80 space-y-2.5">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Top Improvements</p>
                    <ul className="space-y-2">
                      {sStats.resumeSuggestions.slice(0, 3).map((sug, i) => (
                        <li key={i} className="text-xs text-zinc-650 dark:text-zinc-450 flex items-start space-x-2 leading-relaxed font-semibold">
                          <span className="text-indigo-505 font-bold shrink-0 mt-0.5">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-zinc-955 dark:text-zinc-50 text-base flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Recent Alerts</span>
                </h3>
                <Link to="/notifications" className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline">
                  View all
                </Link>
              </div>
              
              <div className="space-y-4">
                {sStats.recentNotifications && sStats.recentNotifications.length > 0 ? (
                  sStats.recentNotifications.map((notif) => (
                    <div key={notif._id} className="text-xs border-l-2 border-indigo-550 pl-3 py-1 space-y-1">
                      <p className="font-bold text-zinc-855 dark:text-zinc-200">{notif.title}</p>
                      <p className="text-zinc-505 dark:text-zinc-455 leading-normal font-semibold">{notif.message}</p>
                      <span className="text-[9px] text-zinc-400 font-medium block">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-505 dark:text-zinc-400 text-xs py-4 text-center">No recent alerts.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- RECRUITER / HR VIEW ---
  const totalJobsCount = recruiterStats?.totalJobs || 0;
  const activeJobsCount = recruiterStats?.activeJobs || 0;
  const totalCandidatesCount = recruiterStats?.totalCandidates || 0;
  const shortlistedCandidatesCount = recruiterStats?.shortlistedCount || 0;
  const selectedCandidatesCount = recruiterStats?.selectedCount || 0;
  const totalInterviewsCount = recruiterStats?.interviewStats?.totalInterviews || 0;
  const avgAiScore = recruiterStats?.averageAiScore || 0;

  const statCards = [
    { title: 'Total Jobs', value: totalJobsCount, icon: Briefcase, color: 'text-blue-650 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400', desc: 'All job openings' },
    { title: 'Active Jobs', value: activeJobsCount, icon: TrendingUp, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400', desc: 'Positions open for applications' },
    { title: 'Applications', value: totalCandidatesCount, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400', desc: 'Total candidates in pool' },
    { title: 'Interviews', value: totalInterviewsCount, icon: Calendar, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400', desc: 'Scheduled interview slots' },
    { title: 'Shortlisted', value: shortlistedCandidatesCount, icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400', desc: 'Candidates meeting requirements' },
    { title: 'Selected / Hired', value: selectedCandidatesCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400', desc: 'Hired candidate listings' },
  ];

  // Custom visual components for SVG charts
  const renderFunnelChart = () => {
    const statuses = recruiterStats?.candidateStatusDistribution || [];
    const funnelSteps = [
      { key: 'Applied', name: 'Applied', color: '#6366f1' },
      { key: 'Shortlisted', name: 'Shortlisted', color: '#a855f7' },
      { key: 'Interview Scheduled', name: 'Scheduled', color: '#f59e0b' },
      { key: 'Selected', name: 'Selected', color: '#10b981' },
      { key: 'Rejected', name: 'Rejected', color: '#ef4444' }
    ];

    const getCount = (key) => {
      const match = statuses.find(s => s.status === key);
      return match ? match.count : 0;
    };

    const maxVal = Math.max(...funnelSteps.map(s => getCount(s.key)), 1);

    return (
      <div className="space-y-4">
        {funnelSteps.map((step) => {
          const count = getCount(step.key);
          const percent = Math.round((count / maxVal) * 100);
          
          return (
            <div key={step.key} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-700 dark:text-zinc-300">{step.name}</span>
                <span className="text-zinc-900 dark:text-zinc-50 font-bold">{count} candidates</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: step.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTopSkillsChart = () => {
    const skills = recruiterStats?.topSkills || [];
    if (skills.length === 0) {
      return <p className="text-xs text-zinc-550 py-4 text-center">No skills registered yet.</p>;
    }

    const maxCount = Math.max(...skills.map(s => s.count), 1);

    return (
      <div className="space-y-3.5">
        {skills.slice(0, 5).map((sk) => {
          const percent = Math.round((sk.count / maxCount) * 100);
          return (
            <div key={sk.skill} className="flex items-center space-x-3 text-xs">
              <span className="w-24 text-zinc-700 dark:text-zinc-300 font-semibold truncate text-right">
                {sk.skill}
              </span>
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-4 rounded-lg overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full rounded-lg flex items-center pl-2 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                >
                  {percent > 15 && (
                    <span className="text-[9px] text-white font-bold">{sk.count}</span>
                  )}
                </div>
              </div>
              {percent <= 15 && (
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold w-4">
                  {sk.count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-950 dark:text-zinc-50">HR Dashboard</h1>
          <p className="text-zinc-650 dark:text-zinc-450 mt-1 text-sm font-semibold">
            Track hiring metrics, shortlists, scheduled interviews, and candidate evaluations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/jobs"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Manage Jobs
          </Link>
        </div>
      </div>

      {/* Grid Stats (6 Cards for Recruiter Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.color} shrink-0`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-none">{card.value}</h3>
              <p className="text-[9px] text-zinc-450 dark:text-zinc-505 font-medium mt-1 leading-normal">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left chart: Funnel progression */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 text-base flex items-center space-x-1.5">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Hiring Pipeline Distribution</span>
            </h3>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
              Funnel
            </span>
          </div>
          {renderFunnelChart()}
        </div>

        {/* Right chart: Top Candidate Skills bar chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 text-base flex items-center space-x-1.5">
              <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Skill Word Cloud Analysis</span>
            </h3>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
              Volume
            </span>
          </div>
          {renderTopSkillsChart()}
        </div>

      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Latest Candidates (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-950 dark:text-zinc-50 text-base">Recent Applicants</h3>
              <Link to="/candidates" className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center space-x-1">
                <span>Go to pool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentCandidates.length > 0 ? (
                recentCandidates.map((candidate) => (
                  <div key={candidate._id} className="p-6 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-650 dark:text-zinc-300 font-bold text-sm shrink-0 uppercase">
                        {candidate.name[0]}
                      </div>
                      <div className="min-w-0">
                        <Link to={`/candidates`} className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors block">
                          {candidate.name}
                        </Link>
                        <div className="flex items-center space-x-2.5 mt-1 text-xs text-zinc-550 dark:text-zinc-400">
                          <span className="truncate">{candidate.email}</span>
                          <span>•</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-350">{candidate.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      {candidate.aiScore > 0 && (
                        <div className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-705 dark:text-emerald-450 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-450" />
                          <span>{candidate.aiScore}%</span>
                        </div>
                      )}
                      <span className="text-[11px] text-zinc-405 dark:text-zinc-500">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  No candidates registered yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Jobs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recent Jobs widget */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-950 dark:text-zinc-50 text-base">Recent Jobs</h3>
              <Link to="/jobs" className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center space-x-1">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job._id} className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{job.title}</h4>
                        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">{job.company} • {job.location}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        job.status === 'Open'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-zinc-550 dark:text-zinc-400 text-sm">
                  No job positions created yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
