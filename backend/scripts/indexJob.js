const mongoose = require('mongoose');
const Job = require('../models/Job');
const client = require('../config/elasticsearch');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function indexJob() {
  try {
    const job = await Job.findById('6801f54138ed5b477cb3c658'); // Data Scientist job ID
    if (!job) {
      console.log('Job not found');
      return;
    }
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
    console.log(`Job ${job._id} indexed in Elasticsearch`);
  } catch (err) {
    console.error('Error indexing job:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

indexJob();