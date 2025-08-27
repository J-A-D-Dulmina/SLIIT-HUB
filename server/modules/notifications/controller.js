const Notification = require('./model');

exports.listMyNotifications = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const items = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ notifications: items });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    await Notification.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createForUser = async (userId, type, content, meta) => {
  try {
    const n = new Notification({ userId, type, content, meta });
    await n.save();
    return n;
  } catch (e) {
    console.error('Failed to create notification', e.message);
  }
};


