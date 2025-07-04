const express = require('express');
const Question = require('../models/Question');
const Form = require('../models/Form');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get questions for authenticated admin
router.get('/', authenticateToken, async (req, res) => {
  try {
    const adminId = req.user.userId;
    
    // Find admin's form
    const form = await Form.findOne({ adminId });
    if (!form) {
      return res.json([]);
    }
    
    // Get questions for this form
    const questions = await Question.find({ formId: form._id }).sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create question (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const adminId = req.user.userId;
    
    // Find or create form for this admin
    let form = await Form.findOne({ adminId });
    if (!form) {
      form = new Form({
        title: 'Dynamic Form',
        adminId: adminId
      });
      await form.save();
    }
    
    // Check if already 10 questions exist for this form
    const questionCount = await Question.countDocuments({ formId: form._id });
    if (questionCount >= 10) {
      return res.status(400).json({ error: 'Maximum 10 questions allowed' });
    }
    
    // Create question with formId
    const questionData = {
      ...req.body,
      formId: form._id
    };
    
    const question = new Question(questionData);
    await question.save();
    
    // Add question to form's questions array
    form.questions.push(question._id);
    await form.save();
    
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
    const adminId = req.user.userId;
    const form = await Form.findOne({ adminId });
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const question = await Question.findOneAndDelete({
      _id: req.params.id,
      formId: form._id
    });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Remove question from form's questions array
    form.questions.pull(question._id);
    await form.save();
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get questions for user (user sees their admin's questions)
router.get('/user-questions', authenticateToken, async (req, res) => {
  try {
    let adminId;
    
    if (req.user.role === 'admin') {
      adminId = req.user.userId;
    } else {
      // For users, get their admin's questions
      const user = await require('../models/User').findById(req.user.userId);
      if (!user || !user.adminId) {
        return res.status(404).json({ error: 'Admin not found for user' });
      }
      adminId = user.adminId;
    }
    
    // Find admin's form
    const form = await Form.findOne({ adminId });
    if (!form) {
      return res.json([]);
    }
    
    // Get questions for this form
    const questions = await Question.find({ formId: form._id }).sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;