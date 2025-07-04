const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'middleware/www/dynamic-form-frontend'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/allbusiness';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  console.log('📍 Database URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.log('🔧 Trying to connect to:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  process.exit(1);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/responses', require('./routes/responses'));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve Angular app for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'middleware/www/dynamic-form-frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

