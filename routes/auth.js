const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { JWT_SECRET, REFRESH_SECRET } = require('../config');

// Store refresh tokens (in production, use Redis or database)
const refreshTokens = new Set();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: '7d' });
    
    refreshTokens.add(refreshToken);
    
    res.json({ 
      token, 
      refreshToken,
      role: user.role, 
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken || !refreshTokens.has(refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    const newToken = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    
    res.json({ token: newToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;