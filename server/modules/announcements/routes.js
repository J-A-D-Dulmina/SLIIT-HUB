const express = require('express');
const router = express.Router();
const { listAnnouncements, createAnnouncement, deleteAnnouncement } = require('./controller');
const { authenticateAdmin } = require('../../middleware/auth');

router.get('/', listAnnouncements);
router.post('/', authenticateAdmin, createAnnouncement);
router.delete('/:id', authenticateAdmin, deleteAnnouncement);

module.exports = router;


