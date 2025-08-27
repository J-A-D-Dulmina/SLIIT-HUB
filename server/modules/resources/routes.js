const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticateToken = require('../../middleware/auth');

// Upload requires auth to set owner
router.post('/upload', authenticateToken, controller.uploadResource);
// List will include private resources for the owner if authenticated
router.get('/', authenticateToken, controller.listResources);
// Dedicated public and my listings
router.get('/public', authenticateToken, controller.listPublicResources);
router.get('/mine', authenticateToken, controller.listMyResources);
// Download checks access for private
router.get('/download/:id', authenticateToken, controller.downloadResource);
router.patch('/:id/visibility', authenticateToken, controller.updateVisibility);
router.patch('/:id', authenticateToken, controller.updateResource);
router.delete('/:id', authenticateToken, controller.deleteResource);

module.exports = router; 