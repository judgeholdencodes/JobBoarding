const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  jobSeeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  coverLetter: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  appliedDate: { type: Date, default: Date.now }
});

ApplicationSchema.index({ jobSeeker: 1, job: 1 }, { unique: true });
ApplicationSchema.index({ job: 1, status: 1 });
ApplicationSchema.index({ applicationDate: 1 });

ApplicationSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Application', ApplicationSchema);