const express = require('express');
const router = express.Router();
const { 
  uploadVideo, 
  getStudentVideos, 
  updateVideo, 
  deleteVideo, 
  togglePublishStatus,
  streamVideo,
  serveThumbnail
} = require('./controller');
const authenticateToken = require('../../middleware/auth');

// All tutoring routes require authentication
router.use(authenticateToken);

// Upload new video
router.post('/upload', uploadVideo);

// Get student's videos
router.get('/videos', getStudentVideos);

// Get a single video by ID
router.get('/videos/:videoId', require('./controller').getVideoById);

// Stream video file
router.get('/video/:videoId', streamVideo);

// Serve thumbnail
router.get('/thumbnail/:videoId', serveThumbnail);

// Update video
router.put('/videos/:videoId', updateVideo);

// Delete video
router.delete('/videos/:videoId', deleteVideo);

// Toggle publish status
router.patch('/videos/:videoId/publish', togglePublishStatus);

module.exports = router; 