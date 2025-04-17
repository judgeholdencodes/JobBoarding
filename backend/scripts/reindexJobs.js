const Job = require('../models/Job');
const client = require('../config/elasticsearch');

async function reindexJobs() {
  try {
    const jobs = await Job.find({ isActive: true });
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
      console.log(`Reindexed job ${job._id}`);
    }
    console.log('Reindexing complete');
  } catch (err) {
    console.error('Error reindexing jobs:', err.message);
    throw err;
  }
}

reindexJobs()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));