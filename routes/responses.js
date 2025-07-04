const express = require('express');
const Response = require('../models/Response');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Submit response
router.post('/', authenticateToken, async (req, res) => {
  console.log('Received response data:', req.body);
  try {
    const userId = req.user.userId;
    
    // Get user to find their admin
    const user = await require('../models/User').findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let adminId;
    if (user.role === 'admin') {
      adminId = userId;
    } else {
      adminId = user.adminId;
    }
    
    // Find admin's form
    const form = await require('../models/Form').findOne({ adminId });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Calculate client rating if remarks exist
    if (req.body.remarks && req.body.remarks.length > 0) {
      const totalRating = req.body.remarks.reduce((sum, remark) => sum + remark.rating, 0);
      const averageRating = totalRating / req.body.remarks.length;
      req.body.clientRating = Math.min(5, Math.round((averageRating / 10) * 5));
    }
    
    const responseData = {
      ...req.body,
      userId: userId,
      formId: form._id,
      adminId: adminId
    };
    
    const response = new Response(responseData);
    await response.save();
    res.status(201).json({ message: 'Response submitted successfully' });
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get responses by field value
router.get('/field/:field/:value', authenticateToken, async (req, res) => {
  try {
    const { field, value } = req.params;
    const userId = req.user.userId;
    
    // Get user to determine admin relationship
    const user = await require('../models/User').findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let adminId;
    if (user.role === 'admin') {
      adminId = userId;
    } else {
      adminId = user.adminId;
    }
    
    // Get responses filtered by admin relationship
    const allResponses = await Response.find({ adminId: adminId }).populate('userId', 'username').lean();
    
    const filteredResponses = allResponses.filter(response => {
      const fieldValue = response[field];
      
      if (!fieldValue) return false;
      
      // Handle checkbox objects (e.g., {"2BHK": true, "3BHK": false})
      if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
        return fieldValue[value] === true;
      }
      
      // Handle string values
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(value.toLowerCase());
      }
      
      // Handle other types
      return fieldValue.toString().toLowerCase().includes(value.toLowerCase());
    });
    
    res.json(filteredResponses);
  } catch (error) {
    console.error('Field search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get responses by name
router.get('/name/:name', authenticateToken, async (req, res) => {
  try {
    const name = req.params.name;
    const userId = req.user.userId;
    
    // Get user to determine admin relationship
    const user = await require('../models/User').findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let adminId;
    if (user.role === 'admin') {
      adminId = userId;
    } else {
      adminId = user.adminId;
    }
    
    // Get responses filtered by admin relationship
    const allResponses = await Response.find({ adminId: adminId }).populate('userId', 'username').lean();
    
    const filteredResponses = allResponses.filter(response => {
      return Object.entries(response).some(([key, value]) => {
        if (key === '_id' || key === '__v' || key === 'userId' || key === 'createdAt' || key === 'updatedAt' || key === 'remarks' || key === 'clientRating' || key === 'formId' || key === 'adminId') {
          return false;
        }
        
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(name.toLowerCase());
        }
        return false;
      });
    });
    
    res.json(filteredResponses);
  } catch (error) {
    console.error('Name search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get responses by mobile number
router.get('/mobile/:mobile', authenticateToken, async (req, res) => {
  try {
    const mobile = req.params.mobile;
    const userId = req.user.userId;
    
    // Get user to determine admin relationship
    const user = await require('../models/User').findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let adminId;
    if (user.role === 'admin') {
      adminId = userId;
    } else {
      adminId = user.adminId;
    }
    
    // Search in mobile fields but filter by admin relationship
    const responses = await Response.find({
      adminId: adminId,
      $or: [
        { mobile: mobile },
        { Mobile: mobile },
        { phone: mobile },
        { Phone: mobile },
        { phoneNumber: mobile },
        { PhoneNumber: mobile },
        { mobileNumber: mobile },
        { MobileNumber: mobile }
      ]
    }).populate('userId', 'username');
    
    // If no direct matches, search all fields within admin's responses
    if (responses.length === 0) {
      const allResponses = await Response.find({ adminId: adminId }).lean();
      const filteredResponses = allResponses.filter(response => {
        return Object.entries(response).some(([key, value]) => {
          return value && (value.toString() === mobile || 
                         (typeof value === 'number' && value.toString() === mobile));
        });
      });
      
      if (filteredResponses.length > 0) {
        const populatedResponses = await Response.find({
          _id: { $in: filteredResponses.map(r => r._id) }
        }).populate('userId', 'username');
        return res.json(populatedResponses);
      }
    }
    
    res.json(responses);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get responses (admin sees their responses, user sees their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await require('../models/User').findById(userId);
    
    let responses;
    if (user.role === 'admin') {
      // Admin sees all responses for their form
      responses = await Response.find({ adminId: userId }).populate('userId', 'username');
    } else {
      // User sees only their own responses
      responses = await Response.find({ userId: userId }).populate('userId', 'username');
    }
    
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update response
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Updating response:', req.params.id);
    
    // Recalculate client rating if remarks exist
    if (req.body.remarks && req.body.remarks.length > 0) {
      const totalRating = req.body.remarks.reduce((sum, remark) => sum + remark.rating, 0);
      const averageRating = totalRating / req.body.remarks.length;
      
      // Convert to 5-point scale and round to whole number
      req.body.clientRating = Math.min(5, Math.round((averageRating / 10) * 5));
      
      console.log(`Server calculated client rating: ${req.body.clientRating}/5`);
    }
    
    // Update the response
    const response = await Response.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    console.log('Response updated successfully');
    res.json({ message: 'Response updated successfully' });
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;