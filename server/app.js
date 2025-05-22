const mongoose = require('mongoose');
require('dotenv').config(); // Loads .env file

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sliithub';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));