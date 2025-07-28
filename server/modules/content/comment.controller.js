const Comment = require('./comment.model');
const Video = require('./video.model');
const { Student } = require('../user/model');
const Lecturer = require('../lecturer/model');

// Debug: Check if all models are properly imported
console.log('Comment controller imports:', {
  Comment: typeof Comment,
  Video: typeof Video,
  Student: typeof Student,
  Lecturer: typeof Lecturer
});

// Get all comments for a video
const getComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log('Getting comments for videoId:', videoId);
    
    const comments = await Comment.find({ videoId })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('videoId', 'title');
    
    console.log('Found comments:', comments.length);
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

// Helper function to get user info
const getUserInfo = async (userType, userId) => {
  try {
    console.log('Getting user info for:', { userType, userId });
    
    if (userType === 'student') {
      const student = await Student.findOne({ studentId: userId });
      console.log('Student found:', student);
      return student ? { name: student.name, id: student.studentId } : null;
    } else if (userType === 'lecturer') {
      const lecturer = await Lecturer.findOne({ lecturerId: userId });
      console.log('Lecturer found:', lecturer);
      return lecturer ? { name: lecturer.name, id: lecturer.lecturerId } : null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

// Add a new comment
const addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content } = req.body;
    
    // Get user info from request (set by auth middleware)
    const user = req.user;
    console.log('User from token:', user);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get actual user info from database
    console.log('Calling getUserInfo with:', { type: user.type, id: user.studentId || user.lecturerId });
    const userInfo = await getUserInfo(user.type, user.studentId || user.lecturerId);
    console.log('User info from database:', userInfo);
    
    if (!userInfo) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Create comment
    const comment = new Comment({
      videoId,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        type: user.type
      },
      content: content.trim()
    });

    await comment.save();
    
    // Populate video info for response
    await comment.populate('videoId', 'title');
    
    console.log('Comment created:', comment);
    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

// Add a reply to a comment
const addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    // Get user info from request
    const user = req.user;
    console.log('User from token (reply):', user);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get actual user info from database
    console.log('Calling getUserInfo with (reply):', { type: user.type, id: user.studentId || user.lecturerId });
    const userInfo = await getUserInfo(user.type, user.studentId || user.lecturerId);
    console.log('User info from database (reply):', userInfo);
    
    if (!userInfo) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Add reply
    const reply = {
      user: {
        id: userInfo.id,
        name: userInfo.name,
        type: user.type
      },
      content: content.trim()
    };

    comment.replies.push(reply);
    await comment.save();
    
    // Populate video info for response
    await comment.populate('videoId', 'title');
    
    console.log('Reply added to comment:', comment);
    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ success: false, message: 'Failed to add reply' });
  }
};

// Update a comment (only by the author)
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user can edit (only the author can edit their own comment)
    const canEdit = comment.user.id === (user.studentId || user.lecturerId);
    if (!canEdit) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    comment.content = content.trim();
    await comment.save();
    
    await comment.populate('videoId', 'title');
    
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
};

// Delete a comment (only by the author)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user can delete (only the author can delete their own comment)
    const canDelete = comment.user.id === (user.studentId || user.lecturerId);
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);
    
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

// Pin/unpin a comment (only lecturers can pin their own comments)
const togglePinComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Only lecturers can pin/unpin comments
    if (user.userType !== 'lecturer') {
      return res.status(403).json({ success: false, message: 'Only lecturers can pin comments' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only lecturers can pin their own comments
    const canPin = comment.user.id === user.lecturerId;
    if (!canPin) {
      return res.status(403).json({ success: false, message: 'You can only pin your own comments' });
    }

    comment.isPinned = !comment.isPinned;
    await comment.save();
    
    await comment.populate('videoId', 'title');
    
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error toggling comment pin:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle comment pin' });
  }
};

module.exports = {
  getComments,
  addComment,
  addReply,
  updateComment,
  deleteComment,
  togglePinComment
};