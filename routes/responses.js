const express = require('express');
const Response = require('../models/Response');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Submit response
router.post('/', authenticateToken, async (req, res) => {
  console.log('Received response data:', req.body);
  try {
    // Calculate client rating if remarks exist
    if (req.body.remarks && req.body.remarks.length > 0) {
      const totalRating = req.body.remarks.reduce((sum, remark) => sum + remark.rating, 0);
      const averageRating = totalRating / req.body.remarks.length;
      
      // Convert to 5-point scale and round to whole number
      req.body.clientRating = Math.min(5, Math.round((averageRating / 10) * 5));
      
      console.log(`Server calculated client rating: ${req.body.clientRating}/5`);
    }
    
    const response = new Response(req.body);
    console.log('Created response object:', response);
    await response.save();
    console.log('Response saved successfully');
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
    console.log('Searching field:', field, 'value:', value);
    
    // Get all responses and filter manually for complex field searches
    const allResponses = await Response.find().populate('userId', 'username').lean();
    
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
    
    console.log('Found responses:', filteredResponses.length);
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
    console.log('Searching for name:', name);
    
    // Get all responses and search through all fields
    const allResponses = await Response.find().populate('userId', 'username').lean();
    
    const filteredResponses = allResponses.filter(response => {
      return Object.entries(response).some(([key, value]) => {
        if (key === '_id' || key === '__v' || key === 'userId' || key === 'createdAt' || key === 'updatedAt' || key === 'remarks' || key === 'clientRating') {
          return false;
        }
        
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(name.toLowerCase());
        }
        return false;
      });
    });
    
    console.log('Found responses:', filteredResponses.length);
    res.json(filteredResponses);
  } catch (error) {
    console.error('Name search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get responses by mobile number
router.get('/mobile/:mobile', authenticateToken, async (req, res) => {
  console.log('Mobile search route hit:', req.params.mobile);
  try {
    const mobile = req.params.mobile;
    console.log('Searching for mobile:', mobile);
    
    // First try to find by direct field match with case variations
    const responses = await Response.find({
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
    
    console.log('Total responses found:', responses.length);
    
    // If no direct matches, try searching all fields
    if (responses.length === 0) {
      const allResponses = await Response.find().lean();
      const filteredResponses = allResponses.filter(response => {
        return Object.entries(response).some(([key, value]) => {
          // Convert both the value and search term to strings for comparison
          return value && (value.toString() === mobile || 
                         (typeof value === 'number' && value.toString() === mobile));
        });
      });
      
      // If we found matches in the second search, populate them
      if (filteredResponses.length > 0) {
        const populatedResponses = await Response.find({
          _id: { $in: filteredResponses.map(r => r._id) }
        }).populate('userId', 'username');
        console.log('Filtered responses:', populatedResponses.length);
        return res.json(populatedResponses);
      }
    }
    
    console.log('Returning responses:', responses.length);
    res.json(responses);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all responses (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const responses = await Response.find().populate('userId', 'username');
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