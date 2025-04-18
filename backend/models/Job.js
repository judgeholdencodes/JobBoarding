const mongoose = require('mongoose');
const client = require('../config/elasticsearch');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true },
  company: { name: { type: String, required: true, trim: true }, logo: String },
  location: { city: { type: String, required: true }, country: { type: String, required: true }, remote: { type: Boolean, default: false } },
  jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'], required: true },
  experienceLevel: { type: String, enum: ['entry', 'mid', 'senior'], required: true },
  skills: [{ type: String, trim: true }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postingDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

JobSchema.post('save', async function(doc) {
  try {
    await client.index({
      index: 'jobs',
      id: doc._id.toString(),
      body: {
        title: doc.title,
        description: doc.description,
        company: doc.company,
        location: doc.location,
        jobType: doc.jobType,
        experienceLevel: doc.experienceLevel,
        skills: doc.skills,
        postingDate: doc.postingDate,
        isActive: doc.isActive
      }
    });
    console.log(`Job ${doc._id} indexed in Elasticsearch`);
  } catch (err) {
    console.error('Error indexing job:', err.message); // Ensure errors are logged
  }
});


JobSchema.index({ title: 'text', description: 'text', 'skills': 'text' });
JobSchema.index({ 'location.city': 1, 'location.country': 1 });
JobSchema.index({ jobType: 1, experienceLevel: 1 });
JobSchema.index({ postedBy: 1 });

module.exports = mongoose.model('Job', JobSchema);