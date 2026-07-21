import React, { useEffect, useState } from 'react';
import { getCandidates } from '../services/candidateApi';
import { getJobs } from '../services/jobApi';
import { generateInterviewQuestions } from '../services/aiApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Video, User, Briefcase, Copy, RefreshCw, Printer, CheckSquare, Layers, HelpCircle, ArrowRight } from 'lucide-react';

const InterviewGenerator = () => {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  // Selected IDs
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  // Generator inputs
  const [difficulty, setDifficulty] = useState('Medium');
  const [type, setType] = useState('Mixed');

  // Interview results state
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState(null);
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('Technical'); // Technical, Behavioral, Advanced

  // Load lists on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [candidatesRes, jobsRes] = await Promise.all([
          getCandidates(),
          getJobs()
        ]);
        if (candidatesRes.success) {
          setCandidates(candidatesRes.data);
          if (candidatesRes.data.length > 0) {
            setSelectedCandidateId(candidatesRes.data[0]._id);
            // Pre-fill jobId from candidate
            setSelectedJobId(candidatesRes.data[0].jobId?._id || candidatesRes.data[0].jobId || '');
          }
        }
        if (jobsRes.success) {
          setJobs(jobsRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  // Update selected job automatically when candidate selection changes
  const handleCandidateChange = (candId) => {
    setSelectedCandidateId(candId);
    const cand = candidates.find(c => c._id === candId);
    if (cand) {
      setSelectedJobId(cand.jobId?._id || cand.jobId || '');
    }
  };

  // Generate Questions handler
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCandidateId || !selectedJobId) {
      toast.error('Please select both a candidate and job position.');
      return;
    }

    try {
      setLoading(true);
      setInterview(null);
      const res = await generateInterviewQuestions(selectedCandidateId, selectedJobId);
      if (res.success) {
        toast.success('Interview questions generated successfully!');
        setInterview(res.data);
        // Default to technical tab if questions exist
        if (res.data.questions?.length > 0) {
          const firstCat = res.data.questions[0].category;
          setActiveTab(firstCat || 'Technical');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'AI generation of interview questions failed.');
    } finally {
      setLoading(false);
    }
  };

  // Copy individual question
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Question copied to clipboard!');
  };

  // Printable layout download / print view
  const handlePrint = () => {
    window.print();
  };

  // Group questions by category
  const getCategorizedQuestions = () => {
    if (!interview || !interview.questions) return [];
    return interview.questions.filter(q => q.category === activeTab);
  };

  const categories = ['Technical', 'Behavioral', 'Advanced'];
  const categorizedList = getCategorizedQuestions();
  const currentCandidate = candidates.find(c => c._id === selectedCandidateId);
  const currentJob = jobs.find(j => j._id === selectedJobId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">AI Interview Generator</h1>
        <p className="text-zinc-650 dark:text-zinc-400 mt-1 text-sm font-medium">
          Generate custom coding, technical, and situational behavioral questions using Gemini, specifically tailored to the applicant's experience level.
        </p>
      </div>

      {/* Select widget */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs print:hidden">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          
          {/* Candidate Select */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-zinc-450" />
              <span>Select Candidate</span>
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => handleCandidateChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-hidden"
            >
              {candidates.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Select */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4 text-zinc-450" />
              <span>Mapped Job Opening</span>
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-hidden"
            >
              {jobs.map(j => (
                <option key={j._id} value={j._id}>
                  {j.title} at {j.company}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty setting (visual placeholder helper metadata) */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-zinc-455" />
              <span>Difficulty Level</span>
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-hidden"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Submit */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading || !selectedCandidateId || !selectedJobId}
              className="w-full py-2.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Generate Set
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center space-y-4 print:hidden">
          <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-650 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-zinc-650 dark:text-zinc-350">
            AI is analyzing job requirements and candidate skills to construct customized questions...
          </p>
        </div>
      )}

      {/* PRINT-ONLY HEADER */}
      {interview && (
        <div className="hidden print:block space-y-4 border-b border-zinc-300 pb-5">
          <h1 className="text-2xl font-bold">Interview Assessment Questionnaire</h1>
          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div>
              <p><span className="font-bold">Candidate:</span> {currentCandidate?.name}</p>
              <p><span className="font-bold">Email:</span> {currentCandidate?.email}</p>
            </div>
            <div>
              <p><span className="font-bold">Target Job Position:</span> {currentJob?.title}</p>
              <p><span className="font-bold">Company:</span> {currentJob?.company}</p>
            </div>
          </div>
        </div>
      )}

      {/* Interview Results */}
      {interview && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none animate-in fade-in zoom-in-98 duration-350">
          
          {/* Header Actions bar */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center print:hidden">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-550 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {interview.questions?.length || 0} customized questions generated
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Questionnaire / Save PDF</span>
              </button>
              
              <button
                onClick={handleGenerate}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Questions</span>
              </button>
            </div>
          </div>

          {/* Interactive tabs */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 flex print:hidden">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
                  activeTab === cat
                    ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400 dark:border-indigo-500'
                    : 'border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300'
                }`}
              >
                {cat} Questions
              </button>
            ))}
          </div>

          {/* Print-only lists (all questions consecutively) */}
          <div className="hidden print:block p-6 space-y-8">
            {categories.map(cat => {
              const qs = interview.questions.filter(q => q.category === cat);
              if (qs.length === 0) return null;
              return (
                <div key={cat} className="space-y-4">
                  <h3 className="text-base font-bold uppercase tracking-wider border-b pb-1 text-zinc-700">{cat} Questions</h3>
                  <div className="space-y-6">
                    {qs.map((q, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="font-semibold text-sm">{idx + 1}. {q.question}</p>
                        {q.tests && <p className="text-xs text-zinc-500 pl-4"><span className="font-bold">Evaluation/Test:</span> {q.tests}</p>}
                        {q.expectedKeyPoints?.length > 0 && (
                          <div className="pl-4 text-xs text-zinc-500">
                            <span className="font-bold">Key evaluation checklist:</span>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                              {q.expectedKeyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Web interactive active tab questions (only shown on screen) */}
          <div className="p-6 space-y-6 print:hidden">
            {categorizedList.length > 0 ? (
              categorizedList.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-xl p-5 relative group"
                >
                  {/* Copy button hover widget */}
                  <button
                    onClick={() => copyToClipboard(q.question)}
                    className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Copy Question"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-start space-x-3.5 pr-8">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    
                    <div className="space-y-4 flex-1">
                      {/* Question content */}
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">
                        {q.question}
                      </p>

                      {/* Criteria tests */}
                      {q.tests && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-450 border-t border-zinc-200 dark:border-zinc-850 pt-3">
                          <span className="font-bold block mb-1">Evaluation / Test Criteria:</span>
                          <p className="leading-relaxed italic">{q.tests}</p>
                        </div>
                      )}

                      {/* Expected Checklist points */}
                      {q.expectedKeyPoints && q.expectedKeyPoints.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                            Expected Answer Keypoints Checklist
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.expectedKeyPoints.map((pt, i) => (
                              <div key={i} className="flex items-center space-x-2 text-xs text-zinc-650 dark:text-zinc-400">
                                <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
                No questions found in this category. Click 'Regenerate Questions' to trigger generator.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty / Generate pending State */}
      {!interview && !loading && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center shadow-xs print:hidden">
          <Video className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">Generate AI Assessments</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            Select a candidate profile and their corresponding job opening to generate customized technical and behavioral interview questionnaires.
          </p>
        </div>
      )}
    </div>
  );
};

export default InterviewGenerator;
