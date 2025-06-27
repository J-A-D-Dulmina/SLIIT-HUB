const express = require('express');
const router = express.Router();
const aiController = require('./controller');

// AI Generation Routes
router.post('/generate-summary', aiController.generateSummary);
router.post('/generate-description', aiController.generateDescription);
router.post('/generate-timestamps', aiController.generateTimestamps);
router.post('/detect-scenes', aiController.detectScenes);
router.post('/process-video', aiController.processVideoWithAI);

// Test and Health Routes
router.get('/test-video/:videoId', aiController.testVideoAccess);
router.get('/comprehensive-test/:videoId', aiController.comprehensiveTest);
router.get('/health', aiController.healthCheck);

module.exports = router; 