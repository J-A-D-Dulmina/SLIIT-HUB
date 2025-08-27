const Announcement = require('./model');
const Notifications = require('../notifications/controller');

exports.listAnnouncements = async (req, res) => {
  try {
    const { limit } = req.query;
    const max = Math.min(parseInt(limit || '100', 10) || 100, 200);
    const items = await Announcement.find({}).sort({ date: -1 }).limit(max).lean();
    res.json({ announcements: items.map(a => ({ id: a._id, text: a.text, date: a.date })) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Text required' });
    const a = new Announcement({ text: text.trim(), date: new Date(), createdBy: req.user?.id });
    await a.save();
    // Broadcast notification to all users (students and lecturers)
    try {
      const mongoose = require('mongoose');
      const { Student } = require('../user/model');
      const Lecturer = require('../lecturer/model');
      const students = await Student.find({}, '_id');
      const lecturers = await Lecturer.find({}, '_id');
      const targets = [...students, ...lecturers].map(u => u._id);
      await Promise.all(targets.map(uid => Notifications.createForUser(uid, 'announcement', a.text, { announcementId: a._id })));
    } catch (e) { /* noop */ }
    res.status(201).json({ id: a._id, text: a.text, date: a.date });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Announcement.findByIdAndDelete(id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


