const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files for uploaded videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// User routes
app.use('/api', require('./modules/user'));
app.use('/api', require('./modules/lecturer'));
app.use('/api/tutoring', require('./modules/tutoring'));

// Logout endpoint to clear JWT cookie
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });

// Example route
app.get('/', (req, res) => {
  res.send('Server is running!');
});