const bcrypt = require('bcryptjs');
const Lecturer = require('./model');

exports.createLecturer = async (req, res) => {
  // TODO: Add admin authentication check
  const { lecturerId, name, email, password, mobile, modules } = req.body;
  if (!lecturerId || !name || !email || !password || !mobile) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const existingEmail = await Lecturer.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: 'Email already registered' });
    const existingLecturerId = await Lecturer.findOne({ lecturerId });
    if (existingLecturerId) return res.status(409).json({ message: 'Lecturer ID already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const lecturer = new Lecturer({
      lecturerId,
      name,
      email,
      password: hashed,
      mobile,
      modules: modules && Array.isArray(modules) ? modules : []
    });
    await lecturer.save();
    res.status(201).json({ message: 'Lecturer created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 