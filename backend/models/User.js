const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['job_seeker', 'employer'],
    required: [true, 'Role is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?\d{10,15}$/, 'Please provide a valid phone number']
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  jobSeekerProfile: {
    type: {
      skills: [{ type: String, trim: true }],
      experience: [{
        company: String,
        title: String,
        startDate: Date,
        endDate: Date,
        description: String
      }],
      education: [{
        institution: String,
        degree: String,
        field: String,
        startDate: Date,
        endDate: Date
      }],
      resumeUrl: String
    },
    required: function() {
      return this.role === 'job_seeker';
    }
  },
  employerProfile: {
    type: {
      companyName: String,
      companyWebsite: String,
      companyDescription: String,
      companyLogo: String
    },
    required: function() {
      return this.role === 'employer';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

UserSchema.index({ email: 1 });
UserSchema.index({ 'jobSeekerProfile.skills': 1 });
UserSchema.index({ role: 1 });

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);