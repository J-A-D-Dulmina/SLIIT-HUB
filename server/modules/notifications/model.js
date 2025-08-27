const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, enum: ['message','meeting','system','deadline','announcement'], required: true },
  content: { type: String, required: true, trim: true, maxlength: 500 },
  read: { type: Boolean, default: false },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now, index: true }
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);


