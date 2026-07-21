import React, { useEffect, useState } from 'react';
import { getSeekerInterviews, getRecruiterInterviews, scheduleInterview, evaluateInterview } from '../services/interviewApi';
import { getCandidates } from '../services/candidateApi';
import { useForm } from 'react-hook-form';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Video,
  User,
  FileText,
  Plus,
  Star,
  Activity,
  CheckCircle,
  HelpCircle,
  Building,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Interviews = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recruiter state: list of candidates to schedule
  const [candidates, setCandidates] = useState([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const {
    register: regSchedule,
    handleSubmit: handleScheduleSubmit,
    reset: resetSchedule,
    formState: { errors: errorsSchedule }
  } = useForm();

  const {
    register: regEval,
    handleSubmit: handleEvalSubmit,
    reset: resetEval,
    formState: { errors: errorsEval }
  } = useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'Job Seeker') {
        const res = await getSeekerInterviews();
        if (res.success) {
          setInterviews(res.data);
        }
      } else {
        const [intRes, candRes] = await Promise.all([
          getRecruiterInterviews(),
          getCandidates() // Fetch candidates to schedule
        ]);
        
        if (intRes.success) {
          setInterviews(intRes.data);
        }
        
        if (candRes.success) {
          // Filter candidate applications that are Shortlisted or Interviewing
          const filterCands = candRes.data.filter(c => c.status === 'Shortlisted' || c.status === 'Interview Scheduled');
          setCandidates(filterCands);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load interviews data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onScheduleSubmit = async (data) => {
    try {
      // Find candidate to get jobId
      const cand = candidates.find(c => c._id === data.candidateId);
      if (!cand) {
        toast.error('Selected candidate not found');
        return;
      }

      const payload = {
        candidateId: data.candidateId,
        jobId: cand.jobId?._id || cand.jobId,
        interviewDate: data.interviewDate,
        interviewTime: data.interviewTime,
        interviewType: data.interviewType,
        meetingLink: data.meetingLink,
        interviewer: data.interviewer,
        notes: data.notes
      };

      const res = await scheduleInterview(payload);
      if (res.success) {
        toast.success('Interview scheduled successfully!');
        setScheduleModalOpen(false);
        resetSchedule();
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule interview');
    }
  };

  const onEvalSubmit = async (data) => {
    if (!selectedInterview) return;
    try {
      const payload = {
        technicalKnowledge: parseInt(data.technicalKnowledge, 10),
        communicationSkills: parseInt(data.communicationSkills, 10),
        problemSolving: parseInt(data.problemSolving, 10),
        confidence: parseInt(data.confidence, 10),
        overallRating: parseInt(data.overallRating, 10),
        finalRecommendation: data.finalRecommendation,
        feedback: data.feedback
      };

      const res = await evaluateInterview(selectedInterview._id, payload);
      if (res.success) {
        toast.success('Evaluation submitted successfully!');
        setEvalModalOpen(false);
        resetEval();
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit evaluation');
    }
  };

  const openScheduleModal = () => {
    resetSchedule({
      candidateId: '',
      interviewDate: '',
      interviewTime: '',
      interviewType: 'Technical',
      meetingLink: '',
      interviewer: '',
      notes: ''
    });
    setScheduleModalOpen(true);
  };

  const openEvalModal = (interview) => {
    setSelectedInterview(interview);
    resetEval({
      technicalKnowledge: 3,
      communicationSkills: 3,
      problemSolving: 3,
      confidence: 3,
      overallRating: 3,
      finalRecommendation: 'Hire',
      feedback: ''
    });
    setEvalModalOpen(true);
  };

  if (loading && interviews.length === 0) return <LoadingSpinner size="lg" />;

  const renderStars = (rating) => {
    return (
      <div className="flex space-x-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50">Interviews Directory</h1>
          <p className="text-zinc-555 dark:text-zinc-400 mt-1 text-sm font-semibold">
            {user?.role === 'Job Seeker'
              ? 'View scheduled dates, interviewer coordinates, and finalized evaluation reports.'
              : 'Schedule interview rounds, assign recruiters, and submit candidate scorecards.'}
          </p>
        </div>
        {user?.role === 'Recruiter' && candidates.length > 0 && (
          <button
            onClick={openScheduleModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Interview</span>
          </button>
        )}
      </div>

      {/* Interviews List */}
      {interviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviews.map((item) => {
            const isCompleted = item.status === 'Completed';
            const candidateName = item.candidateId?.name || 'Candidate';
            
            return (
              <div
                key={item._id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-500 transition-all"
              >
                <div>
                  {/* Status Badge */}
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                      {item.interviewType}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 mt-3">
                    {item.jobId?.title || 'Job Position'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 font-semibold mb-3">
                    {user?.role === 'Job Seeker' ? item.jobId?.company : `Candidate: ${candidateName}`}
                  </p>

                  {/* Scheduling Info */}
                  <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-850/80 text-xs font-semibold text-zinc-600 dark:text-zinc-450">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span>{item.interviewDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span>{item.interviewTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>Interviewer: {item.interviewer || 'Not assigned'}</span>
                    </div>
                    {item.meetingLink && (
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-zinc-400" />
                        <a
                          href={item.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Join Meeting Coordinates
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Evaluation Report (Seeker & Recruiter completed view) */}
                  {isCompleted && item.evaluation && (
                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center space-x-1">
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Evaluation Report Card</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-zinc-650">
                        <div className="flex items-center justify-between">
                          <span>Technical:</span>
                          {renderStars(item.evaluation.technicalKnowledge)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Communication:</span>
                          {renderStars(item.evaluation.communicationSkills)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Problem Solving:</span>
                          {renderStars(item.evaluation.problemSolving)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Confidence:</span>
                          {renderStars(item.evaluation.confidence)}
                        </div>
                      </div>

                      {item.feedback && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850 text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed font-medium whitespace-pre-line">
                          {item.feedback}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="font-bold text-zinc-500">Verdict:</span>
                        <span className={`font-black uppercase tracking-wider ${
                          item.evaluation.finalRecommendation === 'Hire'
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}>
                          {item.evaluation.finalRecommendation}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recruiter Evaluation trigger */}
                  {!isCompleted && user?.role === 'Recruiter' && (
                    <button
                      onClick={() => openEvalModal(item)}
                      className="w-full mt-4 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center block border border-indigo-100/50"
                    >
                      Complete Evaluation Scorecard
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-750 mx-auto mb-4" />
          <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">No Interviews Scheduled</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            {user?.role === 'Job Seeker'
              ? 'You have no scheduled interview rounds yet.'
              : 'No scheduled candidate slots. Make sure to shortlist candidates first.'}
          </p>
        </div>
      )}

      {/* SCHEDULER MODAL (RECRUITER ONLY) */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Interview Round"
      >
        <form onSubmit={handleScheduleSubmit(onScheduleSubmit)} className="space-y-4">
          {/* Candidate selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Select Shortlisted Candidate *</label>
            <select
              {...registerSchedule('candidateId', { required: 'Candidate is required' })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            >
              <option value="">-- Choose Candidate --</option>
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Applied for "{c.jobId?.title || 'Job Position'}"
                </option>
              ))}
            </select>
            {errorsSchedule.candidateId && <p className="text-xs text-red-500 font-medium">{errorsSchedule.candidateId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Interview Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Date *</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                {...registerSchedule('interviewDate', { required: 'Date is required' })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errorsSchedule.interviewDate && <p className="text-xs text-red-500 font-medium">{errorsSchedule.interviewDate.message}</p>}
            </div>

            {/* Interview Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Time *</label>
              <input
                type="text"
                placeholder="10:00 AM"
                {...registerSchedule('interviewTime', { required: 'Time is required' })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errorsSchedule.interviewTime && <p className="text-xs text-red-500 font-medium">{errorsSchedule.interviewTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Interview Type</label>
              <select
                {...registerSchedule('interviewType')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Scenario-Based">Scenario-Based</option>
                <option value="Coding">Coding</option>
                <option value="HR/Onboarding">HR/Onboarding</option>
              </select>
            </div>

            {/* Interviewer */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Interviewer Name *</label>
              <input
                type="text"
                placeholder="Jane Smith (VP of Eng)"
                {...registerSchedule('interviewer', { required: 'Interviewer name is required' })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errorsSchedule.interviewer && <p className="text-xs text-red-500 font-medium">{errorsSchedule.interviewer.message}</p>}
            </div>
          </div>

          {/* Link */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Meeting Link *</label>
            <input
              type="text"
              placeholder="https://meet.google.com/abc-defg-hij"
              {...registerSchedule('meetingLink', { required: 'Meeting link is required' })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            />
            {errorsSchedule.meetingLink && <p className="text-xs text-red-500 font-medium">{errorsSchedule.meetingLink.message}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Scheduling Notes</label>
            <textarea
              rows="3"
              placeholder="Provide preparatory guidelines or notes for candidate..."
              {...registerSchedule('notes')}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold"
            >
              Confirm Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* EVALUATION MODAL (RECRUITER ONLY) */}
      <Modal
        isOpen={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        title={selectedInterview ? `Scorecard: ${selectedInterview.candidateId?.name} - ${selectedInterview.jobId?.title}` : ''}
      >
        <form onSubmit={handleEvalSubmit(onEvalSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Technical */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Technical Knowledge (1-5)</label>
              <select
                {...registerEval('technicalKnowledge')}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            {/* Communication */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Communication Skills (1-5)</label>
              <select
                {...registerEval('communicationSkills')}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Problem Solving */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Problem Solving (1-5)</label>
              <select
                {...registerEval('problemSolving')}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            {/* Confidence */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confidence (1-5)</label>
              <select
                {...registerEval('confidence')}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Overall */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Overall Rating (1-5)</label>
              <select
                {...registerEval('overallRating')}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            {/* Recommendation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Final Recommendation</label>
              <select
                {...registerEval('finalRecommendation')}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-semibold"
              >
                <option value="Hire">Hire / Offer Position</option>
                <option value="Reject">Reject Candidate</option>
                <option value="Review">Keep Under Review</option>
              </select>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Feedback / Evaluation Notes</label>
            <textarea
              rows="4"
              placeholder="Describe interview responses, architectural gaps, or behavioral indicators..."
              {...registerEval('feedback')}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
            <button
              type="button"
              onClick={() => setEvalModalOpen(false)}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold"
            >
              Submit Scorecard
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Interviews;
