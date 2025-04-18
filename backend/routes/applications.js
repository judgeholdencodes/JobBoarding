const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

// Apply for a job (job seeker only)
router.post('/:jobId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not defined' });
    }
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ error: 'Only job seekers can apply' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const existingApplication = await Application.findOne({
      jobSeeker: req.user._id,
      job: req.params.jobId
    });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = new Application({
      jobSeeker: req.user._id,
      job: req.params.jobId,
      coverLetter: req.body.coverLetter
    });

    await application.save();
    res.status(201).json(application);
  } catch (err) {
    console.error('Application error:', err.message); // Log errors
    res.status(400).json({ error: err.message });
  }
});

// View applications for a job (employer only)
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not defined' });
    }
    if (req.user.role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can view applications' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job || job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view applications for this job' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('jobSeeker', 'fullName email jobSeekerProfile');
    res.json(applications);
  } catch (err) {
    console.error('View applications error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;