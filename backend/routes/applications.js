const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

// Apply for a job (job seeker only)
router.post('/:jobId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ error: 'Only job seekers can apply for jobs' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user.jobSeekerProfile?.resumeUrl) {
      return res.status(400).json({ error: 'Please upload a resume before applying' });
    }

    const existingApplication = await Application.findOne({
      jobSeeker: req.user.id,
      job: req.params.jobId
    });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = new Application({
      jobSeeker: req.user.id,
      job: req.params.jobId,
      resumeUrl: user.jobSeekerProfile.resumeUrl,
      coverLetter: req.body.coverLetter
    });

    await application.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get applications for a job (employer only)
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can view applications' });
    }

    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user.id });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('jobSeeker', 'fullName email jobSeekerProfile');
    res.json(applications);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get a job seeker's applications
router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ error: 'Only job seekers can view their applications' });
    }

    const applications = await Application.find({ jobSeeker: req.user.id })
      .populate('job', 'title company.name');
    res.json(applications);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;