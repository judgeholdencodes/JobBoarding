const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, fullName, phone, location } = req.body;

    // Validation
    if (!email || !password || !role || !fullName) {
      return res.status(400).json({ error: 'Email, password, role, and fullName are required' });
    }
    if (!['job_seeker', 'employer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      role,
      fullName,
      phone,
      location,
      ...(role === 'job_seeker' && { jobSeekerProfile: req.body.jobSeekerProfile }),
      ...(role === 'employer' && { employerProfile: req.body.employerProfile })
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user._id, email, role, fullName } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email, role: user.role, fullName: user.fullName } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  // JWT is stateless; client should remove token
  res.json({ message: 'Logout successful. Please remove the token client-side.' });
});

module.exports = router;