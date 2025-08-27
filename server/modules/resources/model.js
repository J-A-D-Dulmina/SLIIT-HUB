const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  visibility: { type: String, enum: ['public','private'], default: 'public', index: true },
  degree: { type: String },
  year: { type: String },
  semester: { type: String },
  module: { type: String },
  filePath: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
  uploader: { type: mongoose.Schema.Types.ObjectId, refPath: 'uploaderModel' },
  uploaderModel: { type: String, enum: ['Student','Lecturer'] },
  uploadDate: { type: Date, default: Date.now },
  downloadCount: { type: Number, default: 0 }
});

module.exports = mongoose.models.Resource || mongoose.model('Resource', resourceSchema); 