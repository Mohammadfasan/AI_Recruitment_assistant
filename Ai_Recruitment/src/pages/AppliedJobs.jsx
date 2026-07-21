import React, { useEffect, useState } from 'react';
import { getMyApplications } from '../services/candidateApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  FileText,
  Briefcase,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  Eye,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import Modal from '../components/common/Modal';

const AppliedJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected application modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await getMyApplications();
      if (res.success) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setModalOpen(true);
  };

  if (loading && applications.length === 0) return <LoadingSpinner size="lg" />;

  // Status mapping
  const statusSteps = [
    'Applied',
    'Under Review',
    'Shortlisted',
    'Interview Scheduled',
    'Interview Completed',
    'Selected' // or Rejected
  ];

  const getStatusStepIndex = (status) => {
    if (status === 'Rejected') return 5; // maps to final index
    return statusSteps.indexOf(status);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-50/20';
    if (score >= 60) return 'text-amber-500 border-amber-500 bg-amber-50/20';
    return 'text-red-500 border-red-500 bg-red-50/20';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50">Applications Tracker</h1>
        <p className="text-zinc-550 dark:text-zinc-400 mt-1 text-sm font-semibold">
          Track the status progression of your job applications and review AI fit feedback.
        </p>
      </div>

      {applications.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => {
            const stepIndex = getStatusStepIndex(app.status);
            const isRejected = app.status === 'Rejected';
            const isSelected = app.status === 'Selected';

            return (
              <div
                key={app._id}
                onClick={() => handleOpenDetails(app)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 hover:text-indigo-650 transition-colors">
                      {app.jobId?.title || 'Job Position'}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : isRejected
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 font-semibold">
                    {app.jobId?.company || 'Company'} • Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Progress bar timeline indicators */}
                <div className="hidden lg:flex items-center space-x-2 w-96">
                  {statusSteps.map((step, idx) => {
                    const isDone = idx <= stepIndex;
                    const isCurrent = idx === stepIndex;
                    return (
                      <React.Fragment key={idx}>
                        <div
                          title={step}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? isRejected
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-indigo-600 text-white animate-pulse'
                              : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        />
                        {idx < statusSteps.length - 1 && (
                          <div className={`h-0.5 flex-1 ${idx < stepIndex ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t border-zinc-100 md:border-t-0 dark:border-zinc-800">
                  {app.aiScore > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
                      <span>{app.aiScore}% Match</span>
                    </div>
                  )}
                  
                  <button className="p-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold text-xs flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View Timeline</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">No Applications Yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            You haven't submitted any job applications. Visit the Job Directory to find positions and apply!
          </p>
        </div>
      )}

      {/* DETAILED TRACKING TIMELINE MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedApp ? `Application: ${selectedApp.jobId?.title} at ${selectedApp.jobId?.company}` : ''}
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            
            {/* Status Timeline layout */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-850 rounded-2xl">
              <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-5">Application Pipeline</h4>
              
              <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-6">
                {statusSteps.map((step, idx) => {
                  const stepIndex = getStatusStepIndex(selectedApp.status);
                  const isDone = idx <= stepIndex;
                  const isCurrent = idx === stepIndex;
                  const isRejected = selectedApp.status === 'Rejected' && idx === 5;
                  
                  // Handle conditional names for final step
                  let stepName = step;
                  if (idx === 5) {
                    stepName = selectedApp.status === 'Rejected' ? 'Application Closed' : selectedApp.status === 'Selected' ? 'Selected / Offer Extended' : 'Decision Pending';
                  }

                  return (
                    <div key={idx} className="relative">
                      {/* Node Icon */}
                      <span className={`absolute -left-9 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white dark:bg-zinc-900 text-[10px] font-bold ${
                        isCurrent
                          ? isRejected
                            ? 'border-red-500 text-red-500 shadow-sm animate-pulse'
                            : 'border-indigo-600 text-indigo-600 shadow-sm animate-pulse'
                          : isDone
                          ? 'border-emerald-500 text-emerald-500'
                          : 'border-zinc-300 text-zinc-400'
                      }`}>
                        {isDone && !isCurrent ? '✓' : idx + 1}
                      </span>
                      
                      <div className="space-y-0.5">
                        <p className={`text-sm font-bold ${
                          isCurrent
                            ? isRejected
                              ? 'text-red-650'
                              : 'text-indigo-650'
                            : isDone
                            ? 'text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-450 dark:text-zinc-500'
                        }`}>
                          {stepName}
                        </p>
                        <p className="text-xs text-zinc-450 dark:text-zinc-500 leading-normal">
                          {idx === 0 && 'We have received your application and resume details.'}
                          {idx === 1 && isDone && 'Our HR recruiter is currently reviewing your resume score and match analysis.'}
                          {idx === 2 && isDone && 'Great news! Your profile meets job requirements and has been shortlisted.'}
                          {idx === 3 && isCurrent && 'Interview has been scheduled! Check the Interviews tab for coordinates.'}
                          {idx === 3 && isDone && !isCurrent && 'You completed the scheduled interview rounds.'}
                          {idx === 4 && isDone && 'HR has finalized evaluations for your interview answers.'}
                          {idx === 5 && selectedApp.status === 'Selected' && 'Congratulations! You have been selected. HR will contact you shortly with the onboarding details.'}
                          {idx === 5 && selectedApp.status === 'Rejected' && 'Thank you for your time. Unfortunately, the position has been filled.'}
                          {idx === 5 && selectedApp.status !== 'Selected' && selectedApp.status !== 'Rejected' && 'A final decision is pending HR review.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Match feedback columns */}
            {selectedApp.aiScore > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">AI Fit Analysis Details</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {selectedApp.compareSkills && (
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider block">Skills Fit Comparison</span>
                      <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-3 border border-zinc-150 rounded-xl leading-relaxed">{selectedApp.compareSkills}</p>
                    </div>
                  )}
                  {selectedApp.compareExperience && (
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider block">Experience Fit Comparison</span>
                      <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-3 border border-zinc-150 rounded-xl leading-relaxed">{selectedApp.compareExperience}</p>
                    </div>
                  )}
                  {selectedApp.compareEducation && (
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider block">Education Fit Comparison</span>
                      <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-3 border border-zinc-150 rounded-xl leading-relaxed">{selectedApp.compareEducation}</p>
                    </div>
                  )}
                  {selectedApp.compareCertifications && (
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider block">Certifications Fit Comparison</span>
                      <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-3 border border-zinc-150 rounded-xl leading-relaxed">{selectedApp.compareCertifications}</p>
                    </div>
                  )}
                </div>

                {/* Match Reasoning summary */}
                {selectedApp.matchExplanation && (
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-150 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Match Explanation Summary</span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">{selectedApp.matchExplanation}</p>
                  </div>
                )}
                
                {/* Recommendation summary */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">AI Screening Verdict:</span>
                  <span className="font-black bg-indigo-100 dark:bg-indigo-900 px-2.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                    {selectedApp.recommendation}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-300 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Close Tracking Panel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AppliedJobs;
