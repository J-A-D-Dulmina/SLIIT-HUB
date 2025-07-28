const express = require('express');
const router = express.Router();
const videoController = require('./video.controller');
const commentRoutes = require('./comment.routes');

// Debug middleware to log all video route requests
router.use((req, res, next) => {
  console.log(`[Video Routes] ${req.method} ${req.path}`);
  next();
});

router.post('/', videoController.createVideo);
router.get('/', videoController.getVideos);
router.get('/:id', videoController.getVideoById);
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);

// Include comment routes
router.use('/videos', commentRoutes);

module.exports = router; 