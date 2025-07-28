const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String }, // optional
  module: { type: String, required: true },
  degree: { type: mongoose.Schema.Types.Mixed, required: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  videoFile: { type: String, required: true },
  thumbnail: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentId: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published', 'unpublished'], default: 'draft' },
  addDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  publishDate: { type: Date },
  unpublishDate: { type: Date },
  deleteDate: { type: Date },
  aiFeatures: { type: Object },
  summary: { type: String },
  timestamps: { type: Array },
  reviewStatus: { type: String },
  reviewLecturer: { type: String }
});

module.exports = mongoose.models.Video || mongoose.model('Video', videoSchema); 