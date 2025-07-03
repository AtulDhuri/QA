const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend/dist/dynamic-form-frontend'));
app.use(express.static('.'));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamicforms';

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

// Serve Angular app
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/frontend/dist/dynamic-form-frontend/index.html');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

