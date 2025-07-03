const express = require('express');
const Question = require('../models/Question');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all questions (public)
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find().sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create question (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if already 10 questions exist
    const questionCount = await Question.countDocuments();
    if (questionCount >= 10) {
      return res.status(400).json({ error: 'Maximum 10 questions allowed' });
    }
    
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update question
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete question
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;