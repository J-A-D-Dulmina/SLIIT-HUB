console.log('Tutoring routes loaded');
const express = require('express');
const router = express.Router();
const { 
  uploadVideo, 
  getStudentVideos, 
  updateVideo, 
  deleteVideo, 
  togglePublishStatus,
  streamVideo,
  serveThumbnail,
  getPublishedVideos,
  likeVideo,
  requestReview,
  toggleSaveVideo,
  getSavedVideos
} = require('./controller');
const authenticateToken = require('../../middleware/auth');

// Get published videos (public endpoint - no authentication required)
router.get('/videos/published', getPublishedVideos);

// All other tutoring routes require authentication
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

// Like/Unlike video
router.post('/videos/:videoId/like', likeVideo);

// Request lecturer review
router.post('/videos/:videoId/request-review', requestReview);

// Save/Unsave & list saved videos
router.post('/videos/:videoId/save', toggleSaveVideo);
router.get('/videos/saved/me', getSavedVideos);

module.exports = router; 