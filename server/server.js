const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const http = require('http');
const MeetingSocketServer = require('./websocket/meetingSocket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket server
const meetingSocketServer = new MeetingSocketServer(server);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files for uploaded videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// User routes
app.use('/api', require('./modules/user'));
app.use('/api', require('./modules/lecturer'));
app.use('/api/tutoring', require('./modules/tutoring'));
app.use('/api', require('./modules/ai'));
app.use('/api', require('./modules/meeting'));

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  const stats = meetingSocketServer.getRoomStats();
  res.json({
    success: true,
    data: {
      activeRooms: Object.keys(stats).length,
      totalParticipants: Object.values(stats).reduce((sum, room) => sum + room.participantCount, 0),
      rooms: stats
    }
  });
});

// Logout endpoint to clear JWT cookie
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Connect to MongoDB and start server
connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready for real-time communication`);
    });
  });

// Example route
app.get('/', (req, res) => {
  res.send('Server is running!');
});