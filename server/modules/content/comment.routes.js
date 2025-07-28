const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/auth');
const {
  getComments,
  addComment,
  addReply,
  updateComment,
  deleteComment,
  togglePinComment
} = require('./comment.controller');

// Debug: Check if all functions are properly imported
console.log('Comment controller functions:', {
  getComments: typeof getComments,
  addComment: typeof addComment,
  addReply: typeof addReply,
  updateComment: typeof updateComment,
  deleteComment: typeof deleteComment,
  togglePinComment: typeof togglePinComment
});

// Debug middleware to log all comment route requests
router.use((req, res, next) => {
  console.log(`[Comment Routes] ${req.method} ${req.path}`);
  next();
});

// Test route to check if routing works
router.get('/test', (req, res) => {
  res.json({ message: 'Comment routes are working!' });
});

// Get all comments for a video
router.get('/:videoId/comments', authenticateToken, getComments);

// Add a new comment to a video
router.post('/:videoId/comments', authenticateToken, addComment);

// Add a reply to a comment
router.post('/comments/:commentId/replies', authenticateToken, addReply);

// Update a comment
router.put('/comments/:commentId', authenticateToken, updateComment);

// Delete a comment
router.delete('/comments/:commentId', authenticateToken, deleteComment);

// Toggle pin/unpin a comment (lecturers only)
router.patch('/comments/:commentId/pin', authenticateToken, togglePinComment);

module.exports = router;