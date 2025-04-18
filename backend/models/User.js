const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employer', 'job_seeker'], required: true },
  fullName: { type: String, required: true },
  employerProfile: {
    type: { companyName: String, companyWebsite: String },
    required: function() { return this.role === 'employer'; }
  },
  jobSeekerProfile: {
    type: { skills: [String], resumeUrl: String, education: [Object] },
    required: function() { return this.role === 'job_seeker'; }
  }
});

module.exports = mongoose.model('User', UserSchema);