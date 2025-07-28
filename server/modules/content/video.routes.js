const express = require('express');
const router = express.Router();
const videoController = require('./video.controller');

router.post('/', videoController.createVideo);
router.get('/', videoController.getVideos);
router.get('/:id', videoController.getVideoById);
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);

module.exports = router; 