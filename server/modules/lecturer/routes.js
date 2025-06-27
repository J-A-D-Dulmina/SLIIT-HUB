const express = require('express');
const router = express.Router();
const { createLecturer } = require('./controller');
const authenticateToken = require('../../middleware/auth');

// Admin-only routes (authentication required)
router.post('/admin/lecturers', authenticateToken, createLecturer);

module.exports = router; 