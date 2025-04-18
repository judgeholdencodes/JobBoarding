const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const client = require('../config/elasticsearch'); // Add this line

// Search jobs (public, Elasticsearch)
router.get('/search', async (req, res) => {
  try {
    const { q, city, country, jobType, experienceLevel, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1); // Enforce page >= 1
    const limitNum = parseInt(limit) || 20;
    const query = {
      bool: {
        must: [],
        filter: [{ term: { isActive: true } }]
      }
    };
    if (q) {
      query.bool.must.push({
        multi_match: {
          query: q,
          fields: ['title^2', 'description', 'skills', 'company.name'],
          fuzziness: 'AUTO'
        }
      });
    }
    if (city) query.bool.filter.push({ term: { 'location.city': city } });
    if (country) query.bool.filter.push({ term: { 'location.country': country } });
    if (jobType) query.bool.filter.push({ term: { jobType } });
    if (experienceLevel) query.bool.filter.push({ term: { experienceLevel } });
    const result = await client.search({
      index: 'jobs',
      body: {
        query,
        sort: [{ postingDate: { order: 'desc' } }],
        from: (pageNum - 1) * limitNum,
        size: limitNum
      }
    });
    const jobIds = result.hits.hits.map(hit => hit._id);
    const jobs = await Job.find({ _id: { $in: jobIds }, isActive: true })
      .populate('postedBy', 'fullName employerProfile.companyName')
      .sort({ postingDate: -1 });
    res.json({
      total: result.hits.total.value,
      jobs
    });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(400).json({ error: err.message });
  }
});


// Autocomplete suggestions (public, Elasticsearch)
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const result = await client.search({
      index: 'jobs',
      body: {
        suggest: {
          title_suggest: {
            prefix: q,
            completion: {
              field: 'title.suggest',
              fuzzy: { fuzziness: 'AUTO' }
            }
          }
        }
      }
    });
    const suggestions = result.suggest.title_suggest[0].options.map(opt => opt.text);
    res.json(suggestions);
  } catch (err) {
    console.error('Suggest error:', err.message);
    res.status(400).json({ error: err.message });
  }
});


// Validation middleware
const validateJob = (req, res, next) => {
  const { title, description, company, location, jobType, experienceLevel } = req.body;
  if (!title || !description || !company?.name || !location?.city || !location?.country || !jobType || !experienceLevel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['full-time', 'part-time', 'contract', 'internship', 'remote'].includes(jobType)) {
    return res.status(400).json({ error: 'Invalid job type' });
  }
  if (!['entry', 'mid', 'senior'].includes(experienceLevel)) {
    return res.status(400).json({ error: 'Invalid experience level' });
  }
  next();
};

// Create a job (employer only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can post jobs' });
    }

    const job = new Job({
      ...req.body,
      postedBy: req.user.id
    });

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}, validateJob);

// Get all jobs (public)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('postedBy', 'fullName employerProfile.companyName')
      .sort({ postingDate: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single job (public)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'fullName employerProfile.companyName');
    if (!job || !job.isActive) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    console.error('Get job error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Update a job (employer only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can update jobs' });
    }

    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}, validateJob);

// Delete a job (employer only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can delete jobs' });
    }

    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;