const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const { JWT_SECRET, REFRESH_SECRET } = require('../config');

// Store refresh tokens (in production, use Redis or database)
const refreshTokens = new Set();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
    }
    
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
    } else {
      res.status(400).json({ error: error.message });
    }
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

// Get admin's users
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const users = await User.find({ adminId: req.user.userId }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (admin only)
router.post('/create-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const user = new User({
      username,
      password,
      role: 'user',
      adminId: req.user.userId
    });
    
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      adminId: req.user.userId,
      role: 'user'
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;