const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  uniqueId: { 
    type: String, 
    required: true, 
    unique: true 
  }, // Combination of studentId and videoId
  title: { type: String, required: true },
  description: { type: String, required: true },
  module: { type: String, required: true },
  degree: { type: String, required: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  videoFile: { type: String, required: true }, // File path/URL
  thumbnail: { type: String },
  duration: { type: Number }, // in seconds
  fileSize: { type: Number }, // in bytes
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'unpublished'], 
    default: 'unpublished' 
  },
  reviewStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', null], 
    default: null 
  },
  reviewLecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer' },
  reviewComments: { type: String },
  aiFeatures: {
    summary: { type: Boolean, default: false },
    timestamps: { type: Boolean, default: false },
    lecturerRecommended: { type: Boolean, default: false }
  },
  views: { type: Number, default: 0 },
  uploadDate: { type: Date, default: Date.now },
  publishDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema); 