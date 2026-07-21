import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, createJob, updateJob, deleteJob } from '../services/jobApi';
import { getCandidates } from '../services/candidateApi';
import { useForm } from 'react-hook-form';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, DollarSign, Calendar, Search, Filter, Plus, Edit, Trash2, Users, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import JobSearch from './JobSearch';

const Jobs = () => {
  const { user } = useAuth();

  if (user?.role === 'Job Seeker') {
    return <JobSearch />;
  }
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobCandidates, setSelectedJobCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm();

  // Load jobs list
  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await getJobs();
      if (res.success) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch jobs. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Fetch candidates mapped to a specific job
  const fetchJobCandidates = async (jobId) => {
    try {
      setLoadingCandidates(true);
      const res = await getCandidates({ jobId });
      if (res.success) {
        setSelectedJobCandidates(res.data);
      }
    } catch (err) {
      console.error('Failed to load candidate list:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Filter jobs locally
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesLoc = locFilter ? job.location.toLowerCase() === locFilter.toLowerCase() : true;
    const matchesType = typeFilter ? job.employmentType.toLowerCase() === typeFilter.toLowerCase() : true;
    return matchesSearch && matchesLoc && matchesType;
  });

  // Handle Form Open
  const handleOpenCreateForm = () => {
    setEditingJob(null);
    reset({
      title: '',
      company: '',
      description: '',
      requiredSkills: '',
      experience: 0,
      salary: '',
      employmentType: 'Full-time',
      location: 'Remote',
      status: 'Open',
      deadline: ''
    });
    setFormModalOpen(true);
  };

  const handleOpenEditForm = (job) => {
    setEditingJob(job);
    reset({
      title: job.title,
      company: job.company,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      experience: job.experience,
      salary: job.salary,
      employmentType: job.employmentType,
      location: job.location,
      status: job.status,
      deadline: job.deadline || ''
    });
    setFormModalOpen(true);
  };

  // Submit Job Form
  const onFormSubmit = async (data) => {
    // Convert requiredSkills comma string to array
    const formattedSkills = data.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      ...data,
      requiredSkills: formattedSkills,
      experience: parseInt(data.experience, 10)
    };

    try {
      if (editingJob) {
        // Update
        const res = await updateJob(editingJob._id, payload);
        if (res.success) {
          toast.success('Job updated successfully!');
          setFormModalOpen(false);
          loadJobs();
          // Update details view if open
          if (selectedJob && selectedJob._id === editingJob._id) {
            setSelectedJob(res.data);
          }
        }
      } else {
        // Create
        const res = await createJob(payload);
        if (res.success) {
          toast.success('Job position created successfully!');
          setFormModalOpen(false);
          loadJobs();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save job form.');
    }
  };

  // Open delete confirm
  const handleOpenDelete = (job, e) => {
    e.stopPropagation();
    setJobToDelete(job);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      const res = await deleteJob(jobToDelete._id);
      if (res.success) {
        toast.success(res.message || 'Job deleted successfully.');
        setDeleteConfirmOpen(false);
        setJobToDelete(null);
        // If the deleted job was selected, close details
        if (selectedJob && selectedJob._id === jobToDelete._id) {
          setDetailsModalOpen(false);
          setSelectedJob(null);
        }
        loadJobs();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to delete job.');
    }
  };

  // Select job to view details
  const handleSelectJob = (job) => {
    setSelectedJob(job);
    fetchJobCandidates(job._id);
    setDetailsModalOpen(true);
  };

  if (loading && jobs.length === 0) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-zinc-50">Job Directory</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-sm font-medium">
            Create, update, and manage job descriptions and view applicant counts.
          </p>
        </div>
        {user?.role === 'Admin' || user?.role === 'Recruiter' ? (
          <button
            onClick={handleOpenCreateForm}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, company, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Location type filter */}
        <div className="w-full md:w-44">
          <select
            value={locFilter}
            onChange={(e) => setLocFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>

        {/* Employment Type Filter */}
        <div className="w-full md:w-44">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Job Grid / List */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              onClick={() => handleSelectJob(job)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                    job.status === 'Open'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {job.status}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEditForm(job); }}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleOpenDelete(job, e)}
                      className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 mt-3 hover:text-indigo-600 transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{job.company}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className="flex items-center text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-md">
                    <MapPin className="w-3 h-3 mr-1" />
                    {job.location}
                  </span>
                  <span className="flex items-center text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-md">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {job.employmentType}
                  </span>
                  <span className="flex items-center text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-md">
                    <DollarSign className="w-3 h-3 mr-0.5" />
                    {job.salary}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {job.experience > 0 ? `${job.experience}+ years exp` : 'Entry level'}
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center shadow-xs">
          <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">No Jobs Found</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            No job positions match your criteria. Create a new job or modify your filters.
          </p>
        </div>
      )}

      {/* FORM MODAL (CREATE / EDIT) */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingJob ? 'Edit Job Position' : 'Create New Job Position'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Senior React Developer"
                {...register('title', { required: 'Job title is required' })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
            </div>

            {/* Company */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                {...register('company', { required: 'Company is required' })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errors.company && <p className="text-xs text-red-500 font-medium">{errors.company.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Location Type *</label>
              <select
                {...register('location', { required: true })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            {/* Employment Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Employment Type *</label>
              <select
                {...register('employmentType', { required: true })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            {/* Salary */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Salary *</label>
              <input
                type="text"
                placeholder="e.g. $120,000 - $140,000"
                {...register('salary', { required: 'Salary description is required' })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errors.salary && <p className="text-xs text-red-500 font-medium">{errors.salary.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Experience */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Required Experience (Years) *</label>
              <input
                type="number"
                min="0"
                {...register('experience', { required: 'Required experience is required', min: 0 })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errors.experience && <p className="text-xs text-red-500 font-medium">{errors.experience.message}</p>}
            </div>

            {/* Deadline */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Application Deadline</label>
              <input
                type="text"
                placeholder="e.g. 2026-08-31"
                {...register('deadline')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Job Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              >
                <option value="Open">Open</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Required Skills * (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. React, JavaScript, Node.js, Tailwind CSS"
              {...register('requiredSkills', { required: 'At least one skill is required' })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            />
            {errors.requiredSkills && <p className="text-xs text-red-500 font-medium">{errors.requiredSkills.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Description *</label>
            <textarea
              rows="5"
              placeholder="Describe the job requirements, responsibilities, and benefits..."
              {...register('description', { required: 'Job description is required' })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            />
            {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Save Job
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAILS VIEW MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedJob ? `${selectedJob.title} - ${selectedJob.company}` : ''}
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2.5">
              <span className="flex items-center text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {selectedJob.location}
              </span>
              <span className="flex items-center text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md">
                <Briefcase className="w-3.5 h-3.5 mr-1" />
                {selectedJob.employmentType}
              </span>
              <span className="flex items-center text-xs text-zinc-650 dark:text-zinc-450 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md font-medium">
                <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                {selectedJob.salary}
              </span>
              <span className="flex items-center text-xs text-zinc-650 dark:text-zinc-450 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md font-medium">
                {selectedJob.experience > 0 ? `${selectedJob.experience}+ years experience` : 'Entry level'}
              </span>
              {selectedJob.deadline && (
                <span className="flex items-center text-xs text-zinc-650 dark:text-zinc-450 bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-md font-medium">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-450" />
                  <span>Deadline: {selectedJob.deadline}</span>
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                selectedJob.status === 'Open'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}>
                {selectedJob.status}
              </span>
            </div>

            {/* Required Skills tags */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedJob.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Job Description</h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                {selectedJob.description}
              </p>
            </div>

            {/* Candidates applied to this job */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Applicants ({selectedJobCandidates.length})</span>
              </h4>
              {loadingCandidates ? (
                <div className="py-6 flex justify-center">
                  <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : selectedJobCandidates.length > 0 ? (
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                  {selectedJobCandidates.map((candidate) => (
                    <div key={candidate._id} className="p-3 flex items-center justify-between bg-zinc-50/20 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{candidate.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{candidate.email}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md font-medium">
                          {candidate.status}
                        </span>
                        {candidate.aiScore > 0 && (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                            {candidate.aiScore}% Match
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3 bg-zinc-50 dark:bg-zinc-950 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
                  No applicants registered for this job. You can upload and map resumes on the <Link to="/upload" className="text-indigo-600 dark:text-indigo-400 underline">Upload page</Link>.
                </p>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end space-x-3 pt-5 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={(e) => { setDetailsModalOpen(false); handleOpenEditForm(selectedJob); }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Job</span>
              </button>
              <button
                onClick={(e) => { handleOpenDelete(selectedJob, e); }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 hover:text-red-700 border border-transparent text-red-600 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Job</span>
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
        title="Delete Job Position"
        message={`Are you sure you want to delete the job position "${jobToDelete?.title}" at "${jobToDelete?.company}"? All applicant mapping counts will be affected.`}
        confirmText="Delete Job"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Jobs;
