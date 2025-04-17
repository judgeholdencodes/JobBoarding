const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  jobSeeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Job seeker is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  resumeUrl: {
    type: String,
    required: [true, 'Resume is required'],
    trim: true
  },
  coverLetter: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['applied', 'under_review', 'interview', 'accepted', 'rejected'],
    default: 'applied'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

ApplicationSchema.index({ jobSeeker: 1, job: 1 }, { unique: true });
ApplicationSchema.index({ job: 1, status: 1 });
ApplicationSchema.index({ applicationDate: 1 });

ApplicationSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Application', ApplicationSchema);