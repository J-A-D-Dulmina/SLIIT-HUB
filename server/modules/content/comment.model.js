const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  videoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video', 
    required: true 
  },
  user: {
    id: { type: String, required: true }, // studentId or lecturerId
    name: { type: String, required: true },
    type: { type: String, enum: ['student', 'lecturer'], required: true }
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  isPinned: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  replies: [{
    user: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, enum: ['student', 'lecturer'], required: true }
    },
    content: { 
      type: String, 
      required: true,
      maxlength: 500
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
});

// Update the updatedAt field before saving
commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema);