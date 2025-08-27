const express = require('express');
const router = express.Router();
const { createLecturer, getReviewQueue, updateReviewDecision, getRecommended, listAllLecturers } = require('./controller');
const authenticateToken = require('../../middleware/auth');

// Admin-only routes (authentication required)
router.post('/admin/lecturers', authenticateToken, createLecturer);

// Lecturer review workflow (authentication required)
router.get('/lecturer/reviews', authenticateToken, getReviewQueue);
router.get('/lecturer/recommended', authenticateToken, getRecommended);
router.patch('/lecturer/reviews/:videoId', authenticateToken, updateReviewDecision);

// Public list of lecturers for selection in student UI
router.get('/lecturers', listAllLecturers);

module.exports = router;