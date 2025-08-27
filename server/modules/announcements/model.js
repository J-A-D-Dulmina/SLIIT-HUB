const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  date: { type: Date, default: Date.now, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

announcementSchema.index({ date: -1 });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);


