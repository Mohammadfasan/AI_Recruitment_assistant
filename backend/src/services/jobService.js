import Job from '../models/Job.js';

export const createJob = async (jobData, createdById) => {
  const job = await Job.create({
    ...jobData,
    createdBy: createdById
  });
  return job;
};

export const getJobs = async (query = {}) => {
  const filters = {};
  if (query.status) {
    filters.status = query.status;
  }
  
  if (query.location) {
    filters.location = { $regex: query.location, $options: 'i' };
  }
  
  if (query.employmentType) {
    filters.employmentType = query.employmentType;
  }

  if (query.experience !== undefined && query.experience !== '') {
    filters.experience = { $lte: Number(query.experience) };
  }

  if (query.salary) {
    filters.salary = { $regex: query.salary, $options: 'i' };
  }

  if (query.search) {
    filters.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { company: { $regex: query.search, $options: 'i' } },
      { location: { $regex: query.search, $options: 'i' } },
      { requiredSkills: { $in: [new RegExp(query.search, 'i')] } }
    ];
  }
  
  return await Job.find(filters).populate('createdBy', 'name email');
};

export const getJobById = async (id) => {
  const job = await Job.findById(id).populate('createdBy', 'name email');
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }
  return job;
};

export const updateJob = async (id, jobData) => {
  const job = await Job.findById(id);
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }

  return await Job.findByIdAndUpdate(id, jobData, {
    new: true,
    runValidators: true
  });
};

export const deleteJob = async (id) => {
  const job = await Job.findById(id);
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }

  await Job.findByIdAndDelete(id);
  return { message: 'Job deleted successfully' };
};
