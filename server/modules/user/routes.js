const express = require('express');
const router = express.Router();
const { loginUser, registerUser, createLecturer, updateProfile, adminLogin, getAllAdmins, createAdmin, updateAdmin, deleteAdmin, listStudents, createStudent, updateStudent, deleteStudent, listLecturers, updateLecturer, deleteLecturer, getAdminStats, uploadProfileImageMiddleware, uploadProfileImage } = require('./controller');
const authenticateToken = require('../../middleware/auth');
const { authenticateAdmin } = require('../../middleware/auth');
const { Student } = require('./model');
const Lecturer = require('../lecturer/model');

// POST /api/login
router.post('/login', loginUser);
// POST /api/register (students only)
router.post('/register', registerUser);
// POST /api/admin/lecturers (admin only)
router.post('/admin/lecturers', authenticateToken, createLecturer);
// POST /api/admin/login (admin login)
router.post('/admin/login', adminLogin);

// Admin management endpoints
router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

// Admin: Students CRUD (admin only)
router.get('/admin/students', authenticateAdmin, listStudents);
router.post('/admin/students', authenticateAdmin, createStudent);
router.put('/admin/students/:id', authenticateAdmin, updateStudent);
router.delete('/admin/students/:id', authenticateAdmin, deleteStudent);

// Admin: Lecturers CRUD (admin only)
router.get('/admin/lecturers', authenticateAdmin, listLecturers);
// Public to authenticated users: list lecturers for selection (name, lecturerId)
router.get('/lecturers', async (req, res) => {
  try {
    const Lecturer = require('../lecturer/model');
    const lecturers = await Lecturer.find({}, 'name email lecturerId _id');
    res.json({ lecturers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/admin/lecturers/:id', authenticateAdmin, updateLecturer);
router.delete('/admin/lecturers/:id', authenticateAdmin, deleteLecturer);

// Admin: dashboard stats (admin only)
router.get('/admin/stats', authenticateAdmin, getAdminStats);

// GET /api/students/by-id/:studentId
router.get('/students/by-id/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { Student } = require('./model');
  const student = await Student.findOne({ studentId });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ name: student.name, studentId: student.studentId });
});

// Example protected route
router.get('/protected', authenticateToken, async (req, res) => {
  let userInfo = {};
  if (req.user.type === 'student') {
    userInfo = await Student.findById(req.user.id).lean();
    res.json({
      message: 'You are authenticated!',
      user: {
        name: userInfo.name,
        email: userInfo.email,
        mobile: userInfo.mobile,
        userType: 'student',
        studentId: userInfo.studentId,
        degree: userInfo.degree,
        profileImageUrl: userInfo.profileImageUrl
      }
    });
  } else if (req.user.type === 'lecturer') {
    userInfo = await Lecturer.findById(req.user.id).lean();
    res.json({
      message: 'You are authenticated!',
      user: {
        name: userInfo.name,
        email: userInfo.email,
        mobile: userInfo.mobile,
        userType: 'lecturer',
        lecturerId: userInfo.lecturerId,
        profileImageUrl: userInfo.profileImageUrl
      }
    });
  } else if (req.user.type === 'admin') {
    const { Admin } = require('./model');
    const admin = await Admin.findById(req.user.id).lean();
    res.json({
      message: 'You are authenticated!',
      user: {
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        userType: 'admin',
        adminId: admin.adminId
      }
    });
  } else {
    res.status(400).json({ message: 'Unknown user type' });
  }
});

// Profile update route
router.put('/profile', authenticateToken, updateProfile);
router.post('/profile/image', authenticateToken, uploadProfileImageMiddleware, uploadProfileImage);

module.exports = router; 