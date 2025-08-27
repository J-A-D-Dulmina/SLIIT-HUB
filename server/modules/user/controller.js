const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Student } = require('./model');
const Lecturer = require('../lecturer/model');
const { Admin } = require('./model');
const Degree = require('../admin/degree.model');
const Video = require('../tutoring/model');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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
      const updateData = {};
      if (name !== undefined && name !== '') updateData.name = name;
      if (mobile !== undefined && mobile !== '') updateData.mobile = mobile;
      if (degree) {
        let degreeObj = await Degree.findOne({ code: degree }) || await Degree.findById(degree);
        if (!degreeObj) return res.status(400).json({ message: 'Degree not found' });
        updateData.degree = degreeObj._id;
        updateData.degreeLegacy = degree;
      }
      // If nothing to update, just return current user data
      if (Object.keys(updateData).length === 0) {
        const current = await Student.findById(userId).lean();
        if (!current) return res.status(404).json({ message: 'User not found' });
        return res.json({
          message: 'No changes',
          user: {
            name: current.name,
            email: current.email,
            mobile: current.mobile,
            userType: 'student',
            studentId: current.studentId,
            degree: current.degree,
            degreeLegacy: current.degreeLegacy,
            profileImageUrl: current.profileImageUrl
          }
        });
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
          degreeLegacy: updatedUser.degreeLegacy,
          profileImageUrl: updatedUser.profileImageUrl
        }
      });
    } else if (userType === 'lecturer') {
      const updateData = {};
      if (name !== undefined && name !== '') updateData.name = name;
      if (mobile !== undefined && mobile !== '') updateData.mobile = mobile;
      if (Object.keys(updateData).length === 0) {
        const current = await Lecturer.findById(userId).lean();
        if (!current) return res.status(404).json({ message: 'User not found' });
        return res.json({
          message: 'No changes',
          user: {
            name: current.name,
            email: current.email,
            mobile: current.mobile,
            userType: 'lecturer',
            lecturerId: current.lecturerId,
            profileImageUrl: current.profileImageUrl
          }
        });
      }
      const updatedUser = await Lecturer.findByIdAndUpdate(
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
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
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

// Admin: list students
exports.listStudents = async (req, res) => {
  try {
    const students = await Student.find({}, '-__v -updatedAt');
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: create student
exports.createStudent = async (req, res) => {
  const { name, email, password, studentId, mobile, enrolYear, degree } = req.body;
  if (!name || !email || !password || !studentId || !mobile || !enrolYear) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const existing = await Student.findOne({ $or: [{ email }, { studentId }] });
    if (existing) return res.status(409).json({ message: 'Email or Student ID already exists' });
    let degreeObj = null;
    if (degree) {
      degreeObj = await Degree.findOne({ code: degree }) || await Degree.findById(degree);
      if (!degreeObj) return res.status(400).json({ message: 'Degree not found' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const student = new Student({
      name,
      email,
      password: hashed,
      studentId,
      mobile,
      enrolYear: Number(enrolYear),
      ...(degreeObj ? { degree: degreeObj._id } : {}),
      degreeLegacy: degree || undefined
    });
    await student.save();
    res.status(201).json({ message: 'Student created', id: student._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: update student
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, enrolYear, degree, password } = req.body;
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (name) student.name = name;
    if (email) student.email = email;
    if (mobile) student.mobile = mobile;
    if (enrolYear) student.enrolYear = Number(enrolYear);
    if (degree) {
      let degreeObj = await Degree.findOne({ code: degree }) || await Degree.findById(degree);
      if (!degreeObj) return res.status(400).json({ message: 'Degree not found' });
      student.degree = degreeObj._id;
      student.degreeLegacy = degree;
    }
    if (password) {
      student.password = await bcrypt.hash(password, 10);
    }
    await student.save();
    res.json({ message: 'Student updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: delete student
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list lecturers
exports.listLecturers = async (req, res) => {
  try {
    const lecturers = await Lecturer.find({}, '-__v -updatedAt');
    res.json({ lecturers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: update lecturer
exports.updateLecturer = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, modules, password } = req.body;
  try {
    const lecturer = await Lecturer.findById(id);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });
    if (name) lecturer.name = name;
    if (email) lecturer.email = email;
    if (mobile) lecturer.mobile = mobile;
    if (Array.isArray(modules)) lecturer.modules = modules;
    if (typeof modules === 'string') lecturer.modules = modules.split(',').map(m => m.trim()).filter(Boolean);
    if (password) lecturer.password = await bcrypt.hash(password, 10);
    await lecturer.save();
    res.json({ message: 'Lecturer updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: delete lecturer
exports.deleteLecturer = async (req, res) => {
  const { id } = req.params;
  try {
    const lecturer = await Lecturer.findByIdAndDelete(id);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });
    res.json({ message: 'Lecturer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: aggregated stats for dashboard
exports.getAdminStats = async (req, res) => {
  try {
    const [students, lecturers, videos, degrees, admins] = await Promise.all([
      Student.countDocuments({}),
      Lecturer.countDocuments({}),
      Video.countDocuments({}),
      Degree.countDocuments({}),
      Admin.countDocuments({})
    ]);
    res.json({ students, lecturers, videos, degrees, admins });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Multer for profile image uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../../uploads/profile');
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  }
});

function imageFileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
}

exports.uploadProfileImageMiddleware = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
}).single('image');

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const relativePath = path.join('uploads', 'profile', req.file.filename).replace(/\\/g, '/');
    if (req.user.type === 'student') {
      const updated = await Student.findByIdAndUpdate(req.user.id, { profileImageUrl: relativePath }, { new: true });
      return res.json({ url: `/${relativePath}`, userType: 'student' });
    } else if (req.user.type === 'lecturer') {
      const LecturerModel = require('../lecturer/model');
      const updated = await LecturerModel.findByIdAndUpdate(req.user.id, { profileImageUrl: relativePath }, { new: true });
      return res.json({ url: `/${relativePath}`, userType: 'lecturer' });
    }
    return res.status(400).json({ message: 'Unsupported user type' });
  } catch (err) {
    console.error('Profile image upload error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};