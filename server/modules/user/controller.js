const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Student } = require('./model');
const Lecturer = require('../lecturer/model');
const { Admin } = require('./model');
const Degree = require('../admin/degree.model');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Try student first
    let user = await Student.findOne({ email });
    let userType = 'student';
    if (!user) {
      // Try lecturer
      user = await Lecturer.findOne({ email });
      userType = 'lecturer';
    }
    if (!user) {
      return res.status(401).json({ message: 'No user found with this email.' });
    }
    if (!user.password) {
      return res.status(400).json({ message: 'User account is missing a password. Please reset your password or contact support.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }
    const token = jwt.sign({ 
      id: user._id, 
      type: userType,
      ...(userType === 'student' ? { studentId: user.studentId } : { lecturerId: user.lecturerId })
    }, JWT_SECRET, { expiresIn: '1d' });
    // Set JWT as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.json({
      token,
      name: user.name,
      userType,
      ...(userType === 'student' ? { studentId: user.studentId } : { lecturerId: user.lecturerId })
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
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
    // Find degree by code or _id
    let degreeObj = await Degree.findOne({ code: degree }) || await Degree.findById(degree);
    if (!degreeObj) return res.status(400).json({ message: 'Degree not found' });
    const student = new Student({
      name,
      email,
      password: hashed,
      studentId,
      mobile,
      enrolYear: Number(enrolYear),
      degree: degreeObj._id,
      degreeLegacy: degree // Store original string for legacy
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
      if (degree) {
        let degreeObj = await Degree.findOne({ code: degree }) || await Degree.findById(degree);
        if (!degreeObj) return res.status(400).json({ message: 'Degree not found' });
        updateData.degree = degreeObj._id;
        updateData.degreeLegacy = degree;
      }
      
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
          degree: updatedUser.degree,
          degreeLegacy: updatedUser.degreeLegacy
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

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin._id, type: 'admin', email: admin.email, adminId: admin.adminId }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ token, email: admin.email, userType: 'admin', adminId: admin.adminId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}, '-password'); // Exclude password from list
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAdmin = async (req, res) => {
  // Only extract allowed fields, ignore adminId if present in req.body
  const { name, email, mobile, password } = req.body;
  if (!name || !email || !mobile || !password) return res.status(400).json({ message: 'All fields required' });
  try {
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    // Do NOT set adminId here, let the schema pre-save hook handle it
    const admin = new Admin({ name, email, mobile, password: hashed });
    await admin.save();
    res.status(201).json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, password } = req.body;
  try {
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.mobile = mobile || admin.mobile;
    if (password) {
      // Only hash if password is changed
      if (!(await bcrypt.compare(password, admin.password))) {
        admin.password = await bcrypt.hash(password, 10);
      }
    }
    await admin.save();
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 