const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('./model');
const Lecturer = require('../lecturer/model');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    // Try student first
    let user = await Student.findOne({ email });
    let userType = 'student';
    if (!user) {
      // Try lecturer
      user = await Lecturer.findOne({ email });
      userType = 'lecturer';
    }
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, type: userType }, JWT_SECRET, { expiresIn: '1d' });
    // Set JWT as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.json({
      name: user.name,
      userType,
      ...(userType === 'student' ? { studentId: user.studentId } : { lecturerId: user.lecturerId })
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Only students can register via this endpoint.
// Lecturers must be created by an admin (not implemented here).
exports.registerUser = async (req, res) => {
  const { name, email, password, studentId, mobile, enrolYear, degree } = req.body;
  if (!name || !email || !password || !studentId || !mobile || !enrolYear || !degree) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const existing = await Student.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const existingStudentId = await Student.findOne({ studentId });
    if (existingStudentId) return res.status(409).json({ message: 'Student ID already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const student = new Student({
      name,
      email,
      password: hashed,
      studentId,
      mobile,
      enrolYear: Number(enrolYear),
      degree
    });
    await student.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin-only: Create a lecturer
exports.createLecturer = async (req, res) => {
  // TODO: Add real admin authentication/authorization check here
  // For now, this is open (should be protected in production)
  const { lecturerId, name, email, password, mobile } = req.body;
  if (!lecturerId || !name || !email || !password || !mobile) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const existing = await Lecturer.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const existingLecturerId = await Lecturer.findOne({ lecturerId });
    if (existingLecturerId) return res.status(409).json({ message: 'Lecturer ID already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const lecturer = new Lecturer({
      lecturerId,
      name,
      email,
      password: hashed,
      mobile
    });
    await lecturer.save();
    res.status(201).json({ message: 'Lecturer created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const { name, mobile, degree } = req.body;
  const userId = req.user.id;
  const userType = req.user.type;

  try {
    if (userType === 'student') {
      const updateData = { name, mobile };
      if (degree) updateData.degree = degree;
      
      const updatedUser = await Student.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          name: updatedUser.name,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          userType: 'student',
          studentId: updatedUser.studentId,
          degree: updatedUser.degree
        }
      });
    } else if (userType === 'lecturer') {
      const updatedUser = await Lecturer.findByIdAndUpdate(
        userId,
        { name, mobile },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          name: updatedUser.name,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          userType: 'lecturer',
          lecturerId: updatedUser.lecturerId
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user type' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 