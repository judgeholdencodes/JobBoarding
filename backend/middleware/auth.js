const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import at the top
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded); // Debug log

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('User found:', user); // Debug log
    req.user = user; // Attach user to req
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message); // Log errors
    res.status(401).json({ error: 'Invalid token' });
  }
};