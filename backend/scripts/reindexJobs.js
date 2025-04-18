const mongoose = require('mongoose');
const Job = require('../models/Job');
const client = require('../config/elasticsearch');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/job_board', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function reindexJobs() {
  try {
    const jobs = await Job.find({ isActive: true });
    console.log(`Found ${jobs.length} jobs to reindex`);

    for (const job of jobs) {
      await client.index({
        index: 'jobs',
        id: job._id.toString(),
        body: {
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          skills: job.skills,
          postingDate: job.postingDate,
          isActive: job.isActive
        }
      });
      console.log(`Indexed job ${job._id}`);
    }
    console.log('Reindexing complete');
  } catch (err) {
    console.error('Error reindexing jobs:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

reindexJobs();