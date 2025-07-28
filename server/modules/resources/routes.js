const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/upload', controller.uploadResource);
router.get('/', controller.listResources);
router.get('/download/:id', controller.downloadResource);
router.delete('/:id', controller.deleteResource);

module.exports = router; 